package com.futbol.gateway.controllers;

import com.futbol.gateway.models.User;
import com.futbol.gateway.repositories.UserRepository;
import com.futbol.gateway.security.JWTUtil;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JWTUtil jwtUtil;

    @PostMapping("/signin")
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

            // 3. Sincronizar con Postgres
            Optional<User> userOpt = userRepository.findByFirebaseUid(uid);
            User user;
            
            if (userOpt.isEmpty()) {
                // Buscar por email como fallback (por si se creó por otra vía y aún no tiene el firebaseUid actualizado)
                Optional<User> userByEmailOpt = userRepository.findByEmail(email);
                
                if (userByEmailOpt.isPresent()) {
                    user = userByEmailOpt.get();
                    user.setFirebaseUid(uid);
                    user.setName(name != null ? name : user.getName());
                    user.setRole(isAdmin ? "admin" : "user");
                    userRepository.save(user);
                } else {
                    // Registro inicial
                    user = new User();
                    user.setFirebaseUid(uid);
                    user.setEmail(email);
                    user.setName(name != null ? name : email.split("@")[0]);
                    user.setRole(isAdmin ? "admin" : "user");
                    userRepository.save(user);
                }
            } else {
                // Actualizar datos existentes
                user = userOpt.get();
                user.setName(name != null ? name : user.getName());
                // Actualizamos el rol por si cambió en Firebase
                user.setRole(isAdmin ? "admin" : "user");
                userRepository.save(user);
            }

            // 4. Generar JWT local
            String token = jwtUtil.generateToken(user.getFirebaseUid(), user.getRole());

            // 5. Responder
            Map<String, Object> response = new HashMap<>();
            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("firebaseUid", user.getFirebaseUid());
            userMap.put("name", user.getName());
            userMap.put("email", user.getEmail());
            userMap.put("role", user.getRole());
            
            data.put("user", userMap);
            
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
            
            String searchEmail = (email == null) ? "" : email;
            List<User> users = userRepository.findTop10ByEmailContainingIgnoreCase(searchEmail);
            
            List<Map<String, Object>> usersList = new ArrayList<>();
            for (User u : users) {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("name", u.getName());
                userMap.put("email", u.getEmail());
                userMap.put("role", u.getRole());
                userMap.put("is_active", u.isActive());
                usersList.add(userMap);
            }
            
            return buildSuccessResponse("Usuarios encontrados", usersList);
            
        } catch (Exception e) {
            return buildErrorResponse(401, "Token inválido o error: " + e.getMessage());
        }
    }

    @PostMapping("/make-admin")
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
            
            // 1. Buscar usuario en Firebase
            UserRecord userFirebase = FirebaseAuth.getInstance().getUserByEmail(email);
            
            // 2. Establecer Custom Claims en Firebase
            Map<String, Object> customClaims = new HashMap<>();
            customClaims.put("admin", true);
            FirebaseAuth.getInstance().setCustomUserClaims(userFirebase.getUid(), customClaims);
            
            // 3. Actualizar rol en Postgres
            Optional<User> userOpt = userRepository.findByEmail(email.toLowerCase());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setRole("admin");
                userRepository.save(user);
            } else {
                return buildErrorResponse(404, "Usuario no encontrado en la base de datos");
            }
            
            return buildSuccessResponse("Usuario promovido a admin exitosamente", null);
            
        } catch (Exception e) {
            return buildErrorResponse(500, "Error al promover usuario: " + e.getMessage());
        }
    }

    @PostMapping("/remove-admin")
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
            
            // 1. Buscar usuario en Firebase
            UserRecord userFirebase = FirebaseAuth.getInstance().getUserByEmail(email);
            
            // 2. Quitar Custom Claims en Firebase
            Map<String, Object> customClaims = new HashMap<>();
            customClaims.put("admin", false);
            FirebaseAuth.getInstance().setCustomUserClaims(userFirebase.getUid(), customClaims);
            
            // 3. Actualizar rol en Postgres
            Optional<User> userOpt = userRepository.findByEmail(email.toLowerCase());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setRole("user");
                userRepository.save(user);
            } else {
                return buildErrorResponse(404, "Usuario no encontrado en la base de datos");
            }
            
            return buildSuccessResponse("Rol de administrador revocado exitosamente", null);
            
        } catch (Exception e) {
            return buildErrorResponse(500, "Error al revocar rol: " + e.getMessage());
        }
    }

    @PostMapping("/toggle-status")
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
            
            // 1. Buscar usuario en Firebase
            UserRecord userFirebase = FirebaseAuth.getInstance().getUserByEmail(email);
            
            // 2. Habilitar/Inhabilitar en Firebase
            UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(userFirebase.getUid())
                    .setDisabled(disabled);
            FirebaseAuth.getInstance().updateUser(request);
            
            // 3. Actualizar en Postgres
            Optional<User> userOpt = userRepository.findByEmail(email.toLowerCase());
            User updatedUser = null;
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setActive(!disabled);
                updatedUser = userRepository.save(user);
            } else {
                return buildErrorResponse(404, "Usuario no encontrado en la base de datos");
            }
            
            // Estructurar el usuario actualizado para el frontend
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("name", updatedUser.getName());
            userMap.put("email", updatedUser.getEmail());
            userMap.put("role", updatedUser.getRole());
            userMap.put("is_active", updatedUser.isActive());
            
            String statusLabel = disabled ? "INHABILITADO" : "HABILITADO";
            return buildSuccessResponse("Usuario " + statusLabel + " correctamente", userMap);
            
        } catch (Exception e) {
            return buildErrorResponse(500, "Error al cambiar estado del usuario: " + e.getMessage());
        }
    }

    private ResponseEntity<?> buildSuccessResponse(String detail, Object data) {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> result = new HashMap<>();
        result.put("status", "OK");
        result.put("code", "200");
        result.put("description", "OK");
        result.put("descriptionDetail", detail);
        
        response.put("result", result);
        response.put("data", data);
        return ResponseEntity.ok(response);
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
