package com.futbol.gateway.services;

import com.futbol.gateway.models.PlayerAnalysisResponse;
import dev.langchain4j.service.SystemMessage;

public interface PlayerAIService {

    @SystemMessage("Eres un experto analista técnico de fútbol profesional. Analiza la plantilla de jugadores de fútbol que se te proporciona y genera un análisis táctico detallado, recomendando la formación ideal, seleccionando el jugador más destacado e indicando recomendaciones para mejorar.")
    PlayerAnalysisResponse analyze(String prompt);
}
