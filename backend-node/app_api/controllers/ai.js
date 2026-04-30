const aiService = require('../services/ai.service');
const mongoose = require('mongoose');
const Player = mongoose.model('Player');

/**
 * POST /api/ai/analyze
 * Analiza los jugadores del usuario autenticado usando IA.
 */
const analyzeMyTeam = async (req, res) => {
    try {
        // 1. Obtener el firebaseUid del token decodificado (inyectado por el middleware de auth)
        const firebaseUid = req.auth.uid;

        // 2. Buscar los jugadores en MongoDB que pertenezcan a este usuario
        // Nota: Asegúrate de que el modelo Player tenga el campo 'firebaseUid' 
        // o similar para filtrar por dueño.
        const players = await Player.find({ createdBy: firebaseUid });

        if (!players || players.length === 0) {
            return res.status(404).json({
                result: { status: "NOK", description: "No tienes jugadores registrados para analizar." }
            });
        }

        // 3. Llamar al servicio de IA
        const analysis = await aiService.analyzePlayers(players);

        // 4. Responder con el formato estándar
        res.status(200).json({
            result: { status: "OK" },
            data: analysis
        });

    } catch (err) {
        console.error("Error en analyzeMyTeam:", err);
        res.status(500).json({
            result: { status: "NOK", description: err.message }
        });
    }
};

module.exports = {
    analyzeMyTeam
};
