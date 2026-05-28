package com.futbol.gateway.config;

import com.futbol.gateway.services.PlayerAIService;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.service.AiServices;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AIConfig {

    private static final Logger logger = LoggerFactory.getLogger(AIConfig.class);

    @Value("${google.api.key}")
    private String apiKey;

    private String resolveApiKey(String fallbackKey) {
        if (fallbackKey != null && !fallbackKey.isEmpty() && !fallbackKey.contains("${") && !fallbackKey.equals("tu-clave-aqui")) {
            return fallbackKey;
        }
        // Buscar .env hacia arriba en el árbol de directorios
        try {
            java.io.File dir = new java.io.File(".").getAbsoluteFile();
            for (int i = 0; i < 5 && dir != null; i++) {
                java.io.File envFile = new java.io.File(dir, ".env");
                if (envFile.exists() && envFile.isFile()) {
                    try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(envFile))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            line = line.trim();
                            if (line.startsWith("GOOGLE_API_KEY=")) {
                                String value = line.substring("GOOGLE_API_KEY=".length()).trim();
                                if (value.startsWith("\"") && value.endsWith("\"")) {
                                    value = value.substring(1, value.length() - 1);
                                } else if (value.startsWith("'") && value.endsWith("'")) {
                                    value = value.substring(1, value.length() - 1);
                                }
                                if (!value.isEmpty()) {
                                    logger.debug("API Key de Gemini cargada desde .env: {}", envFile.getAbsolutePath());
                                    return value;
                                }
                            }
                        }
                    }
                }
                // Buscar también en subcarpeta backend-node por si acaso
                java.io.File nodeEnv = new java.io.File(dir, "backend-node/.env");
                if (nodeEnv.exists() && nodeEnv.isFile()) {
                    try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(nodeEnv))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            line = line.trim();
                            if (line.startsWith("GOOGLE_API_KEY=")) {
                                String value = line.substring("GOOGLE_API_KEY=".length()).trim();
                                if (value.startsWith("\"") && value.endsWith("\"")) {
                                    value = value.substring(1, value.length() - 1);
                                } else if (value.startsWith("'") && value.endsWith("'")) {
                                    value = value.substring(1, value.length() - 1);
                                }
                                if (!value.isEmpty()) {
                                    logger.debug("API Key de Gemini cargada desde backend-node/.env: {}", nodeEnv.getAbsolutePath());
                                    return value;
                                }
                            }
                        }
                    }
                }
                dir = dir.getParentFile();
            }
        } catch (Exception e) {
            logger.warn("Error buscando .env para cargar GOOGLE_API_KEY: {}", e.getMessage());
        }
        return fallbackKey;
    }

    @Bean
    public GoogleAiGeminiChatModel geminiModel() {
        String resolvedKey = resolveApiKey(apiKey);
        logger.info("Configurando Gemini (gateway) - Modelo: gemini-flash-latest, API Key: {}",
                resolvedKey != null && !resolvedKey.isEmpty() ? resolvedKey.substring(0, 4) + "..." : "MISSING");
        return GoogleAiGeminiChatModel.builder()
                .apiKey(resolvedKey)
                .modelName("gemini-3.5-flash")
                .build();
    }

    @Bean
    public PlayerAIService playerAIService(GoogleAiGeminiChatModel model) {
        return AiServices.builder(PlayerAIService.class)
                .chatLanguageModel(model)
                .build();
    }
}
