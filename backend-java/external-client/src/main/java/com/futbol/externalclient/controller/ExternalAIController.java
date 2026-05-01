package com.futbol.externalclient.controller;

import com.futbol.common.dto.ApiResult;
import com.futbol.player.feign.client.PlayerClient;
import com.futbol.player.feign.model.PlayerDTO;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@Tag(name = "External AI Orchestrator", description = "Orquesta datos locales con Gemini AI")
public class ExternalAIController {

    private final PlayerClient playerClient;
    private final GoogleAiGeminiChatModel geminiModel;

    public ExternalAIController(PlayerClient playerClient, GoogleAiGeminiChatModel geminiModel) {
        this.playerClient = playerClient;
        this.geminiModel = geminiModel;
    }

    @PostMapping("/analyze")
    @Operation(summary = "Analiza los jugadores guardados en la BD local usando IA")
    public ApiResult<com.futbol.externalclient.dto.PlayerAnalysisResponse> analyzeLocalTeam() {
        try {
            // 1. Obtener jugadores de la BD local usando el cliente Feign de Player
            com.futbol.player.feign.dto.ApiResult<List<PlayerDTO>> result = playerClient.getAllPlayers(null, null, null);
            
            if (result.getData() == null || result.getData().isEmpty()) {
                return ApiResult.error("404", "No hay jugadores en la base de datos local para analizar");
            }

            // 2. Construir Prompt profesional
            StringBuilder prompt = new StringBuilder("Actúa como un experto analista técnico de fútbol.\n");
            prompt.append("INSTRUCCIÓN: Devuelve ÚNICAMENTE un JSON válido con la siguiente estructura:\n");
            prompt.append("{\n");
            prompt.append("  \"analysis\": \"análisis general\",\n");
            prompt.append("  \"idealEleven\": [\"jugador1\", \"jugador2\", ...],\n");
            prompt.append("  \"starPlayer\": \"nombre\",\n");
            prompt.append("  \"justification\": \"por qué este 11\",\n");
            prompt.append("  \"tacticalRecommendations\": [\"rec1\", \"rec2\", ...]\n");
            prompt.append("}\n");
            prompt.append("NO incluyas explicaciones fuera del JSON. No incluyas bloques de pensamiento.\n");
            prompt.append("Listado de futbolistas:\n");
            result.getData().forEach(p -> {
                prompt.append("- ").append(p.getName()).append(" (Equipo: ").append(p.getTeam()).append(")\n");
            });

            // 3. Llamar a Gemini (Modelo 3 Flash Preview)
            String jsonResponse = geminiModel.generate(prompt.toString());

            // 4. Limpiar respuesta (quitar backticks e inyecciones de texto)
            String cleanJson = jsonResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.futbol.externalclient.dto.PlayerAnalysisResponse analysis = mapper.readValue(cleanJson, com.futbol.externalclient.dto.PlayerAnalysisResponse.class);

            // Uso de la librería común para el éxito
            return ApiResult.success("Análisis de equipo local completado", analysis);

        } catch (Exception e) {
            return ApiResult.error("500", "Error orquestando IA local: " + e.getMessage());
        }
    }
}
