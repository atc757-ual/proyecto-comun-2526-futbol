package com.futbol.player.feign.service;

import com.futbol.player.feign.client.PlayerClient;
import com.futbol.player.feign.model.PlayerDTO;
import com.futbol.common.dto.ApiResult;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PlayerFallbackFactory implements FallbackFactory<PlayerClient> {

    private static final Logger logger = LoggerFactory.getLogger(PlayerFallbackFactory.class);
    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servicio de jugadores temporalmente no disponible";

    @Override
    public PlayerClient create(Throwable cause) {
        return new PlayerClient() {
            @Override
            public ApiResult<List<PlayerDTO>> getAllPlayers(String userId, String name, String team) {
                logger.error("Error al obtener jugadores (User:{}, Name:{}, Team:{})", userId, name, team, cause);
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), SERVICE_UNAVAILABLE_MESSAGE, null);
            }

            @Override
            public ApiResult<PlayerDTO> getPlayerById(Long id) {
                logger.error("Error al obtener jugador {}", id, cause);
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), SERVICE_UNAVAILABLE_MESSAGE, null);
            }

            @Override
            public ApiResult<PlayerDTO> createPlayer(PlayerDTO player) {
                logger.error("Error al crear jugador {}", player != null ? player.getName() : null, cause);
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), SERVICE_UNAVAILABLE_MESSAGE, null);
            }

            @Override
            public ApiResult<PlayerDTO> updatePlayer(PlayerDTO player) {
                logger.error("Error al actualizar jugador {}", player != null ? player.getId() : null, cause);
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), SERVICE_UNAVAILABLE_MESSAGE, null);
            }

            @Override
            public ApiResult<Void> deletePlayer(Long id) {
                logger.error("Error al eliminar jugador {}", id, cause);
                return new ApiResult<>(String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()), SERVICE_UNAVAILABLE_MESSAGE, null);
            }
        };
    }
}
