const axios = require('axios');

async function testSearch() {
    const name = 'Navarro';
    const url = `https://www.thesportsdb.com/api/v2/json/1/search/player/${name}`;
    
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const players = response.data.search || [];
        console.log(`Encontrados ${players.length} jugadores.`);
        
        players.slice(0, 3).forEach(p => {
            console.log(`- ${p.strPlayer} | Deporte: ${p.strSport} | Equipo: ${p.strTeam}`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testSearch();
