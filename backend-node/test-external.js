require('dotenv').config();
const footballService = require('./app_api/services/football.service');

async function testSearch() {
    console.log('--- TEST BÚSQUEDA EXTERNA ---');
    console.log('Buscando jugador: "Neymar"...');
    
    try {
        const results = await footballService.searchPlayers('Neymar');
        console.log(`\nÉxito! Se han encontrado ${results.length} resultados.`);
        
        if (results.length > 0) {
            console.log('\nPrimer resultado:');
            console.log(JSON.stringify(results[0], null, 2));
        }
    } catch (error) {
        console.error('\nERROR EN EL TEST:', error.message);
    }
}

testSearch();
