package com.futbol.comment.feign.service;

import com.futbol.comment.feign.client.CommentClient;
import com.futbol.comment.feign.model.ApiResult;
import com.futbol.comment.feign.model.CommentDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommentService {

    @Autowired
    private CommentClient commentClient;

    public ApiResult<List<CommentDTO>> listarTodos() {
        return commentClient.getAllComments();
    }

    public ApiResult<List<CommentDTO>> listarPorJugador(Long playerId) {
        return commentClient.getCommentsByPlayer(playerId);
    }

    public ApiResult<CommentDTO> guardar(CommentDTO dto) {
        return commentClient.createComment(dto);
    }

    public ApiResult<Void> eliminar(Long id) {
        return commentClient.deleteComment(id);
    }
}
