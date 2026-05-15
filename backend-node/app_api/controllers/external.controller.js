const tsdbService = require('../services/thesportsdb.service');
const { sendApiResult } = require('./apiResult');

/**
 * Controlador para gestionar peticiones a APIs externas (TheSportsDB)
 */

const searchTSDBPlayers = async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return sendApiResult(res, 400, "El nombre es obligatorio");
        
        const players = await tsdbService.searchPlayers(name);
        return sendApiResult(res, 200, "Búsqueda TSDB realizada", players);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const getTSDBPlayerDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const details = await tsdbService.getPlayerDetails(id);
        return sendApiResult(res, 200, "Detalles TSDB recuperados", details);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const getTSDBTeamDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const details = await tsdbService.getTeamDetails(id);
        return sendApiResult(res, 200, "Equipo TSDB recuperado", details);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const getTSDBLeagueDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const details = await tsdbService.getLeagueDetails(id);
        return sendApiResult(res, 200, "Liga TSDB recuperada", details);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const searchTSDBTeams = async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return sendApiResult(res, 400, "El nombre del equipo es obligatorio");
        const teams = await tsdbService.searchTeams(name);
        return sendApiResult(res, 200, "Búsqueda de equipos realizada", teams);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const getTSDBPlayersByTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const players = await tsdbService.getPlayersByTeam(id);
        return sendApiResult(res, 200, "Plantilla recuperada", players);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const searchTSDBPlayersByTeam = async (req, res) => {
    try {
        const { team } = req.query;
        if (!team) return sendApiResult(res, 400, "El nombre del equipo es obligatorio");
        const players = await tsdbService.searchPlayersByTeam(team);
        return sendApiResult(res, 200, "Búsqueda por equipo realizada", players);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const getTSDBLeagues = async (req, res) => {
    try {
        const leagues = await tsdbService.getLeagues();
        return sendApiResult(res, 200, "Ligas TSDB recuperadas", leagues);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const searchTSDBLeagues = async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return sendApiResult(res, 400, "El nombre de la liga es obligatorio");
        const leagues = await tsdbService.searchLeagues(name);
        return sendApiResult(res, 200, "Búsqueda de ligas realizada", leagues);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};


const getTSDBLiveScores = async (req, res) => {
    try {
        console.log('[BACKEND-DEBUG] Petición Livescore recibida');
        const results = await tsdbService.getLiveScores('soccer');
        console.log(`[BACKEND-DEBUG] Livescore Results: ${results?.length || 0} encontrados`);
        return sendApiResult(res, 200, "Live scores recuperados", results);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const getTSDBTeamsByLeague = async (req, res) => {
    try {
        const { id } = req.params;
        const teams = await tsdbService.getTeamsByLeague(id);
        return sendApiResult(res, 200, "Equipos de la liga recuperados", teams);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const getTSDBPlayerTeams = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await tsdbService.getPlayerTeamsHistory(id);
        return sendApiResult(res, 200, "Trayectoria del jugador recuperada", history);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const getTSDBPlayerHonours = async (req, res) => {
    try {
        const { id } = req.params;
        const honours = await tsdbService.getPlayerHonours(id);
        return sendApiResult(res, 200, "Palmarés del jugador recuperado", honours);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const getTSDBPlayerMilestones = async (req, res) => {
    try {
        const { id } = req.params;
        const milestones = await tsdbService.getPlayerMilestones(id);
        return sendApiResult(res, 200, "Hitos del jugador recuperados", milestones);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

const getTSDBTVByCountry = async (req, res) => {
    try {
        const { country } = req.params;
        console.log(`[BACKEND-DEBUG] Petición TV por País: ${country}`);
        const results = await tsdbService.getTVByCountry(country || 'Spain');
        return sendApiResult(res, 200, "Eventos de TV por país recuperados", results);
    } catch (error) {
        return sendApiResult(res, 500, "Error TSDB: " + error.message);
    }
};

module.exports = {
    searchTSDBPlayers,
    getTSDBPlayerDetails,
    getTSDBTeamDetails,
    getTSDBLeagueDetails,
    searchTSDBTeams,
    getTSDBPlayersByTeam,
    searchTSDBPlayersByTeam,
    getTSDBLeagues,
    searchTSDBLeagues,
    getTSDBLiveScores,
    getTSDBTeamsByLeague,
    getTSDBPlayerTeams,
    getTSDBPlayerHonours,
    getTSDBPlayerMilestones,
    getTSDBTVByCountry
};
