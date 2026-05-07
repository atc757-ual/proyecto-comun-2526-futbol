const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Leer la llave privada para RS256
const privateKeyPath = path.join(__dirname, '../../private_key.pem');
let privateKey;

try {
    if (fs.existsSync(privateKeyPath)) {
        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        console.log('✅ Llave privada RS256 cargada correctamente desde:', privateKeyPath);
    } else {
        throw new Error('El archivo no existe en: ' + privateKeyPath);
    }
} catch (err) {
    console.error('!!! ERROR CRÍTICO: No se pudo cargar la llave privada RS256 !!!');
    console.error('Detalle:', err.message);
    privateKey = 'error';
}

/**
 * Genera un token JWT para un usuario usando RS256.
 */
const generateJWT = (userId, role = 'user') => {
    if (privateKey === 'error') {
        throw new Error('No se puede generar JWT: Llave privada no cargada');
    }
    return jwt.sign(
        {
            id: userId,
            role: role,
        },
        privateKey,
        {
            algorithm: 'RS256',
            expiresIn: "1d",
        }
    );
};

module.exports = { generateJWT };
