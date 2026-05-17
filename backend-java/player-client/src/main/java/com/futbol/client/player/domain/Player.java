package com.futbol.client.player.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "players")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre no puede estar vacío")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    @Column(nullable = false)
    private String name;

    private String fullname;

    @NotBlank(message = "El equipo es obligatorio")
    @Column(nullable = false)
    private String team;

    @Column(name = "secondary_team")
    private String secondaryTeam;

    private String league;

    private Integer age;

    @Column(name = "birth_date")
    private String birthDate;

    @Column(name = "birth_place")
    private String birthPlace;

    @Column(name = "birth_country")
    private String birthCountry;

    private String nationality;

    private String height;

    private String weight;

    private Integer number;

    private String position;

    private String side;

    @Column(name = "image_url")
    private String imageUrl;

    @NotBlank(message = "El user_id es obligatorio")
    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "external_id")
    private Long externalId;

    private Double latitude;

    private Double longitude;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "is_manual")
    private Boolean isManual = true;

    @Column(name = "is_favorite")
    private Boolean isFavorite = false;

    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    @Embedded
    private SocialMedia socialMedia;

    @Embedded
    private PlayerImages images;

    @Embedded
    private TsdbIds tsdbIds;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isManual == null) isManual = true;
        if (isFavorite == null) isFavorite = false;
        if (isFeatured == null) isFeatured = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
