package com.futbol.comment.feign.service;

import com.futbol.comment.feign.client.CommentClient;
import com.futbol.common.dto.ApiResult;
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
    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servicio de comentarios temporalmente no disponible";

    @Override
    public CommentClient create(Throwable cause) {
        return new CommentClient() {
            @Override
            public ApiResult<List<CommentDTO>> getAllComments(String userId) {
                logger.error("Error al obtener comentarios para usuario {}", userId, cause);
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), SERVICE_UNAVAILABLE_MESSAGE, null);
            }

            @Override
            public ApiResult<List<CommentDTO>> getCommentsByPlayer(Long playerId) {
                logger.error("Error al obtener comentarios del jugador {}", playerId, cause);
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), SERVICE_UNAVAILABLE_MESSAGE, null);
            }

            @Override
            public ApiResult<CommentDTO> createComment(CommentDTO comment) {
                logger.error("Error al crear comentario para jugador {}", comment != null ? comment.getPlayerId() : null, cause);
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), SERVICE_UNAVAILABLE_MESSAGE, null);
            }

            @Override
            public ApiResult<Void> deleteComment(Long id) {
                logger.error("Error al eliminar comentario {}", id, cause);
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), SERVICE_UNAVAILABLE_MESSAGE, null);
            }

            @Override
            public ApiResult<Void> deleteByPlayerId(Long playerId) {
                logger.error("Error al borrar comentarios del jugador {}", playerId, cause);
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), SERVICE_UNAVAILABLE_MESSAGE, null);
            }
        };
    }
}
