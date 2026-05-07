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
    console.log('>>> PETICIÓN RECIBIDA EN /auth/signin');
    const { idToken } = req.body;
    console.log("token:" + idToken)
    if (!idToken) {
        return sendApiResult(res, 400, "Falta el idToken de Firebase");
    }

    try {
        // 1. Verificar el token con Firebase Admin
        // (Si no hay Service Account configurado, esto fallará - para desarrollo podemos simularlo si lo deseas)
        let firebaseUser;

        let decodedToken;
        try {
            // Solo intentar validar si Firebase Admin está inicializado
            if (admin.apps.length > 0) {
                decodedToken = await admin.auth().verifyIdToken(idToken);
                console.log("decode " + decodedToken)
            } else {
                throw new Error("Firebase Admin no inicializado");
            }
        } catch (error) {
            console.log("decode error " + error)
            // Si falla y estamos en desarrollo, usamos simulación
            if (process.env.NODE_ENV === 'development') {
                console.log('!!! SIMULACIÓN ACTIVA !!!');
                console.log('EMAIL DEL ENV:', process.env.INITIAL_ADMIN_EMAIL);
                decodedToken = {
                    uid: 'simulated_uid_123',
                    email: process.env.INITIAL_ADMIN_EMAIL,
                    name: 'Admin Simulado'
                };
            } else {
                throw error;
            }
        }

        console.log('--- DEBUG LOGIN ---');
        console.log('Email detectado:', decodedToken.email);
        console.log('Email Admin en .env:', process.env.INITIAL_ADMIN_EMAIL);

        const isInitialAdmin = decodedToken.email === process.env.INITIAL_ADMIN_EMAIL;
        console.log('¿Coinciden los emails?:', isInitialAdmin);

        firebaseUser = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.email.split('@')[0],
            isAdmin: decodedToken.admin === true || isInitialAdmin
        };
        console.log('Resultado isAdmin final:', firebaseUser.isAdmin);
        console.log('-------------------');

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
                role: isAdmin ? 'admin' : 'user'
            });
            console.log(`Nuevo usuario creado: ${user.email} con rol ${user.role}`);
        } else {
            // Usuario existente: Actualizar datos básicos y ROL por si cambió
            user.name = firebaseUser.name;
            user.role = firebaseUser.isAdmin ? 'admin' : 'user'; // <--- ACTUALIZAMOS EL ROL
            await user.save();
        }

        // 5. Generar token y responder (Chapter 2.3)
        const token = generateJWT(user.firebaseUid, user.role);

        return sendApiResult(res, 200, "Login exitoso", {
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role
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
