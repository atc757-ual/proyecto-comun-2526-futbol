const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const { sendApiResult } = require('./apiResult');

// GET /api/players/public
const playersPublicList = async (req, res) => {
    try {
        const players = await Player.find({}, 'name image_url nationality team league created_at position age')
            .limit(100)
            .exec();
        sendApiResult(res, 200, "Procesamiento concluído exitosamente", players);
    } catch (err) {
        sendApiResult(res, 500, "Error en vista pública: " + err.message);
    }
};

// GET /api/players
const playersList = async (req, res) => {
    try {
        // Log de depuración usando el sistema de tracing
        if (req.log) req.log('Iniciando recuperación de jugadores para el usuario');

        if (!req.user || !req.user.firebaseUid) {
            if (req.log) req.log('ERROR: req.user o firebaseUid no disponibles');
            return sendApiResult(res, 401, "No se pudo identificar al usuario activo");
        }

        const userIdFromToken = req.user.firebaseUid;
        const { name, team } = req.query;

        // Filtro obligatorio: solo vemos lo NUESTRO
        let query = { user_id: userIdFromToken };

        const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
        if (name) {
            query.name = { $regex: escapeRegex(name), $options: 'i' };
        } else if (team) {
            query.team = { $regex: escapeRegex(team), $options: 'i' };
        }

        const players = await Player.find(query).exec();

        if (req.log) req.log(`Jugadores encontrados: ${players.length}`);
        sendApiResult(res, 200, "Procesamiento concluído exitosamente", players);
    } catch (err) {
        if (req.log) req.log('Error crítico en playersList:', err.message);
        sendApiResult(res, 500, "Error al listar jugadores: " + err.message);
    }
};

// POST /api/players
const playersCreate = async (req, res) => {
    try {
        // Inyectamos el ID de usuario desde el objeto req.user inyectado por el middleware
        const allowed = ['name','fullname','team','secondary_team','league','age','birth_date',
            'birth_place','birth_country','nationality','height','weight','number','position',
            'side','image_url','external_id','location','summary','social_media','images',
            'tsdb_ids','is_manual','isFavorite','isFeatured'];
        const playerData = { user_id: req.user.firebaseUid };
        for (const field of allowed) {
            if (req.body[field] !== undefined) playerData[field] = req.body[field];
        }
        const newPlayer = await Player.create(playerData);
        sendApiResult(res, 201, "Procesamiento concluído exitosamente", newPlayer);
    } catch (err) {
        sendApiResult(res, 400, "Error al crear jugador: " + err.message);
    }
};


// GET /api/players/all - Traer todos los jugadores (Sin excluir propios)
const playersListAll = async (req, res) => {
    try {
        const limit = Math.min(Number.parseInt(req.query.limit) || 200, 500);
        const page = Math.max(Number.parseInt(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;
        const players = await Player.find({}).skip(skip).limit(limit).exec();
        sendApiResult(res, 200, "Procesamiento concluído exitosamente", players);
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

        // Actualizamos solo campos permitidos (evita mass assignment)
        const ALLOWED_FIELDS = [
            'name', 'fullname', 'team', 'secondary_team', 'league', 'age',
            'birth_date', 'birth_place', 'birth_country', 'nationality',
            'height', 'weight', 'number', 'position', 'side', 'image_url',
            'external_id', 'location', 'summary', 'social_media', 'images',
            'tsdb_ids', 'is_manual', 'isFavorite', 'isFeatured'
        ];
        const updates = {};
        for (const field of ALLOWED_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        Object.assign(player, updates);
        const updatedPlayer = await player.save();

        sendApiResult(res, 200, "Procesamiento concluído exitosamente", updatedPlayer);
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
