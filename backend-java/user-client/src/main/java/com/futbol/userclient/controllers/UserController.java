package com.futbol.userclient.controllers;

import com.futbol.common.dto.ApiResult;
import com.futbol.common.dto.Result;
import com.futbol.userclient.models.User;
import com.futbol.userclient.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users API", description = "Gestión y sincronización de usuarios")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Sincronizar usuario desde Firebase (llamada interna de gateway)
     */
    @PostMapping("/sync")
        @Operation(summary = "Sincronizar usuario desde Firebase")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuario sincronizado"),
            @ApiResponse(responseCode = "500", description = "Error interno")
        })
    public ResponseEntity<ApiResult<Object>> syncUser(@RequestBody Map<String, Object> body) {
        try {
            String firebaseUid = (String) body.get("firebaseUid");
            String email = (String) body.get("email");
            String name = (String) body.get("name");
            Boolean isAdmin = (Boolean) body.getOrDefault("isAdmin", false);

            User user = userService.syncUserFromFirebase(firebaseUid, email, name, isAdmin != null ? isAdmin : false);

            Map<String, Object> userMap = toUserMap(user);
            return buildSuccessResponse("Usuario sincronizado", userMap);
        } catch (Exception e) {
            return buildErrorResponse(500, "Error sincronizando usuario: " + e.getMessage());
        }
    }

    /**
     * Obtener usuario por Firebase UID
     */
    @GetMapping("/firebase/{firebaseUid}")
        @Operation(summary = "Obtener usuario por firebaseUid")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuario encontrado"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
        })
    public ResponseEntity<ApiResult<Object>> getUserByFirebaseUid(@PathVariable String firebaseUid) {
        try {
            Optional<User> userOpt = userService.findByFirebaseUid(firebaseUid);
            if (userOpt.isEmpty()) {
                return buildErrorResponse(404, "Usuario no encontrado");
            }
            return buildSuccessResponse("Usuario encontrado", toUserMap(userOpt.get()));
        } catch (Exception e) {
            return buildErrorResponse(500, "Error: " + e.getMessage());
        }
    }

    /**
     * Obtener usuario por email
     */
    @GetMapping("/email/{email}")
        @Operation(summary = "Obtener usuario por email")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuario encontrado"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
        })
    public ResponseEntity<ApiResult<Object>> getUserByEmail(@PathVariable String email) {
        try {
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) {
                return buildErrorResponse(404, "Usuario no encontrado");
            }
            return buildSuccessResponse("Usuario encontrado", toUserMap(userOpt.get()));
        } catch (Exception e) {
            return buildErrorResponse(500, "Error: " + e.getMessage());
        }
    }

    /**
     * Buscar usuarios por email (contiene)
     */
    @GetMapping("/search")
        @Operation(summary = "Buscar usuarios por email")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Búsqueda exitosa"),
            @ApiResponse(responseCode = "500", description = "Error interno")
        })
    public ResponseEntity<ApiResult<Object>> searchUsers(@RequestParam(required = false) String email) {
        try {
            String searchEmail = email != null ? email : "";
            List<User> users = userService.searchUsersByEmail(searchEmail);
            List<Map<String, Object>> usersList = users.stream().map(this::toUserMap).toList();
            return buildSuccessResponse("Usuarios encontrados", usersList);
        } catch (Exception e) {
            return buildErrorResponse(500, "Error: " + e.getMessage());
        }
    }

    /**
     * Promover usuario a admin
     */
    @PostMapping("/make-admin")
        @Operation(summary = "Promover usuario a admin")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuario promovido"),
            @ApiResponse(responseCode = "400", description = "Email faltante")
        })
    public ResponseEntity<ApiResult<Object>> makeAdmin(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.trim().isEmpty()) {
                return buildErrorResponse(400, "Falta email");
            }
            userService.makeAdmin(email);
            return buildSuccessResponse("Usuario promovido a admin", null);
        } catch (Exception e) {
            return buildErrorResponse(500, "Error: " + e.getMessage());
        }
    }

    /**
     * Remover rol admin
     */
    @PostMapping("/remove-admin")
        @Operation(summary = "Remover rol admin")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rol removido"),
            @ApiResponse(responseCode = "400", description = "Email faltante")
        })
    public ResponseEntity<ApiResult<Object>> removeAdmin(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.trim().isEmpty()) {
                return buildErrorResponse(400, "Falta email");
            }
            userService.removeAdmin(email);
            return buildSuccessResponse("Rol de admin removido", null);
        } catch (Exception e) {
            return buildErrorResponse(500, "Error: " + e.getMessage());
        }
    }

    /**
     * Alternar estado de usuario (activo/inactivo)
     */
    @PostMapping("/toggle-status")
        @Operation(summary = "Alternar estado activo/inactivo de usuario")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Estado actualizado"),
            @ApiResponse(responseCode = "400", description = "Parámetros inválidos")
        })
    public ResponseEntity<ApiResult<Object>> toggleStatus(@RequestBody Map<String, Object> body) {
        try {
            String email = (String) body.get("email");
            Boolean disabled = (Boolean) body.get("disabled");
            if (email == null || email.trim().isEmpty() || disabled == null) {
                return buildErrorResponse(400, "Faltan parámetros (email, disabled)");
            }
            userService.toggleUserStatus(email, disabled);
            Optional<User> userOpt = userService.findByEmail(email);
            return buildSuccessResponse("Estado actualizado", userOpt.map(this::toUserMap).orElse(null));
        } catch (Exception e) {
            return buildErrorResponse(500, "Error: " + e.getMessage());
        }
    }

    // Helpers

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("firebaseUid", user.getFirebaseUid());
        map.put("email", user.getEmail());
        map.put("name", user.getName());
        map.put("role", user.getRole());
        map.put("is_active", user.isActive());
        map.put("blocked", user.isBlocked());
        map.put("created_at", user.getCreatedAt());
        return map;
    }

    private ResponseEntity<ApiResult<Object>> buildSuccessResponse(String detail, Object data) {
        ApiResult<Object> response = new ApiResult<>(new Result("200", "OK", detail), data);
        return ResponseEntity.ok(response);
    }

    private ResponseEntity<ApiResult<Object>> buildErrorResponse(int status, String detail) {
        ApiResult<Object> response = new ApiResult<>(new Result(String.valueOf(status), "NOK", detail), null);
        return ResponseEntity.status(status).body(response);
    }
}
