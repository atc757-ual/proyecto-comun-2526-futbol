package com.futbol.client.player.controller;

import com.futbol.comment.feign.client.CommentClient;
import com.futbol.client.player.domain.Player;
import com.futbol.client.player.repository.PlayerRepository;
import com.futbol.client.player.exceptions.NotFoundException;
import com.futbol.common.dto.ApiResult;
import com.futbol.player.feign.dto.PlayerPublicDTO;
import org.springframework.http.HttpStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "Jugadores", description = "Gestión de jugadores del sistema")
@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private static final Logger log = LoggerFactory.getLogger(PlayerController.class);

    private final PlayerRepository playerRepository;
    private final CommentClient commentClient;

    public PlayerController(PlayerRepository playerRepository, CommentClient commentClient) {
        this.playerRepository = playerRepository;
        this.commentClient = commentClient;
    }

    @Operation(summary = "Listar jugadores (Vista Pública)", description = "Obtiene 10 jugadores aleatorios con información mínima (Nombre, Foto) sin necesidad de token")
    @GetMapping("/public")
    public ResponseEntity<ApiResult<List<PlayerPublicDTO>>> getAllPlayersPublic() {
        List<PlayerPublicDTO> publicPlayers = playerRepository.findRandomPlayers(10).stream()
                .map(p -> PlayerPublicDTO.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .imageUrl(p.getImageUrl())
                        .team(p.getTeam())
                        .age(p.getAge())
                        .nationality(p.getNationality())
                        .position(p.getPosition())
                        .createdAt(p.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResult.success("Vista pública aleatoria recuperada", publicPlayers));
    }

    @Operation(summary = "Obtener detalle de jugador (Vista Pública)", description = "Obtiene el detalle de un jugador por su ID sin necesidad de token")
    @GetMapping("/public/{id}")
    public ResponseEntity<ApiResult<Player>> getPlayerByIdPublic(@PathVariable Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Jugador no encontrado con ID: " + id));
        
        return ResponseEntity.ok(ApiResult.success("Vista pública de jugador recuperada", player));
    }

    @Operation(summary = "Listar jugadores", description = "Obtiene todos los jugadores o filtra por userId, nombre o equipo")
    @GetMapping
    public ResponseEntity<ApiResult<List<Player>>> getAllPlayers(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String team) {
        List<Player> players;
        if (userId != null && !userId.isEmpty()) {
            players = playerRepository.findByUserId(userId);
        } else if (name != null && !name.isEmpty()) {
            players = playerRepository.findByNameContainingIgnoreCase(name);
        } else if (team != null && !team.isEmpty()) {
            players = playerRepository.findByTeamIgnoreCase(team);
        } else {
            players = playerRepository.findAll();
        }
        return ResponseEntity.ok(ApiResult.success("Procesamiento concluído exitosamente", players));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener jugador por ID", description = "Devuelve el detalle completo de un jugador")
    public ResponseEntity<ApiResult<Player>> getPlayerById(@PathVariable Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Jugador no encontrado con ID: " + id));
        
        return ResponseEntity.ok(ApiResult.success("Procesamiento concluído exitosamente", player));
    }

    @PostMapping
    @Operation(summary = "Crear jugador", description = "Crea un jugador nuevo con validación de campos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Jugador creado"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    })
    public ResponseEntity<ApiResult<Player>> createPlayer(@Valid @RequestBody Player player) {
        log.info("[PLAYER-CLIENT] Recibida petición POST para crear jugador: {}", player);
        try {
            Player savedPlayer = playerRepository.save(player);
            log.info("[PLAYER-CLIENT] Jugador creado con éxito en Postgres: {}", savedPlayer);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResult.success("Procesamiento concluído exitosamente", savedPlayer));
        } catch (Exception e) {
            log.error("[PLAYER-CLIENT] Error crítico al guardar el jugador en base de datos: ", e);
            throw e;
        }
    }

    @PutMapping
    @Operation(summary = "Actualizar jugador", description = "Actualiza un jugador existente por su ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Jugador actualizado"),
        @ApiResponse(responseCode = "404", description = "Jugador no encontrado"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    })
    public ResponseEntity<ApiResult<Player>> updatePlayer(@Valid @RequestBody Player player) {
        log.info("[PLAYER-CLIENT] Recibida petición PUT para actualizar jugador con ID {}: {}", player.getId(), player);
        try {
            if (!playerRepository.existsById(player.getId())) {
                log.warn("[PLAYER-CLIENT] Intento de actualización fallido: Jugador no encontrado con ID {}", player.getId());
                throw new NotFoundException("No se puede actualizar. Jugador no encontrado con ID: " + player.getId());
            }
            Player updated = playerRepository.save(player);
            log.info("[PLAYER-CLIENT] Jugador actualizado con éxito en Postgres: {}", updated);
            return ResponseEntity.ok(ApiResult.success("Jugador actualizado exitosamente", updated));
        } catch (Exception e) {
            log.error("[PLAYER-CLIENT] Error crítico al actualizar el jugador en base de datos: ", e);
            throw e;
        }
    }

    @PutMapping("/{id}/favorite")
    @Operation(summary = "Actualizar favorito", description = "Marca o desmarca un jugador como favorito")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Favorito actualizado"),
        @ApiResponse(responseCode = "404", description = "Jugador no encontrado")
    })
    public ResponseEntity<ApiResult<Player>> toggleFavorite(
            @PathVariable Long id,
            @RequestParam Boolean isFavorite) {
        log.info("[PLAYER-CLIENT] Recibida petición PUT para favorite con ID {}: {}", id, isFavorite);
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Jugador no encontrado con ID: " + id));
        player.setIsFavorite(isFavorite);
        Player saved = playerRepository.save(player);
        return ResponseEntity.ok(ApiResult.success("Estado de favorito actualizado exitosamente", saved));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar jugador", description = "Elimina jugador y sus comentarios asociados")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Jugador eliminado"),
        @ApiResponse(responseCode = "404", description = "Jugador no encontrado")
    })
    public ResponseEntity<ApiResult<Void>> deletePlayer(@PathVariable Long id) {
        log.info("[PLAYER-CLIENT] Recibida petición DELETE para jugador con ID: {}", id);
        if (!playerRepository.existsById(id)) {
            log.warn("[PLAYER-CLIENT] Intento de eliminación fallido: Jugador no encontrado con ID {}", id);
            throw new NotFoundException("Jugador no encontrado con ID: " + id);
        }
        
        // Eliminación en Cascada (Homologación con Node/Mongo)
        try {
            commentClient.deleteByPlayerId(id);
            log.info("[PLAYER-CLIENT] Borrados comentarios en cascada con éxito para el jugador con ID: {}", id);
        } catch (Exception e) {
            log.error("[PLAYER-CLIENT] Error al borrar comentarios en cascada para player " + id + ": " + e.getMessage());
        }

        playerRepository.deleteById(id);
        log.info("[PLAYER-CLIENT] Jugador con ID {} eliminado con éxito de Postgres", id);
        return ResponseEntity.ok(ApiResult.success("Jugador eliminado exitosamente (incluyendo comentarios)", null));
    }

}
