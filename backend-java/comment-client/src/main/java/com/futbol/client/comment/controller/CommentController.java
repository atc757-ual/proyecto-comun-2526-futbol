package com.futbol.client.comment.controller;

import com.futbol.client.comment.domain.Comment;
import com.futbol.client.comment.repository.CommentRepository;
import com.futbol.client.comment.exceptions.NotFoundException;
import com.futbol.common.dto.ApiResult;
import org.springframework.http.HttpStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Comentarios", description = "Gestión de comentarios de los jugadores")
@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentRepository commentRepository;

    public CommentController(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    @Operation(summary = "Obtener todos los comentarios", description = "Devuelve una lista con todos los comentarios registrados")
    @GetMapping
    public ResponseEntity<ApiResult<List<Comment>>> getAllComments(@RequestParam(required = false) String userId) {
        List<Comment> comments;
        if (userId != null && !userId.isEmpty()) {
            comments = commentRepository.findByUserId(userId);
        } else {
            comments = commentRepository.findAll();
        }
        return ResponseEntity.ok(ApiResult.success("Procesamiento concluído exitosamente", comments));
    }

    @Operation(summary = "Obtener comentarios por jugador", description = "Busca todos los comentarios asociados a un ID de jugador")
    @GetMapping("/player/{playerId}")
    public ResponseEntity<ApiResult<List<Comment>>> getCommentsByPlayer(@PathVariable Long playerId) {
        List<Comment> comments = commentRepository.findByPlayerId(playerId);
        return ResponseEntity.ok(ApiResult.success("Procesamiento concluído exitosamente", comments));
    }

    @SecurityRequirements({})
    @Operation(summary = "Obtener comentarios por jugador (Público)", description = "Busca todos los comentarios asociados a un ID de jugador sin token")
    @GetMapping("/public/player/{playerId}")
    public ResponseEntity<ApiResult<List<Comment>>> getCommentsByPlayerPublic(@PathVariable Long playerId) {
        List<Comment> comments = commentRepository.findByPlayerId(playerId);
        return ResponseEntity.ok(ApiResult.success("Procesamiento público concluído exitosamente", comments));
    }

    @Operation(summary = "Añadir un comentario", description = "Guarda un nuevo comentario en el sistema")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Comentario creado con éxito"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    })
    @PostMapping
    public ResponseEntity<ApiResult<Comment>> createComment(@Valid @RequestBody Comment comment) {
        Comment savedComment = commentRepository.save(comment);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResult.success("Procesamiento concluído exitosamente", savedComment));
    }

    @SecurityRequirements({})
    @Operation(summary = "Añadir un comentario público", description = "Guarda un nuevo comentario de forma pública sin requerir token")
    @PostMapping("/public")
    public ResponseEntity<ApiResult<Comment>> createPublicComment(@Valid @RequestBody Comment comment) {
        // Al ser público, podemos forzar userId "invitado" o similar si fuese necesario
        Comment savedComment = commentRepository.save(comment);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResult.success("Comentario público procesado exitosamente", savedComment));
    }

    @Operation(summary = "Actualizar un comentario", description = "Actualiza el contenido y rating de un comentario existente")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResult<Comment>> updateComment(@PathVariable Long id, @RequestBody Comment comment) {
        Comment existing = commentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Comentario no encontrado con ID: " + id));
        existing.setContent(comment.getContent());
        existing.setRating(comment.getRating());
        Comment updated = commentRepository.save(existing);
        return ResponseEntity.ok(ApiResult.success("Comentario actualizado exitosamente", updated));
    }

    @Operation(summary = "Eliminar un comentario", description = "Borra permanentemente un comentario por su ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResult<Void>> deleteComment(@PathVariable Long id) {
        if (!commentRepository.existsById(id) ) {
            throw new NotFoundException("Comentario no encontrado con ID: " + id);
        }
        commentRepository.deleteById(id);
        return ResponseEntity.ok(ApiResult.success("Comentario eliminado exitosamente", null));
    }

    @Operation(summary = "Eliminar comentarios por jugador", description = "Borra todos los comentarios asociados a un ID de jugador")
    @DeleteMapping("/player/{playerId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResult<Void>> deleteByPlayer(@PathVariable Long playerId) {
        commentRepository.deleteByPlayerId(playerId);
        return ResponseEntity.ok(ApiResult.success("Comentarios del jugador eliminados exitosamente", null));
    }
}
