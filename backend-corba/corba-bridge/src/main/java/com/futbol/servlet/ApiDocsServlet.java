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
            "    \"description\": \"API REST que actúa como puente HTTP-CORBA con validación XML/XSD y seguridad JWT\"\n" +
            "  },\n" +
            "  \"basePath\": \"/corba-bridge\",\n" +
            "  \"seguridad\": \"Todas las rutas /api/* requieren header: Authorization: Bearer <token>\",\n" +
            "  \"endpoints\": [\n" +
            "    {\n" +
            "      \"ruta\": \"/api/noticias/crear\",\n" +
            "      \"metodo\": \"POST\",\n" +
            "      \"descripcion\": \"Crear o actualizar una noticia (validada contra XSD)\",\n" +
            "      \"parametros\": {\n" +
            "        \"id\": \"(opcional) Si se proporciona, actualiza la noticia existente\",\n" +
            "        \"titulo\": \"(requerido) Título de la noticia (5-100 chars)\",\n" +
            "        \"contenido\": \"(requerido) Contenido de la noticia (20-5000 chars)\",\n" +
            "        \"fecha\": \"(requerido) Formato DD/MM/YYYY\",\n" +
            "        \"autor\": \"(requerido) Nombre del autor (5-100 chars)\",\n" +
            "        \"etiquetas\": \"(requerido) Tags separados por coma (1-6 tags)\",\n" +
            "        \"categoria\": \"(requerido) Valores: Fichajes, Resultados, Crónica, Opinión, Internacional, General\",\n" +
            "        \"imageUrl\": \"(requerido) URL de imagen (http:// o https://)\"\n" +
            "      },\n" +
            "      \"respuesta_ok\": {\"ok\": true, \"mensaje\": \"Noticia validada (XSD) y guardada en CORBA\", \"id\": \"123\"},\n" +
            "      \"respuesta_error_xsd\": {\"ok\": false, \"mensaje\": \"Validación XSD fallida\", \"detalle\": \"...\"}\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"/api/noticias/listar\",\n" +
            "      \"metodo\": \"GET\",\n" +
            "      \"descripcion\": \"Obtener todas las noticias o una por ID\",\n" +
            "      \"parametros\": {\n" +
            "        \"id\": \"(opcional) Si se proporciona, devuelve solo esa noticia\"\n" +
            "      },\n" +
            "      \"respuesta_lista\": {\"ok\": true, \"noticias\": [\"...\"]},\n" +
            "      \"respuesta_unica\": {\"ok\": true, \"noticia\": {\"id\": \"001\", \"title\": \"...\"}}\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"/api/noticias/eliminar\",\n" +
            "      \"metodo\": \"POST / DELETE\",\n" +
            "      \"descripcion\": \"Eliminar una noticia por ID (verifica integridad XML antes de borrar)\",\n" +
            "      \"parametros\": {\n" +
            "        \"id\": \"(requerido) ID de la noticia a eliminar\"\n" +
            "      },\n" +
            "      \"respuesta_ok\": {\"ok\": true, \"mensaje\": \"Noticia eliminada correctamente\"},\n" +
            "      \"respuesta_error\": {\"ok\": false, \"mensaje\": \"No se encontró la noticia\"}\n" +
            "    },\n" +
            "    {\n" +
            "      \"ruta\": \"/docs\",\n" +
            "      \"metodo\": \"GET\",\n" +
            "      \"descripcion\": \"Esta documentación (NO requiere JWT)\",\n" +
            "      \"parametros\": {}\n" +
            "    }\n" +
            "  ],\n" +
            "  \"validacion_xsd\": {\n" +
            "    \"esquema\": \"noticias.xsd\",\n" +
            "    \"reglas\": {\n" +
            "      \"id\": \"Alfanumérico, 1-50 chars, no vacío\",\n" +
            "      \"date\": \"Formato DD/MM/YYYY\",\n" +
            "      \"title\": \"5-100 chars (sin espacios en blanco solos)\",\n" +
            "      \"author\": \"5-100 chars\",\n" +
            "      \"content\": \"20-5000 chars\",\n" +
            "      \"imageUrl\": \"Debe empezar por http:// o https://\",\n" +
            "      \"category\": \"Enum: Fichajes, Resultados, Crónica, Opinión, Internacional, General\",\n" +
            "      \"tags\": \"Mínimo 1, máximo 6 etiquetas\"\n" +
            "    }\n" +
            "  },\n" +
            "  \"pipeline_xml\": [\"XMLCoder (NewsItem→XML)\", \"XMLValidator (XML vs XSD)\", \"XMLParser (XML→DOM)\", \"XMLDecoder (XML→NewsItem)\"]\n" +
            "}");
    }
}
