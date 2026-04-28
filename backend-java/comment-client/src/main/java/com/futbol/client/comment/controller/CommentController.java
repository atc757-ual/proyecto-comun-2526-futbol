package com.futbol.client.comment.controller;

import com.futbol.client.comment.domain.Comment;
import com.futbol.client.comment.repository.CommentRepository;
import com.futbol.client.comment.exceptions.NotFoundException;
import com.futbol.client.comment.dto.ApiResult;
import org.springframework.http.HttpStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Comentarios", description = "Gestión de comentarios de los jugadores")
@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;

    @Operation(summary = "Obtener todos los comentarios", description = "Devuelve una lista con todos los comentarios registrados")
    @GetMapping
    public ResponseEntity<ApiResult<List<Comment>>> getAllComments(@RequestParam(required = false) String userId) {
        List<Comment> comments;
        if (userId != null && !userId.isEmpty()) {
            comments = commentRepository.findByUserId(userId);
        } else {
            comments = commentRepository.findAll();
        }
        ApiResult<List<Comment>> response = new ApiResult<>(String.valueOf(HttpStatus.OK.value()), "Procesamiento concluído exitosamente", comments);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Obtener comentarios por jugador", description = "Busca todos los comentarios asociados a un ID de jugador")
    @GetMapping("/player/{playerId}")
    public ResponseEntity<ApiResult<List<Comment>>> getCommentsByPlayer(@PathVariable Long playerId) {
        List<Comment> comments = commentRepository.findByPlayerId(playerId);
        ApiResult<List<Comment>> response = new ApiResult<>(String.valueOf(HttpStatus.OK.value()), "Procesamiento concluído exitosamente", comments);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Añadir un comentario", description = "Guarda un nuevo comentario en el sistema")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Comentario creado con éxito"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    })
    @PostMapping
    public ResponseEntity<ApiResult<Comment>> createComment(@Valid @RequestBody Comment comment) {
        Comment savedComment = commentRepository.save(comment);
        ApiResult<Comment> response = new ApiResult<>(String.valueOf(HttpStatus.CREATED.value()), "Procesamiento concluído exitosamente", savedComment);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Eliminar un comentario", description = "Borra permanentemente un comentario por su ID")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public void deleteComment(@PathVariable Long id) {
        if (!commentRepository.existsById(id)) {
            throw new NotFoundException("Comentario no encontrado con ID: " + id);
        }
        commentRepository.deleteById(id);
    }
}
