const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { sendApiResult } = require('../controllers/apiResult');

/**
 * Middleware para autorizar peticiones.
 * Siguiendo el Chapter 2.4 del tutorial.
 */
const authorizeRequest = async (req, res, next) => {
    // BYPASS para entorno de TEST
    if (process.env.NODE_ENV === 'test') {
        const User = mongoose.model('User');
        // Buscamos o creamos un usuario de prueba para que los tests tengan un ID válido
        let testUser = await User.findOne({ firebaseUid: 'test-user-id' });
        if (!testUser) {
            testUser = await User.create({
                name: 'Test User',
                email: 'test@example.com',
                firebaseUid: 'test-user-id',
                role: 'admin',
                is_active: true
            });
        }
        req.user = testUser;
        return next();
    }

    // Obtener la cabecera Authorization
    let header = req.headers.Authorization || req.headers.authorization;

    // Comprobar si la cabecera existe y comienza con 'Bearer'
    if (!header || !header.startsWith("Bearer ")) {
        return sendApiResult(res, 401, "Acceso no autorizado");
    }

    const token = header.split(" ")[1];

    if (!token) {
        return sendApiResult(res, 401, "No autorizado: Token no proporcionado");
    }

    const User = mongoose.model('User');

    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET || 'clave-por-defecto-cambiar-en-produccion', async (err, decoded) => {
        if (err) {
            return sendApiResult(res, 401, "No autorizado: Token inválido o expirado");
        }

        try {
            let user = await User.findOne({
                firebaseUid: decoded.id, 
                is_active: true, 
                blocked: false 
            }).select('-password');

            if (!user) {
                return sendApiResult(res, 401, "No autorizado: El usuario asociado al token no existe o está inactivo");
            }

            req.user = user;
            return next();
        } catch (error) {
            console.error('Error en el middleware de autorización:', error);
            return sendApiResult(res, 500, "Error interno al verificar autorización");
        }
    });
};

/**
 * Middleware para comprobar si el usuario es Admin.
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return sendApiResult(res, 403, "Acceso denegado: Se requiere rol de Administrador");
};

module.exports = { authorizeRequest, isAdmin };
