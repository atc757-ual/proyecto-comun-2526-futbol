package com.futbol.servlet;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.*;
import javax.servlet.http.*;
import org.omg.CORBA.*;
import org.omg.CosNaming.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import BufferApp.*;
import com.futbol.utils.*;

/**
 * Servlet RESTful para gestionar noticias con Logs de Depuración y Conexión Persistente.
 */
public class NoticiasRestServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private final ObjectMapper mapper = new ObjectMapper();
    private NewsService newsService;

    @Override
    public void init() throws ServletException {
        conectarCorba();
    }

    private void conectarCorba() {
        try {
            System.out.println("[BRIDGE-INIT] Intentando conectar con servidor CORBA...");
            this.newsService = getCorbaService();
            System.out.println("[BRIDGE-INIT] !!! CONEXION ESTABLECIDA CON ÉXITO !!!");
        } catch (Exception e) {
            System.err.println("[BRIDGE-INIT] ERROR CRÍTICO AL CONECTAR: " + e.getMessage());
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        System.out.println("[BRIDGE-GET] Nueva peticion recibida: " + request.getPathInfo());
        
        if (!validarAutorizacion(request, response)) return;

        response.setContentType("application/json;charset=UTF-8");
        String pathInfo = request.getPathInfo(); 
        
        try {
            if (this.newsService == null) {
                System.out.println("[BRIDGE-GET] Re-intentando conexion CORBA perdida...");
                conectarCorba();
            }
            
            String xsdPath = getXsdPath();
            System.out.println("[BRIDGE-GET] Usando XSD: " + xsdPath);

            if (pathInfo == null || pathInfo.equals("/") || pathInfo.isEmpty()) {
                if (!validarRolAdmin(request, response)) return;
                System.out.println("[BRIDGE-GET] Llamando a CORBA: getAllNews()...");
                procesarLista(this.newsService.getAllNews(), response, xsdPath, "Admin: Todas las noticias");
            } else if (pathInfo.startsWith("/feed")) {
                System.out.println("[BRIDGE-GET] Llamando a CORBA: getVisibleNews()...");
                procesarLista(this.newsService.getVisibleNews(), response, xsdPath, "Public: Feed de noticias");
            } else if (pathInfo.startsWith("/featured")) {
                System.out.println("[BRIDGE-GET] Llamando a CORBA: getFeaturedNews()...");
                procesarLista(this.newsService.getFeaturedNews(), response, xsdPath, "Public: Destacadas");
            } else if (pathInfo.startsWith("/recent")) {
                System.out.println("[BRIDGE-GET] Llamando a CORBA: getRecentNews()...");
                procesarLista(this.newsService.getRecentNews(), response, xsdPath, "Public: Recientes");
            } else {
                String id = pathInfo.substring(1);
                System.out.println("[BRIDGE-GET] Llamando a CORBA: getNewsById(" + id + ")...");
                try {
                    NewsItem noticia = this.newsService.getNewsById(id);
                    if (noticia == null || noticia.id == null || noticia.id.isEmpty()) {
                        System.out.println("[BRIDGE-GET] Noticia " + id + " no encontrada (null).");
                        enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false, "Noticia no encontrada", null);
                    } else {
                        System.out.println("[BRIDGE-GET] Noticia " + id + " encontrada. Validando XML...");
                        try {
                            enviarRespuesta(response, HttpServletResponse.SC_OK, true, "Noticia recuperada", validarYLimpiar(noticia, xsdPath));
                        } catch (Exception valEx) {
                            System.err.println("[BRIDGE-VALID] Error validando noticia existente: " + valEx.getMessage());
                            // Si falla la validación pero la noticia existe, la enviamos igual pero con aviso o limpia
                            enviarRespuesta(response, HttpServletResponse.SC_OK, true, "Noticia recuperada (Error validación XSD)", noticia);
                        }
                    }
                } catch (org.omg.CORBA.OBJECT_NOT_EXIST | org.omg.CORBA.BAD_PARAM ex) {
                    System.out.println("[BRIDGE-GET] Excepción CORBA: Noticia " + id + " no existe.");
                    enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false, "Noticia no encontrada en CORBA", null);
                }
            }
        } catch (Exception e) {
            System.err.println("[BRIDGE-ERROR] Fallo crítico en el flujo: " + e.getMessage());
            e.printStackTrace();
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Error Crítico Bridge: " + e.getMessage(), null);
        }
    }

    private void procesarLista(NewsItem[] noticias, HttpServletResponse response, String xsdPath, String msg) throws Exception {
        System.out.println("[BRIDGE-LIST] Procesando lista de " + (noticias != null ? noticias.length : 0) + " items...");
        List<NewsItem> lista = new ArrayList<>();
        if (noticias != null) {
            for (NewsItem n : noticias) {
                try {
                    lista.add(validarYLimpiar(n, xsdPath));
                } catch (Exception e) {
                    System.err.println("[BRIDGE-LIST] Saltando noticia " + n.id + " por error de validación: " + e.getMessage());
                    // Opcionalmente podrías añadir la noticia sin validar si quieres que se vea igual
                    // lista.add(n); 
                }
            }
        }
        
        // Ordenar la lista por fecha descendente (más reciente primero)
        // El formato es DD/MM/YYYY, lo comparamos como YYYYMMDD
        lista.sort((n1, n2) -> {
            try {
                String[] d1 = n1.date.split("/");
                String[] d2 = n2.date.split("/");
                String iso1 = d1[2] + d1[1] + d1[0]; // YYYYMMDD
                String iso2 = d2[2] + d2[1] + d2[0];
                return iso2.compareTo(iso1); // Descendente
            } catch (Exception e) {
                return 0;
            }
        });

        System.out.println("[BRIDGE-LIST] Lista procesada y ordenada. Enviando respuesta JSON...");
        enviarRespuesta(response, HttpServletResponse.SC_OK, true, msg, lista);
    }

    private NewsItem validarYLimpiar(NewsItem n, String xsdPath) throws Exception {
        // System.out.println("[BRIDGE-VALID] Pipeline XML para: " + n.title);
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
            System.out.println("[BRIDGE-BULK] Iniciando carga masiva...");
            NewsItem[] noticias = mapper.readValue(request.getReader(), NewsItem[].class);
            List<NewsItem> validadas = new ArrayList<>();

            for (NewsItem n : noticias) {
                // Blindaje anti-nulos para CORBA
                if (n.id == null) n.id = "";
                if (n.title == null) n.title = "";
                if (n.author == null) n.author = "";
                if (n.summary == null) n.summary = "";
                if (n.content == null) n.content = "";
                if (n.imageUrl == null) n.imageUrl = "";
                if (n.category == null) n.category = "";
                if (n.date == null) n.date = "";
                if (n.tags == null) n.tags = new String[0];
                if (n.createdBy == null) n.createdBy = "Admin";
                if (n.updatedBy == null) n.updatedBy = "Admin";
                if (n.createdAt == null) n.createdAt = "";
                if (n.updatedAt == null) n.updatedAt = "";

                System.out.println("[BRIDGE-BULK] Procesando noticia ID: " + n.id + " | Titulo: " + n.title);

                String xmlData = XMLCoder.toXML(n);
                XMLValidator.validar(xmlData, getXsdPath());
                validadas.add(XMLDecoder.decode(xmlData));
            }

            if (this.newsService == null) conectarCorba();
            this.newsService.bulkAddNews(validadas.toArray(new NewsItem[0]));

            System.out.println("[BRIDGE-BULK] Exito: " + validadas.size() + " noticias cargadas.");
            enviarRespuesta(response, HttpServletResponse.SC_CREATED, true, "Carga masiva exitosa", validadas);
        } catch (Exception e) {
            System.err.println("[BRIDGE-BULK] ERROR: " + e.getMessage());
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Error en carga masiva: " + e.getMessage(), null);
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
            System.out.println("[BRIDGE-POST] Iniciando publicacion...");
            // 1. Leer una sola vez el JSON del request
            NewsItem noticiaRecibida = mapper.readValue(request.getReader(), NewsItem.class);
            
            // 2. Validar contra XSD antes de guardar (Pipeline de limpieza)
            String xsdPath = getXsdPath();
            NewsItem noticiaLimpia;
            try {
                noticiaLimpia = validarYLimpiar(noticiaRecibida, xsdPath);
            } catch (Exception e) {
                System.err.println("[BRIDGE-POST] Error de validación XSD: " + e.getMessage());
                enviarRespuesta(response, HttpServletResponse.SC_BAD_REQUEST, false, "Error de validación XSD: " + e.getMessage(), null);
                return;
            }

            if (this.newsService == null) conectarCorba();
            
            // 3. Validación de tamaño de imagen en Backend
            validarTamanoImagen(noticiaLimpia.imageUrl);

            // 4. Guardar en CORBA
            this.newsService.addNews(noticiaLimpia);
            System.out.println("[BRIDGE-POST] Noticia creada con éxito: " + noticiaLimpia.id);
            enviarRespuesta(response, HttpServletResponse.SC_CREATED, true, "Noticia creada correctamente", noticiaLimpia);
        } catch (Exception e) {
            System.err.println("[BRIDGE-POST] ERROR: " + e.getMessage());
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Error de validación: " + e.getMessage(), null);
        }
    }

    private void procesarPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        if (!validarAutorizacion(request, response)) return;
        if (!validarRolAdmin(request, response)) return;

        try {
            System.out.println("[BRIDGE-PUT] Iniciando actualizacion...");
            // 1. Leer JSON una sola vez
            NewsItem noticiaRecibida = mapper.readValue(request.getReader(), NewsItem.class);
            
            // 2. Validar contra XSD (Pipeline de limpieza)
            String xsdPath = getXsdPath();
            NewsItem noticiaLimpia;
            try {
                noticiaLimpia = validarYLimpiar(noticiaRecibida, xsdPath);
            } catch (Exception e) {
                System.err.println("[BRIDGE-PUT] Error de validación XSD: " + e.getMessage());
                enviarRespuesta(response, HttpServletResponse.SC_BAD_REQUEST, false, "Error de validación XSD: " + e.getMessage(), null);
                return;
            }

            if (this.newsService == null) conectarCorba();
            
            // 3. Validación de tamaño de imagen en Backend
            validarTamanoImagen(noticiaLimpia.imageUrl);

            // 4. Actualizar en CORBA
            boolean success = this.newsService.updateNews(noticiaLimpia);

            if (success) {
                System.out.println("[BRIDGE-PUT] Exito actualizando en CORBA.");
                enviarRespuesta(response, HttpServletResponse.SC_OK, true, "Noticia actualizada", noticiaLimpia);
            } else {
                System.out.println("[BRIDGE-PUT] CORBA devolvio false (no encontrado?).");
                enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false, "No se pudo actualizar la noticia", null);
            }
        } catch (Exception e) {
            System.err.println("[BRIDGE-PUT] ERROR: " + e.getMessage());
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Error al actualizar: " + e.getMessage(), null);
        }
    }

    private void procesarDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        if (!validarAutorizacion(request, response)) return;
        if (!validarRolAdmin(request, response)) return;

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.isEmpty()) {
            enviarRespuesta(response, HttpServletResponse.SC_BAD_REQUEST, false, "ID de noticia requerido", null);
            return;
        }

        try {
            String id = pathInfo.substring(1);
            System.out.println("[BRIDGE-DELETE] Iniciando eliminacion de ID: " + id);

            if (this.newsService == null) conectarCorba();
            boolean success = this.newsService.deleteNews(id);

            if (success) {
                System.out.println("[BRIDGE-DELETE] Exito eliminando en CORBA.");
                enviarRespuesta(response, HttpServletResponse.SC_OK, true, "Noticia eliminada", null);
            } else {
                System.out.println("[BRIDGE-DELETE] Noticia no encontrada en CORBA.");
                enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false, "Noticia no encontrada", null);
            }
        } catch (Exception e) {
            System.err.println("[BRIDGE-DELETE] ERROR: " + e.getMessage());
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, e.getMessage(), null);
        }
    }

    private void validarTamanoImagen(String imageUrl) throws Exception {
        if (imageUrl == null || imageUrl.isEmpty() || !imageUrl.startsWith("http")) return;
        
        System.out.println("[BRIDGE-VALID] Verificando tamaño de imagen: " + imageUrl);
        try {
            java.net.URL url = new java.net.URL(imageUrl);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("HEAD");
            conn.setConnectTimeout(2000); // 2 segundos máximo
            conn.setReadTimeout(2000);
            
            long size = conn.getContentLengthLong();
            if (size > 100 * 1024) {
                System.err.println("[BRIDGE-VALID] IMAGEN RECHAZADA: " + (size/1024) + "KB");
                throw new Exception("La imagen es demasiado pesada (" + (size/1024) + "KB). El máximo permitido es 100KB.");
            }
            System.out.println("[BRIDGE-VALID] Imagen OK: " + (size/1024) + "KB");
        } catch (IOException e) {
            System.err.println("[BRIDGE-VALID] No se pudo verificar el tamaño (Ignorado): " + e.getMessage());
            // Si falla la conexión, dejamos pasar para no bloquear la publicación por un error de red temporal
        }
    }

    private boolean validarAutorizacion(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.err.println("[BRIDGE-AUTH] Denegado: Sin Token");
            enviarRespuesta(response, HttpServletResponse.SC_UNAUTHORIZED, false, "Token no proporcionado", null);
            return false;
        }
        return true;
    }

    private boolean validarRolAdmin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String userRole = request.getHeader("X-User-Role");
        if (userRole == null || !userRole.equalsIgnoreCase("ADMIN")) {
            System.err.println("[BRIDGE-AUTH] Denegado: Requiere ADMIN y es " + userRole);
            enviarRespuesta(response, HttpServletResponse.SC_FORBIDDEN, false, "Requiere ADMIN", null);
            return false;
        }
        return true;
    }

    private void enviarRespuesta(HttpServletResponse response, int statusCode, boolean success, String mensaje, java.lang.Object data) throws IOException {
        response.setStatus(statusCode);
        java.util.Map<String, java.lang.Object> fullResponse = new java.util.LinkedHashMap<>();
        java.util.Map<String, java.lang.Object> result = new java.util.LinkedHashMap<>();
        result.put("descriptionDetail", mensaje);
        result.put("code", success ? "0" : "1");
        fullResponse.put("result", result);
        fullResponse.put("data", data != null ? data : new java.util.ArrayList<>());
        response.getWriter().println(mapper.writeValueAsString(fullResponse));
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
}
