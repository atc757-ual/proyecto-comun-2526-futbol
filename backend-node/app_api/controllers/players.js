const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const { sendApiResult } = require('./apiResult');

// GET /api/players/public
const playersPublicList = async (req, res) => {
    try {
        // Usamos $sample para aleatoriedad y $project para limitar campos
        const players = await Player.aggregate([
            { $sample: { size: 10 } },
            { $project: { _id: 0, name: 1, photo: 1 } }
        ]);
        sendApiResult(res, 200, "Vista pública aleatoria recuperada", players);
    } catch (err) {
        sendApiResult(res, 500, "Error en vista pública: " + err.message);
    }
};

// GET /api/players
const playersList = async (req, res) => {
    try {
        const { userId, name, team } = req.query;
        let query = {};

        if (userId) {
            query.user_id = userId;
        } else if (name) {
            query.name = { $regex: name, $options: 'i' };
        } else if (team) {
            query.team = { $regex: team, $options: 'i' };
        }

        const players = await Player.find(query).exec();
        sendApiResult(res, 200, "Procesamiento concluído exitosamente", players);
    } catch (err) {
        sendApiResult(res, 500, "Error al listar jugadores: " + err.message);
    }
};

// POST /api/players
const playersCreate = async (req, res) => {
    try {
        const newPlayer = await Player.create(req.body);
        sendApiResult(res, 201, "Procesamiento concluído exitosamente", newPlayer);
    } catch (err) {
        sendApiResult(res, 400, "Error al crear jugador: " + err.message);
    }
};

// GET /api/players/:playerid
const playersReadOne = async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerid).exec();
        if (!player) {
            return sendApiResult(res, 404, "Jugador no encontrado");
        }
        sendApiResult(res, 200, "Procesamiento concluído exitosamente", player);
    } catch (err) {
        sendApiResult(res, 500, "Error al buscar el jugador: " + err.message);
    }
};

// PUT /api/players/:playerid
const playersUpdateOne = async (req, res) => {
    try {
        const player = await Player.findByIdAndUpdate(
            req.params.playerid,
            req.body,
            { returnDocument: 'after', runValidators: true }
        ).exec();
        
        if (!player) {
            return sendApiResult(res, 404, "No se encontró el jugador para actualizar");
        }
        sendApiResult(res, 200, "Procesamiento concluído exitosamente", player);
    } catch (err) {
        sendApiResult(res, 400, "Error al actualizar el jugador: " + err.message);
    }
};

// DELETE /api/players/:playerid
const playersDeleteOne = async (req, res) => {
    try {
        const player = await Player.findByIdAndDelete(req.params.playerid).exec();
        if (!player) {
            return sendApiResult(res, 404, "No se encontró el jugador para borrar");
        }
        sendApiResult(res, 204, "Eliminado con éxito");
    } catch (err) {
        sendApiResult(res, 500, "Error al borrar el jugador: " + err.message);
    }
};

module.exports = {
    playersList,
    playersPublicList,
    playersCreate,
    playersReadOne,
    playersUpdateOne,
    playersDeleteOne
};
