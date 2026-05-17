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
    // Campos de compatibilidad para unificar con el formato de Node.js y la UI
    private String strPlayer;
    private String strTeam;
    private String strThumb;
    private String strCutout;
    private String strRender;
    private String strNationality;
    private String strPosition;
    private String strSide;
    private String strSport;
    private String strTeam2;
    private String idTeam2;
}
