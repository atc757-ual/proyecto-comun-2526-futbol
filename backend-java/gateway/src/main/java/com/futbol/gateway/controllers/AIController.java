package com.futbol.gateway.controllers;

import com.futbol.gateway.models.PlayerAnalysisResponse;
import com.futbol.gateway.services.PlayerAIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private PlayerAIService aiService;

    // TODO: Inyectar Repositorio de Jugadores para leer datos reales
    // @Autowired
    // private PlayerRepository playerRepository;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeTeam() {
        try {
            // 1. Aquí buscaríamos los jugadores del usuario en Postgres
            // Por ahora simularemos el envío de datos para verificar que el LLM responde
            String mockPlayersData = "- Lionel Messi: Delantero, Habilidad 99\n" +
                                     "- Sergio Busquets: Medio, Habilidad 85\n" +
                                     "- Jordi Alba: Defensa, Habilidad 82";

            // 2. Llamar a la IA
            PlayerAnalysisResponse analysis = aiService.analyze(mockPlayersData);

            // 3. Responder
            Map<String, Object> response = new HashMap<>();
            response.put("result", Map.of("status", "OK"));
            response.put("data", analysis);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "result", Map.of("status", "NOK", "description", e.getMessage())
            ));
        }
    }
}
