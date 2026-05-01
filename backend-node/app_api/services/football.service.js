const axios = require('axios');

/**
 * Servicio para interactuar con API-Football (api-sports.io)
 */

const footballApi = axios.create({
    baseURL: 'https://v3.football.api-sports.io',
    headers: {
        'x-apisports-key': process.env.FOOTBALL_API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
    }
});

/**
 * Busca perfiles de jugadores en la API externa
 * @param {string} name - Nombre a buscar
 */
const searchPlayers = async (name) => {
    try {
        if (!name || name.length < 3) {
            return [];
        }

        // Llamada al endpoint verificado por el usuario
        const response = await footballApi.get('/players/profiles', {
            params: { search: name }
        });

        console.log('DEBUG: API Response status:', response.status);
        console.log('DEBUG: API Results:', response.data.results);

        const players = response.data.response || [];

        // Mapeo basado exactamente en el JSON que me has pasado
        return players.map(item => ({
            externalId: item.player.id,
            name: item.player.name,
            firstname: item.player.firstname,
            lastname: item.player.lastname,
            age: item.player.age,
            birthDate: item.player.birth?.date,
            nationality: item.player.nationality,
            photo: item.player.photo,
            position: item.player.position // Este campo sí viene en profiles
        }));

    } catch (error) {
        console.error('Error in FootballService.searchPlayers:', error.message);
        throw new Error('Error al conectar con la API de perfiles de fútbol');
    }
};

module.exports = {
    searchPlayers
};
