const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const { sendApiResult } = require('./apiResult');

// POST /api/players/:playerid/comments
const commentsCreate = async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerid).exec();
        if (!player) {
            return sendApiResult(res, 404, "Jugador no encontrado");
        }
        
        player.comments.push(req.body);
        const savedPlayer = await player.save();
        const lastComment = savedPlayer.comments[savedPlayer.comments.length - 1];
        
        sendApiResult(res, 201, "Procesamiento concluído exitosamente", lastComment);
        
    } catch (err) {
        sendApiResult(res, 400, "Error al añadir comentario: " + err.message);
    }
};

// GET /api/players/:playerid/comments/:commentid
const commentsReadOne = async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerid).select('name comments').exec();
        if (!player) {
            return sendApiResult(res, 404, "Jugador no encontrado");
        }
        
        const comment = player.comments.id(req.params.commentid);
        if (!comment) {
            return sendApiResult(res, 404, "Comentario no encontrado");
        }
        
        sendApiResult(res, 200, "Procesamiento concluído exitosamente", comment);
    } catch (err) {
        sendApiResult(res, 500, "Error al leer comentario: " + err.message);
    }
};

// DELETE /api/players/:playerid/comments/:commentid
const commentsDeleteOne = async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerid).exec();
        if (!player) {
            return sendApiResult(res, 404, "Jugador no encontrado");
        }
        
        const comment = player.comments.id(req.params.commentid);
        if (!comment) {
            return sendApiResult(res, 404, "Comentario no encontrado para borrar");
        }
        
        player.comments.pull(req.params.commentid);
        await player.save();
        
        sendApiResult(res, 204, "Eliminado con éxito");
    } catch (err) {
        sendApiResult(res, 500, "Error al borrar comentario: " + err.message);
    }
};

// PUT /api/players/:playerid/comments/:commentid - Actualizar un comentario
const commentsUpdateOne = async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerid).exec();
        if (!player) {
            return sendApiResult(res, 404, "Jugador no encontrado");
        }
        
        const comment = player.comments.id(req.params.commentid);
        if (!comment) {
            return sendApiResult(res, 404, "Comentario no encontrado para actualizar");
        }
        
        // Actualizar campos del subdocumento
        if (req.body.content) comment.content = req.body.content;
        if (req.body.rating) comment.rating = req.body.rating;
        if (req.body.user_name) comment.user_name = req.body.user_name;
        
        await player.save();
        sendApiResult(res, 200, "Comentario actualizado con éxito", comment);
    } catch (err) {
        sendApiResult(res, 400, "Error al actualizar comentario: " + err.message);
    }
};

module.exports = {
    commentsCreate,
    commentsReadOne,
    commentsUpdateOne,
    commentsDeleteOne
};
