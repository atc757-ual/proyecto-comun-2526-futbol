package com.futbol.player.feign.controller;

import com.futbol.player.feign.model.PlayerDTO;
import com.futbol.player.feign.model.PlayerFullDTO;
import com.futbol.player.feign.dto.ApiResult;
import com.futbol.player.feign.service.PlayerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/feign/players")
@Tag(name = "Players Feign API", description = "API interna Feign para operaciones de jugadores")
public class PlayerController {

    @Autowired
    private PlayerService playerService;

    @GetMapping
        @Operation(summary = "Listar jugadores")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Listado obtenido")
        })
    public ResponseEntity<ApiResult<List<PlayerDTO>>> getAll(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String team) {
        return ResponseEntity.ok(playerService.getTodosLosJugadores(userId, name, team));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener jugador por ID")
    public ResponseEntity<ApiResult<PlayerDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getJugadorPorId(id));
    }

    @GetMapping("/{id}/full")
    @Operation(summary = "Obtener jugador completo por ID")
    public ResponseEntity<ApiResult<PlayerFullDTO>> getFullById(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getJugadorCompleto(id));
    }

    @PostMapping
        @Operation(summary = "Crear jugador")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Jugador creado"),
            @ApiResponse(responseCode = "400", description = "Request inválido")
        })
    public ResponseEntity<ApiResult<PlayerDTO>> create(@RequestBody PlayerDTO player) {
        return ResponseEntity.status(HttpStatus.CREATED).body(playerService.crearJugador(player));
    }

    @PutMapping
    @Operation(summary = "Actualizar jugador")
    public ResponseEntity<ApiResult<PlayerDTO>> update(@RequestBody PlayerDTO player) {
        return ResponseEntity.ok(playerService.actualizarJugador(player));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar jugador")
    public ResponseEntity<ApiResult<Void>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.eliminarJugador(id));
    }
}
