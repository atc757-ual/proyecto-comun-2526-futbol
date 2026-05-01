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
            console.log(`[AI-DEBUG] Configurando Gemini - Modelo: gemma-4-26b-a4b-it, API Key: ${process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.substring(0, 4) + '...' : 'MISSING'}`);
            this.model = new ChatGoogleGenerativeAI({
                model: "gemini-3-flash-preview",
                apiKey: process.env.GOOGLE_API_KEY,
                apiVersion: "v1beta",
                temperature: 0.1,
                maxOutputTokens: 1024,
            });
        }

        // Definimos el esquema de respuesta estructurada con Zod
        this.parser = StructuredOutputParser.fromZodSchema(
            z.object({
                analysis: z.string().describe("Un análisis táctico general del plantel"),
                idealEleven: z.array(z.string()).describe("Los 11 jugadores elegidos para el equipo titular"),
                starPlayer: z.string().describe("El jugador estrella del equipo"),
                justification: z.string().describe("Justificación técnica de la elección del 11 ideal"),
                tacticalRecommendations: z.array(z.string()).describe("Recomendaciones para mejorar la alineación y el rendimiento")
            })
        );

        // Si no es test, creamos la cadena real
        if (!this.isTest) {
            this.chain = RunnableSequence.from([
                PromptTemplate.fromTemplate(
                    "Eres un experto analista técnico de fútbol profesional.\n" +
                    "INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con el objeto JSON solicitado.\n" +
                    "NO incluyas pensamientos, NO incluyas bloques de código markdown, NO incluyas texto extra.\n" +
                    "Estructura esperada:\n" +
                    "{{\n" +
                    "  \"analysis\": \"...\",\n" +
                    "  \"idealEleven\": [\"...\"],\n" +
                    "  \"starPlayer\": \"...\",\n" +
                    "  \"justification\": \"...\",\n" +
                    "  \"tacticalRecommendations\": [\"...\"]\n" +
                    "}}\n" +
                    "Listado de futbolistas registrados:\n{players_data}"
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
                idealEleven: ["Jugador 1", "Jugador 2"],
                starPlayer: "Jugador Estrella",
                justification: "Justificación de prueba",
                tacticalRecommendations: ["Rec 1", "Rec 2"]
            };
        }

        try {
            const playersData = players.map(p =>
                `- ${p.name}: Posición ${p.position || 'N/A'}, Habilidad ${p.skill || 'N/A'}`
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