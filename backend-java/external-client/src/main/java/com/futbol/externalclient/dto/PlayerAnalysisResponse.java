package com.futbol.externalclient.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PlayerAnalysisResponse {
    private String analysis;
    private String formation;
    private List<IdealPlayerDTO> idealEleven;
    private String starPlayer;
    private String justification;
    private List<String> tacticalRecommendations;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class IdealPlayerDTO {
        private String name;
        private String position;
        private String role;
    }
}
