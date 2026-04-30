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
            this.model = new ChatGoogleGenerativeAI({
                modelName: "gemini-1.5-flash",
                apiKey: process.env.GOOGLE_API_KEY,
                maxOutputTokens: 2048,
            });
        }

        // Definimos el esquema de respuesta estructurada con Zod
        this.parser = StructuredOutputParser.fromZodSchema(
            z.object({
                analysis: z.string().describe("Un análisis detallado del equipo del usuario"),
                idealFormation: z.string().describe("La formación táctica sugerida (ej: 4-3-3, 4-4-2)"),
                topPlayer: z.string().describe("El nombre del jugador más destacado del listado"),
                recommendations: z.array(z.string()).describe("Lista de sugerencias para mejorar el equipo")
            })
        );

        // Si no es test, creamos la cadena real
        if (!this.isTest) {
            this.chain = RunnableSequence.from([
                PromptTemplate.fromTemplate(
                    "Eres un experto analista técnico de fútbol.\n" +
                    "Dado el siguiente listado de futbolistas registrados por un usuario, realiza un análisis táctico profesional.\n" +
                    "{format_instructions}\n" +
                    "Listado de futbolistas:\n{players_data}"
                ),
                this.model,
                this.parser
            ]);
        }
    }

    async analyzePlayers(players) {
        // MOCK para entorno de TEST
        if (this.isTest) {
            return {
                analysis: "ANÁLISIS DE PRUEBA: El equipo tiene buen equilibrio entre defensa y ataque.",
                idealFormation: "4-4-2",
                topPlayer: players.length > 0 ? players[0].name : "N/A",
                recommendations: ["Mejorar la profundidad del banquillo", "Practicar jugadas ensayadas"]
            };
        }

        try {
            const playersData = players.map(p => 
                `- ${p.name}: Posición ${p.position || 'N/A'}, Habilidad ${p.skill || 'N/A'}`
            ).join('\n');

            const response = await this.chain.invoke({
                players_data: playersData,
                format_instructions: this.parser.getFormatInstructions()
            });

            return response;
        } catch (error) {
            console.error("Error en AIService:", error);
            throw new Error("No se pudo completar el análisis de IA: " + error.message);
        }
    }
}

module.exports = new AIService();
