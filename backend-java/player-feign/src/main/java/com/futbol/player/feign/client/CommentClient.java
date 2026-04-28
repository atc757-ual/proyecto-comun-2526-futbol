package com.futbol.player.feign.client;

import com.futbol.player.feign.dto.ApiResult;
import com.futbol.player.feign.model.CommentDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "COMMENT-CLIENT")
public interface CommentClient {

    @GetMapping("/api/comments")
    ApiResult<List<CommentDTO>> getAllComments(@RequestParam("userId") String userId);

    @GetMapping("/api/comments/player/{playerId}")
    ApiResult<List<CommentDTO>> getCommentsByPlayer(@PathVariable("playerId") Long playerId);
}
