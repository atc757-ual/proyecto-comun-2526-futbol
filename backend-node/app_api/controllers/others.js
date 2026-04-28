const axios = require('axios');
const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const { sendApiResult } = require('./apiResult');

// GET /api/db-load - Servicio de carga REAL desde API-Football
const dbLoad = async (req, res) => {
    try {
        const apiKey = process.env.FOOTBALL_API_KEY;
        
        // Configuración de la petición a API-Football
        const options = {
            method: 'GET',
            url: 'https://v3.football.api-sports.io/players',
            params: { 
                team: '541', // Real Madrid (puedes cambiar este ID por otro)
                season: '2023' 
            },
            headers: {
                'x-apisports-key': apiKey
            }
        };

        const response = await axios.request(options);

        if (response.data && response.data.response && response.data.response.length > 0) {
            const externalPlayers = response.data.response.slice(0, 10); // Cargamos los 10 primeros
            
            const playersToSave = externalPlayers.map(p => ({
                name: `${p.player.firstname} ${p.player.lastname}`,
                team: p.statistics[0].team.name,
                league: p.statistics[0].league.name,
                image_url: p.player.photo,
                user_id: 'admin_uid',
                location: { 
                    type: 'Point', 
                    coordinates: [-3.6883, 40.4531] // Coordenadas del Bernabéu para el ejemplo
                },
                comments: []
            }));

            // Limpiar e insertar
            await Player.deleteMany({});
            await Player.insertMany(playersToSave);

            sendApiResult(res, 201, `¡Éxito! Se han cargado ${playersToSave.length} jugadores del ${playersToSave[0].team} en MongoDB`);
        } else {
            // Si la API no devuelve datos (quizás por límite de cuota o ID incorrecto)
            throw new Error("La API no devolvió jugadores. Verifica tu cuota diaria o el ID del equipo.");
        }

    } catch (err) {
        console.error("Error en db-load:", err.message);
        sendApiResult(res, 500, "Error en el servicio de carga: " + err.message);
    }
};

module.exports = {
    dbLoad
};
