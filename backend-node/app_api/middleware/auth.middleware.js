const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const { sendApiResult } = require('../controllers/apiResult');

// Leer la llave pública para verificar RS256
const publicKeyPath = path.join(__dirname, '../../public_key.pem');
let secretOrKey;
let jwtAlgorithm;

if (fs.existsSync(publicKeyPath)) {
    secretOrKey = fs.readFileSync(publicKeyPath, 'utf8');
    jwtAlgorithm = 'RS256';
} else if (process.env.JWT_SECRET) {
    secretOrKey = process.env.JWT_SECRET;
    jwtAlgorithm = 'HS256';
} else {
    throw new Error('FATAL: Se requiere JWT_SECRET o public_key.pem. El servidor no puede arrancar sin seguridad JWT.');
}

/**
 * Middleware para autorizar peticiones.
 */
const authorizeRequest = async (req, res, next) => {


    let header = req.headers.Authorization || req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return sendApiResult(res, 401, "Acceso no autorizado");
    }

    const token = header.split(" ")[1];

    const User = mongoose.model('User');



        jwt.verify(token, secretOrKey, { algorithms: [jwtAlgorithm] }, async (err, decoded) => {
            if (err) {
                console.error('JWT Verify Error:', err.message);
                return sendApiResult(res, 401, "No autorizado: Token inválido o expirado");
            }

            try {
                let user = await User.findOne({
                    firebaseUid: decoded.id || decoded.sub, 
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
