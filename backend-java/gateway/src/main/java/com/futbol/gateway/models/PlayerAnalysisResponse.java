package com.futbol.gateway.models;

import java.util.List;

public class PlayerAnalysisResponse {
    private String analysis;
    private String idealFormation;
    private String topPlayer;
    private List<String> recommendations;

    // Getters y Setters
    public String getAnalysis() { return analysis; }
    public void setAnalysis(String analysis) { this.analysis = analysis; }

    public String getIdealFormation() { return idealFormation; }
    public void setIdealFormation(String idealFormation) { this.idealFormation = idealFormation; }

    public String getTopPlayer() { return topPlayer; }
    public void setTopPlayer(String topPlayer) { this.topPlayer = topPlayer; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
}
