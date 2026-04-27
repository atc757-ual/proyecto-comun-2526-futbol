package com.futbol.comment.feign.controller;

import com.futbol.comment.feign.model.ApiResult;
import com.futbol.comment.feign.model.CommentDTO;
import com.futbol.comment.feign.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;

@Tag(name = "Orquestador de Comentarios", description = "API Feign para gestionar operaciones con los comentarios")
@RestController
@RequestMapping("/feign/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @Operation(summary = "Obtener todos los comentarios", description = "Llama a comment-client para listar todos los comentarios")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista obtenida correctamente o Fallback ejecutado"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    @GetMapping
    public ApiResult<List<CommentDTO>> getAll() {
        return commentService.listarTodos();
    }

    @Operation(summary = "Obtener comentarios de un jugador", description = "Busca a través de comment-client los comentarios asociados a un ID de jugador")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Comentarios obtenidos correctamente")
    })
    @GetMapping("/player/{playerId}")
    public ApiResult<List<CommentDTO>> getByPlayer(@PathVariable Long playerId) {
        return commentService.listarPorJugador(playerId);
    }

    @Operation(summary = "Crear un comentario", description = "Envía los datos a comment-client para crear un comentario nuevo")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Comentario creado con éxito"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    @PostMapping
    public ApiResult<CommentDTO> create(@RequestBody CommentDTO dto) {
        return commentService.guardar(dto);
    }

    @Operation(summary = "Eliminar un comentario", description = "Elimina un comentario usando comment-client")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Comentario eliminado con éxito"),
        @ApiResponse(responseCode = "404", description = "Comentario no encontrado")
    })
    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        return commentService.eliminar(id);
    }
}
