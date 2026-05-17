const axios = require('axios');

async function testGeocoding() {
    try {
        const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=40.4168&lon=-3.7038';
        console.log('Consultando Nominatim:', url);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'FootballApp-Scouting/1.0',
                'Accept-Language': 'es'
            }
        });

        console.log('Respuesta:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

testGeocoding();
