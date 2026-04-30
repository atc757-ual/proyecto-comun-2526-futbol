const admin = require('firebase-admin');
const fs = require('fs');

let serviceAccount = null;

try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-credentials.json';
    if (fs.existsSync(serviceAccountPath)) {
        const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
    }
} catch (error) {
    console.error('Error al cargar las credenciales de Firebase:', error.message);
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin inicializado correctamente');
} else {
    console.warn('AVISO: Firebase Admin no inicializado. Se requiere archivo de credenciales válido.');
}

module.exports = admin;
