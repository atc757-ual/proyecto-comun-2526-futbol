const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const { sendApiResult } = require('./apiResult');

// POST /api/public/players/:playerid/comments
const publicCommentsCreate = async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerid).exec();
        if (!player) {
            return sendApiResult(res, 404, "Jugador no encontrado");
        }

        // Estructura simplificada para la comunidad pública
        const newComment = {
            content: req.body.content,
            rating: req.body.rating || 5,
            autor_name: req.body.autor_name || 'Invitado',
            user_id: req.body.user_id || null,
            status: true,
            created_at: new Date()
        };

        player.comments.push(newComment);
        const savedPlayer = await player.save();
        const lastComment = savedPlayer.comments[savedPlayer.comments.length - 1];

        return sendApiResult(res, 201, "Opinión publicada con éxito", lastComment);

    } catch (err) {
        return sendApiResult(res, 400, "Error al publicar en la comunidad: " + err.message);
    }
};

module.exports = {
    publicCommentsCreate
};
