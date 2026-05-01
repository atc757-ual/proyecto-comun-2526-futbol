package com.futbol.comment.feign.service;

import com.futbol.comment.feign.client.CommentClient;
import com.futbol.comment.feign.dto.ApiResult;
import com.futbol.comment.feign.model.CommentDTO;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CommentFallbackFactory implements FallbackFactory<CommentClient> {

    private static final Logger logger = LoggerFactory.getLogger(CommentFallbackFactory.class);

    @Override
    public CommentClient create(Throwable cause) {
        return new CommentClient() {
            @Override
            public ApiResult<List<CommentDTO>> getAllComments(String userId) {
                logger.error("Error al obtener comentarios para usuario {}: {}", userId, cause.getMessage());
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), cause.getMessage(), null);
            }

            @Override
            public ApiResult<List<CommentDTO>> getCommentsByPlayer(Long playerId) {
                logger.error("Error al obtener comentarios del jugador {}: {}", playerId, cause.getMessage());
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), cause.getMessage(), null);
            }

            @Override
            public ApiResult<CommentDTO> createComment(CommentDTO comment) {
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), cause.getMessage(), null);
            }

            @Override
            public ApiResult<Void> deleteComment(Long id) {
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), cause.getMessage(), null);
            }

            @Override
            public ApiResult<Void> deleteByPlayerId(Long playerId) {
                logger.error("Error al borrar comentarios del jugador {}: {}", playerId, cause.getMessage());
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), cause.getMessage(), null);
            }
        };
    }
}
