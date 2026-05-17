package com.futbol.externalfeign.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExternalPlayerDTO {
    private String idPlayer;
    private String idTeam;
    private String idLeague;
    private String name;
    private String team;
    private String nationality;
    private String photo;
    private String position;
    private String height;
    private String weight;
    private String dateBorn;
    private String description;
}
