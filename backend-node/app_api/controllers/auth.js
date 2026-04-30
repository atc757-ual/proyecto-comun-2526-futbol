const mongoose = require('mongoose');
const User = mongoose.model('User');
const admin = require('../models/firebase');
const { generateJWT } = require('../utils/jwt.util');
const { sendApiResult } = require('./apiResult');

/**
 * Endpoint para login/registro con Firebase.
 * Recibe el idToken de Ionic y devuelve el JWT del backend.
 */
const loginFirebase = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return sendApiResult(res, 400, "Falta el idToken de Firebase");
    }

    try {
        // 1. Verificar el token con Firebase Admin
        // (Si no hay Service Account configurado, esto fallará - para desarrollo podemos simularlo si lo deseas)
        let firebaseUser;

        if (process.env.NODE_ENV === 'development' && !process.env.FIREBASE_SERVICE_ACCOUNT) {
            console.log('--- MODO DESARROLLO SIN FIREBASE ADMIN ---');
            // Simulación para que puedas probar el flujo sin el JSON de Google por ahora
            firebaseUser = {
                uid: 'simulated_uid_123',
                email: 'admin@test.com',
                name: 'Usuario Test Admin',
                picture: ''
            };
        } else {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            firebaseUser = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name || decodedToken.email.split('@')[0],
                picture: decodedToken.picture || '',
                isAdmin: decodedToken.admin === true // Leemos el Custom Claim de Firebase
            };
        }

        // 2. Sincronizar con MongoDB
        let user = await User.findOne({ firebaseUid: firebaseUser.uid });

        if (!user) {
            // Primer login: Crear usuario
            // El rol se hereda directamente de los Custom Claims de Firebase (Opción A - Máxima Seguridad)
            const isAdmin = firebaseUser.isAdmin;

            user = await User.create({
                firebaseUid: firebaseUser.uid,
                name: firebaseUser.name,
                email: firebaseUser.email,
                picture: firebaseUser.picture,
                role: isAdmin ? 'admin' : 'user'
            });
            console.log(`Nuevo usuario creado: ${user.email} con rol ${user.role}`);
        } else {
            // Usuario existente: Actualizar datos básicos por si cambiaron en Google
            user.name = firebaseUser.name;
            user.picture = firebaseUser.picture;
            await user.save();
        }

        // 5. Generar token y responder (Chapter 2.3)
        const token = generateJWT(user.firebaseUid, user.role);

        return sendApiResult(res, 200, "Login exitoso", {
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                picture: user.picture
            }
        });

    } catch (error) {
        console.error('Error en loginFirebase:', error);
        return sendApiResult(res, 401, "Error de autenticación con Firebase: " + error.message);
    }
};

module.exports = {
    loginFirebase
};
