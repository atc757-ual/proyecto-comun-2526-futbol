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

/**
 * Filtro JWT para proteger las rutas /api/*.
 * Verifica el token del header "Authorization: Bearer <token>".
 * Usa RSA (RS256) con llave pública.
 */
public class JWTFilter implements Filter {

    private PublicKey publicKey;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        String publicKeyPath = filterConfig.getInitParameter("publicKeyPath");
        if (publicKeyPath == null || publicKeyPath.isEmpty()) {
            publicKeyPath = "/app/public.key";
        }
        
        try {
            System.out.println("[JWT-RS256] Cargando llave pública desde: " + publicKeyPath);
            String keyContent = new String(Files.readAllBytes(Paths.get(publicKeyPath)), StandardCharsets.UTF_8);
            
            // Limpiar cabeceras del PEM
            keyContent = keyContent
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
            
            byte[] keyBytes = Base64.getDecoder().decode(keyContent);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
            KeyFactory kf = KeyFactory.getInstance("RSA");
            this.publicKey = kf.generatePublic(spec);
            
            System.out.println("[JWT-RS256] Llave pública cargada correctamente");
        } catch (Exception e) {
            System.err.println("[JWT-RS256] ERROR crítico al cargar la llave pública: " + e.getMessage());
            e.printStackTrace();
        }
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
        System.out.println("[DEBUG-JWT] Header Authorization recibido: " + (authHeader != null ? "SI" : "NO"));

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.err.println("[DEBUG-JWT] ERROR: Token faltante o formato invalido");
            enviarError(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Autenticacion requerida");
            return;
        }

        String token = authHeader.substring(7); // Quitar "Bearer "
        System.out.println("[DEBUG-JWT] Intentando verificar firma RSA del token...");

        try {
            // Verificar el token JWT
            if (!verificarToken(token)) {
                System.err.println("[DEBUG-JWT] ERROR: Firma RSA INVALIDA");
                enviarError(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Autenticacion requerida");
                return;
            }

            // Extraer el payload y pasarlo como atributo del request
            String payload = extraerPayload(token);
            httpRequest.setAttribute("jwt_payload", payload);

            System.out.println("[DEBUG-JWT] !!! TOKEN VALIDO !!! Acceso permitido.");

            // Token válido: continuar con el servlet
            chain.doFilter(request, response);

        } catch (Exception e) {
            System.err.println("[DEBUG-JWT] EXCEPCION durante la verificacion: " + e.getMessage());
            e.printStackTrace();
            enviarError(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized",
                "Autenticacion requerida");
        }
    }

    /**
     * Verifica la firma RSA (SHA256withRSA) del token.
     */
    private boolean verificarToken(String token) throws Exception {
        if (publicKey == null) return false;
        
        String[] partes = token.split("\\.");
        if (partes.length != 3) return false;

        String headerPayload = partes[0] + "." + partes[1];
        String firmaRecibidaStr = partes[2];
        
        // Decodificar la firma de Base64URL
        byte[] firmaRecibida = Base64.getUrlDecoder().decode(firmaRecibidaStr);

        // Verificar usando RSA
        Signature sig = Signature.getInstance("SHA256withRSA");
        sig.initVerify(publicKey);
        sig.update(headerPayload.getBytes(StandardCharsets.UTF_8));
        
        return sig.verify(firmaRecibida);
    }

    /**
     * Extrae y decodifica el payload (parte central) del JWT.
     */
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

    /**
     * Configura los headers CORS para permitir peticiones desde Ionic.
     */
    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-User-Role");
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
        System.out.println("[JWT-RS256] Filtro de seguridad destruido");
    }
}
