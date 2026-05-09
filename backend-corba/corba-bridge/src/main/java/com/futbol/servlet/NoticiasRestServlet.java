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
                NewsItem noticia = this.newsService.getNewsById(id);
                if (noticia == null) {
                    System.out.println("[BRIDGE-GET] Noticia " + id + " no encontrada.");
                    enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false, "Noticia no encontrada", null);
                } else {
                    System.out.println("[BRIDGE-GET] Noticia " + id + " encontrada. Validando XML...");
                    enviarRespuesta(response, HttpServletResponse.SC_OK, true, "Noticia recuperada", validarYLimpiar(noticia, xsdPath));
                }
            }
        } catch (Exception e) {
            System.err.println("[BRIDGE-ERROR] Fallo en el flujo de datos: " + e.getMessage());
            e.printStackTrace();
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Error Bridge: " + e.getMessage(), null);
        }
    }

    private void procesarLista(NewsItem[] noticias, HttpServletResponse response, String xsdPath, String msg) throws Exception {
        System.out.println("[BRIDGE-LIST] Procesando lista de " + (noticias != null ? noticias.length : 0) + " items...");
        List<NewsItem> lista = new ArrayList<>();
        if (noticias != null) {
            for (NewsItem n : noticias) {
                lista.add(validarYLimpiar(n, xsdPath));
            }
        }
        System.out.println("[BRIDGE-LIST] Lista procesada. Enviando respuesta JSON...");
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
        procesarPost(request, response);
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
            NewsItem noticiaRecibida = mapper.readValue(request.getReader(), NewsItem.class);
            String xmlData = XMLCoder.toXML(noticiaRecibida);
            XMLValidator.validar(xmlData, getXsdPath());
            NewsItem itemParaCorba = XMLDecoder.decode(xmlData);

            if (this.newsService == null) conectarCorba();
            this.newsService.addNews(itemParaCorba);

            System.out.println("[BRIDGE-POST] Exito enviando a CORBA.");
            enviarRespuesta(response, HttpServletResponse.SC_CREATED, true, "Noticia publicada", itemParaCorba);
        } catch (Exception e) {
            System.err.println("[BRIDGE-POST] ERROR: " + e.getMessage());
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, e.getMessage(), null);
        }
    }

    private void procesarPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        if (!validarAutorizacion(request, response)) return;
        if (!validarRolAdmin(request, response)) return;

        try {
            System.out.println("[BRIDGE-PUT] Iniciando actualizacion...");
            NewsItem noticiaRecibida = mapper.readValue(request.getReader(), NewsItem.class);
            System.out.println("[BRIDGE-PUT] Datos recibidos: ID=" + noticiaRecibida.id + ", isFeatured=" + noticiaRecibida.isFeatured);
            
            String xmlData = XMLCoder.toXML(noticiaRecibida);
            XMLValidator.validar(xmlData, getXsdPath());
            NewsItem itemParaCorba = XMLDecoder.decode(xmlData);

            if (this.newsService == null) conectarCorba();
            boolean success = this.newsService.updateNews(itemParaCorba);

            if (success) {
                System.out.println("[BRIDGE-PUT] Exito actualizando en CORBA.");
                enviarRespuesta(response, HttpServletResponse.SC_OK, true, "Noticia actualizada", itemParaCorba);
            } else {
                System.out.println("[BRIDGE-PUT] CORBA devolvio false (no encontrado?).");
                enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false, "No se pudo actualizar la noticia", null);
            }
        } catch (Exception e) {
            System.err.println("[BRIDGE-PUT] ERROR: " + e.getMessage());
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, e.getMessage(), null);
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
