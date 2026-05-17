package com.futbol.externalclient.controller;

import com.futbol.externalfeign.client.TsdbFeignClient;
import com.futbol.externalfeign.dto.ApiResult;
import com.futbol.externalfeign.dto.ExternalPlayerDTO;
import com.futbol.externalfeign.dto.TsdbSearchResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/external")
@Tag(name = "External API", description = "Endpoints para interactuar con APIs de terceros (TheSportsDB)")
public class ExternalController {

    private final TsdbFeignClient tsdbClient;

    @Value("${tsdb.api.key:1}")
    private String apiKey;

    public ExternalController(TsdbFeignClient tsdbClient) {
        this.tsdbClient = tsdbClient;
    }

    @GetMapping("/players")
    @Operation(summary = "Busca jugadores en TSDB", description = "Conecta con TheSportsDB V2 para obtener perfiles de jugadores por nombre")
    public ApiResult<List<ExternalPlayerDTO>> searchPlayers(@RequestParam String name) {
        try {
            TsdbSearchResponse response = tsdbClient.searchPlayers(apiKey, name);
            
            if (response.getSearch() == null) {
                return new ApiResult<>("200", "No se encontraron resultados", List.of());
            }

            List<ExternalPlayerDTO> players = response.getSearch().stream()
                .filter(p -> "Soccer".equalsIgnoreCase(p.getStrSport()))
                .map(p -> ExternalPlayerDTO.builder()
                        .idPlayer(p.getIdPlayer())
                        .idTeam(p.getIdTeam())
                        .idLeague(p.getIdLeague())
                        .name(p.getStrPlayer())
                        .team(p.getStrTeam())
                        .nationality(p.getStrNationality())
                        .photo(p.getStrThumb())
                        .position(p.getStrPosition())
                        .height(p.getStrHeight())
                        .weight(p.getStrWeight())
                        .dateBorn(p.getDateBorn())
                        .description(p.getStrDescriptionES() != null ? p.getStrDescriptionES() : p.getStrDescriptionEN())
                        .build())
                .collect(Collectors.toList());

            return new ApiResult<>("200", "Búsqueda TSDB (Java) realizada con éxito", players);

        } catch (Exception e) {
            return new ApiResult<>("500", "Error en servicio externo Java: " + e.getMessage(), null);
        }
    }

    @GetMapping("/player/{id}")
    @Operation(summary = "Detalles del jugador")
    public ApiResult<Object> getPlayerDetails(@PathVariable String id) {
        try {
            Object details = tsdbClient.getPlayerDetails(apiKey, id);
            return new ApiResult<>("200", "Detalles recuperados", details);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/team/{id}")
    @Operation(summary = "Detalles del equipo")
    public ApiResult<Object> getTeamDetails(@PathVariable String id) {
        try {
            Object details = tsdbClient.getTeamDetails(apiKey, id);
            return new ApiResult<>("200", "Equipo recuperado", details);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/live/soccer")
    @Operation(summary = "Marcadores en vivo")
    public ApiResult<Object> getLiveScores() {
        try {
            Object results = tsdbClient.getLiveScores(apiKey, "soccer");
            return new ApiResult<>("200", "Live scores recuperados", results);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/tv/{country}")
    @Operation(summary = "Eventos de TV por país")
    public ApiResult<Object> getTVByCountry(@PathVariable(required = false) String country) {
        try {
            Object results = tsdbClient.getTVByCountry(apiKey, country != null ? country : "Spain");
            return new ApiResult<>("200", "TV Schedule recuperado", results);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/league/{id}")
    @Operation(summary = "Detalles de la liga")
    public ApiResult<Object> getLeagueDetails(@PathVariable String id) {
        try {
            Object details = tsdbClient.getLeagueDetails(apiKey, id);
            return new ApiResult<>("200", "Liga recuperada", details);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/player/{id}/honours")
    @Operation(summary = "Palmarés del jugador")
    public ApiResult<Object> getPlayerHonours(@PathVariable String id) {
        try {
            Object results = tsdbClient.getPlayerHonours(apiKey, id);
            return new ApiResult<>("200", "Palmarés recuperado", results);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/player/{id}/milestones")
    @Operation(summary = "Hitos del jugador")
    public ApiResult<Object> getPlayerMilestones(@PathVariable String id) {
        try {
            Object results = tsdbClient.getPlayerMilestones(apiKey, id);
            return new ApiResult<>("200", "Hitos recuperados", results);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/player/{id}/history")
    @Operation(summary = "Trayectoria del jugador")
    public ApiResult<Object> getPlayerTeamsHistory(@PathVariable String id) {
        try {
            Object results = tsdbClient.getPlayerTeamsHistory(apiKey, id);
            return new ApiResult<>("200", "Trayectoria recuperada", results);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }
}
