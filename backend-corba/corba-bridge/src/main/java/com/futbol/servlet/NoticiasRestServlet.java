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
 * Servlet RESTful para gestionar noticias.
 * Mapeado a /api/noticias/*
 * Responde con estructura estándar: { result: {success, message}, data: [...] }
 */
public class NoticiasRestServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private final ObjectMapper mapper = new ObjectMapper();

    // GET /api/noticias -> Lista todas (Admin)
    // GET /api/noticias/public -> Lista solo activas (User)
    // GET /api/noticias/recent -> Lista 5 más recientes (User)
    // GET /api/noticias/{id} -> Obtiene una
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        if (!validarAutorizacion(request, response)) return;

        response.setContentType("application/json;charset=UTF-8");
        String pathInfo = request.getPathInfo(); 
        
        try {
            NewsService newsService = getCorbaService();
            String xsdPath = getXsdPath();

            if (pathInfo == null || pathInfo.equals("/")) {
                // RUTA DE ADMIN: Requiere validación de rol Admin
                if (!validarRolAdmin(request, response)) return;
                procesarLista(newsService.getAllNews(), response, xsdPath, "Todas las noticias recuperadas (Admin)");
            } else if (pathInfo.equals("/feed")) {
                // RUTA PÚBLICA: Solo noticias activas (Obscuridad)
                procesarLista(newsService.getVisibleNews(), response, xsdPath, "Feed de noticias actualizado");
            } else if (pathInfo.equals("/recent")) {
                // RUTA PÚBLICA: 5 recientes
                procesarLista(newsService.getRecentNews(), response, xsdPath, "Noticias recientes recuperadas");
            } else {
                // Obtener por ID: Pública
                String id = pathInfo.substring(1);
                NewsItem noticia = newsService.getNewsById(id);
                if (noticia == null) {
                    enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false, "Noticia no encontrada", null);
                } else {
                    enviarRespuesta(response, HttpServletResponse.SC_OK, true, "Noticia recuperada", validarYLimpiar(noticia, xsdPath));
                }
            }
        } catch (Exception e) {
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Error: " + e.getMessage(), null);
        }
    }

    private void procesarLista(NewsItem[] noticias, HttpServletResponse response, String xsdPath, String msg) throws Exception {
        List<NewsItem> lista = new ArrayList<>();
        for (NewsItem n : noticias) {
            lista.add(validarYLimpiar(n, xsdPath));
        }
        enviarRespuesta(response, HttpServletResponse.SC_OK, true, msg, lista);
    }

    private NewsItem validarYLimpiar(NewsItem n, String xsdPath) throws Exception {
        String xml = XMLCoder.toXML(n);
        XMLValidator.validar(xml, xsdPath);
        return XMLDecoder.decode(xml);
    }

    // POST /api/noticias -> Crea una noticia (recibiendo JSON desde el Frontend)
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");

        if (!validarAutorizacion(request, response)) return;
        if (!validarRolAdmin(request, response)) return;

        try {
            System.out.println("[DEBUG-BRIDGE] Iniciando proceso de publicacion...");
            
            // 1. Recibir JSON desde el Frontend y mapear a objeto CORBA NewsItem
            System.out.println("[DEBUG-BRIDGE] Intentando mapear JSON a NewsItem...");
            NewsItem noticiaRecibida = mapper.readValue(request.getReader(), NewsItem.class);
            System.out.println("[DEBUG-BRIDGE] JSON mapeado correctamente para: " + noticiaRecibida.title);

            if (noticiaRecibida == null) {
                enviarRespuesta(response, HttpServletResponse.SC_BAD_REQUEST, false, "El body JSON no puede estar vacío", null);
                return;
            }

            // 2. Convertir a XML para pasar el Pipeline de validación (Requisito de sintaxis/semántica)
            System.out.println("[DEBUG-BRIDGE] Convirtiendo objeto a XML...");
            String xmlData = XMLCoder.toXML(noticiaRecibida);
            String xsdPath = getXsdPath();
            System.out.println("[DEBUG-BRIDGE] XML generado. Usando XSD en: " + xsdPath);
            
            // 3. Validar sintaxis y semántica contra el XSD
            System.out.println("[DEBUG-BRIDGE] Validando contra XSD...");
            XMLValidator.validar(xmlData, xsdPath);
            System.out.println("[DEBUG-BRIDGE] Validacion XSD exitosa.");
            
            // 4. Decodificar de nuevo desde el XML validado (Garantiza integridad total)
            NewsItem itemParaCorba = XMLDecoder.decode(xmlData);

            // 5. Enviar al servidor CORBA central
            System.out.println("[DEBUG-BRIDGE] Conectando con el servicio CORBA (NewsService)...");
            NewsService newsService = getCorbaService();
            System.out.println("[DEBUG-BRIDGE] Servicio CORBA obtenido. Llamando a addNews...");
            newsService.addNews(itemParaCorba);

            System.out.println("[DEBUG-BRIDGE] !!! EXITO !!! Noticia enviada a CORBA.");
            enviarRespuesta(response, HttpServletResponse.SC_CREATED, true, 
                "Noticia procesada (JSON -> XML -> XSD VALID -> CORBA) con éxito", itemParaCorba);

        } catch (org.xml.sax.SAXException vex) {
            System.err.println("[DEBUG-BRIDGE] ERROR DE VALIDACION XSD: " + vex.getMessage());
            enviarRespuesta(response, HttpServletResponse.SC_BAD_REQUEST, false, 
                "Error: El JSON enviado genera un XML inválido según el esquema (XSD): " + vex.getMessage(), null);
        } catch (Exception e) {
            System.err.println("[DEBUG-BRIDGE] ERROR CRITICO: " + e.getMessage());
            e.printStackTrace();
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, 
                "Error interno en el bridge: " + e.getMessage(), null);
        }
    }

    // PUT /api/noticias -> Actualiza una noticia
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        if (!validarAutorizacion(request, response)) return;
        if (!validarRolAdmin(request, response)) return;

        response.setContentType("application/json;charset=UTF-8");
        
        try {
            NewsItem noticiaRecibida = mapper.readValue(request.getReader(), NewsItem.class);
            String xsdPath = getXsdPath();
            
            // Validar Pipeline (JSON -> XML -> XSD -> CORBA)
            NewsItem itemValidado = validarYLimpiar(noticiaRecibida, xsdPath);

            NewsService newsService = getCorbaService();
            boolean actualizado = newsService.updateNews(itemValidado);

            if (actualizado) {
                enviarRespuesta(response, HttpServletResponse.SC_OK, true, "Noticia actualizada con éxito", itemValidado);
            } else {
                enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false, "No se pudo actualizar: ID no encontrado", null);
            }

        } catch (Exception e) {
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Error al actualizar: " + e.getMessage(), null);
        }
    }

    // DELETE /api/noticias/{id} -> Borra una noticia
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        if (!validarAutorizacion(request, response)) return;
        if (!validarRolAdmin(request, response)) return;

        response.setContentType("application/json;charset=UTF-8");
        String pathInfo = request.getPathInfo();
        String id = (pathInfo != null && pathInfo.length() > 1) ? pathInfo.substring(1) : null;

        if (id == null) {
            enviarRespuesta(response, HttpServletResponse.SC_BAD_REQUEST, false, "Se requiere el ID de la noticia a eliminar en la URL", null);
            return;
        }

        try {
            NewsService newsService = getCorbaService();
            
            // Verificar si existe
            NewsItem noticia = newsService.getNewsById(id);
            if (noticia == null) {
                enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false, "Noticia no encontrada para eliminar", null);
                return;
            }

            // Eliminar de CORBA
            newsService.deleteNews(id);
            enviarRespuesta(response, HttpServletResponse.SC_NO_CONTENT, true, "Noticia eliminada correctamente", null);

        } catch (Exception e) {
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Error al eliminar: " + e.getMessage(), null);
        }
    }

    // --- Métodos de utilidad ---

    private boolean validarAutorizacion(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String authHeader = request.getHeader("Authorization");
        System.out.println("[DEBUG-AUTH] Verificando cabecera Authorization...");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.err.println("[DEBUG-AUTH] ERROR: Cabecera Authorization no encontrada o mal formateada");
            enviarRespuesta(response, HttpServletResponse.SC_UNAUTHORIZED, false, "Token no proporcionado", null);
            return false;
        }
        System.out.println("[DEBUG-AUTH] Cabecera Authorization encontrada.");
        return true;
    }

    private boolean validarRolAdmin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // En una arquitectura con Gateway, el Gateway suele inyectar el rol en un header
        String userRole = request.getHeader("X-User-Role");
        System.out.println("[DEBUG-AUTH] Verificando rol de usuario (Header X-User-Role): " + (userRole != null ? userRole : "NULL"));
        
        if (userRole == null || !userRole.equalsIgnoreCase("ADMIN")) {
            System.err.println("[DEBUG-AUTH] ERROR: Acceso denegado. Se esperaba ADMIN y se recibio: " + userRole);
            enviarRespuesta(response, HttpServletResponse.SC_FORBIDDEN, false, "Acceso denegado: Se requiere rol ADMIN", null);
            return false;
        }
        System.out.println("[DEBUG-AUTH] !!! ROL ADMIN CONFIRMADO !!!");
        return true;
    }

    private void enviarRespuesta(HttpServletResponse response, int statusCode, boolean success, String mensaje, java.lang.Object data) throws IOException {
        response.setStatus(statusCode);
        
        java.util.Map<String, java.lang.Object> result = new java.util.LinkedHashMap<>();
        result.put("transactionId", java.util.UUID.randomUUID().toString());
        result.put("code", success ? "0" : String.valueOf(statusCode));
        result.put("description", success ? "OK" : "NOK");
        result.put("descriptionDetail", mensaje);
        result.put("responseTimestamp", java.time.Instant.now().toString());

        java.util.Map<String, java.lang.Object> fullResponse = new java.util.LinkedHashMap<>();
        fullResponse.put("result", result);
        fullResponse.put("data", data != null ? data : new java.util.ArrayList<>());

        response.getWriter().println(mapper.writeValueAsString(fullResponse));
    }

    private NewsService getCorbaService() throws Exception {
        String orbHost = System.getenv("ORB_HOST") != null ? System.getenv("ORB_HOST") : "localhost";
        String[] orbArgs = {"-ORBInitialPort", "1050", "-ORBInitialHost", orbHost};
        java.util.Properties props = new java.util.Properties();
        props.put("org.glassfish.gmbal.disable", "true");
        props.put("com.sun.CORBA.ORBDisableJMX", "true");
        
        ORB orb = ORB.init(orbArgs, props);
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
