package com.futbol.player.feign.model;

import java.time.LocalDate;

public class PlayerDTO {
    private Long id;
    private String name;
    private String team;
    private String league;
    private String imageUrl;
    private LocalDate entryDate;

    private String userId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTeam() { return team; }
    public void setTeam(String team) { this.team = team; }
    public String getLeague() { return league; }
    public void setLeague(String league) { this.league = league; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
