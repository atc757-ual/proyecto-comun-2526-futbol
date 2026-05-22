package com.futbol.externalfeign.controller;

import com.futbol.externalfeign.client.FootballFeignClient;
import com.futbol.common.dto.ApiResult;
import com.futbol.externalfeign.dto.FootballApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/feign/external")
@Tag(name = "External Feign API", description = "Cliente Feign para integración con API Football")
public class ExternalFeignController {

    private final FootballFeignClient footballClient;

    @Value("${football.api.key}")
    private String apiKey;

    public ExternalFeignController(FootballFeignClient footballClient) {
        this.footballClient = footballClient;
    }

    @GetMapping("/players")
        @Operation(summary = "Buscar jugadores en API Football (Feign)")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Consulta externa exitosa"),
            @ApiResponse(responseCode = "500", description = "Error en proveedor externo")
        })
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
