package com.futbol.player.feign.model;

import java.util.List;

public class PlayerFullDTO {
    private PlayerDTO player;
    private List<CommentDTO> comments;

    public PlayerFullDTO() {}

    public PlayerFullDTO(PlayerDTO player, List<CommentDTO> comments) {
        this.player = player;
        this.comments = comments;
    }

    public PlayerDTO getPlayer() { return player; }
    public void setPlayer(PlayerDTO player) { this.player = player; }
    public List<CommentDTO> getComments() { return comments; }
    public void setComments(List<CommentDTO> comments) { this.comments = comments; }
}
