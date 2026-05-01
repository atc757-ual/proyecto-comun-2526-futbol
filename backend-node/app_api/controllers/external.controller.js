const footballService = require('../services/football.service');
const { sendApiResult } = require('./apiResult');

/**
 * Controlador para gestionar peticiones a APIs externas
 */

const searchExternalPlayers = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return sendApiResult(res, 400, "El nombre del jugador es obligatorio");
        }

        const players = await footballService.searchPlayers(name);

        // Devolvemos el resultado usando el estándar ApiResult
        return sendApiResult(res, 200, "Búsqueda externa realizada con éxito", players);

    } catch (error) {
        console.error('Error in externalController:', error.message);
        return sendApiResult(res, 500, "Error al buscar jugadores en el servicio externo: " + error.message);
    }
};

module.exports = {
    searchExternalPlayers
};
