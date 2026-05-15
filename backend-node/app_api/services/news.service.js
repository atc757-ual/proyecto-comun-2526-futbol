const axios = require('axios');

/**
 * Servicio para gestionar la comunicación con el Bridge CORBA (Java)
 */

const CORBA_BRIDGE_URL = process.env.CORBA_BRIDGE_URL || 'http://localhost:8089/corba-bridge/api/noticias';

/**
 * Utilidad para asegurar el formato DD/MM/YYYY que exige el XSD de CORBA
 */
const formatToCorbaDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/2025`; // DD/MM/2025
        }
    }
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/2025`;
        }
    }
    return dateStr;
};

const getHeaders = (req) => {
    // Si req.user existe (inyectado por el middleware), usamos su rol transformado a mayúsculas
    // Si no, intentamos leerlo del header original o por defecto 'USER'
    const userRole = req.user?.role?.toUpperCase() || req.headers['x-user-role']?.toUpperCase() || 'USER';

    const headers = {
        'Authorization': req.headers.authorization,
        'X-User-Role': userRole,
        'Content-Type': 'application/json'
    };
    console.log(`[NEWS-SERVICE] 🔑 Autorizando en Bridge CORBA como: ${userRole}`);
    return headers;
};

const findAll = async (req) => {
    // Por defecto, todos ven el 'feed' (noticias activas)
    // Solo si se pasa ?all=true y el usuario es ADMIN, mostramos todo
    const showAll = req.query.all === 'true' && req.user?.role === 'admin';
    const endpoint = showAll ? CORBA_BRIDGE_URL : `${CORBA_BRIDGE_URL}/feed`;
    
    console.log(`[NEWS-SERVICE] 🔍 Recuperando noticias (${showAll ? 'ADMIN-ALL' : 'FEED'}) de: ${endpoint}`);
    
    const response = await axios.get(endpoint, { headers: getHeaders(req) });
    return response.data.data;
};

const findOne = async (id, req) => {
    const response = await axios.get(`${CORBA_BRIDGE_URL}/${id}`, { headers: getHeaders(req) });
    return response.data.data;
};

const create = async (newsData, req) => {
    const adminName = req.user?.email || req.user?.name || 'admin@futbol.com';
    const now = new Date();
    const displayDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/2025`;
    const isoDate2025 = `2025-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.000Z`;

    const payload = {
        id: newsData.id || `news-${Math.random().toString(36).substr(2, 9)}`,
        title: newsData.title,
        author: newsData.author || adminName,
        content: newsData.content,
        summary: newsData.summary,
        imageUrl: newsData.imageUrl,
        category: newsData.category,
        tags: newsData.tags || [],
        date: formatToCorbaDate(newsData.date) || displayDate,
        isActive: newsData.isActive !== undefined ? newsData.isActive : true,
        isFeatured: newsData.isFeatured !== undefined ? newsData.isFeatured : false,
        createdBy: adminName,
        updatedBy: adminName,
        createdAt: isoDate2025,
        updatedAt: isoDate2025
    };

    const response = await axios.post(CORBA_BRIDGE_URL, payload, { headers: getHeaders(req) });
    return response.data.data;
};

const update = async (id, newsData, req) => {
    const isoDate = new Date().toISOString();
    const payload = {
        id: id,
        ...newsData,
        date: formatToCorbaDate(newsData.date) || "12/05/2025",
        updatedBy: req.user?.email || 'Admin',
        updatedAt: isoDate
    };

    try {
        console.log(`[NEWS-SERVICE] Intentando actualizar noticia ${id} en CORBA...`);
        console.log(`[NEWS-SERVICE] Payload:`, JSON.stringify(payload, null, 2));
        
        const response = await axios.put(`${CORBA_BRIDGE_URL}/${id}`, payload, { headers: getHeaders(req) });
        console.log(`[NEWS-SERVICE] ✅ Noticia actualizada con éxito en CORBA`);
        return response.data.data;
    } catch (error) {
        console.error(`[NEWS-SERVICE] ❌ Error al actualizar en CORBA:`, error.response?.data || error.message);
        throw error;
    }
};

const remove = async (id, req) => {
    await axios.delete(`${CORBA_BRIDGE_URL}/${id}`, { headers: getHeaders(req) });
};

const bulkCreate = async (newsList, req) => {
    console.log(`[NEWS-SERVICE] 🚀 Iniciando Bulk Create. Items: ${newsList ? newsList.length : 'NULL'}`);
    
    // 1. Validación de entrada
    if (!Array.isArray(newsList)) {
        console.error('[NEWS-SERVICE] ❌ Error: newsList no es un array', typeof newsList);
        throw new Error('El formato de las noticias no es válido. Se esperaba una lista (Array).');
    }

    const adminName = req.user?.email || req.user?.name || 'admin@futbol.com';
    const now = new Date();
    const displayDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/2025`;
    const isoDate2025 = `2025-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.000Z`;

    try {
        const payload = newsList.map((n, index) => {
            // Aseguramos que los campos obligatorios existan para evitar fallos en el Bridge
            return {
                id: n.id || `bulk-${Math.random().toString(36).substr(2, 9)}-${index}`,
                title: n.title || 'Sin título',
                author: n.author || adminName,
                content: n.content || 'Sin contenido',
                summary: n.summary || 'Sin resumen',
                imageUrl: n.imageUrl || '',
                category: n.category || 'Internacional',
                tags: n.tags || [],
                date: formatToCorbaDate(n.date) || displayDate,
                isActive: n.isActive !== undefined ? n.isActive : true,
                isFeatured: n.isFeatured !== undefined ? n.isFeatured : false,
                createdBy: adminName,
                updatedBy: adminName,
                createdAt: isoDate2025,
                updatedAt: isoDate2025
            };
        });

        console.log(`[NEWS-SERVICE] 📦 Payload preparado (${payload.length} noticias). Enviando a: ${CORBA_BRIDGE_URL}/bulk`);

        const response = await axios.post(`${CORBA_BRIDGE_URL}/bulk`, payload, { 
            headers: getHeaders(req),
            timeout: 15000 
        });

        console.log(`[NEWS-SERVICE] ✅ Carga masiva completada con éxito en CORBA`);
        return response.data;
    } catch (error) {
        if (error.response) {
            // El Bridge respondió con un error (4xx, 5xx)
            console.error(`[NEWS-SERVICE] ❌ Error del Bridge (Status ${error.response.status}):`, JSON.stringify(error.response.data, null, 2));
            throw new Error(`Error en el Bridge CORBA: ${error.response.data?.message || error.response.statusText}`);
        } else if (error.request) {
            // No hubo respuesta del Bridge
            console.error(`[NEWS-SERVICE] ❌ El Bridge no responde en ${CORBA_BRIDGE_URL}`);
            throw new Error('El servidor de noticias (Bridge) no responde. ¿Está encendido el puerto 8089?');
        } else {
            // Error al configurar la petición
            console.error(`[NEWS-SERVICE] ❌ Error de configuración/mapeo:`, error.message);
            throw error;
        }
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    remove,
    bulkCreate
};
