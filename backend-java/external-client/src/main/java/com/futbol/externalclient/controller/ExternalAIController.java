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
            // 1. Obtener jugadores de la BD local
            com.futbol.player.feign.dto.ApiResult<List<PlayerDTO>> result = playerClient.getAllPlayers(null, null, null);
            
            if (result.getData() == null || result.getData().isEmpty()) {
                return ApiResult.error("404", "No hay jugadores en la base de datos local para analizar");
            }

            // 2. Construir Prompt profesional (Homologado con Node)
            StringBuilder prompt = new StringBuilder("Eres un Director Técnico de Élite y experto analista de Big Data futbolístico.\n");
            prompt.append("Tu tarea es armar el MEJOR EQUIPO POSIBLE (máximo 11 titulares) basado ÚNICAMENTE en los datos de los jugadores proporcionados.\n\n");
            prompt.append("REGLA DE ORO: Si el usuario tiene menos de 11 jugadores, NO inventes jugadores. Usa los que hay y explica en el análisis que el equipo está incompleto pero que esta es la mejor disposición para ellos.\n");
            prompt.append("Si tiene más de 11, selecciona a los mejores 11 para la formación ideal.\n\n");
            prompt.append("INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con el objeto JSON solicitado.\n");
            prompt.append("Estructura esperada:\n");
            prompt.append("{\n");
            prompt.append("  \"analysis\": \"análisis general\",\n");
            prompt.append("  \"formation\": \"4-3-3, 4-4-2 o Incompleta\",\n");
            prompt.append("  \"idealEleven\": [ {\"name\": \"nombre\", \"position\": \"PO|DF|MC|DL\", \"role\": \"rol\"} ],\n");
            prompt.append("  \"starPlayer\": \"nombre\",\n");
            prompt.append("  \"justification\": \"justificación técnica\",\n");
            prompt.append("  \"tacticalRecommendations\": [\"rec1\", \"rec2\"]\n");
            prompt.append("}\n");
            prompt.append("NO incluyas bloques de código ni explicaciones fuera del JSON.\n\n");
            
            prompt.append("DATOS DEL PLANTEL DEL USUARIO:\n");
            result.getData().forEach(p -> {
                prompt.append("- ").append(p.getName())
                      .append(": Posición ").append(p.getPosition() != null ? p.getPosition() : "N/A")
                      .append(", Equipo: ").append(p.getTeam() != null ? p.getTeam() : "N/A")
                      .append(", Nac: ").append(p.getNationality() != null ? p.getNationality() : "N/A")
                      .append(Boolean.TRUE.equals(p.getIsFavorite()) ? " [FAVORITO]" : "")
                      .append("\n");
            });

            // 3. Llamar a Gemini
            String jsonResponse = geminiModel.generate(prompt.toString());

            // 4. Limpieza de respuesta (JSON puro)
            String cleanJson = jsonResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            if (cleanJson.contains("{")) {
                cleanJson = cleanJson.substring(cleanJson.indexOf("{"), cleanJson.lastIndexOf("}") + 1);
            }
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            com.futbol.externalclient.dto.PlayerAnalysisResponse analysis = mapper.readValue(cleanJson, com.futbol.externalclient.dto.PlayerAnalysisResponse.class);

            return ApiResult.success("Análisis de equipo local (Java) completado", analysis);

        } catch (Exception e) {
            return ApiResult.error("500", "Error orquestando IA local (Java): " + e.getMessage());
        }
    }
}
