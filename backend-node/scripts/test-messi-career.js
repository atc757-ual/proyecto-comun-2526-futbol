const axios = require('axios');

async function testMessi() {
    const idPlayer = '34146370'; // ID de Messi
    const baseUrl = 'https://www.thesportsdb.com/api/v2/json';
    const headers = { 'X-API-KEY': '1', 'User-Agent': 'Mozilla/5.0' };

    const endpoints = [
        { name: 'Honours (V2 format A)', url: `${baseUrl}/lookup/honours/${idPlayer}` },
        { name: 'Honours (V2 format B)', url: `${baseUrl}/lookup/player/honours/${idPlayer}` },
        { name: 'Teams (V2 format A)', url: `${baseUrl}/lookup/player_teams/${idPlayer}` },
        { name: 'Teams (V2 format B)', url: `${baseUrl}/lookup/player/teams/${idPlayer}` }
    ];

    for (const ep of endpoints) {
        try {
            console.log(`\n--- Probando ${ep.name} ---`);
            const response = await axios.get(ep.url, { headers });
            const data = response.data.lookup || [];
            console.log(`URL: ${ep.url}`);
            console.log(`Recuperados ${data.length} elementos.`);
        } catch (error) {
            console.log(`Error en ${ep.name} (${ep.url}): ${error.message}`);
        }
    }
}

testMessi();
