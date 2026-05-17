package com.futbol.externalfeign.client;

import com.futbol.externalfeign.dto.TsdbSearchResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "TSDB-CLIENT", url = "${tsdb.api.url:https://www.thesportsdb.com/api/v2/json}")
public interface TsdbFeignClient {

    @GetMapping("/search/player/{name}")
    TsdbSearchResponse searchPlayers(
        @RequestHeader("X-API-KEY") String apiKey,
        @PathVariable("name") String name
    );

    @GetMapping("/player/{id}")
    Object getPlayerDetails(
        @RequestHeader("X-API-KEY") String apiKey,
        @PathVariable("id") String id
    );

    @GetMapping("/team/{id}")
    Object getTeamDetails(
        @RequestHeader("X-API-KEY") String apiKey,
        @PathVariable("id") String id
    );

    @GetMapping("/livescore/{sport}")
    Object getLiveScores(
        @RequestHeader("X-API-KEY") String apiKey,
        @PathVariable("sport") String sport
    );

    @GetMapping("/eventstv/{country}")
    Object getTVByCountry(
        @RequestHeader("X-API-KEY") String apiKey,
        @PathVariable("country") String country
    );

    @GetMapping("/lookup/league/{id}")
    Object getLeagueDetails(
        @RequestHeader("X-API-KEY") String apiKey,
        @PathVariable("id") String id
    );

    @GetMapping("/lookup/player_honours/{id}")
    Object getPlayerHonours(
        @RequestHeader("X-API-KEY") String apiKey,
        @PathVariable("id") String id
    );

    @GetMapping("/lookup/player_milestones/{id}")
    Object getPlayerMilestones(
        @RequestHeader("X-API-KEY") String apiKey,
        @PathVariable("id") String id
    );

    @GetMapping("/lookup/player_teams/{id}")
    Object getPlayerTeamsHistory(
        @RequestHeader("X-API-KEY") String apiKey,
        @PathVariable("id") String id
    );
}
