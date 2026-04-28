package com.futbol.comment.feign.client;

import com.futbol.comment.feign.dto.ApiResult;
import com.futbol.comment.feign.model.CommentDTO;
import com.futbol.comment.feign.service.CommentFallbackFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "COMMENT-CLIENT", fallbackFactory = CommentFallbackFactory.class)
public interface CommentClient {

    @GetMapping("/api/comments")
    ApiResult<List<CommentDTO>> getAllComments(@RequestParam("userId") String userId);

    @GetMapping("/api/comments/player/{playerId}")
    ApiResult<List<CommentDTO>> getCommentsByPlayer(@PathVariable("playerId") Long playerId);

    @PostMapping("/api/comments")
    ApiResult<CommentDTO> createComment(@RequestBody CommentDTO comment);

    @DeleteMapping("/api/comments/{id}")
    ApiResult<Void> deleteComment(@PathVariable("id") Long id);
}
