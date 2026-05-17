const axios = require('axios');
const { sendApiResult } = require('./apiResult');

/**
 * Realiza Geocoding Inverso usando Nominatim de OpenStreetMap.
 * Se sirve desde el backend para mayor seguridad y control.
 */
const reverseGeocode = async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return sendApiResult(res, 400, "Faltan parámetros lat o lng");
    }

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'FootballApp-Scouting/1.0',
                'Accept-Language': 'es'
            }
        });

        if (response.data && response.data.display_name) {
            const addr = response.data.address || {};
            
            // Extraer componentes
            const street = addr.road || addr.pedestrian || addr.path || addr.suburb || addr.neighbourhood || '';
            const houseNumber = addr.house_number || '';
            const postCode = addr.postcode || '';
            const state = addr.state || addr.province || '';
            
            // Construir partes con comas
            let parts = [];
            if (street) parts.push(street);
            if (houseNumber) parts.push(houseNumber);
            if (postCode) parts.push(postCode);
            if (state) parts.push(state);

            let addressPart = parts.join(', ');
            
            // Si por alguna razón está vacío, usamos el fallback del display_name
            if (!addressPart) {
                addressPart = response.data.display_name.split(',').slice(0, 3).join(', ');
            }

            return sendApiResult(res, 200, "Procesamiento concluído exitosamente", {
                displayAddress: addressPart,
                raw: response.data
            });
        }

        return sendApiResult(res, 404, "No se encontró una dirección para estas coordenadas");
    } catch (error) {
        console.error('[GEOCODING] Error en Nominatim:', error.message);
        return sendApiResult(res, 500, "Error al consultar el servicio de geocoding externo");
    }
};

module.exports = {
    reverseGeocode
};
