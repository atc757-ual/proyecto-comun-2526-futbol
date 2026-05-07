package com.futbol.externalclient.controller;

import com.futbol.externalfeign.client.FootballFeignClient;
import com.futbol.externalfeign.dto.ApiResult;
import com.futbol.externalfeign.dto.ExternalPlayerDTO;
import com.futbol.externalfeign.dto.FootballApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/external")
@Tag(name = "External API", description = "Endpoints para interactuar con APIs de terceros (API-Football)")
public class ExternalController {

    private final FootballFeignClient footballClient;

    @Value("${football.api.key}")
    private String apiKey;

    public ExternalController(FootballFeignClient footballClient) {
        this.footballClient = footballClient;
    }

    @GetMapping("/players")
    @Operation(summary = "Busca jugadores en la API externa", description = "Conecta con API-Football para obtener perfiles de jugadores por nombre")
    public ApiResult<List<ExternalPlayerDTO>> searchPlayers(@RequestParam String name) {
        try {
            FootballApiResponse response = footballClient.searchPlayers(apiKey, name);
            
            List<ExternalPlayerDTO> players = response.getResponse().stream()
                .map(wrapper -> {
                    FootballApiResponse.PlayerInfo p = wrapper.getPlayer();
                    return ExternalPlayerDTO.builder()
                        .externalId(p.getId())
                        .name(p.getName())
                        .firstname(p.getFirstname())
                        .lastname(p.getLastname())
                        .age(p.getAge())
                        .birthDate(p.getBirth() != null ? p.getBirth().getDate() : null)
                        .nationality(p.getNationality())
                        .photo(p.getPhoto())
                        .build();
                })
                .collect(Collectors.toList());

            return new ApiResult<>("200", "Búsqueda externa (Java) realizada con éxito", players);

        } catch (Exception e) {
            return new ApiResult<List<ExternalPlayerDTO>>("500", "Error en servicio externo Java: " + e.getMessage(), null);
        }
    }
}
