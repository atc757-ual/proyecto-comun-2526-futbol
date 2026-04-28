package com.futbol.client.player.controller;

import com.futbol.client.player.domain.Player;
import com.futbol.client.player.repository.PlayerRepository;
import com.futbol.client.player.exceptions.NotFoundException;
import com.futbol.client.player.dto.ApiResult;
import org.springframework.http.HttpStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Jugadores", description = "Gestión de jugadores del sistema")
@RestController
@RequestMapping("/api/players")
public class PlayerController {

    @Autowired
    private PlayerRepository playerRepository;

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
        ApiResult<List<Player>> response = new ApiResult<>(String.valueOf(HttpStatus.OK.value()), "Procesamiento concluído exitosamente", players);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResult<Player>> getPlayerById(@PathVariable Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Jugador no encontrado con ID: " + id));
        
        ApiResult<Player> response = new ApiResult<>(String.valueOf(HttpStatus.OK.value()), "Procesamiento concluído exitosamente", player);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResult<Player>> createPlayer(@Valid @RequestBody Player player) {
        Player savedPlayer = playerRepository.save(player);
        ApiResult<Player> response = new ApiResult<>(String.valueOf(HttpStatus.CREATED.value()), "Procesamiento concluído exitosamente", savedPlayer);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping
    public Player updatePlayer(@Valid @RequestBody Player player) {
        if (!playerRepository.existsById(player.getId())) {
            throw new NotFoundException("No se puede actualizar. Jugador no encontrado con ID: " + player.getId());
        }
        return playerRepository.save(player);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public void deletePlayer(@PathVariable Long id) {
        if (!playerRepository.existsById(id)) {
            throw new NotFoundException("Jugador no encontrado con ID: " + id);
        }
        playerRepository.deleteById(id);
    }
}
