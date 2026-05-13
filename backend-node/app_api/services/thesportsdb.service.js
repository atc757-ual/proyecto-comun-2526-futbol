const axios = require('axios');

const getBaseUrl = () => {
    return (process.env.TSDB_BASE_URL || 'https://www.thesportsdb.com/api/v2/json').trim();
};

const getHeaders = () => {
    return {
        'X-API-KEY': (process.env.TSDB_API_KEY || '1').trim(),
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    };
};

const searchPlayers = async (name) => {
    try {
        const url = `${getBaseUrl()}/search/player/${encodeURIComponent(name)}`;
        console.log('--- TSDB V2 SEARCH PLAYER ---', url);

        const response = await axios.get(url, {
            headers: getHeaders()
        });

        let players = response.data.search;
        if (!players) return [];
        if (!Array.isArray(players)) players = [players];

        return players.map(p => ({
            idPlayer: p.idPlayer,
            idTeam: p.idTeam,
            strPlayer: p.strPlayer,
            strTeam: p.strTeam,
            strThumb: p.strThumb,
            strCutout: p.strCutout,
            strNationality: p.strNationality,
            strPosition: p.strPosition
        }));
    } catch (error) {
        console.error('Error in TSDB searchPlayers V2:', error.message);
        throw error;
    }
};

const getPlayerDetails = async (id) => {
    try {
        const url = `${getBaseUrl()}/lookup/player/${id}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });

        const players = response.data.lookup;
        if (!players) return null;
        const p = Array.isArray(players) ? players[0] : players;

        return {
            idPlayer: p.idPlayer,
            idTeam: p.idTeam,
            strPlayer: p.strPlayer,
            strNationality: p.strNationality,
            strTeam: p.strTeam,
            strPosition: p.strPosition,
            strHeight: p.strHeight,
            strWeight: p.strWeight,
            strNumber: p.strNumber,
            dateBorn: p.dateBorn,
            strBirthLocation: p.strBirthLocation,
            strThumb: p.strThumb,
            strDescriptionES: p.strDescriptionES || p.strDescriptionEN
        };
    } catch (error) {
        console.error('Error in TSDB getPlayerDetails V2:', error.message);
        throw error;
    }
};

const getTeamDetails = async (id) => {
    try {
        const url = `${getBaseUrl()}/lookup/team/${id}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });

        const teams = response.data.lookup;
        if (!teams) return null;
        const t = Array.isArray(teams) ? teams[0] : teams;

        return {
            idTeam: t.idTeam,
            strTeam: t.strTeam,
            strTeamBadge: t.strBadge || t.strTeamBadge, // V2 usa strBadge
            strCountry: t.strCountry,
            intFormedYear: t.intFormedYear,
            strStadium: t.strStadium,
            strStadiumLocation: t.strStadiumLocation,
            strStadiumThumb: t.strStadiumThumb,
            idLeague: t.idLeague
        };
    } catch (error) {
        console.error('Error in TSDB getTeamDetails V2:', error.message);
        throw error;
    }
};

const getLeagueDetails = async (id) => {
    try {
        const url = `${getBaseUrl()}/lookup/league/${id}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });

        const leagues = response.data.lookup;
        if (!leagues) return null;
        const l = Array.isArray(leagues) ? leagues[0] : leagues;

        return {
            idLeague: l.idLeague,
            strLeague: l.strLeague
        };
    } catch (error) {
        console.error('Error in TSDB getLeagueDetails V2:', error.message);
        throw error;
    }
};

const getLeagues = async () => {
    try {
        const url = `${getBaseUrl()}/all/leagues`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });
        // V2 usa "all" para el endpoint /all/leagues
        return response.data.all || response.data.leagues || response.data.countries || [];
    } catch (error) {
        console.error('Error in TSDB getLeagues V2:', error.message);
        throw error;
    }
};

const searchTeams = async (name) => {
    try {
        const url = `${getBaseUrl()}/search/team/${encodeURIComponent(name)}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });

        let teams = response.data.search;
        if (!teams) return [];
        if (!Array.isArray(teams)) teams = [teams];

        return teams.map(t => ({
            idTeam: t.idTeam,
            strTeam: t.strTeam,
            strTeamBadge: t.strBadge || t.strTeamBadge, // V2 usa strBadge
            strLeague: t.strLeague,
            strCountry: t.strCountry
        }));
    } catch (error) {
        console.error('Error in TSDB searchTeams V2:', error.message);
        throw error;
    }
};

const getTeamsByLeague = async (idLeague) => {
    try {
        const url = `${getBaseUrl()}/list/teams/${idLeague}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });
        const teams = response.data.list || [];

        return teams.map(t => ({
            idTeam: t.idTeam,
            strTeam: t.strTeam,
            strTeamShort: t.strTeamShort,
            strBadge: t.strBadge,
            strLogo: t.strLogo,
            strColour1: t.strColour1,
            strColour2: t.strColour2,
            strCountry: t.strCountry,
            // Compatibilidad con código antiguo
            strTeamBadge: t.strBadge
        }));
    } catch (error) {
        console.error('Error in TSDB getTeamsByLeague V2:', error.message);
        throw error;
    }
};

const getPlayersByTeam = async (idTeam) => {
    try {
        const url = `${getBaseUrl()}/list/players/${idTeam}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });

        let players = response.data.list;
        if (!players) return [];
        if (!Array.isArray(players)) players = [players];

        return players.map(p => ({
            idPlayer: p.idPlayer,
            idTeam: p.idTeam,
            strPlayer: p.strPlayer,
            strTeam: p.strTeam,
            strTeam2: p.strTeam2,
            strThumb: p.strThumb,
            strCutout: p.strCutout,
            strNationality: p.strNationality,
            strPosition: p.strPosition
        }));
    } catch (error) {
        console.error('Error in TSDB getPlayersByTeam V2:', error.message);
        throw error;
    }
};

const searchLeagues = async (name) => {
    try {
        const url = `${getBaseUrl()}/search/league/${encodeURIComponent(name)}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });

        let leagues = response.data.search;
        if (!leagues) return [];
        if (!Array.isArray(leagues)) leagues = [leagues];

        return leagues.map(l => ({
            idLeague: l.idLeague,
            strLeague: l.strLeague,
            strSport: l.strSport,
            strBadge: l.strBadge,
            strCountry: l.strCountry
        }));
    } catch (error) {
        console.error('Error in TSDB searchLeagues V2:', error.message);
        throw error;
    }
};

const getPlayerHonours = async (idPlayer) => {
    try {
        const url = `${getBaseUrl()}/lookup/player_honours/${idPlayer}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });
        return response.data.lookup || [];
    } catch (error) {
        console.error('Error in TSDB getPlayerHonours V2:', error.message);
        throw error;
    }
};

const getPlayerTeamsHistory = async (idPlayer) => {
    try {
        const url = `${getBaseUrl()}/lookup/player_teams/${idPlayer}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });
        return response.data.lookup || [];
    } catch (error) {
        console.error('Error in TSDB getPlayerTeamsHistory V2:', error.message);
        throw error;
    }
};

const getTVBySport = async (sport) => {
    try {
        const url = `${getBaseUrl()}/filter/tv/sport/${encodeURIComponent(sport)}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });
        // En v2 los filtros suelen devolver "results" o el nombre de la sección
        return response.data.results || response.data.tv || [];
    } catch (error) {
        console.error('Error in TSDB getTVBySport V2:', error.message);
        throw error;
    }
};

module.exports = {
    searchPlayers,
    searchTeams,
    searchLeagues,
    getTVBySport,
    getTeamsByLeague,
    getPlayerHonours,
    getPlayerTeamsHistory,
    getPlayersByTeam,
    getPlayerDetails,
    getTeamDetails,
    getLeagueDetails,
    getLeagues
};
