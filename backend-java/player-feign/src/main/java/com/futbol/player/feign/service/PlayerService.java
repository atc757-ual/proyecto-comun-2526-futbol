package com.futbol.player.feign.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.futbol.player.feign.client.PlayerClient;
import com.futbol.player.feign.client.CommentClient;
import com.futbol.player.feign.model.PlayerDTO;
import com.futbol.player.feign.model.CommentDTO;
import com.futbol.player.feign.model.PlayerFullDTO;
import com.futbol.player.feign.model.ApiResult;
import java.util.List;

@Service
public class PlayerService {
    
    @Autowired
    private PlayerClient playerClient;

    @Autowired
    private CommentClient commentClient;

    public ApiResult<List<PlayerDTO>> getTodosLosJugadores() {
        return playerClient.getAllPlayers();
    }

    public ApiResult<PlayerDTO> getJugador(Long id) {
        return playerClient.getPlayerById(id);
    }

    public ApiResult<PlayerFullDTO> getJugadorCompleto(Long id) {
        // 1. Buscamos el jugador
        ApiResult<PlayerDTO> playerRes = playerClient.getPlayerById(id);
        
        if (!"SUCCESS".equals(playerRes.getCode())) {
            return new ApiResult<>(playerRes.getCode(), "No se pudo obtener el jugador", playerRes.getDetail());
        }

        // 2. Buscamos sus comentarios
        ApiResult<List<CommentDTO>> commentRes = commentClient.getCommentsByPlayer(id);
        
        // 3. Combinamos (aunque los comentarios fallen, devolvemos el jugador con lista vacía si es necesario)
        List<CommentDTO> comments = commentRes.getData();
        PlayerFullDTO full = new PlayerFullDTO(playerRes.getData(), comments);
        
        return new ApiResult<>("SUCCESS", "Jugador y comentarios obtenidos", full);
    }

    public ApiResult<PlayerDTO> nuevoJugador(PlayerDTO dto) {
        return playerClient.createPlayer(dto);
    }

    public ApiResult<PlayerDTO> actualizarJugador(PlayerDTO dto) {
        return playerClient.updatePlayer(dto);
    }

    public ApiResult<Void> borrarJugador(Long id) {
        return playerClient.deletePlayer(id);
    }
}
