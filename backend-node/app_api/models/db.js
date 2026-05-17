const mongoose = require('mongoose');

// Usamos la variable de entorno definida en el docker-compose o la local por defecto
let dbURI = process.env.MONGO_URL || 'mongodb://localhost:27017/football';

// Si estamos en modo TEST, ajustamos la URL para conectar desde el host y usar DB de test
if (process.env.NODE_ENV === 'test') {
    // En tests normalmente corremos fuera de Docker; si por entorno nos llega hostname de Compose, lo forzamos a localhost.
    dbURI = dbURI
        .replace('db-node', '127.0.0.1')
        .replace('football-mongo', '127.0.0.1');
    if (!dbURI.includes('_test')) {
        dbURI = `${dbURI}_test`;
    }
}

const connectOptions = {
    // Evita bloqueos largos cuando Mongo aún no está listo
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 5000,
    connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000,
};

const maxRetries = Number(process.env.MONGO_CONNECT_MAX_RETRIES) || 30;
const baseDelayMs = Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS) || 1000;

async function connectWithRetry() {
    let attempt = 0;

    while (true) {
        try {
            await mongoose.connect(dbURI, connectOptions);
            return;
        } catch (err) {
            attempt += 1;
            console.log(`[Mongoose] connection attempt ${attempt} failed:`, err?.message || err);

            // En tests preferimos fallar rápido (para no colgar Jest).
            if (process.env.NODE_ENV === 'test') {
                throw err;
            }

            if (attempt >= maxRetries) {
                console.log(`[Mongoose] giving up after ${maxRetries} attempts.`);
                // No tiramos el proceso; dejamos que el contenedor se reinicie o el operador actúe.
                return;
            }

            const delay = Math.min(baseDelayMs * attempt, 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

connectWithRetry().catch(err => {
    // En tests provocamos fallo inmediato y visible.
    if (process.env.NODE_ENV === 'test') {
        setImmediate(() => {
            throw err;
        });
        return;
    }
    console.log('[Mongoose] initial connection failed:', err);
});

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
require('./users');
