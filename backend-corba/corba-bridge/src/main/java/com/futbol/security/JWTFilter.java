package com.futbol.security;

import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.*;
import javax.servlet.http.*;

/**
 * Filtro JWT para proteger las rutas /api/*.
 * Verifica el token del header "Authorization: Bearer <token>".
 * Usa HMAC-SHA256 (sin dependencias externas).
 */
public class JWTFilter implements Filter {

    private String secret;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        this.secret = filterConfig.getInitParameter("secret");
        if (this.secret == null || this.secret.isEmpty()) {
            this.secret = "clave-por-defecto-cambiar-en-produccion";
        }
        System.out.println("[JWT] Filtro de seguridad inicializado");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Permitir peticiones OPTIONS (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            setCorsHeaders(httpResponse);
            httpResponse.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // Añadir headers CORS a todas las respuestas
        setCorsHeaders(httpResponse);

        // Extraer el token del header Authorization
        String authHeader = httpRequest.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            enviarError(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "NOK", "No autorizado: Token faltante");
            return;
        }

        String token = authHeader.substring(7); // Quitar "Bearer "

        try {
            // Verificar el token JWT
            if (!verificarToken(token)) {
                enviarError(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "NOK", "No autorizado: Token inválido");
                return;
            }

            // Extraer el payload y pasarlo como atributo del request
            String payload = extraerPayload(token);
            httpRequest.setAttribute("jwt_payload", payload);

            System.out.println("[JWT] Token válido. Acceso permitido a: " + httpRequest.getRequestURI());

            // Token válido: continuar con el servlet
            chain.doFilter(request, response);

        } catch (Exception e) {
            enviarError(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "NOK",
                    "No autorizado: Error al verificar el token: " + e.getMessage());
        }
    }

    /**
     * Verifica que la firma HMAC-SHA256 del token es correcta.
     * Formato JWT: header.payload.signature (Base64URL cada parte)
     */
    private boolean verificarToken(String token) throws Exception {
        String[] partes = token.split("\\.");
        if (partes.length != 3) {
            return false;
        }

        String headerPayload = partes[0] + "." + partes[1];
        String firmaRecibida = partes[2];

        // Recalcular la firma con nuestra clave secreta
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] firmaCalculada = mac.doFinal(headerPayload.getBytes(StandardCharsets.UTF_8));

        String firmaEsperada = Base64.getUrlEncoder().withoutPadding().encodeToString(firmaCalculada);

        // Verificar expiración
        String payload = extraerPayload(token);
        if (payload.contains("\"exp\"")) {
            try {
                // Extraer exp del JSON de forma simple
                int expIdx = payload.indexOf("\"exp\"");
                int colonIdx = payload.indexOf(":", expIdx);
                int endIdx = payload.indexOf(",", colonIdx);
                if (endIdx == -1) endIdx = payload.indexOf("}", colonIdx);
                long exp = Long.parseLong(payload.substring(colonIdx + 1, endIdx).trim());
                long ahora = System.currentTimeMillis() / 1000;
                if (ahora > exp) {
                    System.out.println("[JWT] Token expirado");
                    return false;
                }
            } catch (NumberFormatException e) {
                // Si no podemos parsear exp, ignoramos la verificación de expiración
            }
        }

        return firmaEsperada.equals(firmaRecibida);
    }

    /**
     * Extrae y decodifica el payload (parte central) del JWT.
     */
    private String extraerPayload(String token) {
        String[] partes = token.split("\\.");
        if (partes.length < 2) return "{}";
        // Añadir padding si es necesario
        String payload = partes[1];
        int padding = 4 - (payload.length() % 4);
        if (padding != 4) {
            payload += "=".repeat(padding);
        }
        return new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8);
    }

    /**
     * Configura los headers CORS para permitir peticiones desde Ionic.
     */
    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
        response.setHeader("Access-Control-Max-Age", "3600");
    }

    /**
     * Envía una respuesta JSON de error.
     */
    private void enviarError(HttpServletResponse response, int status, String description, String mensaje)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        String timestamp = java.time.Instant.now().toString();
        String transactionId = java.util.UUID.randomUUID().toString();
        
        String json = "{\n" +
                "  \"result\": {\n" +
                "    \"transactionId\": \"" + transactionId + "\",\n" +
                "    \"code\": \"" + status + "\",\n" +
                "    \"description\": \"" + description + "\",\n" +
                "    \"descriptionDetail\": \"" + mensaje.replace("\"", "\\\"") + "\",\n" +
                "    \"responseTimestamp\": \"" + timestamp + "\"\n" +
                "  },\n" +
                "  \"data\": []\n" +
                "}";
                
        out.println(json);
    }

    @Override
    public void destroy() {
        System.out.println("[JWT] Filtro de seguridad destruido");
    }
}
