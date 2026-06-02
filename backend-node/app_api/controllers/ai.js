const aiService = require('../services/ai.service');
const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const { sendApiResult } = require('./apiResult');

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
            return sendApiResult(res, 404, "No tienes jugadores registrados para analizar.");
        }

        console.log(`[AI-CONTROLLER] Analizando ${players.length} jugadores para UID: ${firebaseUid}`);

        // 2. Llamar al servicio de IA
        const analysis = await aiService.analyzePlayers(players);

        return sendApiResult(res, 200, "Análisis de IA generado exitosamente", analysis);

    } catch (err) {
        const errorMessage = err.message || "";
        console.error("Error en analyzeMyTeam:", errorMessage);

        // Si es un error de cuota (Rate Limit), devolvemos 429 en lugar de 500
        if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
            return sendApiResult(res, 429, "¡FootballAI está recargando pilas! 🔋 Mañana tendremos más consejos para ti.");
        }

        return sendApiResult(res, 500, `Lo sentimos, el entrenador IA no está disponible en este momento. Revisa tu conexión o inténtalo más tarde. [${errorMessage}]`);
    }
};

module.exports = {
    analyzeMyTeam
};
