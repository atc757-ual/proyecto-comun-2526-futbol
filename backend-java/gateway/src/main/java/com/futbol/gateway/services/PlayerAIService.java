package com.futbol.gateway.services;

import com.futbol.gateway.models.PlayerAnalysisResponse;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

public interface PlayerAIService {

    @SystemMessage("Eres un experto analista técnico de fútbol profesional.")
    @UserMessage("Analiza el siguiente equipo de futbolistas y devuelve un análisis táctico detallado, " +
                 "la formación ideal, el jugador más destacado y recomendaciones para mejorar.\n\n" +
                 "Jugadores:\n{{playersData}}")
    PlayerAnalysisResponse analyze(String playersData);
}
