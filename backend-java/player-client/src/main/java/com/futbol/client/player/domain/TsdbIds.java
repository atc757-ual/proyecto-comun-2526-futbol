package com.futbol.client.player.domain;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TsdbIds {
    private String playerId;
    private String teamId;
    private String teamId2;
    private String leagueId;
    private String transfermarktId;
    private String espnId;
    private String wikidataId;
}
