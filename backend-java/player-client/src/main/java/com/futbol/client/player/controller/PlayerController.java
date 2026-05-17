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
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import java.util.stream.Collectors;

@Tag(name = "Jugadores", description = "Gestión de jugadores del sistema")
@RestController
@RequestMapping("/api/players")
public class PlayerController {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private CommentClient commentClient;

    @Operation(summary = "Listar jugadores (Vista Pública)", description = "Obtiene 10 jugadores aleatorios con información mínima (Nombre, Foto) sin necesidad de token")
    @GetMapping("/public")
    public ResponseEntity<ApiResult<List<PlayerPublicDTO>>> getAllPlayersPublic() {
        List<Player> allPlayers = new ArrayList<>(playerRepository.findAll());
        Collections.shuffle(allPlayers);

        List<PlayerPublicDTO> publicPlayers = allPlayers.stream()
                .limit(10)
                .map(p -> PlayerPublicDTO.builder()
                        .name(p.getName())
                        .photo(p.getImageUrl())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResult.success("Vista pública aleatoria recuperada", publicPlayers));
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
    public ResponseEntity<ApiResult<Player>> getPlayerById(@PathVariable Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Jugador no encontrado con ID: " + id));
        
        return ResponseEntity.ok(ApiResult.success("Procesamiento concluído exitosamente", player));
    }

    @PostMapping
    public ResponseEntity<ApiResult<Player>> createPlayer(@Valid @RequestBody Player player) {
        Player savedPlayer = playerRepository.save(player);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResult.success("Procesamiento concluído exitosamente", savedPlayer));
    }

    @PutMapping
    public ResponseEntity<ApiResult<Player>> updatePlayer(@Valid @RequestBody Player player) {
        if (!playerRepository.existsById(player.getId())) {
            throw new NotFoundException("No se puede actualizar. Jugador no encontrado con ID: " + player.getId());
        }
        Player updated = playerRepository.save(player);
        return ResponseEntity.ok(ApiResult.success("Jugador actualizado exitosamente", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResult<Void>> deletePlayer(@PathVariable Long id) {
        if (!playerRepository.existsById(id)) {
            throw new NotFoundException("Jugador no encontrado con ID: " + id);
        }
        
        // Eliminación en Cascada (Homologación con Node/Mongo)
        // Eliminamos los comentarios asociados al jugador en el otro microservicio
        try {
            commentClient.deleteByPlayerId(id);
        } catch (Exception e) {
            // Logeamos pero continuamos borrando el jugador si el servicio de comentarios falla
            // (Opcional: podrías abortar si la consistencia es crítica)
            System.err.println("Error al borrar comentarios en cascada para player " + id + ": " + e.getMessage());
        }

        playerRepository.deleteById(id);
        return ResponseEntity.ok(ApiResult.success("Jugador eliminado exitosamente (incluyendo comentarios)", null));
    }
}
