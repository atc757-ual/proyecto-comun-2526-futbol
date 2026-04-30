/**
 * SCRIPT PARA ASIGNAR ROL ADMIN EN FIREBASE (Custom Claims)
 * Uso: node scripts/set-firebase-admin.js <email>
 */

require('dotenv').config();
const admin = require('firebase-admin');

// 1. Inicializar Firebase Admin
// Asegúrate de tener FIREBASE_SERVICE_ACCOUNT en tu .env apuntando al archivo JSON
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('ERROR: No se encontró FIREBASE_SERVICE_ACCOUNT en el .env');
    process.exit(1);
}

const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const email = process.argv[2];

if (!email) {
    console.error('ERROR: Debes proporcionar un email. Uso: node scripts/set-firebase-admin.js usuario@ejemplo.com');
    process.exit(1);
}

async function setAdminClaim() {
    try {
        // 1. Buscar el usuario por email en Firebase
        const user = await admin.auth().getUserByEmail(email);
        
        // 2. Asignar el Custom Claim { admin: true }
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });

        console.log('---------------------------------------------------------');
        console.log(`¡ÉXITO! El usuario ${email} ahora tiene el claim ADMIN.`);
        console.log('En el próximo login, Firebase enviará este rol al backend.');
        console.log('---------------------------------------------------------');

    } catch (err) {
        console.error('ERROR AL ASIGNAR CLAIM:', err.message);
    } finally {
        process.exit(0);
    }
}

setAdminClaim();
