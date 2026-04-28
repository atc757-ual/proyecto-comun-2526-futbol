package com.futbol.player.feign.service;

import com.futbol.player.feign.client.PlayerClient;
import com.futbol.player.feign.model.PlayerDTO;
import com.futbol.player.feign.dto.ApiResult;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PlayerFallbackFactory implements FallbackFactory<PlayerClient> {

    private static final Logger logger = LoggerFactory.getLogger(PlayerFallbackFactory.class);

    @Override
    public PlayerClient create(Throwable cause) {
        return new PlayerClient() {
            @Override
            public ApiResult<List<PlayerDTO>> getAllPlayers(String userId) {
                logger.error("Error al obtener jugadores para usuario {}: {}", userId, cause.getMessage());
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), cause.getMessage(), null);
            }

            @Override
            public ApiResult<PlayerDTO> getPlayerById(Long id) {
                logger.error("Error al obtener jugador {}: {}", id, cause.getMessage());
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), cause.getMessage(), null);
            }

            @Override
            public ApiResult<PlayerDTO> createPlayer(PlayerDTO player) {
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), cause.getMessage(), null);
            }

            @Override
            public ApiResult<PlayerDTO> updatePlayer(PlayerDTO player) {
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), cause.getMessage(), null);
            }

            @Override
            public ApiResult<Void> deletePlayer(Long id) {
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), cause.getMessage(), null);
            }
        };
    }
}
