package com.futbol.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JWTUtil {

    @Value("${jwt.private.key.path:/app/private_key.pem}")
    private String privateKeyPath;

    @Value("${jwt.public.key.path:/app/public.key}")
    private String publicKeyPath;

    @Value("${jwt.expiration:3600}")
    private String expirationTime;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    @PostConstruct
    public void init() {
        try {
            // Cargar Llave Privada para firmar (PKCS8)
            if (Files.exists(Paths.get(privateKeyPath))) {
                String privKeyContent = new String(Files.readAllBytes(Paths.get(privateKeyPath)), StandardCharsets.UTF_8);
                privKeyContent = privKeyContent
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
                byte[] privKeyBytes = Base64.getDecoder().decode(privKeyContent);
                PKCS8EncodedKeySpec privSpec = new PKCS8EncodedKeySpec(privKeyBytes);
                KeyFactory kf = KeyFactory.getInstance("RSA");
                this.privateKey = kf.generatePrivate(privSpec);
                System.out.println("[JWTUtil] Llave privada RS256 cargada correctamente");
            } else {
                System.err.println("[JWTUtil] ERROR: Archivo de llave privada no encontrado en " + privateKeyPath);
            }

            // Cargar Llave Pública para verificar (X509)
            if (Files.exists(Paths.get(publicKeyPath))) {
                String pubKeyContent = new String(Files.readAllBytes(Paths.get(publicKeyPath)), StandardCharsets.UTF_8);
                pubKeyContent = pubKeyContent
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
                byte[] pubKeyBytes = Base64.getDecoder().decode(pubKeyContent);
                X509EncodedKeySpec pubSpec = new X509EncodedKeySpec(pubKeyBytes);
                KeyFactory kf = KeyFactory.getInstance("RSA");
                this.publicKey = kf.generatePublic(pubSpec);
                System.out.println("[JWTUtil] Llave pública RS256 cargada correctamente");
            } else {
                System.err.println("[JWTUtil] ERROR: Archivo de llave pública no encontrado en " + publicKeyPath);
            }
        } catch (Exception e) {
            System.err.println("[JWTUtil] ERROR crítico al cargar llaves RSA: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(publicKey).build().parseClaimsJws(token).getBody();
    }

    public String getUsernameFromToken(String token) {
        return getAllClaimsFromToken(token).getSubject();
    }

    public Date getExpirationDateFromToken(String token) {
        return getAllClaimsFromToken(token).getExpiration();
    }

    private Boolean isTokenExpired(String token) {
        return getExpirationDateFromToken(token).before(new Date());
    }

    public String generateToken(String userId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("id", userId); // PARIDAD TOTAL: Node espera el Firebase UID en decoded.id
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + Long.parseLong(expirationTime) * 1000))
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }

    public Boolean validateToken(String token) {
        return !isTokenExpired(token);
    }
}
