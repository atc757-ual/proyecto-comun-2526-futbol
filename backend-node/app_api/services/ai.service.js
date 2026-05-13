const { z } = require('zod');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');

class AIService {
    constructor() {
        this.isTest = process.env.NODE_ENV === 'test';

        // Solo instanciamos el modelo real si NO estamos en tests
        if (!this.isTest) {
            const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
            const modelName = "gemini-flash-latest"; // Nombre oficial verificado
            const version = "v1beta"; 

            console.log(`[AI-DEBUG] CONFIGURANDO MODELO: ${modelName} en versión ${version}`);

            this.model = new ChatGoogleGenerativeAI({
                model: modelName,
                apiVersion: version,
                apiKey: process.env.GOOGLE_API_KEY,
                temperature: 0.2,
                maxOutputTokens: 4096,
            });

            // Log de confirmación de instanciación
            console.log(`[AI-DEBUG] Modelo instanciado correctamente.`);
        }

        // Definimos el esquema de respuesta estructurada con Zod
        this.parser = StructuredOutputParser.fromZodSchema(
            z.object({
                analysis: z.string().describe("Un análisis táctico general del plantel"),
                formation: z.string().describe("La formación táctica sugerida (ej: 4-3-3, 4-4-2)"),
                idealEleven: z.array(z.object({
                    name: z.string(),
                    position: z.string().describe("Posición específica simplificada (PO, DF, MC, DL)"),
                    role: z.string().describe("Rol táctico detallado (ej: Portero, Central Izquierdo, Extremo Derecho)")
                })).describe("Los 11 jugadores elegidos para el equipo titular con sus posiciones"),
                starPlayer: z.string().describe("El jugador estrella del equipo"),
                justification: z.string().describe("Justificación técnica de la elección del 11 ideal"),
                tacticalRecommendations: z.array(z.string()).describe("Recomendaciones para mejorar la alineación y el rendimiento")
            })
        );

        // Si no es test, creamos la cadena real
        if (!this.isTest) {
            this.chain = RunnableSequence.from([
                PromptTemplate.fromTemplate(
                    "Eres un Director Técnico de Élite y experto analista de Big Data futbolístico.\n" +
                    "Tu tarea es armar el EQUIPO IDEAL (11 titulares) basado en los datos REALES de rendimiento proporcionados.\n\n" +
                    "INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con el objeto JSON solicitado.\n" +
                    "Estructura esperada:\n" +
                    "{{\n" +
                    "  \"analysis\": \"Un análisis profundo basado en las estadísticas.\",\n" +
                    "  \"formation\": \"La formación táctica (ej: 4-3-3)\",\n" +
                    "  \"idealEleven\": [\n" +
                    "    {{ \"name\": \"Nombre\", \"position\": \"PO|DF|MC|DL\", \"role\": \"Rol específico\" }}\n" +
                    "  ],\n" +
                    "  \"starPlayer\": \"Jugador estrella\",\n" +
                    "  \"justification\": \"Por qué elegiste esta táctica.\",\n" +
                    "  \"tacticalRecommendations\": [\"Consejos\"]\n" +
                    "}}\n\n" +
                    "DATOS DEL PLANTEL:\n{players_data}"
                ),
                this.model
            ]);
        }
    }

    async analyzePlayers(players) {
        // MOCK para entorno de TEST
        if (this.isTest) {
            return {
                analysis: "Análisis de prueba",
                idealEleven: [{ name: "Jugador 1", position: "DL", role: "Delantero" }],
                starPlayer: "Jugador Estrella",
                justification: "Justificación de prueba",
                tacticalRecommendations: ["Rec 1", "Rec 2"]
            };
        }

        try {
            const playersData = players.map(p =>
                `- ${p.name}: Posición ${p.position || 'N/A'}, Equipo: ${p.team || 'N/A'}, Liga: ${p.league || 'N/A'}, Edad: ${p.age || 'N/A'}, Nac: ${p.nationality || 'N/A'}${p.isFavorite ? ' [FAVORITO]' : ''}`
            ).join('\n');

            console.log("[AI-DEBUG] Solicitando análisis para:", players.length, "jugadores");

            const response = await this.chain.invoke({
                players_data: playersData
            });

            // 1. Obtener el texto de la respuesta
            let text = typeof response === 'string' ? response : response.content;
            console.log("[AI-DEBUG] Respuesta raw de la IA:", text);

            // 2. Limpieza agresiva
            // Quitamos backticks y posibles prefijos/sufijos
            let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

            // Extraemos solo lo que esté entre llaves {}
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanText = jsonMatch[0];
            }

            // 3. Parseo manual
            try {
                return JSON.parse(cleanText);
            } catch (parseError) {
                console.error("[AI-DEBUG] Error al parsear JSON limpio:", parseError);
                throw new Error("El formato de respuesta de la IA no es un JSON válido");
            }

        } catch (error) {
            console.error("[AI-DEBUG] Error crítico en servicio de IA:", error);
            throw new Error("Fallo en la comunicación con la IA: " + error.message);
        }
    }
}

module.exports = new AIService();