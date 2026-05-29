package com.futbol.servlet;

import java.io.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.servlet.*;
import javax.servlet.http.*;
import org.omg.CORBA.*;
import org.omg.CosNaming.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import BufferApp.*;
import com.futbol.utils.*;

public class NoticiasRestServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(NoticiasRestServlet.class);

    private final ObjectMapper mapper = new ObjectMapper();
    private NewsService newsService;

    @Override
    public void init() throws ServletException {
        conectarCorba();
    }

    private void conectarCorba() {
        try {
            logger.info("[BRIDGE-INIT] Conectando con servidor CORBA...");
            this.newsService = getCorbaService();
            logger.info("[BRIDGE-INIT] Conexión CORBA establecida correctamente.");
        } catch (Exception e) {
            logger.error("[BRIDGE-INIT] ERROR CRÍTICO al conectar con CORBA: {}", e.getMessage());
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        logger.debug("[BRIDGE-GET] Nueva peticion recibida: {}", request.getPathInfo());

        if (!validarAutorizacion(request, response)) return;

        response.setContentType("application/json;charset=UTF-8");
        String pathInfo = request.getPathInfo();

        int page = parseIntParam(request.getParameter("page"), 0);
        int limit = parseIntParam(request.getParameter("limit"), 0);

        try {
            if (this.newsService == null) {
                logger.warn("[BRIDGE-GET] Re-intentando conexión CORBA perdida...");
                conectarCorba();
            }

            String xsdPath = getXsdPath();

            if (pathInfo == null || pathInfo.equals("/") || pathInfo.isEmpty()) {
                if (!validarRolAdmin(request, response)) return;
                procesarLista(this.newsService.getAllNews(), response, xsdPath,
                        "Procesamiento concluído exitosamente", page, limit);
            } else if (pathInfo.startsWith("/feed")) {
                procesarLista(this.newsService.getVisibleNews(), response, xsdPath,
                        "Procesamiento concluído exitosamente", page, limit);
            } else if (pathInfo.startsWith("/featured")) {
                procesarLista(this.newsService.getFeaturedNews(), response, xsdPath,
                        "Procesamiento concluído exitosamente", page, limit);
            } else if (pathInfo.startsWith("/recent")) {
                procesarLista(this.newsService.getRecentNews(), response, xsdPath,
                        "Procesamiento concluído exitosamente", page, limit);
            } else {
                String id = pathInfo.substring(1);
                try {
                    NewsItem noticia = this.newsService.getNewsById(id);
                    if (noticia == null || noticia.id == null || noticia.id.isEmpty()) {
                        enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false,
                                "Noticia no encontrada en CORBA", null);
                    } else {
                        try {
                            enviarRespuesta(response, HttpServletResponse.SC_OK, true,
                                    "Procesamiento concluído exitosamente", validarYLimpiar(noticia, xsdPath));
                        } catch (Exception valEx) {
                            logger.warn("[BRIDGE-VALID] Error validando noticia {}: {}", id, valEx.getMessage());
                            enviarRespuesta(response, HttpServletResponse.SC_OK, true,
                                    "Procesamiento concluído exitosamente", noticia);
                        }
                    }
                } catch (org.omg.CORBA.OBJECT_NOT_EXIST | org.omg.CORBA.BAD_PARAM ex) {
                    enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false,
                            "Noticia no encontrada en CORBA", null);
                }
            }
        } catch (Exception e) {
            logger.error("[BRIDGE-ERROR] Fallo crítico en el flujo: {}", e.getMessage(), e);
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false,
                    "Error Crítico Bridge: " + e.getMessage(), null);
        }
    }

    private void procesarLista(NewsItem[] noticias, HttpServletResponse response, String xsdPath,
                                String msg, int page, int limit) throws Exception {
        logger.debug("[BRIDGE-LIST] Procesando lista de {} items, page={}, limit={}",
                noticias != null ? noticias.length : 0, page, limit);

        List<NewsItem> lista = new ArrayList<>();
        if (noticias != null) {
            for (NewsItem n : noticias) {
                try {
                    lista.add(validarYLimpiar(n, xsdPath));
                } catch (Exception e) {
                    logger.warn("[BRIDGE-LIST] Saltando noticia {} por error de validación: {}", n.id, e.getMessage());
                }
            }
        }

        lista.sort((n1, n2) -> {
            try {
                String[] d1 = n1.date.split("/");
                String[] d2 = n2.date.split("/");
                String iso1 = d1[2] + d1[1] + d1[0];
                String iso2 = d2[2] + d2[1] + d2[0];
                return iso2.compareTo(iso1);
            } catch (Exception e) {
                return 0;
            }
        });

        int total = lista.size();
        Map<String, java.lang.Object> pagination = null;

        List<NewsItem> paginada;
        if (page > 0 && limit > 0) {
            int totalPages = (int) Math.ceil((double) total / limit);
            int fromIndex = (page - 1) * limit;
            int toIndex = Math.min(fromIndex + limit, total);
            paginada = (fromIndex < total) ? new ArrayList<>(lista.subList(fromIndex, toIndex)) : new ArrayList<>();

            pagination = new LinkedHashMap<>();
            pagination.put("page", page);
            pagination.put("limit", limit);
            pagination.put("total", total);
            pagination.put("totalPages", totalPages);
        } else {
            paginada = lista;
        }

        enviarRespuestaConPaginacion(response, HttpServletResponse.SC_OK, true, msg, paginada, pagination);
    }

    private NewsItem validarYLimpiar(NewsItem n, String xsdPath) throws Exception {
        String xml = XMLCoder.toXML(n);
        XMLValidator.validar(xml, xsdPath);
        return XMLDecoder.decode(xml);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo != null && pathInfo.equals("/bulk")) {
            handleBulkUpload(request, response);
        } else {
            procesarPost(request, response);
        }
    }

    private void handleBulkUpload(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        if (!validarAutorizacion(request, response)) return;
        if (!validarRolAdmin(request, response)) return;

        try {
            logger.info("[BRIDGE-BULK] Iniciando carga masiva...");
            NewsItem[] noticias = leerNoticiasDesdeRequest(request);
            List<NewsItem> validadas = new ArrayList<>();

            for (NewsItem n : noticias) {
                if (n.title == null) n.title = "";
                if (n.author == null) n.author = "";
                if (n.summary == null) n.summary = "";
                if (n.content == null) n.content = "";
                if (n.imageUrl == null) n.imageUrl = "";
                if (n.category == null) n.category = "";
                if (n.date == null) n.date = "";
                if (n.expiryDate == null) n.expiryDate = "";
                if (n.tags == null) n.tags = new String[0];
                if (n.createdBy == null) n.createdBy = "Admin";
                if (n.updatedBy == null) n.updatedBy = "Admin";
                if (n.createdAt == null) n.createdAt = "";
                if (n.updatedAt == null) n.updatedAt = "";
                n.id = generateId();

                String xmlData = XMLCoder.toXML(n);
                XMLValidator.validar(xmlData, getXsdPath());
                validadas.add(XMLDecoder.decode(xmlData));
            }

            if (this.newsService == null) conectarCorba();
            this.newsService.bulkAddNews(validadas.toArray(new NewsItem[0]));

            logger.info("[BRIDGE-BULK] Éxito: {} noticias cargadas.", validadas.size());
            enviarRespuesta(response, HttpServletResponse.SC_CREATED, true,
                    "Carga masiva completada en CORBA", validadas);
        } catch (Exception e) {
            logger.error("[BRIDGE-BULK] ERROR: {}", e.getMessage());
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false,
                    "Error en carga masiva: " + e.getMessage(), null);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        procesarPut(request, response);
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        procesarDelete(request, response);
    }

    private void procesarPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        if (!validarAutorizacion(request, response)) return;
        if (!validarRolAdmin(request, response)) return;

        try {
            logger.info("[BRIDGE-POST] Iniciando publicación...");
            NewsItem noticiaRecibida = leerNoticiaDesdeRequest(request);
            if (noticiaRecibida.id == null || noticiaRecibida.id.isEmpty()) {
                noticiaRecibida.id = generateId();
            }
            String xsdPath = getXsdPath();
            NewsItem noticiaLimpia;
            try {
                noticiaLimpia = validarYLimpiar(noticiaRecibida, xsdPath);
            } catch (Exception e) {
                logger.warn("[BRIDGE-POST] Error de validación XSD: {}", e.getMessage());
                enviarRespuesta(response, HttpServletResponse.SC_BAD_REQUEST, false,
                        "Error de validación XSD: " + e.getMessage(), null);
                return;
            }

            validarTamanoImagen(noticiaLimpia.imageUrl);
            final NewsItem noticiaFinal = sanitizeParaCorba(noticiaLimpia);
            ejecutarConRetry(() -> this.newsService.addNews(noticiaFinal));
            logger.info("[BRIDGE-POST] Noticia creada con éxito: {}", noticiaFinal.id);
            enviarRespuesta(response, HttpServletResponse.SC_CREATED, true,
                    "Noticia creada en CORBA", noticiaFinal);
        } catch (Exception e) {
            logger.error("[BRIDGE-POST] ERROR: {}", e.getMessage());
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false,
                    "Error al crear noticia: " + e.getMessage(), null);
        }
    }

    private void procesarPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        if (!validarAutorizacion(request, response)) return;
        if (!validarRolAdmin(request, response)) return;

        try {
            logger.info("[BRIDGE-PUT] Iniciando actualización...");
            NewsItem noticiaRecibida = leerNoticiaDesdeRequest(request);
            String xsdPath = getXsdPath();
            NewsItem noticiaLimpia;
            try {
                noticiaLimpia = validarYLimpiar(noticiaRecibida, xsdPath);
            } catch (Exception e) {
                logger.warn("[BRIDGE-PUT] Error de validación XSD: {}", e.getMessage());
                enviarRespuesta(response, HttpServletResponse.SC_BAD_REQUEST, false,
                        "Error de validación XSD: " + e.getMessage(), null);
                return;
            }

            validarTamanoImagen(noticiaLimpia.imageUrl);
            final NewsItem noticiaFinal = sanitizeParaCorba(noticiaLimpia);
            boolean[] result = {false};
            ejecutarConRetry(() -> result[0] = this.newsService.updateNews(noticiaFinal));
            boolean success = result[0];

            if (success) {
                enviarRespuesta(response, HttpServletResponse.SC_OK, true,
                        "Procesamiento concluído exitosamente", noticiaFinal);
            } else {
                enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false,
                        "No se pudo actualizar la noticia", null);
            }
        } catch (Exception e) {
            logger.error("[BRIDGE-PUT] ERROR: {}", e.getMessage());
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false,
                    "Error al actualizar: " + e.getMessage(), null);
        }
    }

    private void procesarDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        if (!validarAutorizacion(request, response)) return;
        if (!validarRolAdmin(request, response)) return;

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.isEmpty()) {
            enviarRespuesta(response, HttpServletResponse.SC_BAD_REQUEST, false,
                    "ID de noticia requerido", null);
            return;
        }

        try {
            String id = pathInfo.substring(1);
            logger.info("[BRIDGE-DELETE] Eliminando ID: {}", id);

            if (this.newsService == null) conectarCorba();
            boolean success = this.newsService.deleteNews(id);

            if (success) {
                enviarRespuesta(response, HttpServletResponse.SC_OK, true,
                        "Procesamiento concluído exitosamente", null);
            } else {
                enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false,
                        "Noticia no encontrada", null);
            }
        } catch (Exception e) {
            logger.error("[BRIDGE-DELETE] ERROR: {}", e.getMessage());
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false,
                    e.getMessage(), null);
        }
    }

    private NewsItem sanitizeParaCorba(NewsItem n) {
        n.title      = sanitizarString(n.title);
        n.content    = sanitizarString(n.content);
        n.summary    = sanitizarString(n.summary);
        n.author     = sanitizarString(n.author);
        n.imageUrl   = sanitizarString(n.imageUrl);
        n.category   = sanitizarString(n.category);
        n.expiryDate = sanitizarString(n.expiryDate);
        n.createdBy  = sanitizarString(n.createdBy);
        n.updatedBy  = sanitizarString(n.updatedBy);
        if (n.tags != null) {
            for (int i = 0; i < n.tags.length; i++) n.tags[i] = sanitizarString(n.tags[i]);
        }
        return n;
    }

    private String sanitizarString(String text) {
        if (text == null) return "";
        return text
            .replace("…", "...")   // … → ...
            .replace("‘", "'")     // ' → '
            .replace("’", "'")     // ' → '
            .replace("“", "\"")    // " → "
            .replace("”", "\"")    // " → "
            .replace("–", "-")     // – → -
            .replace("—", "--")    // — → --
            .replace(" ", " ")     // espacio no-separable → espacio
            .replaceAll("[^\\x00-\\xFF]", "?"); // resto de Unicode → ?
    }

    @FunctionalInterface
    private interface CorbaAction {
        void run() throws Exception;
    }

    private void ejecutarConRetry(CorbaAction action) throws Exception {
        try {
            if (this.newsService == null) conectarCorba();
            action.run();
        } catch (org.omg.CORBA.SystemException corbaEx) {
            logger.warn("[BRIDGE-RETRY] Error CORBA ({}), reconectando...", corbaEx.getMessage());
            this.newsService = null;
            conectarCorba();
            if (this.newsService == null) {
                throw new Exception("Servicio CORBA no disponible tras reconexión");
            }
            action.run();
        }
    }

    private void validarTamanoImagen(String imageUrl) throws Exception {
        if (imageUrl == null || imageUrl.isEmpty() || !imageUrl.startsWith("http")) return;
        try {
            java.net.URL url = new java.net.URL(imageUrl);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("HEAD");
            conn.setConnectTimeout(2000);
            conn.setReadTimeout(2000);
            long size = conn.getContentLengthLong();
            if (size > 100 * 1024) {
                throw new Exception("La imagen es demasiado pesada (" + (size / 1024) + "KB). El máximo permitido es 100KB.");
            }
        } catch (IOException e) {
            logger.warn("[BRIDGE-VALID] No se pudo verificar el tamaño de imagen (ignorado): {}", e.getMessage());
        }
    }

    private boolean validarAutorizacion(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("[BRIDGE-AUTH] Denegado: Sin Token");
            enviarRespuesta(response, HttpServletResponse.SC_UNAUTHORIZED, false,
                    "Autenticacion requerida", null);
            return false;
        }
        return true;
    }

    private boolean validarRolAdmin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String userRole = request.getHeader("X-User-Role");
        if (userRole == null || !userRole.equalsIgnoreCase("ADMIN")) {
            logger.warn("[BRIDGE-AUTH] Denegado: Requiere ADMIN, recibido={}", userRole);
            enviarRespuesta(response, HttpServletResponse.SC_FORBIDDEN, false,
                    "Permisos insuficientes", null);
            return false;
        }
        return true;
    }

    private void enviarRespuesta(HttpServletResponse response, int statusCode, boolean success,
                                  String mensaje, java.lang.Object data) throws IOException {
        enviarRespuestaConPaginacion(response, statusCode, success, mensaje, data, null);
    }

    private void enviarRespuestaConPaginacion(HttpServletResponse response, int statusCode, boolean success,
                                               String mensaje, java.lang.Object data,
                                               Map<String, java.lang.Object> pagination) throws IOException {
        response.setStatus(statusCode);
        Map<String, java.lang.Object> fullResponse = new LinkedHashMap<>();
        Map<String, java.lang.Object> result = new LinkedHashMap<>();

        result.put("transactionId", UUID.randomUUID().toString());
        result.put("code", String.valueOf(statusCode));

        String desc = "OK";
        if (statusCode == 201) desc = "Created";
        else if (statusCode == 400) desc = "Bad Request";
        else if (statusCode == 401) desc = "Unauthorized";
        else if (statusCode == 403) desc = "Forbidden";
        else if (statusCode == 404) desc = "Not Found";
        else if (statusCode >= 500) desc = "Internal Server Error";
        result.put("description", desc);

        String finalMensaje = (statusCode == 200) ? "Procesamiento concluído exitosamente" : mensaje;
        result.put("descriptionDetail", finalMensaje);
        result.put("responseTimestamp", java.time.Instant.now().toString());

        fullResponse.put("result", result);
        fullResponse.put("data", data != null ? data : new ArrayList<>());
        if (pagination != null) {
            fullResponse.put("pagination", pagination);
        }
        response.getWriter().println(mapper.writeValueAsString(fullResponse));
    }

    private NewsItem leerNoticiaDesdeRequest(HttpServletRequest request) throws IOException {
        JsonNode root = mapper.readTree(request.getReader());
        if (root != null && root.isObject()) {
            ObjectNode node = (ObjectNode) root;
            normalizarFecha(node);
            normalizarEstado(node);
        }
        return mapper.readerFor(NewsItem.class)
                .without(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .readValue(root);
    }

    private NewsItem[] leerNoticiasDesdeRequest(HttpServletRequest request) throws IOException {
        JsonNode root = mapper.readTree(request.getReader());
        if (root != null && root.isArray()) {
            ArrayNode array = (ArrayNode) root;
            for (JsonNode node : array) {
                if (node != null && node.isObject()) {
                    ObjectNode objectNode = (ObjectNode) node;
                    normalizarFecha(objectNode);
                    normalizarEstado(objectNode);
                }
            }
        }
        return mapper.readerFor(NewsItem[].class)
                .without(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .readValue(root);
    }

    private void normalizarFecha(ObjectNode node) {
        if (node.hasNonNull("date")) {
            return;
        }
        if (node.hasNonNull("publishedDate")) {
            node.set("date", node.get("publishedDate"));
            return;
        }
        if (node.hasNonNull("publishdate")) {
            node.set("date", node.get("publishdate"));
        }
    }

    private void normalizarEstado(ObjectNode node) {
        if (node.has("isActive")) {
            return;
        }
        JsonNode statusNode = node.get("status");
        if (statusNode == null || statusNode.isNull()) {
            return;
        }
        if (statusNode.isBoolean()) {
            node.set("isActive", statusNode);
            return;
        }
        if (statusNode.isInt() || statusNode.isLong()) {
            node.put("isActive", statusNode.asInt() != 0);
            return;
        }
        if (!statusNode.isTextual()) {
            return;
        }
        String normalizedStatus = statusNode.asText("").trim().toLowerCase();
        if (normalizedStatus.isEmpty()) {
            return;
        }
        boolean isActive = normalizedStatus.equals("active")
                || normalizedStatus.equals("published")
                || normalizedStatus.equals("public")
                || normalizedStatus.equals("visible")
                || normalizedStatus.equals("true")
                || normalizedStatus.equals("1");
        node.put("isActive", isActive);
    }

    private NewsService getCorbaService() throws Exception {
        String orbHost = System.getenv("ORB_HOST") != null ? System.getenv("ORB_HOST") : "localhost";
        String[] orbArgs = {"-ORBInitialPort", "1050", "-ORBInitialHost", orbHost};
        ORB orb = ORB.init(orbArgs, null);
        org.omg.CORBA.Object objRef = orb.resolve_initial_references("NameService");
        NamingContextExt ncRef = NamingContextExtHelper.narrow(objRef);
        return NewsServiceHelper.narrow(ncRef.resolve_str("NewsService"));
    }

    private String getXsdPath() {
        String xsdPath = getServletContext().getRealPath("/WEB-INF/classes/noticias.xsd");
        if (xsdPath == null || !(new File(xsdPath).exists())) {
            xsdPath = System.getProperty("user.dir") + "/src/main/resources/noticias.xsd";
        }
        return xsdPath;
    }

    private String generateId() {
        return UUID.randomUUID().toString().replaceAll("-", "");
    }

    private int parseIntParam(String param, int defaultValue) {
        if (param == null || param.isEmpty()) return defaultValue;
        try {
            return Integer.parseInt(param);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
