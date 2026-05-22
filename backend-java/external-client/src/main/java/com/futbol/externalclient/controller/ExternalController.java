package com.futbol.externalclient.controller;

import com.futbol.externalfeign.client.TsdbFeignClient;
import com.futbol.common.dto.ApiResult;
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
            String cleanName = name != null ? name.replace("+", " ").trim().replaceAll("\\s+", " ") : "";
            TsdbSearchResponse response = tsdbClient.searchPlayers(apiKey, cleanName);
            
            if (response.getSearch() == null) {
                return new ApiResult<>("200", "Procesamiento concluído exitosamente", List.of());
            }

            List<ExternalPlayerDTO> players = response.getSearch().stream()
                .filter(p -> "Soccer".equalsIgnoreCase(p.getStrSport()))
                .map(p -> {
                    ExternalPlayerDTO dto = new ExternalPlayerDTO();
                    dto.setIdPlayer(p.getIdPlayer());
                    dto.setIdTeam(p.getIdTeam());
                    dto.setIdTeam2(p.getIdTeam2());
                    dto.setIdLeague(p.getIdLeague());
                    dto.setStrPlayer(p.getStrPlayer());
                    dto.setStrSport(p.getStrSport());
                    dto.setStrTeam(p.getStrTeam());
                    dto.setStrTeam2(p.getStrTeam2());
                    dto.setStrThumb(p.getStrThumb());
                    dto.setStrCutout(p.getStrCutout());
                    dto.setStrRender(p.getStrRender());
                    dto.setStrNationality(p.getStrNationality());
                    dto.setStrPosition(p.getStrPosition());
                    dto.setStrSide(p.getStrSide());
                    return dto;
                })
                .collect(Collectors.toList());

            return new ApiResult<>("200", "Procesamiento concluído exitosamente", players);

        } catch (Exception e) {
            return new ApiResult<>("500", "Error en servicio externo Java: " + e.getMessage(), null);
        }
    }

    @GetMapping("/player/{id}")
    @Operation(summary = "Detalles del jugador")
    public ApiResult<Object> getPlayerDetails(@PathVariable String id) {
        try {
            Object details = tsdbClient.getPlayerDetails(apiKey, id);
            if (details instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) details;
                if (map.containsKey("players")) {
                    java.util.List<?> list = (java.util.List<?>) map.get("players");
                    if (list != null && !list.isEmpty()) details = list.get(0);
                } else if (map.containsKey("lookup")) {
                    java.util.List<?> list = (java.util.List<?>) map.get("lookup");
                    if (list != null && !list.isEmpty()) details = list.get(0);
                }
            }
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", details);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/team/{id}")
    @Operation(summary = "Detalles del equipo")
    public ApiResult<Object> getTeamDetails(@PathVariable String id) {
        try {
            Object details = tsdbClient.getTeamDetails(apiKey, id);
            if (details instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) details;
                Object teamObj = details;
                if (map.containsKey("teams")) {
                    java.util.List<?> list = (java.util.List<?>) map.get("teams");
                    if (list != null && !list.isEmpty()) teamObj = list.get(0);
                } else if (map.containsKey("lookup")) {
                    java.util.List<?> list = (java.util.List<?>) map.get("lookup");
                    if (list != null && !list.isEmpty()) teamObj = list.get(0);
                }
                
                if (teamObj instanceof java.util.Map) {
                    java.util.Map<String, Object> teamMap = new java.util.HashMap<>((java.util.Map<String, Object>) teamObj);
                    if (teamMap.containsKey("strBadge") && !teamMap.containsKey("strTeamBadge")) {
                        teamMap.put("strTeamBadge", teamMap.get("strBadge"));
                    }
                    details = teamMap;
                } else {
                    details = teamObj;
                }
            }
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", details);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/live/soccer")
    @Operation(summary = "Marcadores en vivo")
    public ApiResult<Object> getLiveScores() {
        try {
            Object results = tsdbClient.getLiveScores(apiKey, "soccer");
            if (results instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) results;
                if (map.containsKey("livescore")) {
                    return new ApiResult<>("200", "Procesamiento concluído exitosamente", map.get("livescore"));
                } else if (map.containsKey("results")) {
                    return new ApiResult<>("200", "Procesamiento concluído exitosamente", map.get("results"));
                }
            }
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", results);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/tv/{country}")
    @Operation(summary = "Eventos de TV por país")
    public ApiResult<Object> getTVByCountry(@PathVariable(required = false) String country) {
        try {
            Object results = tsdbClient.getTVByCountry(apiKey, country != null ? country : "Spain");
            java.util.List<?> eventList = java.util.List.of();
            
            if (results instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) results;
                Object rawEvents = null;
                
                if (map.containsKey("tvevents")) {
                    rawEvents = map.get("tvevents");
                } else if (map.containsKey("tv")) {
                    rawEvents = map.get("tv");
                } else if (map.containsKey("results")) {
                    rawEvents = map.get("results");
                } else if (map.containsKey("filter")) {
                    rawEvents = map.get("filter");
                }
                
                if (rawEvents instanceof java.util.List) {
                    eventList = (java.util.List<?>) rawEvents;
                }
            } else if (results instanceof java.util.List) {
                eventList = (java.util.List<?>) results;
            }
            
            // Filtrar estrictamente por fútbol (soccer) para replicar la lógica exitosa de Node.js
            java.util.List<?> filteredEvents = eventList.stream()
                .filter(item -> {
                    if (item instanceof java.util.Map) {
                        java.util.Map<?, ?> itemMap = (java.util.Map<?, ?>) item;
                        Object sport = itemMap.get("strSport");
                        return sport != null && "soccer".equalsIgnoreCase(sport.toString());
                    }
                    return false;
                })
                .collect(Collectors.toList());

            return new ApiResult<>("200", "Procesamiento concluído exitosamente", filteredEvents);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), java.util.List.of());
        }
    }

    @GetMapping("/league/{id}")
    @Operation(summary = "Detalles de la liga")
    public ApiResult<Object> getLeagueDetails(@PathVariable String id) {
        try {
            Object details = tsdbClient.getLeagueDetails(apiKey, id);
            if (details instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) details;
                if (map.containsKey("leagues")) {
                    java.util.List<?> list = (java.util.List<?>) map.get("leagues");
                    if (list != null && !list.isEmpty()) details = list.get(0);
                } else if (map.containsKey("lookup")) {
                    java.util.List<?> list = (java.util.List<?>) map.get("lookup");
                    if (list != null && !list.isEmpty()) details = list.get(0);
                }
            }
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", details);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/player/{id}/honours")
    @Operation(summary = "Palmarés del jugador")
    public ApiResult<Object> getPlayerHonours(@PathVariable String id) {
        try {
            Object results = tsdbClient.getPlayerHonours(apiKey, id);
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", results);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/player/{id}/milestones")
    @Operation(summary = "Hitos del jugador")
    public ApiResult<Object> getPlayerMilestones(@PathVariable String id) {
        try {
            Object results = tsdbClient.getPlayerMilestones(apiKey, id);
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", results);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/player/{id}/history")
    @Operation(summary = "Trayectoria del jugador")
    public ApiResult<Object> getPlayerTeamsHistory(@PathVariable String id) {
        try {
            Object results = tsdbClient.getPlayerTeamsHistory(apiKey, id);
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", results);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), null);
        }
    }

    @GetMapping("/leagues/search")
    @Operation(summary = "Busca ligas por nombre")
    public ApiResult<Object> searchLeagues(@RequestParam("query") String query) {
        try {
            Object results = tsdbClient.searchLeagues(apiKey, query);
            if (results instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) results;
                if (map.containsKey("search")) {
                    Object leagues = map.get("search");
                    if (leagues instanceof java.util.List) {
                        java.util.List<?> list = (java.util.List<?>) leagues;
                        java.util.List<?> filtered = list.stream()
                            .filter(l -> {
                                if (l instanceof java.util.Map) {
                                    java.util.Map<?, ?> lMap = (java.util.Map<?, ?>) l;
                                    Object sport = lMap.get("strSport");
                                    return sport != null && "soccer".equalsIgnoreCase(sport.toString());
                                }
                                return false;
                            })
                            .collect(Collectors.toList());
                        return new ApiResult<>("200", "Procesamiento concluído exitosamente", filtered);
                    }
                }
            }
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", java.util.List.of());
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), java.util.List.of());
        }
    }

    @GetMapping("/teams/search")
    @Operation(summary = "Busca equipos por nombre")
    public ApiResult<Object> searchTeams(@RequestParam("query") String query) {
        try {
            Object results = tsdbClient.searchTeams(apiKey, query);
            if (results instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) results;
                if (map.containsKey("search")) {
                    Object teams = map.get("search");
                    if (teams instanceof java.util.List) {
                        java.util.List<?> list = (java.util.List<?>) teams;
                        java.util.List<?> filtered = list.stream()
                            .filter(t -> {
                                if (t instanceof java.util.Map) {
                                    java.util.Map<?, ?> tMap = (java.util.Map<?, ?>) t;
                                    Object sport = tMap.get("strSport");
                                    return sport != null && "soccer".equalsIgnoreCase(sport.toString());
                                }
                                return false;
                            })
                            .collect(Collectors.toList());
                        return new ApiResult<>("200", "Procesamiento concluído exitosamente", filtered);
                    }
                }
            }
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", java.util.List.of());
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), java.util.List.of());
        }
    }

    @GetMapping("/league/{leagueId}/teams")
    @Operation(summary = "Equipos de una liga")
    public ApiResult<Object> getTeamsByLeague(@PathVariable("leagueId") String leagueId) {
        try {
            Object results = tsdbClient.getTeamsByLeague(apiKey, leagueId);
            if (results instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) results;
                Object teams = null;
                if (map.containsKey("teams")) {
                    teams = map.get("teams");
                } else if (map.containsKey("list")) {
                    teams = map.get("list");
                } else if (map.containsKey("results")) {
                    teams = map.get("results");
                }
                if (teams != null) {
                    return new ApiResult<>("200", "Procesamiento concluído exitosamente", teams);
                }
            }
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", results);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), java.util.List.of());
        }
    }

    @GetMapping("/team/{teamId}/players")
    @Operation(summary = "Plantilla de jugadores de un equipo")
    public ApiResult<Object> getPlayersByTeam(@PathVariable("teamId") String teamId) {
        try {
            Object results = tsdbClient.getPlayersByTeam(apiKey, teamId);
            if (results instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) results;
                Object players = null;
                if (map.containsKey("player")) {
                    players = map.get("player");
                } else if (map.containsKey("list")) {
                    players = map.get("list");
                } else if (map.containsKey("results")) {
                    players = map.get("results");
                }
                if (players != null) {
                    return new ApiResult<>("200", "Procesamiento concluído exitosamente", players);
                }
            }
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", results);
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), java.util.List.of());
        }
    }

    @GetMapping("/players/search-team")
    @Operation(summary = "Busca jugadores por nombre de equipo")
    public ApiResult<Object> searchPlayersByTeam(@RequestParam("team") String teamName) {
        try {
            Object results = tsdbClient.searchPlayersByTeam(apiKey, teamName);
            if (results instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) results;
                Object players = null;
                if (map.containsKey("search")) {
                    players = map.get("search");
                } else if (map.containsKey("player")) {
                    players = map.get("player");
                } else if (map.containsKey("results")) {
                    players = map.get("results");
                }
                if (players instanceof java.util.List) {
                    java.util.List<?> list = (java.util.List<?>) players;
                    java.util.List<?> filtered = list.stream()
                        .filter(p -> {
                            if (p instanceof java.util.Map) {
                                java.util.Map<?, ?> pMap = (java.util.Map<?, ?>) p;
                                Object sport = pMap.get("strSport");
                                return sport != null && "soccer".equalsIgnoreCase(sport.toString());
                            }
                            return false;
                        })
                        .collect(Collectors.toList());
                    return new ApiResult<>("200", "Procesamiento concluído exitosamente", filtered);
                }
            }
            return new ApiResult<>("200", "Procesamiento concluído exitosamente", java.util.List.of());
        } catch (Exception e) {
            return new ApiResult<>("500", "Error: " + e.getMessage(), java.util.List.of());
        }
    }
}
