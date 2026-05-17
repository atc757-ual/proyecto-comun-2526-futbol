package com.futbol.client.player.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerDTO {

    private Long id;
    private String name;
    private String fullname;
    private String team;
    private String secondaryTeam;
    private String league;
    private Integer age;
    private String birthDate;
    private String birthPlace;
    private String birthCountry;
    private String nationality;
    private String height;
    private String weight;
    private Integer number;
    private String position;
    private String side;
    private String imageUrl;
    private String userId;
    private Long externalId;
    private Double latitude;
    private Double longitude;
    private LocalDate entryDate;
    private LocalDateTime createdAt;
    private String summary;
    private Boolean isManual;
    private Boolean isFavorite;
    private Boolean isFeatured;

    private SocialMediaDTO socialMedia;
    private PlayerImagesDTO images;
    private TsdbIdsDTO tsdbIds;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SocialMediaDTO {
        private String facebook;
        private String instagram;
        private String twitter;
        private String website;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerImagesDTO {
        private String thumb;
        private String cutout;
        private String banner;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TsdbIdsDTO {
        private String playerId;
        private String teamId;
        private String teamId2;
        private String leagueId;
        private String transfermarktId;
        private String espnId;
        private String wikidataId;
    }
}
