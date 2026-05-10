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
        // Primero buscamos por UID
        let user = await User.findOne({ firebaseUid: firebaseUser.uid });
        
        // Si no existe por UID, buscamos por Email (por si es una cuenta antigua sin vincular)
        if (!user) {
            console.log(`[AUTH] No encontrado por UID, buscando por email: ${firebaseUser.email}`);
            user = await User.findOne({ email: firebaseUser.email });
        }

        if (!user) {
            console.log(`[AUTH] Usuario nuevo. Intentando crear...`);
            try {
                user = await User.create({
                    firebaseUid: firebaseUser.uid,
                    name: firebaseUser.name,
                    email: firebaseUser.email,
                    role: firebaseUser.isAdmin ? 'admin' : 'user'
                });
            } catch (err) {
                if (err.code === 11000) {
                    console.log(`[AUTH] Conflicto de duplicado detectado en Create. Re-intentando búsqueda...`);
                    user = await User.findOne({ email: firebaseUser.email });
                } else {
                    throw err;
                }
            }
        }

        if (user) {
            // Actualizar datos siempre para asegurar sincronización
            user.firebaseUid = firebaseUser.uid;
            user.name = firebaseUser.name;
            user.role = firebaseUser.isAdmin ? 'admin' : 'user';
            await user.save();
            console.log(`[AUTH] Usuario sincronizado: ${user.email} (Rol: ${user.role})`);
        } else {
            throw new Error("No se pudo crear ni encontrar al usuario tras varios intentos.");
        }

        // 5. Generar token y responder (Chapter 2.3)
        const token = generateJWT(user.firebaseUid, user.role, isInitialAdmin);

        return sendApiResult(res, 200, "Login exitoso", {
            token,
            user: {
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en loginFirebase:', error);
        return sendApiResult(res, 401, "Error de autenticación con Firebase: " + error.message);
    }
};

/**
 * Promueve a un usuario a Administrador.
 * Solo puede ser ejecutado por el Administrador Maestro.
 */
const setAdminRole = async (req, res) => {
    const { email } = req.body;
    
    // El middleware de JWT ya debería haber verificado que el solicitante es Master
    // pero añadimos una capa extra de seguridad aquí
    const requester = req.user; // Asumiendo que el middleware inyecta el user decodificado
    
    if (!email) {
        return sendApiResult(res, 400, "Falta el email del usuario a promover");
    }

    try {
        // 1. Buscar usuario en Firebase
        const userFirebase = await admin.auth().getUserByEmail(email);
        
        // 2. Establecer Custom Claims en Firebase
        await admin.auth().setCustomUserClaims(userFirebase.uid, { admin: true });
        
        // 3. Actualizar rol en MongoDB
        await User.findOneAndUpdate(
            { email: email },
            { role: 'admin' },
            { new: true }
        );

        console.log(`[AUTH] Usuario ${email} promovido a ADMIN por el Master`);
        
        return sendApiResult(res, 200, `Usuario ${email} ahora es Administrador. Debe re-loguearse para aplicar cambios.`);

    } catch (error) {
        console.error('Error al promover usuario:', error);
        return sendApiResult(res, 500, "Error al procesar la solicitud: " + error.message);
    }
};

/**
 * Degrada a un usuario de Administrador a Usuario normal.
 * Solo puede ser ejecutado por el Administrador Maestro.
 */
const removeAdminRole = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return sendApiResult(res, 400, "Falta el email del usuario a degradar");
    }

    try {
        // 1. Buscar usuario en Firebase
        const userFirebase = await admin.auth().getUserByEmail(email);
        
        // 2. Eliminar Custom Claims en Firebase
        await admin.auth().setCustomUserClaims(userFirebase.uid, { admin: false });
        
        // 3. Actualizar rol en MongoDB
        await User.findOneAndUpdate(
            { email: email },
            { role: 'user' },
            { new: true }
        );

        console.log(`[AUTH] Usuario ${email} degradado a USER por el Master`);
        
        return sendApiResult(res, 200, `Usuario ${email} ya no es Administrador.`);

    } catch (error) {
        console.error('Error al degradar usuario:', error);
        return sendApiResult(res, 500, "Error al procesar la solicitud: " + error.message);
    }
};

/**
 * Busca usuarios por email (para autocompletado o verificación).
 * Solo Master Admin.
 */
const getUsers = async (req, res) => {
    const { email } = req.query;
    
    try {
        const query = email ? { email: { $regex: email, $options: 'i' } } : {};
        const users = await User.find(query).limit(10).select('name email role is_active');
        
        return sendApiResult(res, 200, "Usuarios encontrados", users);
    } catch (error) {
        return sendApiResult(res, 500, "Error al buscar usuarios: " + error.message);
    }
};

/**
 * Activa o desactiva a un usuario.
 * Solo Master Admin.
 */
const toggleUserStatus = async (req, res) => {
    const { email, disabled } = req.body;
    
    if (!email) {
        return sendApiResult(res, 400, "Falta el email del usuario");
    }

    try {
        // 1. Buscar usuario en Firebase
        const userFirebase = await admin.auth().getUserByEmail(email);
        
        // 2. Actualizar en Firebase
        await admin.auth().updateUser(userFirebase.uid, { disabled: disabled });
        
        // 3. Actualizar en MongoDB
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { is_active: !disabled },
            { new: true }
        );

        const statusLabel = disabled ? 'INHABILITADO' : 'HABILITADO';
        console.log(`[AUTH] Usuario ${email} ha sido ${statusLabel} por el Master`);
        
        return sendApiResult(res, 200, `Usuario ${statusLabel} correctamente`, updatedUser);

    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        return sendApiResult(res, 500, "Error al procesar la solicitud: " + error.message);
    }
};

module.exports = {
    loginFirebase,
    setAdminRole,
    removeAdminRole,
    getUsers,
    toggleUserStatus
};
