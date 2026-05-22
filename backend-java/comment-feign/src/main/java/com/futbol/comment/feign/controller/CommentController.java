package com.futbol.comment.feign.controller;

import com.futbol.common.dto.ApiResult;
import com.futbol.comment.feign.model.CommentDTO;
import com.futbol.comment.feign.service.CommentService;

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
@RequestMapping("/feign/comments")
@Tag(name = "Comments Feign API", description = "API interna Feign para operaciones de comentarios")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @GetMapping
        @Operation(summary = "Listar comentarios")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Listado obtenido")
        })
    public ResponseEntity<ApiResult<List<CommentDTO>>> getAll(@RequestParam(required = false) String userId) {
        return ResponseEntity.ok(commentService.listarTodos(userId));
    }

    @GetMapping("/player/{playerId}")
    @Operation(summary = "Listar comentarios por jugador")
    public ResponseEntity<ApiResult<List<CommentDTO>>> getByPlayer(@PathVariable Long playerId) {
        return ResponseEntity.ok(commentService.listarPorJugador(playerId));
    }

    @PostMapping
        @Operation(summary = "Crear comentario")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Comentario creado"),
            @ApiResponse(responseCode = "400", description = "Request inválido")
        })
    public ResponseEntity<ApiResult<CommentDTO>> create(@RequestBody CommentDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.guardar(dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar comentario")
    public ResponseEntity<ApiResult<Void>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.eliminar(id));
    }
}
