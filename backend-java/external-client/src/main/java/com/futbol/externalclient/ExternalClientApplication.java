package com.futbol.externalclient;

import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients(basePackages = {"com.futbol.externalfeign.client", "com.futbol.player.feign.client"})
public class ExternalClientApplication {

    @Value("${google.api.key}")
    private String apiKey;

    public static void main(String[] args) {
        SpringApplication.run(ExternalClientApplication.class, args);
    }

    @Bean
    public GoogleAiGeminiChatModel geminiModel() {
        System.out.println("[AI-DEBUG-JAVA] Configurando Gemini - Modelo: gemini-3-flash-preview, API Key: " + (apiKey != null ? apiKey.substring(0, 4) + "..." : "MISSING"));
        return GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName("gemini-3-flash-preview")
                .build();
    }
}
