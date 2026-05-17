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

        // FILTRO ESTRICTO: Solo fútbol
        const playersFiltered = players.filter(p => p.strSport && p.strSport.toLowerCase() === 'soccer');

        return playersFiltered.map(p => ({
            idPlayer: p.idPlayer,
            idTeam: p.idTeam,
            idTeam2: p.idTeam2,
            idLeague: p.idLeague,
            strPlayer: p.strPlayer,
            strSport: p.strSport,
            strTeam: p.strTeam,
            strTeam2: p.strTeam2,
            strThumb: p.strThumb,
            strCutout: p.strCutout,
            strRender: p.strRender,
            strNationality: p.strNationality,
            strPosition: p.strPosition,
            strSide: p.strSide
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
            idTeam2: p.idTeam2,
            idLeague: p.idLeague,
            idTransferMkt: p.idTransferMkt,
            idESPN: p.idESPN,
            idWikidata: p.idWikidata,
            strPlayer: p.strPlayer,
            strNationality: p.strNationality,
            strTeam: p.strTeam,
            strTeam2: p.strTeam2,
            strPosition: p.strPosition,
            strSide: p.strSide,
            strHeight: p.strHeight,
            strWeight: p.strWeight,
            strNumber: p.strNumber,
            dateBorn: p.dateBorn,
            strBirthLocation: p.strBirthLocation,
            strThumb: p.strThumb,
            strDescriptionES: p.strDescriptionES || p.strDescriptionEN,
            // Imágenes adicionales
            strCutout: p.strCutout,
            strBanner: p.strBanner,
            // Redes Sociales
            strFacebook: p.strFacebook,
            strInstagram: p.strInstagram,
            strTwitter: p.strTwitter,
            strWebsite: p.strWebsite
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
            strLeague: t.strLeague,
            strCountry: t.strCountry,
            intFormedYear: t.intFormedYear,
            strStadium: t.strStadium,
            strStadiumLocation: t.strStadiumLocation,
            strStadiumThumb: t.strStadiumThumb,
            strFanart1: t.strFanart1, // Banner del equipo
            strWebsite: t.strWebsite,
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

const searchTeams = async (name) => {
    try {
        const url = `${getBaseUrl()}/search/team/${encodeURIComponent(name)}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });

        let teams = response.data.search;
        if (!teams) return [];
        if (!Array.isArray(teams)) teams = [teams];

        // FILTRO ESTRICTO: Solo fútbol
        const teamsFiltered = teams.filter(t => t.strSport && t.strSport.toLowerCase() === 'soccer');

        return teamsFiltered.map(t => ({
            idTeam: t.idTeam,
            strTeam: t.strTeam,
            strTeamBadge: t.strBadge || t.strTeamBadge, 
            strLeague: t.strLeague,
            strCountry: t.strCountry,
            strSport: t.strSport
        }));
    } catch (error) {
        console.error('Error in TSDB searchTeams V2:', error.message);
        throw error;
    }
};

const searchPlayersByTeam = async (teamName) => {
    try {
        const url = `${getBaseUrl()}/search/player?t=${encodeURIComponent(teamName)}`;
        console.log(`[TSDB-DEBUG] Buscando jugadores por NOMBRE de equipo: "${teamName}"`);

        const response = await axios.get(url, {
            headers: getHeaders()
        });

        let players = response.data.search || response.data.player || response.data.results;
        if (!players) {
            console.log(`[TSDB-DEBUG] No se encontraron jugadores para el equipo: "${teamName}"`);
            return [];
        }
        if (!Array.isArray(players)) players = [players];

        // FILTRO ESTRICTO: Solo fútbol
        const playersFiltered = players.filter(p => p.strSport && p.strSport.toLowerCase() === 'soccer');
        console.log(`[TSDB-DEBUG] Búsqueda por nombre finalizada: ${playersFiltered.length} jugadores de fútbol encontrados`);

        return playersFiltered.map(p => ({
            idPlayer: p.idPlayer,
            idTeam: p.idTeam,
            strPlayer: p.strPlayer,
            strTeam: p.strTeam,
            strThumb: p.strThumb,
            strCutout: p.strCutout,
            strPosition: p.strPosition
        }));
    } catch (error) {
        console.error('Error in TSDB searchPlayersByTeam V2:', error.message);
        throw error;
    }
};

const getTeamsByLeague = async (idLeague) => {
    try {
        const url = `${getBaseUrl()}/list/teams/${idLeague}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });
        const teams = response.data.list || response.data.teams || response.data.results || [];

        return teams.map(t => ({
            idTeam: t.idTeam,
            strTeam: t.strTeam,
            strTeamShort: t.strTeamShort,
            strBadge: t.strBadge,
            strLogo: t.strLogo,
            strColour1: t.strColour1,
            strColour2: t.strColour2,
            strCountry: t.strCountry,
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

        console.log(`[TSDB-DEBUG] Consultando Plantilla Oficial para Team ID: ${idTeam}`);
        let players = response.data.list || response.data.player || response.data.results;
        if (!players) {
            console.log(`[TSDB-DEBUG] No se encontró plantilla oficial para ID: ${idTeam}`);
            return [];
        }
        if (!Array.isArray(players)) players = [players];

        console.log(`[TSDB-DEBUG] Plantilla Oficial recuperada: ${players.length} registros`);

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

        // FILTRO ESTRICTO: Solo fútbol
        const leaguesFiltered = leagues.filter(l => l.strSport && l.strSport.toLowerCase() === 'soccer');

        return leaguesFiltered.map(l => ({
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
        const data = response.data.lookup || [];
        const mapped = data.map(h => ({
            strTeam: h.strHonour,
            strTeamBadge: h.strHonourTrophy || h.strTeamBadge,
            strSeason: h.strSeason
        }));
        // Ordenar por año descendente
        return mapped.sort((a, b) => {
            const yearA = parseInt(a.strSeason?.substring(0, 4)) || 0;
            const yearB = parseInt(b.strSeason?.substring(0, 4)) || 0;
            return yearB - yearA;
        });
    } catch (error) {
        console.error('Error in TSDB getPlayerHonours V2:', error.message);
        throw error;
    }
};

const getPlayerMilestones = async (idPlayer) => {
    try {
        const url = `${getBaseUrl()}/lookup/player_milestones/${idPlayer}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });
        const data = response.data.lookup || [];
        const mapped = data.map(m => ({
            strTeam: m.strMilestone,
            strTeamBadge: m.strMilestoneLogo,
            strSeason: m.dateMilestone ? m.dateMilestone.substring(0, 4) : ''
        }));
        // Ordenar por año descendente
        return mapped.sort((a, b) => (parseInt(b.strSeason) || 0) - (parseInt(a.strSeason) || 0));
    } catch (error) {
        console.error('Error in TSDB getPlayerMilestones V2:', error.message);
        throw error;
    }
};

const getPlayerTeamsHistory = async (idPlayer) => {
    try {
        const url = `${getBaseUrl()}/lookup/player_teams/${idPlayer}`;
        const response = await axios.get(url, {
            headers: getHeaders()
        });
        const data = response.data.lookup || [];
        const mapped = data.map(t => ({
            strTeam: t.strFormerTeam,
            strTeamBadge: t.strBadge,
            strSeason: `${t.strJoined}${t.strDeparted ? ' - ' + t.strDeparted : ' - Presente'}`,
            _year: parseInt(t.strJoined) || 0
        }));
        // Ordenar por año de inicio descendente
        return mapped.sort((a, b) => b._year - a._year);
    } catch (error) {
        console.error('Error in TSDB getPlayerTeamsHistory V2:', error.message);
        throw error;
    }
};


const getTVByCountry = async (country) => {
    try {
        const url = `${getBaseUrl()}/filter/tv/country/${encodeURIComponent(country)}`;
        console.log(`[TSDB-BACKEND] Consultando TV País: ${url}`);
        const response = await axios.get(url, {
            headers: getHeaders()
        });
        console.log(`[TSDB-DEBUG] Raw Response Keys:`, Object.keys(response.data));
        const data = response.data.results || response.data.tv || response.data.filter || [];
        // Filtramos estrictamente por fútbol para evitar otros deportes en la agenda
        const filteredData = data.filter(item => item.strSport && item.strSport.toLowerCase() === 'soccer');
        console.log(`[TSDB-BACKEND] TV País recuperada (Filtro Soccer): ${filteredData.length} eventos`);
        return filteredData;
    } catch (error) {
        console.error('Error in TSDB getTVByCountry V2:', error.message);
        throw error;
    }
};

const getLiveScores = async (sport = 'soccer') => {
    try {
        const url = `${getBaseUrl()}/livescore/${encodeURIComponent(sport)}`;
        console.log(`[TSDB-BACKEND] Consultando Livescore (V2): ${url}`);
        const response = await axios.get(url, {
            headers: getHeaders()
        });
        // En V2 el key suele ser 'livescore' o 'results'
        const data = response.data.livescore || response.data.results || [];
        console.log(`[TSDB-BACKEND] Livescore recuperado: ${data.length} partidos`);
        return data;
    } catch (error) {
        console.error('Error in TSDB getLiveScores V2:', error.message);
        throw error;
    }
};

module.exports = {
    searchPlayers,
    searchTeams,
    searchLeagues,
    getPlayerHonours,
    getPlayerMilestones,
    getPlayerTeamsHistory,
    getPlayerDetails,
    getTeamDetails,
    getLeagueDetails,
    getTeamsByLeague,
    getPlayersByTeam,
    searchPlayersByTeam,
    getTVByCountry,
    getLiveScores
};
