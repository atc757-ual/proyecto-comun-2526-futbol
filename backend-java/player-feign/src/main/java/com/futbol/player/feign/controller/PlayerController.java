package com.futbol.player.feign.controller;

import com.futbol.player.feign.model.PlayerDTO;
import com.futbol.player.feign.model.PlayerFullDTO;
import com.futbol.player.feign.dto.ApiResult;
import com.futbol.player.feign.service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/feign/players")
public class PlayerController {

    @Autowired
    private PlayerService playerService;

    @GetMapping
    public ResponseEntity<ApiResult<List<PlayerDTO>>> getAll(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String team) {
        return ResponseEntity.ok(playerService.getTodosLosJugadores(userId, name, team));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResult<PlayerDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getJugadorPorId(id));
    }

    @GetMapping("/{id}/full")
    public ResponseEntity<ApiResult<PlayerFullDTO>> getFullById(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getJugadorCompleto(id));
    }

    @PostMapping
    public ResponseEntity<ApiResult<PlayerDTO>> create(@RequestBody PlayerDTO player) {
        return ResponseEntity.status(HttpStatus.CREATED).body(playerService.crearJugador(player));
    }

    @PutMapping
    public ResponseEntity<ApiResult<PlayerDTO>> update(@RequestBody PlayerDTO player) {
        return ResponseEntity.ok(playerService.actualizarJugador(player));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResult<Void>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.eliminarJugador(id));
    }
}
