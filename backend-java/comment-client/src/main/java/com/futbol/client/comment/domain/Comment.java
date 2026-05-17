package com.futbol.client.comment.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonAlias;

@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "El ID del jugador es obligatorio")
    @Column(name = "player_id", nullable = false)
    @JsonProperty("player_id")
    @JsonAlias({"player_id", "playerId"})
    private Long playerId;

    @NotNull(message = "El ID del usuario es obligatorio")
    @Column(name = "user_id", nullable = false)
    @JsonProperty("user_id")
    @JsonAlias({"user_id", "userId"})
    private String userId = "anonymous";

    @Column(name = "user_name", length = 100)
    @JsonProperty("user_name")
    @JsonAlias({"user_name", "userName", "autor_name", "author_name"})
    private String userName = "Invitado";

    @NotBlank(message = "El contenido del comentario no puede estar vacío")
    @Column(nullable = false, length = 1000)
    private String content;

    @Min(value = 0, message = "La puntuación mínima es 0")
    @Max(value = 5, message = "La puntuación máxima es 5")
    private Integer rating;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "entry_date")
    private LocalDateTime entryDate;

    @PrePersist
    protected void onCreate() {
        this.entryDate = LocalDateTime.now();
    }

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

    // Getters and Setters
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
