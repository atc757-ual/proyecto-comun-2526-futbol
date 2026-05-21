package com.futbol.gateway.controllers;

import com.futbol.gateway.feign.UserServiceClient;
import com.futbol.gateway.security.JWTUtil;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth API", description = "Autenticación y gestión de usuarios administradores vía gateway")
public class AuthController {

    @Autowired
    private UserServiceClient userServiceClient;

    @Autowired
    private JWTUtil jwtUtil;

    @PostMapping("/signin")
        @Operation(summary = "Iniciar sesión con Firebase ID Token", description = "Valida token Firebase, sincroniza usuario y devuelve JWT local")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Autenticación exitosa"),
            @ApiResponse(responseCode = "401", description = "Token Firebase inválido o expirado")
        })
    public ResponseEntity<?> loginFirebase(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");
        
        try {
            // 1. Verificar token con Firebase
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail() != null ? decodedToken.getEmail().toLowerCase() : null;
            String name = (String) decodedToken.getClaims().get("name");
            
            // 2. Leer Custom Claim de Admin
            Boolean isAdminClaim = (Boolean) decodedToken.getClaims().get("admin");
            boolean isAdmin = (isAdminClaim != null && isAdminClaim);

            // 3. Sincronizar usuario con user-client (vía Feign)
            Map<String, Object> syncRequest = new HashMap<>();
            syncRequest.put("firebaseUid", uid);
            syncRequest.put("email", email);
            syncRequest.put("name", name);
            syncRequest.put("isAdmin", isAdmin);

            Map<String, Object> syncResponse = userServiceClient.syncUser(syncRequest);
            Map<String, Object> userData = (Map<String, Object>) syncResponse.get("data");

            // 4. Generar JWT local
            String token = jwtUtil.generateToken(uid, isAdmin ? "admin" : "user");

            // 5. Responder
            Map<String, Object> response = new HashMap<>();
            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("user", userData);
            
            Map<String, String> result = new HashMap<>();
            result.put("status", "OK");
            
            response.put("result", result);
            response.put("data", data);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            Map<String, String> result = new HashMap<>();
            result.put("status", "NOK");
            result.put("description", "Error de autenticación: " + e.getMessage());
            errorResponse.put("result", result);
            return ResponseEntity.status(401).body(errorResponse);
        }
    }

    @GetMapping("/users")
        @Operation(summary = "Buscar usuarios", description = "Requiere rol MASTER y permite filtrar por email")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Búsqueda exitosa"),
            @ApiResponse(responseCode = "401", description = "No autorizado"),
            @ApiResponse(responseCode = "403", description = "Requiere rol MASTER")
        })
    public ResponseEntity<?> getUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "email", required = false) String email) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "No autorizado");
        }
        
        try {
            String token = authHeader.substring(7);
            Claims claims = jwtUtil.getAllClaimsFromToken(token);
            String role = claims.get("role", String.class);
            if (!"master".equalsIgnoreCase(role)) {
                return buildErrorResponse(403, "Acceso denegado: Se requiere rol de Master");
            }
            
            // Delegar a user-client
            return ResponseEntity.ok(userServiceClient.searchUsers(email != null ? email : ""));
            
        } catch (Exception e) {
            return buildErrorResponse(401, "Token inválido o error: " + e.getMessage());
        }
    }

    @PostMapping("/make-admin")
        @Operation(summary = "Promover usuario a admin", description = "Requiere rol MASTER")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuario promovido"),
            @ApiResponse(responseCode = "400", description = "Email faltante"),
            @ApiResponse(responseCode = "401", description = "No autorizado"),
            @ApiResponse(responseCode = "403", description = "Requiere rol MASTER")
        })
    public ResponseEntity<?> setAdminRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body) {
            
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "No autorizado");
        }
        
        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            return buildErrorResponse(400, "Falta el email del usuario a promover");
        }
        
        try {
            String token = authHeader.substring(7);
            Claims claims = jwtUtil.getAllClaimsFromToken(token);
            String requesterRole = claims.get("role", String.class);
            if (!"master".equalsIgnoreCase(requesterRole)) {
                return buildErrorResponse(403, "Acceso denegado: Se requiere rol de Master");
            }
            
            // Delegar a user-client
            Map<String, String> request = new HashMap<>();
            request.put("email", email);
            return ResponseEntity.ok(userServiceClient.makeAdmin(request));
            
        } catch (Exception e) {
            return buildErrorResponse(500, "Error al promover usuario: " + e.getMessage());
        }
    }

    @PostMapping("/remove-admin")
        @Operation(summary = "Revocar rol admin", description = "Requiere rol MASTER")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rol revocado"),
            @ApiResponse(responseCode = "400", description = "Email faltante"),
            @ApiResponse(responseCode = "401", description = "No autorizado"),
            @ApiResponse(responseCode = "403", description = "Requiere rol MASTER")
        })
    public ResponseEntity<?> removeAdminRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body) {
            
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "No autorizado");
        }
        
        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            return buildErrorResponse(400, "Falta el email del usuario a degradar");
        }
        
        try {
            String token = authHeader.substring(7);
            Claims claims = jwtUtil.getAllClaimsFromToken(token);
            String requesterRole = claims.get("role", String.class);
            if (!"master".equalsIgnoreCase(requesterRole)) {
                return buildErrorResponse(403, "Acceso denegado: Se requiere rol de Master");
            }
            
            // Delegar a user-client
            Map<String, String> request = new HashMap<>();
            request.put("email", email);
            return ResponseEntity.ok(userServiceClient.removeAdmin(request));
            
        } catch (Exception e) {
            return buildErrorResponse(500, "Error al revocar rol: " + e.getMessage());
        }
    }

    @PostMapping("/toggle-status")
        @Operation(summary = "Cambiar estado de usuario", description = "Activa o desactiva un usuario; requiere rol MASTER")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Estado actualizado"),
            @ApiResponse(responseCode = "400", description = "Parámetros inválidos"),
            @ApiResponse(responseCode = "401", description = "No autorizado"),
            @ApiResponse(responseCode = "403", description = "Requiere rol MASTER")
        })
    public ResponseEntity<?> toggleUserStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body) {
            
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "No autorizado");
        }
        
        String email = (String) body.get("email");
        Boolean disabled = (Boolean) body.get("disabled");
        if (email == null || email.trim().isEmpty() || disabled == null) {
            return buildErrorResponse(400, "Faltan parámetros requeridos (email y/o disabled)");
        }
        
        try {
            String token = authHeader.substring(7);
            Claims claims = jwtUtil.getAllClaimsFromToken(token);
            String requesterRole = claims.get("role", String.class);
            if (!"master".equalsIgnoreCase(requesterRole)) {
                return buildErrorResponse(403, "Acceso denegado: Se requiere rol de Master");
            }
            
            // Delegar a user-client
            Map<String, Object> request = new HashMap<>();
            request.put("email", email);
            request.put("disabled", disabled);
            return ResponseEntity.ok(userServiceClient.toggleStatus(request));
            
        } catch (Exception e) {
            return buildErrorResponse(500, "Error al cambiar estado del usuario: " + e.getMessage());
        }
    }



    private ResponseEntity<?> buildErrorResponse(int status, String detail) {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> result = new HashMap<>();
        result.put("status", "NOK");
        result.put("code", String.valueOf(status));
        result.put("description", "NOK");
        result.put("descriptionDetail", detail);
        
        response.put("result", result);
        return ResponseEntity.status(status).body(response);
    }
}
