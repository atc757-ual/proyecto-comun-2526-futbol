const aiService = require('../services/ai.service');
const mongoose = require('mongoose');
const Player = mongoose.model('Player');

/**
 * POST /api/ai/analyze
 * Analiza los jugadores del usuario autenticado usando IA.
 */
const analyzeMyTeam = async (req, res) => {
    try {
        const firebaseUid = req.user.firebaseUid;

        // 1. Limitamos a los 30 jugadores más recientes para optimizar el prompt y evitar costes/errores
        const players = await Player.find({ user_id: firebaseUid })
                                    .sort({ updated_at: -1 })
                                    .limit(30);

        if (!players || players.length === 0) {
            return res.status(404).json({
                result: { status: "NOK", description: "No tienes jugadores registrados para analizar." }
            });
        }

        console.log(`[AI-CONTROLLER] Analizando ${players.length} jugadores para UID: ${firebaseUid}`);

        // 2. Llamar al servicio de IA
        const analysis = await aiService.analyzePlayers(players);

        return res.status(200).json({
            result: {
                transactionId: require('crypto').randomUUID(),
                code: "200",
                description: "OK",
                descriptionDetail: "Análisis de IA generado exitosamente",
                responseTimestamp: new Date().toISOString()
            },
            data: analysis
        });

    } catch (err) {
        const errorMessage = err.message || "";
        console.error("Error en analyzeMyTeam:", errorMessage);

        // Si es un error de cuota (Rate Limit), devolvemos 429 en lugar de 500
        if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
            return res.status(429).json({
                result: { 
                    status: "NOK", 
                    description: "¡FootballAI está recargando pilas! 🔋 Mañana tendremos más consejos para ti." 
                }
            });
        }

        res.status(500).json({
            result: { 
                status: "NOK", 
                description: "Lo sentimos, el entrenador IA no está disponible en este momento. Revisa tu conexión o inténtalo más tarde." 
            }
        });
    }
};

module.exports = {
    analyzeMyTeam
};
