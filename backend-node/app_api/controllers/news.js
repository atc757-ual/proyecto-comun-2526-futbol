const axios = require('axios');

// El servidor de Node actúa como un BRIDGE hacia el BRIDGE de Java (CORBA)
// Según docker-compose, el bridge de Java está en el puerto 8089
// IMPORTANTE: El contexto en Tomcat es /corba-bridge y el servlet es /api/noticias
const CORBA_BRIDGE_URL = process.env.CORBA_BRIDGE_URL || 'http://localhost:8089/corba-bridge/api/noticias';

/**
 * Utilidad para asegurar el formato DD/MM/YYYY que exige el XSD
 */
const formatToCorbaDate = (dateStr) => {
    if (!dateStr) return null;
    // Si viene en formato YYYY-MM-DD (de un input date)
    if (dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/2025`; // DD/MM/2025
        }
    }
    // Si ya viene en DD/MM/YYYY pero queremos asegurar 2025
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/2025`;
        }
    }
    return dateStr;
};

/**
 * Obtiene todas las noticias desde el Servidor CORBA (vía Bridge Java)
 */
const getNews = async (req, res) => {
    try {
        const headers = {
            'Authorization': req.headers.authorization,
            'X-User-Role': req.headers['x-user-role'] || 'USER'
        };
        // Usamos /feed para el listado público, así evitamos el 403 (Forbidden)
        const response = await axios.get(`${CORBA_BRIDGE_URL}/feed`, { headers });
        res.status(200).json({ data: response.data.data });
    } catch (error) {
        console.error("[NodeBridge] Error al obtener noticias de CORBA:", error.message);
        res.status(500).json({ message: "Error al conectar con el servidor CORBA", error: error.message });
    }
};

/**
 * Obtiene una noticia específica por ID desde CORBA
 */
const getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        const headers = {
            'Authorization': req.headers.authorization,
            'X-User-Role': req.headers['x-user-role'] || 'USER'
        };
        const response = await axios.get(`${CORBA_BRIDGE_URL}/${id}`, { headers });
        // El bridge de Java devuelve un solo objeto en .data.data para peticiones por ID
        res.status(200).json({ data: response.data.data });
    } catch (error) {
        console.error(`[NodeBridge] Error al obtener noticia ${id} de CORBA:`, error.message);
        res.status(404).json({ message: "Noticia no encontrada en CORBA" });
    }
};

/**
 * Envía una nueva noticia al Servidor CORBA
 */
const createNews = async (req, res) => {
    try {
        const headers = {
            'Authorization': req.headers.authorization,
            'X-User-Role': 'ADMIN',
            'Content-Type': 'application/json'
        };

        const now = new Date();
        const year2025 = "2025";
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const displayDate = `${day}/${month}/${year2025}`;
        const isoDate2025 = `${year2025}-${month}-${day}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.000Z`;

        const adminName = req.user?.email || req.user?.name || 'admin@futbol.com';

        const payload = {
            id: req.body.id || `news-${Math.random().toString(36).substr(2, 9)}`,
            title: req.body.title,
            author: req.body.author || adminName,
            content: req.body.content,
            summary: req.body.summary,
            imageUrl: req.body.imageUrl,
            category: req.body.category,
            tags: req.body.tags || [],
            date: formatToCorbaDate(req.body.date) || displayDate,
            isActive: req.body.isActive !== undefined ? req.body.isActive : true,
            isFeatured: req.body.isFeatured !== undefined ? req.body.isFeatured : false,
            createdBy: adminName,
            updatedBy: adminName,
            createdAt: isoDate2025,
            updatedAt: isoDate2025
        };

        const response = await axios.post(CORBA_BRIDGE_URL, payload, { headers });
        res.status(201).json({ data: response.data.data });
    } catch (error) {
        console.error("[NodeBridge] Error al crear noticia en CORBA:", error.response?.data || error.message);
        res.status(500).json({ message: "Fallo al enviar noticia al sistema CORBA" });
    }
};

/**
 * Actualiza una noticia en el Servidor CORBA
 */
const updateNews = async (req, res) => {
    const { id } = req.params; // Extraemos el ID al principio
    try {
        const headers = {
            'Authorization': req.headers.authorization,
            'X-User-Role': 'ADMIN',
            'Content-Type': 'application/json'
        };

        const now = new Date();
        const isoDate = now.toISOString();

        const payload = {
            id: id,
            title: req.body.title,
            author: req.body.author || req.user?.email || 'Admin',
            content: req.body.content,
            summary: req.body.summary,
            imageUrl: req.body.imageUrl,
            category: req.body.category,
            tags: req.body.tags || [],
            date: formatToCorbaDate(req.body.date) || "12/05/2025",
            isActive: req.body.isActive,
            isFeatured: req.body.isFeatured,
            // Auditoría forzada para edición
            createdBy: req.body.createdBy || 'Admin', 
            updatedBy: req.user?.email || 'Admin',
            createdAt: req.body.createdAt || isoDate,
            updatedAt: isoDate 
        };

        const response = await axios.put(`${CORBA_BRIDGE_URL}/${id}`, payload, { headers });
        res.status(200).json({ data: response.data.data });
    } catch (error) {
        console.error(`[NodeBridge] Error al actualizar noticia ${id} en CORBA:`, error.response?.data || error.message);
        res.status(500).json({ message: "Fallo al actualizar en el sistema CORBA" });
    }
};

/**
 * Elimina una noticia en el Servidor CORBA
 */
const deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const headers = {
            'Authorization': req.headers.authorization,
            'X-User-Role': 'ADMIN'
        };

        await axios.delete(`${CORBA_BRIDGE_URL}/${id}`, { headers });
        res.status(204).send();
    } catch (error) {
        console.error(`[NodeBridge] Error al eliminar noticia ${id} en CORBA:`, error.message);
        res.status(500).json({ message: "Fallo al eliminar en el sistema CORBA" });
    }
};

/**
 * Carga masiva de noticias hacia el Servidor CORBA
 */
const bulkCreateNews = async (req, res) => {
    try {
        const headers = {
            'Authorization': req.headers.authorization,
            'X-User-Role': 'ADMIN',
            'Content-Type': 'application/json'
        };

        const now = new Date();
        // Forzamos el año a 2025 para que cuadre con tu proyecto
        const year2025 = "2025";
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        
        const displayDate = `${day}/${month}/${year2025}`;
        const isoDate2025 = `${year2025}-${month}-${day}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.000Z`;
        
        // Aseguramos un nombre de admin NO nulo
        const adminName = req.user?.email || req.user?.name || 'admin@futbol.com';

        const payload = req.body.map(n => ({
            id: n.id || `bulk-${Math.random().toString(36).substr(2, 9)}`,
            title: n.title || 'Sin título',
            author: n.author || 'Redacción',
            content: n.content || 'Sin contenido',
            summary: n.summary || 'Sin resumen',
            imageUrl: n.imageUrl || '',
            category: n.category || 'General',
            tags: n.tags || [],
            date: formatToCorbaDate(n.date) || displayDate,
            isActive: n.isActive !== undefined ? n.isActive : true,
            isFeatured: n.isFeatured !== undefined ? n.isFeatured : false,
            createdBy: adminName,
            updatedBy: adminName,
            createdAt: isoDate2025,
            updatedAt: isoDate2025
        }));

        const response = await axios.post(`${CORBA_BRIDGE_URL}/bulk`, payload, { headers });
        res.status(201).json({ message: "Carga masiva completada", count: payload.length });
    } catch (error) {
        console.error("[NodeBridge] Error en carga masiva hacia CORBA:", error.response?.data || error.message);
        res.status(500).json({ message: "Fallo en la carga masiva hacia CORBA" });
    }
};

module.exports = {
    getNews,
    getNewsById,
    createNews,
    updateNews,
    bulkCreateNews,
    deleteNews
};
