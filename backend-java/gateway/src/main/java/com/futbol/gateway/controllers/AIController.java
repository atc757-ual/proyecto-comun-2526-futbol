package com.futbol.gateway.controllers;

import com.futbol.gateway.dto.ApiResult;
import com.futbol.gateway.models.PlayerAnalysisResponse;
import com.futbol.gateway.services.PlayerAIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// @RestController
// @RequestMapping("/api/ai")
@Tag(name = "AI Analysis", description = "Servicios de Inteligencia Artificial para Fútbol (Mock de pruebas)")
public class AIController {

    @Autowired
    private PlayerAIService aiService;

    @PostMapping("/analyze")
    @Operation(summary = "Realiza un análisis táctico del equipo usando Gemini AI")
    public ResponseEntity<ApiResult<PlayerAnalysisResponse>> analyzeTeam() {
        try {
            // 1. Datos simulados (pendiente inyectar repo real)
            String mockPlayersData = "- Lionel Messi: Delantero, Habilidad 99\n" +
                                     "- Sergio Busquets: Medio, Habilidad 85\n" +
                                     "- Jordi Alba: Defensa, Habilidad 82";

            // 2. Pre-formatear prompt plano
            String prompt = "Analiza el siguiente equipo de futbolistas y devuelve un análisis táctico detallado, " +
                            "la formación ideal, el jugador más destacado y recomendaciones para mejorar.\n\n" +
                            "Jugadores:\n" + mockPlayersData;

            // 3. Llamar a la IA
            PlayerAnalysisResponse analysis = aiService.analyze(prompt);

            // 4. Responder con ApiResult
            return ResponseEntity.ok(new ApiResult<>("200", "Análisis táctico completado", analysis));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResult<>("500", "Error en el análisis de IA: " + e.getMessage(), null));
        }
    }
}
