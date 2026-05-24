package com.futbol.gateway.controllers;

import com.futbol.common.dto.ApiResult;
import com.futbol.common.dto.Result;
import com.futbol.gateway.feign.UserServiceClient;
import com.futbol.gateway.security.JWTUtil;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth API", description = "Autenticación y gestión de usuarios administradores vía gateway")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserServiceClient userServiceClient;
    private final JWTUtil jwtUtil;

    @Value("${INITIAL_ADMIN_EMAIL:}")
    private String initialAdminEmail;

    public AuthController(UserServiceClient userServiceClient, JWTUtil jwtUtil) {
        this.userServiceClient = userServiceClient;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signin")
    @Operation(summary = "Iniciar sesión con Firebase ID Token", description = "Valida token Firebase, sincroniza usuario y devuelve JWT local")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Autenticación exitosa"),
        @ApiResponse(responseCode = "401", description = "Token Firebase inválido o expirado")
    })
    public ResponseEntity<ApiResult<Object>> loginFirebase(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");

        if (idToken == null || idToken.isBlank()) {
            return buildErrorResponse(400, "Falta el idToken de Firebase");
        }

        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail() != null ? decodedToken.getEmail().toLowerCase() : null;
            String name = (String) decodedToken.getClaims().get("name");
            boolean isInitialAdmin = email != null
                && initialAdminEmail != null
                && !initialAdminEmail.isBlank()
                && email.equalsIgnoreCase(initialAdminEmail);

            Boolean isAdminClaim = (Boolean) decodedToken.getClaims().get("admin");
            boolean isAdmin = (isAdminClaim != null && isAdminClaim) || isInitialAdmin;

            Map<String, Object> syncRequest = new HashMap<>();
            syncRequest.put("firebaseUid", uid);
            syncRequest.put("email", email);
            syncRequest.put("name", name);
            syncRequest.put("isAdmin", isAdmin);

            ApiResult<Object> syncResponse = userServiceClient.syncUser(syncRequest);
            Object userData = syncResponse != null ? syncResponse.getData() : null;

            String token = jwtUtil.generateToken(uid, isAdmin ? "admin" : "user", isInitialAdmin);

            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("user", userData);

            return ResponseEntity.ok(new ApiResult<>(new Result("200", "OK", "Autenticación exitosa"), data));

        } catch (FirebaseAuthException e) {
            logger.error("Fallo validando token Firebase. code={} message={}", e.getAuthErrorCode(), e.getMessage(), e);
            return buildErrorResponse(401, "Token Firebase inválido o expirado");
        } catch (Exception e) {
            logger.error("Error inesperado en /api/auth/signin: {}", e.getMessage(), e);
            return buildErrorResponse(401, "Token Firebase inválido o expirado");
        }
    }

    @GetMapping("/users")
    @Operation(summary = "Buscar usuarios", description = "Requiere rol MASTER y permite filtrar por email")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Búsqueda exitosa"),
        @ApiResponse(responseCode = "401", description = "No autorizado"),
        @ApiResponse(responseCode = "403", description = "Requiere rol MASTER")
    })
    public ResponseEntity<ApiResult<Object>> getUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "email", required = false) String email) {

        ResponseEntity<ApiResult<Object>> authError = requireMaster(authHeader);
        if (authError != null) return authError;

        try {
            return ResponseEntity.ok(userServiceClient.searchUsers(email != null ? email : ""));
        } catch (Exception e) {
            return buildErrorResponse(401, "Token inválido o expirado");
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
    public ResponseEntity<ApiResult<Object>> setAdminRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body) {

        ResponseEntity<ApiResult<Object>> authError = requireMaster(authHeader);
        if (authError != null) return authError;

        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            return buildErrorResponse(400, "Falta el email del usuario a promover");
        }

        try {
            Map<String, String> request = new HashMap<>();
            request.put("email", email);
            return ResponseEntity.ok(userServiceClient.makeAdmin(request));
        } catch (Exception e) {
            return buildErrorResponse(500, "Error interno al promover usuario");
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
    public ResponseEntity<ApiResult<Object>> removeAdminRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body) {

        ResponseEntity<ApiResult<Object>> authError = requireMaster(authHeader);
        if (authError != null) return authError;

        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            return buildErrorResponse(400, "Falta el email del usuario a degradar");
        }

        try {
            Map<String, String> request = new HashMap<>();
            request.put("email", email);
            return ResponseEntity.ok(userServiceClient.removeAdmin(request));
        } catch (Exception e) {
            return buildErrorResponse(500, "Error interno al revocar rol");
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
    public ResponseEntity<ApiResult<Object>> toggleUserStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body) {

        ResponseEntity<ApiResult<Object>> authError = requireMaster(authHeader);
        if (authError != null) return authError;

        String email = (String) body.get("email");
        Boolean disabled = (Boolean) body.get("disabled");
        if (email == null || email.trim().isEmpty() || disabled == null) {
            return buildErrorResponse(400, "Faltan parámetros requeridos (email y/o disabled)");
        }

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("email", email);
            request.put("disabled", disabled);
            return ResponseEntity.ok(userServiceClient.toggleStatus(request));
        } catch (Exception e) {
            return buildErrorResponse(500, "Error interno al cambiar estado del usuario");
        }
    }

    /**
     * Verifica que el Authorization header contenga un token con claim master=true.
     * Devuelve un ResponseEntity de error si la verificación falla, null si es correcta.
     */
    private ResponseEntity<ApiResult<Object>> requireMaster(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "No autorizado");
        }
        try {
            String token = authHeader.substring(7);
            Claims claims = jwtUtil.getAllClaimsFromToken(token);
            Boolean isMaster = claims.get("master", Boolean.class);
            if (isMaster == null || !isMaster) {
                return buildErrorResponse(403, "Acceso denegado: Se requiere rol de Master");
            }
            return null;
        } catch (Exception e) {
            return buildErrorResponse(401, "Token inválido o expirado");
        }
    }

    private ResponseEntity<ApiResult<Object>> buildErrorResponse(int status, String detail) {
        ApiResult<Object> response = new ApiResult<>(new Result(String.valueOf(status), "NOK", detail), null);
        return ResponseEntity.status(status).body(response);
    }
}
