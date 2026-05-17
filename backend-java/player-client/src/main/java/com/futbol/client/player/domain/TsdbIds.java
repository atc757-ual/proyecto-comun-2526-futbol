package com.futbol.client.player.domain;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class TsdbIds {
    private String playerId;
    private String teamId;
    private String teamId2;
    private String leagueId;
    private String transfermarktId;
    private String espnId;
    private String wikidataId;
}
