package com.futbol.client.player.controller;

import com.futbol.client.player.domain.Player;
import com.futbol.client.player.repository.PlayerRepository;
import com.futbol.client.player.exceptions.NotFoundException;
import com.futbol.client.player.dto.ApiResult;
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

    @GetMapping
    public ResponseEntity<ApiResult<List<Player>>> getAllPlayers() {
        List<Player> players = playerRepository.findAll();
        ApiResult<List<Player>> response = new ApiResult<>("SUCCESS", "Lista de jugadores obtenida", players);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResult<Player>> getPlayerById(@PathVariable Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Jugador no encontrado con ID: " + id));
        
        ApiResult<Player> response = new ApiResult<>("SUCCESS", "Jugador encontrado", player);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResult<Player>> createPlayer(@Valid @RequestBody Player player) {
        Player savedPlayer = playerRepository.save(player);
        ApiResult<Player> response = new ApiResult<>("SUCCESS", "Jugador creado con éxito", savedPlayer);
        return ResponseEntity.status(201).body(response);
    }

    @PutMapping
    public ResponseEntity<ApiResult<Player>> updatePlayer(@Valid @RequestBody Player player) {
        if (!playerRepository.existsById(player.getId())) {
            throw new NotFoundException("No se puede actualizar. Jugador no encontrado con ID: " + player.getId());
        }
        Player updatedPlayer = playerRepository.save(player);
        ApiResult<Player> response = new ApiResult<>("SUCCESS", "Jugador actualizado con éxito", updatedPlayer);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResult<Void>> deletePlayer(@PathVariable Long id) {
        if (!playerRepository.existsById(id)) {
            throw new NotFoundException("Jugador no encontrado con ID: " + id);
        }
        playerRepository.deleteById(id);
        ApiResult<Void> response = new ApiResult<>("SUCCESS", "Jugador eliminado con éxito", null);
        return ResponseEntity.ok(response);
    }
}
