package com.futbol.comment.feign.controller;

import com.futbol.comment.feign.dto.ApiResult;
import com.futbol.comment.feign.model.CommentDTO;
import com.futbol.comment.feign.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/feign/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @GetMapping
    public ResponseEntity<ApiResult<List<CommentDTO>>> getAll(@RequestParam(required = false) String userId) {
        return ResponseEntity.ok(commentService.listarTodos(userId));
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<ApiResult<List<CommentDTO>>> getByPlayer(@PathVariable Long playerId) {
        return ResponseEntity.ok(commentService.listarPorJugador(playerId));
    }

    @PostMapping
    public ResponseEntity<ApiResult<CommentDTO>> create(@RequestBody CommentDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.guardar(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResult<Void>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.eliminar(id));
    }
}
