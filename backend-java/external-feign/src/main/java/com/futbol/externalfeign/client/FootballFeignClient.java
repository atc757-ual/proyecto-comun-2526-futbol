package com.futbol.externalfeign.client;

import com.futbol.externalfeign.dto.FootballApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "football-api", url = "https://v3.football.api-sports.io")
public interface FootballFeignClient {

    @GetMapping("/players/profiles")
    FootballApiResponse searchPlayers(
        @RequestHeader("x-apisports-key") String apiKey,
        @RequestParam("search") String name
    );
}
