const mongoose = require('mongoose');

// Usamos la variable de entorno definida en el docker-compose o la local por defecto
let dbURI = process.env.MONGO_URL || 'mongodb://localhost:27017/football';

// Si estamos en modo TEST, ajustamos la URL para conectar desde el host y usar DB de test
if (process.env.NODE_ENV === 'test') {
    dbURI = dbURI.replace('db-node', '127.0.0.1');
    if (!dbURI.includes('_test')) {
        dbURI = `${dbURI}_test`;
    }
}

mongoose.connect(dbURI);

// Eventos de conexión (Basado en tu patrón TRWM)
mongoose.connection.on('connected', () => {
    console.log(`Mongoose connected to ${dbURI}`);
});

mongoose.connection.on('error', err => {
    console.log('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Función para cierre limpio de la conexión
const gracefulShutdown = (msg, callback) => {
    mongoose.connection.close().then(() => {
        console.log(`Mongoose disconnected through ${msg}`);
        callback();
    });
};

// Para reinicios de nodemon
process.once('SIGUSR2', () => {
    gracefulShutdown('nodemon restart', () => {
        process.kill(process.pid, 'SIGUSR2');
    });
});

// Para terminación de la aplicación (Docker/Local)
process.on('SIGINT', () => {
    gracefulShutdown('app termination', () => {
        process.exit(0);
    });
});

// Para terminación en Heroku/Cloud
process.on('SIGTERM', () => {
    gracefulShutdown('Heroku app termination', () => {
        process.exit(0);
    });
});

// Registrar modelos
require('./players');
