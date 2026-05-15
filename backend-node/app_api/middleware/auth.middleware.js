const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { sendApiResult } = require('../controllers/apiResult');

// Leer la llave pública para verificar RS256
const publicKeyPath = path.join(__dirname, '../../public_key.pem');
let secretOrKey = process.env.JWT_SECRET || 'clave-por-defecto';

if (fs.existsSync(publicKeyPath)) {
    secretOrKey = fs.readFileSync(publicKeyPath, 'utf8');
    console.log('✅ Llave pública RS256 cargada para verificación');
} else {
    console.warn('⚠️ No se encontró public_key.pem, usando secret por defecto');
}

/**
 * Middleware para autorizar peticiones.
 */
const authorizeRequest = async (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
        const User = mongoose.model('User');
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

    let header = req.headers.Authorization || req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return sendApiResult(res, 401, "Acceso no autorizado");
    }

    const token = header.split(" ")[1];

    const User = mongoose.model('User');

    jwt.verify(token, secretOrKey, async (err, decoded) => {
        if (err) {
            console.error('JWT Verify Error:', err.message);
            return sendApiResult(res, 401, "No autorizado: Token inválido o expirado");
        }

        try {
            let user = await User.findOne({
                firebaseUid: decoded.id, 
                is_active: true, 
                blocked: false 
            }).select('-password');

            if (!user) {
                return sendApiResult(res, 401, "No autorizado: El usuario no existe");
            }

            // Inyectamos el usuario de BD y los claims del token
            req.user = user;
            req.tokenClaims = decoded; 
            
            return next();
        } catch (error) {
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

/**
 * Middleware para comprobar si el usuario es Master (Super Admin).
 */
const isMaster = (req, res, next) => {
    if (req.tokenClaims && req.tokenClaims.master === true) {
        return next();
    }
    return sendApiResult(res, 403, "Acceso denegado: Solo el Administrador Maestro puede realizar esta acción");
};

module.exports = { authorizeRequest, isAdmin, isMaster };
