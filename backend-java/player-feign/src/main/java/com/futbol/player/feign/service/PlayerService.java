package com.futbol.player.feign.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.futbol.player.feign.client.PlayerClient;
import com.futbol.comment.feign.client.CommentClient;
import com.futbol.player.feign.model.PlayerDTO;
import com.futbol.comment.feign.model.CommentDTO;
import com.futbol.player.feign.model.PlayerFullDTO;
import com.futbol.player.feign.dto.ApiResult;
import org.springframework.http.HttpStatus;
import java.util.List;

@Service
public class PlayerService {
    
    @Autowired
    private PlayerClient playerClient;

    @Autowired
    private CommentClient commentClient;

    public ApiResult<List<PlayerDTO>> getTodosLosJugadores(String userId, String name, String team) {
        return playerClient.getAllPlayers(userId, name, team);
    }

    public ApiResult<PlayerDTO> getJugadorPorId(Long id) {
        return playerClient.getPlayerById(id);
    }

    public ApiResult<PlayerFullDTO> getJugadorCompleto(Long id) {
        // 1. Buscamos el jugador
        ApiResult<PlayerDTO> playerRes = playerClient.getPlayerById(id);
        
        if (playerRes.getData() == null) {
            return new ApiResult<>(playerRes.getResult().getCode(), playerRes.getResult().getDescriptionDetail(), null);
        }

        // 2. Buscamos sus comentarios
        // IMPORTANTE: Obtenemos la data directamente para evitar conflicto de tipos de ApiResult
        com.futbol.comment.feign.dto.ApiResult<List<CommentDTO>> commentRes = commentClient.getCommentsByPlayer(id);
        List<CommentDTO> comments = (commentRes != null) ? commentRes.getData() : null;
        
        PlayerFullDTO full = new PlayerFullDTO(playerRes.getData(), comments);
        
        return new ApiResult<>(String.valueOf(HttpStatus.OK.value()), "Procesamiento concluído exitosamente", full);
    }

    public ApiResult<PlayerDTO> crearJugador(PlayerDTO dto) {
        return playerClient.createPlayer(dto);
    }

    public ApiResult<PlayerDTO> actualizarJugador(PlayerDTO dto) {
        return playerClient.updatePlayer(dto);
    }

    public ApiResult<Void> eliminarJugador(Long id) {
        // 1. Eliminamos sus comentarios en el microservicio de comentarios
        try {
            commentClient.deleteByPlayerId(id);
        } catch (Exception e) {
            // Logueamos pero continuamos para no bloquear el borrado del jugador si el servicio de comentarios falla
            System.err.println("Error eliminando comentarios para el jugador " + id + ": " + e.getMessage());
        }

        // 2. Eliminamos el jugador
        return playerClient.deletePlayer(id);
    }
}
