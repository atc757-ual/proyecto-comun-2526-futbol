const admin = require('./app_api/models/firebase'); // Tu config de Firebase Admin

const setAdminClaim = async (email) => {
    try {
        // 1. Buscar el usuario en Firebase por Email
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        // 2. Asignar Custom Claim { admin: true }
        // Este es el "sello" que viajará dentro del ID Token de Firebase
        await admin.auth().setCustomUserClaims(uid, { admin: true });

        console.log('--------------------------------------------------');
        console.log(`[ÉXITO] Rol de Administrador activado en Firebase para:`);
        console.log(`Email: ${email}`);
        console.log(`UID: ${uid}`);
        console.log('--------------------------------------------------');
        console.log('IMPORTANTE: Si el usuario ya tenía la sesión abierta,');
        console.log('debe cerrarla y volver a entrar para recibir el rol.');

        process.exit(0);
    } catch (error) {
        console.error('[ERROR]', error.message);
        process.exit(1);
    }
};

const emailArg = process.argv[2];
if (!emailArg) {
    console.error('Uso: node make-admin.js usuario@ejemplo.com');
    process.exit(1);
}

setAdminClaim(emailArg);
