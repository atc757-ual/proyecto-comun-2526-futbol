package com.futbol.externalfeign.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TsdbSearchResponse {
    
    private List<TsdbPlayer> search;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TsdbPlayer {
        private String idPlayer;
        private String idTeam;
        private String idTeam2;
        private String idLeague;
        private String strPlayer;
        private String strNationality;
        private String strTeam;
        private String strTeam2;
        private String strSport;
        private String strPosition;
        private String strSide;
        private String strHeight;
        private String strWeight;
        private String strNumber;
        private String dateBorn;
        private String strBirthLocation;
        private String strThumb;
        private String strCutout;
        private String strBanner;
        private String strRender;
        private String strDescriptionES;
        private String strDescriptionEN;
        private String strFacebook;
        private String strInstagram;
        private String strTwitter;
        private String strWebsite;
    }
}
