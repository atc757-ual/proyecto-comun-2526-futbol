package com.futbol.player.feign.service;

import com.futbol.player.feign.client.PlayerClient;
import com.futbol.player.feign.model.PlayerDTO;
import com.futbol.player.feign.model.ApiResult;
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
            public ApiResult<List<PlayerDTO>> getAllPlayers() {
                logger.error("Error al obtener jugadores: {}", cause.getMessage());
                return new ApiResult<>("SERVICE_UNAVAILABLE", "Servicio no disponible", cause.getMessage());
            }

            @Override
            public ApiResult<PlayerDTO> getPlayerById(Long id) {
                logger.error("Error al obtener jugador {}: {}", id, cause.getMessage());
                return new ApiResult<>("SERVICE_UNAVAILABLE", "No se puede buscar el jugador", cause.getMessage());
            }

            @Override
            public ApiResult<PlayerDTO> createPlayer(PlayerDTO player) {
                return new ApiResult<>("SERVICE_UNAVAILABLE", "No se puede crear el jugador", cause.getMessage());
            }

            @Override
            public ApiResult<PlayerDTO> updatePlayer(PlayerDTO player) {
                return new ApiResult<>("SERVICE_UNAVAILABLE", "No se puede actualizar el jugador", cause.getMessage());
            }

            @Override
            public ApiResult<Void> deletePlayer(Long id) {
                return new ApiResult<>("SERVICE_UNAVAILABLE", "No se puede eliminar el jugador", cause.getMessage());
            }
        };
    }
}
