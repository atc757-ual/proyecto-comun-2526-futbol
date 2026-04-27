package com.futbol.player.feign.client;

import com.futbol.player.feign.model.ApiResult;
import com.futbol.player.feign.model.CommentDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "COMMENT-CLIENT")
public interface CommentClient {

    @GetMapping("/api/comments/player/{playerId}")
    ApiResult<List<CommentDTO>> getCommentsByPlayer(@PathVariable("playerId") Long playerId);
}
