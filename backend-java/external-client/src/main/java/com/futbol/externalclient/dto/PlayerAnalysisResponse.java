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
    private List<String> idealEleven;
    private String starPlayer;
    private String justification;
    private List<String> tacticalRecommendations;
}
