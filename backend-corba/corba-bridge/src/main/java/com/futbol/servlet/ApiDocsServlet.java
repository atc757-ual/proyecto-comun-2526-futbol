package com.futbol.servlet;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

/**
 * Servlet que devuelve la documentación de la API en formato JSON (estilo OpenAPI).
 * Accesible SIN token JWT (ruta fuera de /api/*).
 */
public class ApiDocsServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    public void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {

        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        PrintWriter out = response.getWriter();

        out.println("{\n" +
            "  \"info\": {\n" +
            "    \"title\": \"CORBA Bridge - Gestor de Noticias de Fútbol\",\n" +
            "    \"version\": \"1.0.0\",\n" +
            "    \"description\": \"API REST que actua como puente HTTP-CORBA con validacion XML/XSD y seguridad JWT\"\n" +
            "  },\n" +
            "  \"basePath\": \"/corba-bridge\",\n" +
            "  \"seguridad\": \"Todas las rutas /api/* requieren: Authorization: Bearer <token> + X-User-Role: ADMIN\",\n" +
            "  \"endpoints\": [\n" +
            "    {\n" +
            "      \"ruta\": \"GET /api/noticias\",\n" +
            "      \"descripcion\": \"Listar todas las noticias (requiere rol ADMIN)\",\n" +
            "      \"params\": {\"page\": \"(opcional) numero de pagina\", \"limit\": \"(opcional) elementos por pagina\"}\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"GET /api/noticias/feed\",\n" +
            "      \"descripcion\": \"Noticias visibles/publicadas (requiere JWT)\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"GET /api/noticias/featured\",\n" +
            "      \"descripcion\": \"Noticias destacadas (requiere JWT)\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"GET /api/noticias/recent\",\n" +
            "      \"descripcion\": \"Noticias recientes (requiere JWT)\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"GET /api/noticias/{id}\",\n" +
            "      \"descripcion\": \"Obtener noticia por ID (requiere JWT)\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"POST /api/noticias\",\n" +
            "      \"descripcion\": \"Crear noticia — validada contra XSD antes de guardar en CORBA (requiere ADMIN)\",\n" +
            "      \"body\": {\n" +
            "        \"id\": \"(opcional) autogenerado si no se indica\",\n" +
            "        \"title\": \"(requerido) 5-250 chars\",\n" +
            "        \"author\": \"(requerido) 3-100 chars\",\n" +
            "        \"summary\": \"(requerido) 10-1000 chars\",\n" +
            "        \"content\": \"(requerido) 20-10000 chars\",\n" +
            "        \"imageUrl\": \"(requerido) http:// o https:// — maximo 100KB\",\n" +
            "        \"category\": \"(requerido) Fichajes|Resultados|Cronica|Opinion|Internacional|Mundial 2026|Tactica|Actualidad|Salud|General\",\n" +
            "        \"date\": \"(requerido) DD/MM/YYYY\",\n" +
            "        \"expiryDate\": \"(requerido) DD/MM/YYYY\",\n" +
            "        \"isActive\": \"(requerido) boolean\",\n" +
            "        \"isFeatured\": \"(requerido) boolean\",\n" +
            "        \"tags\": \"(requerido) array de 1-6 strings, max 15 chars cada uno\"\n" +
            "      }\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"PUT /api/noticias\",\n" +
            "      \"descripcion\": \"Actualizar noticia existente — validada contra XSD (requiere ADMIN)\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"DELETE /api/noticias/{id}\",\n" +
            "      \"descripcion\": \"Eliminar noticia por ID (requiere ADMIN)\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"POST /api/noticias/bulk\",\n" +
            "      \"descripcion\": \"Carga masiva de noticias — array JSON (requiere ADMIN)\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"GET /docs\",\n" +
            "      \"descripcion\": \"Esta documentacion (NO requiere JWT)\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"validacion_xsd\": {\n" +
            "    \"esquema\": \"noticias.xsd\",\n" +
            "    \"reglas\": {\n" +
            "      \"id\": \"Alfanumerico con guiones, 1-50 chars\",\n" +
            "      \"date\": \"Formato DD/MM/YYYY\",\n" +
            "      \"expiryDate\": \"Formato DD/MM/YYYY\",\n" +
            "      \"title\": \"5-250 chars\",\n" +
            "      \"author\": \"3-100 chars\",\n" +
            "      \"summary\": \"10-1000 chars\",\n" +
            "      \"content\": \"20-10000 chars\",\n" +
            "      \"imageUrl\": \"Debe empezar por http:// o https://, maximo 100KB\",\n" +
            "      \"category\": \"Enum: Fichajes, Resultados, Cronica, Opinion, Internacional, Mundial 2026, Tactica, Actualidad, Salud, General\",\n" +
            "      \"tags\": \"1-6 etiquetas, max 15 chars cada una\"\n" +
            "    }\n" +
            "  },\n" +
            "  \"pipeline_xml\": [\"XMLCoder (NewsItem a XML)\", \"XMLValidator (XML vs XSD)\", \"XMLParser (XML a DOM)\", \"XMLDecoder (XML a NewsItem)\"]\n" +
            "}");
    }
}
