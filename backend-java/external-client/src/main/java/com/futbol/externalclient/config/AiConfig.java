package com.futbol.externalclient.config;

import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    private static final Logger logger = LoggerFactory.getLogger(AiConfig.class);

    @Value("${google.api.key}")
    private String apiKey;

    @Value("${google.api.model:gemini-3.5-flash}")
    private String modelName;

    @Bean
    public GoogleAiGeminiChatModel geminiModel() {
        logger.info("Configurando Gemini (external-client) - Modelo: {}, API Key: {}",
                modelName, apiKey != null && !apiKey.isEmpty() ? apiKey.substring(0, 4) + "..." : "MISSING");
        return GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName(modelName)
                .maxRetries(3)
                .build();
    }
}
