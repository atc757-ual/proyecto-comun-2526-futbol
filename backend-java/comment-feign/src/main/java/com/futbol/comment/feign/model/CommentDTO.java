package com.futbol.comment.feign.model;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonAlias;

public class CommentDTO {
    private Long id;

    @JsonProperty("player_id")
    @JsonAlias({"player_id", "playerId"})
    private Long playerId;

    @JsonProperty("user_id")
    @JsonAlias({"user_id", "userId"})
    private String userId;

    @JsonProperty("user_name")
    @JsonAlias({"user_name", "userName", "autor_name", "author_name"})
    private String userName;

    private String content;
    private Integer rating;
    private Double latitude;
    private Double longitude;
    private LocalDateTime entryDate;

    // Custom Setter for GeoJSON location sent by frontend
    @JsonProperty("location")
    public void setLocationMap(java.util.Map<String, java.lang.Object> location) {
        if (location != null && location.get("coordinates") instanceof java.util.List) {
            java.util.List<?> coords = (java.util.List<?>) location.get("coordinates");
            if (coords.size() >= 2) {
                this.longitude = ((Number) coords.get(0)).doubleValue();
                this.latitude = ((Number) coords.get(1)).doubleValue();
            }
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public LocalDateTime getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDateTime entryDate) { this.entryDate = entryDate; }
}
