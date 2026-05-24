package com.futbol.security;

import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import javax.servlet.*;
import javax.servlet.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Filtro JWT para proteger las rutas /api/*.
 * Verifica el token del header "Authorization: Bearer <token>".
 * Usa RSA (RS256) con llave pública.
 */
public class JWTFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(JWTFilter.class);

    private PublicKey publicKey;
    private String corsAllowedOrigin;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        String publicKeyPath = filterConfig.getInitParameter("publicKeyPath");
        if (publicKeyPath == null || publicKeyPath.isEmpty()) {
            publicKeyPath = "/app/public.key";
        }

        String configuredOrigin = filterConfig.getInitParameter("corsAllowedOrigin");
        this.corsAllowedOrigin = (configuredOrigin != null && !configuredOrigin.isEmpty())
                ? configuredOrigin
                : System.getenv().getOrDefault("CORS_ALLOWED_ORIGIN", "*");

        try {
            logger.info("[JWT-RS256] Cargando llave pública desde: {}", publicKeyPath);
            String keyContent = new String(Files.readAllBytes(Paths.get(publicKeyPath)), StandardCharsets.UTF_8);

            keyContent = keyContent
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

            byte[] keyBytes = Base64.getDecoder().decode(keyContent);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
            KeyFactory kf = KeyFactory.getInstance("RSA");
            this.publicKey = kf.generatePublic(spec);

            logger.info("[JWT-RS256] Llave pública cargada correctamente.");
        } catch (Exception e) {
            logger.error("[JWT-RS256] ERROR crítico al cargar la llave pública: {}", e.getMessage(), e);
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            setCorsHeaders(httpResponse);
            httpResponse.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        setCorsHeaders(httpResponse);

        String authHeader = httpRequest.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("[JWT-RS256] Token faltante o formato inválido en: {}", httpRequest.getRequestURI());
            enviarError(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Autenticacion requerida");
            return;
        }

        String token = authHeader.substring(7);

        try {
            if (!verificarToken(token)) {
                logger.warn("[JWT-RS256] Firma RSA inválida para petición: {}", httpRequest.getRequestURI());
                enviarError(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Autenticacion requerida");
                return;
            }

            String payload = extraerPayload(token);
            httpRequest.setAttribute("jwt_payload", payload);
            chain.doFilter(request, response);

        } catch (Exception e) {
            logger.error("[JWT-RS256] Excepción durante la verificación: {}", e.getMessage(), e);
            enviarError(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Autenticacion requerida");
        }
    }

    private boolean verificarToken(String token) throws Exception {
        if (publicKey == null) return false;

        String[] partes = token.split("\\.");
        if (partes.length != 3) return false;

        String headerPayload = partes[0] + "." + partes[1];
        byte[] firmaRecibida = Base64.getUrlDecoder().decode(partes[2]);

        Signature sig = Signature.getInstance("SHA256withRSA");
        sig.initVerify(publicKey);
        sig.update(headerPayload.getBytes(StandardCharsets.UTF_8));
        return sig.verify(firmaRecibida);
    }

    private String extraerPayload(String token) {
        String[] partes = token.split("\\.");
        if (partes.length < 2) return "{}";
        String payload = partes[1];
        int padding = 4 - (payload.length() % 4);
        if (padding != 4) {
            payload += new String(new char[padding]).replace('\0', '=');
        }
        return new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8);
    }

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", corsAllowedOrigin);
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-User-Role, X-Transaction-Id, Accept");
        response.setHeader("Access-Control-Max-Age", "3600");
    }

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
        logger.info("[JWT-RS256] Filtro de seguridad destruido.");
    }
}
