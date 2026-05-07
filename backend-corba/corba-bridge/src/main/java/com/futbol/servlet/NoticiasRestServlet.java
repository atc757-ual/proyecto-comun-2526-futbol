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

    // GET /api/noticias -> Lista todas
    // GET /api/noticias/{id} -> Obtiene una
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        if (!validarAutorizacion(request, response)) return;

        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        String pathInfo = request.getPathInfo(); // Devuelve null o "/" o "/123"
        String id = (pathInfo != null && pathInfo.length() > 1) ? pathInfo.substring(1) : null;

        try {
            NewsService newsService = getCorbaService();
            String xsdPath = getXsdPath();

            if (id != null) {
                // Obtener por ID
                NewsItem noticia = newsService.getNewsById(id);
                if (noticia == null) {
                    enviarRespuesta(response, HttpServletResponse.SC_NOT_FOUND, false, "Noticia no encontrada", null);
                    return;
                }
                
                // Pipeline de validación XML
                String xml = XMLCoder.toXML(noticia);
                XMLValidator.validar(xml, xsdPath);
                NewsItem limpia = XMLDecoder.decode(xml);
                
                enviarRespuesta(response, HttpServletResponse.SC_OK, true, "Noticia recuperada", limpia);

            } else {
                // Obtener todas
                NewsItem[] noticias = newsService.getAllNews();
                List<NewsItem> lista = new ArrayList<>();
                for (NewsItem n : noticias) {
                    String xml = XMLCoder.toXML(n);
                    XMLValidator.validar(xml, xsdPath);
                    lista.add(XMLDecoder.decode(xml));
                }
                enviarRespuesta(response, HttpServletResponse.SC_OK, true, "Noticias recuperadas", lista);
            }
        } catch (Exception e) {
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Error: " + e.getMessage(), null);
        }
    }

    // POST /api/noticias -> Crea una noticia (recibiendo JSON desde el Frontend)
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        if (!validarAutorizacion(request, response)) return;

        response.setContentType("application/json;charset=UTF-8");
        
        try {
            // 1. Recibir JSON desde el Frontend y mapear a objeto CORBA NewsItem
            NewsItem noticiaRecibida = mapper.readValue(request.getReader(), NewsItem.class);

            if (noticiaRecibida == null) {
                enviarRespuesta(response, HttpServletResponse.SC_BAD_REQUEST, false, "El body JSON no puede estar vacío", null);
                return;
            }

            // 2. Convertir a XML para pasar el Pipeline de validación (Requisito de sintaxis/semántica)
            String xmlData = XMLCoder.toXML(noticiaRecibida);
            String xsdPath = getXsdPath();
            
            // 3. Validar sintaxis y semántica contra el XSD
            XMLValidator.validar(xmlData, xsdPath);
            
            // 4. Decodificar de nuevo desde el XML validado (Garantiza integridad total)
            NewsItem itemParaCorba = XMLDecoder.decode(xmlData);

            // 5. Enviar al servidor CORBA central
            NewsService newsService = getCorbaService();
            newsService.addNews(itemParaCorba);

            enviarRespuesta(response, HttpServletResponse.SC_CREATED, true, 
                "Noticia procesada (JSON -> XML -> XSD VALID -> CORBA) con éxito", itemParaCorba);

        } catch (org.xml.sax.SAXException vex) {
            enviarRespuesta(response, HttpServletResponse.SC_BAD_REQUEST, false, 
                "Error: El JSON enviado genera un XML inválido según el esquema (XSD): " + vex.getMessage(), null);
        } catch (Exception e) {
            enviarRespuesta(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, 
                "Error interno en el bridge: " + e.getMessage(), null);
        }
    }

    // DELETE /api/noticias/{id} -> Borra una noticia
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        if (!validarAutorizacion(request, response)) return;

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
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            enviarRespuesta(response, HttpServletResponse.SC_UNAUTHORIZED, false, "Acceso no autorizado", null);
            return false;
        }
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
