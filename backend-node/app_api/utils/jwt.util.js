const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT para un usuario.
 * Siguiendo el Chapter 2.3 del tutorial.
 */
const generateJWT = (userId, role = 'user') => {
    return jwt.sign(
        {
            id: userId,
            role: role,
        },
        process.env.JWT_SECRET || 'clave-por-defecto-cambiar-en-produccion',
        {
            expiresIn: "1d",
        }
    );
};

module.exports = { generateJWT };
