package com.futbol.gateway.config;

import com.futbol.gateway.services.PlayerAIService;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AIConfig {

    @Value("${google.api.key}")
    private String apiKey;

    @Bean
    public GoogleAiGeminiChatModel geminiModel() {
        return GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName("gemini-1.5-flash")
                .build();
    }

    @Bean
    public PlayerAIService playerAIService(GoogleAiGeminiChatModel model) {
        return AiServices.builder(PlayerAIService.class)
                .chatLanguageModel(model)
                .build();
    }
}
