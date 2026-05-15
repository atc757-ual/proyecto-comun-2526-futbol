const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const { sendApiResult } = require('./apiResult');

// GET /api/players/public
const playersPublicList = async (req, res) => {
    try {
        // Devolvemos los campos necesarios para la vista pública premium
        const players = await Player.find({}, 'name image_url nationality team league created_at position age').exec();
        sendApiResult(res, 200, "Lista pública de jugadores recuperada", players);
    } catch (err) {
        sendApiResult(res, 500, "Error en vista pública: " + err.message);
    }
};

// GET /api/players
const playersList = async (req, res) => {
    try {
        const userIdFromToken = req.user.firebaseUid; // ID de la sesión autenticada correctamente
        const { name, team } = req.query;
        
        // Filtro obligatorio: solo vemos lo NUESTRO
        let query = { user_id: userIdFromToken };

        if (name) {
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
        // Inyectamos el ID de usuario desde el objeto req.user inyectado por el middleware
        const playerData = { 
            ...req.body, 
            user_id: req.user.firebaseUid 
        };
        const newPlayer = await Player.create(playerData);
        sendApiResult(res, 201, "Procesamiento concluído exitosamente", newPlayer);
    } catch (err) {
        sendApiResult(res, 400, "Error al crear jugador: " + err.message);
    }
};


// GET /api/players/all - Traer todos los jugadores (Sin excluir propios)
const playersListAll = async (req, res) => {
    try {
        const players = await Player.find({}).exec();
        sendApiResult(res, 200, "Lista completa de jugadores", players);
    } catch (err) {
        sendApiResult(res, 500, "Error al recuperar todos los jugadores: " + err.message);
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
        const player = await Player.findById(req.params.playerid).exec();
        
        if (!player) {
            return sendApiResult(res, 404, "No se encontró el jugador para actualizar");
        }

        // SEGURIDAD: Solo Admin o Dueño pueden editar
        const isOwner = player.user_id === req.user.firebaseUid || player.user_id === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isAdmin && !isOwner) {
            return sendApiResult(res, 403, "Acceso denegado: No tienes permiso para editar este jugador");
        }

        // Actualizamos los campos
        Object.assign(player, req.body);
        const updatedPlayer = await player.save();
        
        sendApiResult(res, 200, "Jugador actualizado con éxito", updatedPlayer);
    } catch (err) {
        sendApiResult(res, 400, "Error al actualizar el jugador: " + err.message);
    }
};

const playersDeleteOne = async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerid).exec();
        
        if (!player) {
            return sendApiResult(res, 404, "No se encontró el jugador para borrar");
        }

        // SEGURIDAD: Puede borrar si es ADMIN o si es el DUEÑO
        const isOwner = player.user_id === req.user.firebaseUid || player.user_id === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isAdmin && !isOwner) {
            return sendApiResult(res, 403, "Acceso denegado: No tienes permisos para eliminar este jugador");
        }

        await player.deleteOne();
        sendApiResult(res, 204, "Eliminado con éxito");
    } catch (err) {
        sendApiResult(res, 500, "Error al borrar el jugador: " + err.message);
    }
};

module.exports = {
    playersList,
    playersListAll,
    playersPublicList,
    playersCreate,
    playersReadOne,
    playersUpdateOne,
    playersDeleteOne
};
