package com.futbol.gateway.controllers;

import com.futbol.gateway.models.User;
import com.futbol.gateway.repositories.UserRepository;
import com.futbol.gateway.security.JWTUtil;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
            String email = decodedToken.getEmail();
            String name = (String) decodedToken.getClaims().get("name");
            
            // 2. Leer Custom Claim de Admin
            Boolean isAdminClaim = (Boolean) decodedToken.getClaims().get("admin");
            boolean isAdmin = (isAdminClaim != null && isAdminClaim);

            // 3. Sincronizar con Postgres
            Optional<User> userOpt = userRepository.findByFirebaseUid(uid);
            User user;
            
            if (userOpt.isEmpty()) {
                // Registro inicial
                user = new User();
                user.setFirebaseUid(uid);
                user.setEmail(email);
                user.setName(name != null ? name : email.split("@")[0]);
                user.setRole(isAdmin ? "admin" : "user");
                userRepository.save(user);
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
            Map<String, String> data = new HashMap<>();
            data.put("token", token);
            data.put("role", user.getRole());
            data.put("name", user.getName());
            
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
}
