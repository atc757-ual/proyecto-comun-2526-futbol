package com.futbol.player.feign.controller;

import com.futbol.player.feign.model.PlayerDTO;
import com.futbol.player.feign.model.PlayerFullDTO;
import com.futbol.player.feign.dto.ApiResult;
import com.futbol.player.feign.service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;

@Tag(name = "Orquestador de Jugadores", description = "API Feign para gestionar jugadores y sus datos combinados")
@RestController
@RequestMapping("/feign/players")
public class PlayerController {

    @Autowired
    private PlayerService playerService;

    @Operation(summary = "Obtener todos los jugadores", description = "Llama a player-client para listar los jugadores")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista obtenida correctamente o Fallback ejecutado"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    @GetMapping
    public ResponseEntity<ApiResult<List<PlayerDTO>>> getAll(@RequestParam(required = false) String userId) {
        return ResponseEntity.ok(playerService.getTodosLosJugadores(userId));
    }

    @Operation(summary = "Obtener jugador por ID", description = "Llama a player-client para buscar un jugador específico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Jugador encontrado"),
        @ApiResponse(responseCode = "404", description = "Jugador no encontrado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResult<PlayerDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getJugador(id));
    }

    @Operation(summary = "Obtener jugador completo (con comentarios)", description = "Llama a player-client y comment-client para devolver la información orquestada")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Datos combinados obtenidos con éxito")
    })
    @GetMapping("/{id}/full")
    public ResponseEntity<ApiResult<PlayerFullDTO>> getFullById(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getJugadorCompleto(id));
    }

    @Operation(summary = "Crear un jugador", description = "Envía los datos a player-client para su creación")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Jugador creado con éxito"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    @PostMapping
    public ResponseEntity<ApiResult<PlayerDTO>> create(@RequestBody PlayerDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(playerService.nuevoJugador(dto));
    }

    @Operation(summary = "Actualizar un jugador", description = "Envía los datos modificados a player-client")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Jugador actualizado con éxito"),
        @ApiResponse(responseCode = "404", description = "Jugador no encontrado")
    })
    @PutMapping
    public ResponseEntity<ApiResult<PlayerDTO>> update(@RequestBody PlayerDTO dto) {
        return ResponseEntity.ok(playerService.actualizarJugador(dto));
    }

    @Operation(summary = "Eliminar un jugador", description = "Elimina un jugador a través de player-client")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Jugador eliminado con éxito"),
        @ApiResponse(responseCode = "404", description = "Jugador no encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResult<Void>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.borrarJugador(id));
    }
}
