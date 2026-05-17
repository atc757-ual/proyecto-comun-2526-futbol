package com.futbol.externalfeign.controller;

import com.futbol.externalfeign.client.FootballFeignClient;
import com.futbol.externalfeign.dto.ApiResult;
import com.futbol.externalfeign.dto.FootballApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/feign/external")
public class ExternalFeignController {

    private final FootballFeignClient footballClient;

    @Value("${football.api.key}")
    private String apiKey;

    public ExternalFeignController(FootballFeignClient footballClient) {
        this.footballClient = footballClient;
    }

    @GetMapping("/players")
    public ApiResult<FootballApiResponse> searchPlayers(@RequestParam String name) {
        try {
            String cleanName = name != null ? name.replace("+", " ").trim().replaceAll("\\s+", " ") : "";
            FootballApiResponse response = footballClient.searchPlayers(apiKey, cleanName);
            return new ApiResult<>("200", "Petición Feign exitosa", response);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error en Feign externo: " + e.getMessage(), null);
        }
    }
}
