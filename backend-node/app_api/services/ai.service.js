const { z } = require('zod');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const Opossum = require('opossum');

class AIService {
    constructor() {
        this.isTest = process.env.NODE_ENV === 'test';

        // Solo instanciamos el modelo real si NO estamos en entorno de pruebas
        if (!this.isTest) {
            const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
            const modelName = "gemini-flash-latest"; // Nombre oficial verificado
            const version = "v1beta"; 

            this.model = new ChatGoogleGenerativeAI({
                model: modelName,
                apiVersion: version,
                apiKey: process.env.GOOGLE_API_KEY,
                temperature: 0.2,
                maxOutputTokens: 4096,
            });
        }

        // Definimos el esquema de respuesta estructurada con Zod para el análisis táctico
        this.parser = StructuredOutputParser.fromZodSchema(
            z.object({
                analysis: z.string().describe("Un análisis táctico general del plantel. Si faltan jugadores para llegar a 11, menciónalo cordialmente."),
                formation: z.string().describe("La formación táctica sugerida (ej: 4-3-3, 4-4-2) o 'Incompleta' si hay muy pocos jugadores"),
                idealEleven: z.array(z.object({
                    name: z.string(),
                    position: z.string().describe("Posición específica simplificada (PO, DF, MC, DL)"),
                    role: z.string().describe("Rol táctico detallado (ej: Portero, Central Izquierdo, Extremo Derecho)")
                })).describe("Los jugadores elegidos para el equipo titular (máximo 11)"),
                starPlayer: z.string().describe("El jugador estrella del equipo"),
                justification: z.string().describe("Justificación técnica de la elección de los jugadores"),
                tacticalRecommendations: z.array(z.string()).describe("Recomendaciones para mejorar la alineación o completar el equipo")
            })
        );

        // Si no es un entorno de pruebas, configuramos la cadena y el disyuntor
        if (!this.isTest) {
            this.chain = RunnableSequence.from([
                PromptTemplate.fromTemplate(
                    "Eres un Director Técnico de Élite y experto analista de Big Data futbolístico.\n" +
                    "Tu tarea es armar el MEJOR EQUIPO POSIBLE (máximo 11 titulares) basado ÚNICAMENTE en los datos de los jugadores proporcionados.\n\n" +
                    "REGLA DE ORO: Si el usuario tiene menos de 11 jugadores, NO inventes jugadores. Usa los que hay y explica en el análisis que el equipo está incompleto pero que esta es la mejor disposición para ellos.\n" +
                    "Si tiene más de 11, selecciona a los mejores 11 para la formación ideal.\n\n" +
                    "INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con el objeto JSON solicitado.\n" +
                    "Estructura esperada:\n" +
                    "{{\n" +
                    "  \"analysis\": \"Un análisis profundo. Si hay menos de 11 jugadores, indica cuántos faltan para un equipo completo.\",\n" +
                    "  \"formation\": \"La formación táctica (ej: 4-3-3) o 'Incompleta'\",\n" +
                    "  \"idealEleven\": [\n" +
                    "    {{ \"name\": \"Nombre\", \"position\": \"PO|DF|MC|DL\", \"role\": \"Rol específico\" }}\n" +
                    "  ],\n" +
                    "  \"starPlayer\": \"Jugador estrella\",\n" +
                    "  \"justification\": \"Por qué elegiste esta táctica con los jugadores disponibles.\",\n" +
                    "  \"tacticalRecommendations\": [\"Consejos para mejorar el plantel o completar posiciones faltantes\"]\n" +
                    "}}\n\n" +
                    "DATOS DEL PLANTEL DEL USUARIO:\n{players_data}"
                ),
                this.model
            ]);

            // Defino la llamada encapsulada hacia la API de IA
            const invokeChain = async (input) => {
                return await this.chain.invoke(input);
            };

            // Configuro las opciones de mi disyuntor de IA
            const aiBreakerOptions = {
                timeout: 10000,               // Otorgo 10 segundos antes de considerar time-out (los modelos LLM son pesados)
                errorThresholdPercentage: 50,  // Si el 50% de las peticiones fallan, abro el circuito
                resetTimeout: 15000           // Tras 15 segundos en abierto, paso a semiabierto para probar disponibilidad
            };

            // Inicializo el Circuit Breaker para las peticiones de IA
            this.aiBreaker = new Opossum(invokeChain, aiBreakerOptions);

            // Establezco el fallback si el servicio de IA falla o está en circuito abierto
            this.aiBreaker.fallback((input, error) => {
                throw error;
            });

            // Registro los estados de control del disyuntor de IA para visualizarlos en mi terminal
            this.aiBreaker.on('open', () => {
                console.warn('\n[CIRCUIT-BREAKER-AI] !!! ADVERTENCIA: El circuito de IA se ha ABIERTO. Evitando peticiones a Gemini para ahorrar cuotas.');
            });

            this.aiBreaker.on('halfOpen', () => {
                console.info('\n[CIRCUIT-BREAKER-AI] El circuito de IA está SEMIABIERTO. Probando conexión con la API externa...');
            });

            this.aiBreaker.on('close', () => {
                console.info('\n[CIRCUIT-BREAKER-AI] ¡ÉXITO! El circuito de IA se ha CERRADO. API de Gemini restablecida correctamente.');
            });
        }
    }

    async analyzePlayers(players) {
        // Retorno un MOCK estático de inmediato si estoy en entorno de pruebas
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

            // Ejecuto la llamada de IA a través del Circuit Breaker protegido
            const response = await this.aiBreaker.fire({
                players_data: playersData
            });

            // Obtengo el texto de la respuesta
            let text = typeof response === 'string' ? response : response.content;

            // Limpieza del formato devuelto
            let cleanText = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();

            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanText = jsonMatch[0];
            }

            try {
                return JSON.parse(cleanText);
            } catch (parseError) {
                throw new Error("El formato de respuesta de la IA no es un JSON válido");
            }

        } catch (error) {
            throw new Error("Fallo en la comunicación con la IA: " + error.message);
        }
    }
}

module.exports = new AIService();