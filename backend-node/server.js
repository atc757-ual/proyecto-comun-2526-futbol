const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Requerir la conexión a la base de datos (esto carga los modelos y gestiona eventos)
require('./app_api/models/db');

const apiRouter = require('./app_api/routes/index');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./app_api/routes/api-docs');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-API-KEY', 
    'x-user-role', 'X-User-Role', 'x-transaction-id', 'X-Transaction-Id'
  ]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware de Tracing Correlacionado
const tracingMiddleware = require('./app_api/middleware/tracing');
app.use(tracingMiddleware);

// Ruta para la documentación Swagger (Registrar ANTES que la API)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Usar el enrutador de la API con el prefijo /api
app.use('/api', apiRouter);

const path = require('path');
const mongoose = require('mongoose');

// Configuración de Pug como motor de plantillas
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'app_api', 'views'));

app.get('/status.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'app_api', 'views', 'status.css'));
});

const renderStatusDashboard = async (req, res) => {
  try {
    const Player = mongoose.models.Player || mongoose.model('Player');
    const User = mongoose.models.User || mongoose.model('User');
    
    // Obtener métricas de la base de datos de forma segura
    let totalPlayers = 0;
    let totalComments = 0;
    let totalUsers = 0;
    
    if (mongoose.connection.readyState === 1) {
      totalPlayers = await Player.countDocuments({});
      totalUsers = await User.countDocuments({});
      
      // Sumar todos los comentarios anidados en los documentos de jugadores
      const players = await Player.find({}, 'comments');
      totalComments = players.reduce((sum, player) => sum + (player.comments ? player.comments.length : 0), 0);
    }
    
    // Calcular uptime del servidor
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
    
    // Estados de conexión de Mongoose
    const states = ['Desconectado', 'Conectado', 'Conectando', 'Desconectando'];
    const dbState = states[mongoose.connection.readyState] || 'Desconocido';
    const dbHost = mongoose.connection.host || 'Desconocido';
    const dbName = mongoose.connection.name || 'football';
    
    res.render('status', {
      port,
      env: process.env.NODE_ENV || 'development',
      uptime: uptimeStr,
      dbState,
      dbHost,
      dbName,
      totalPlayers,
      totalComments,
      totalUsers
    });
  } catch (error) {
    console.error('Error al renderizar el dashboard de estado:', error);
    res.status(500).send('Error interno del servidor al cargar el panel de estado');
  }
};

// Mantener visibilidad local y exponer ruta limpia para reverse proxy
app.get('/', renderStatusDashboard);
app.get('/status', renderStatusDashboard);


// Captura de errores 404
const { sendApiResult } = require('./app_api/controllers/apiResult');
app.use((req, res) => {
  sendApiResult(res, "404", "Endpoint no encontrado");
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  // --- MANEJO DE ERRORES GLOBALES PARA EVITAR CRASHES ---
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[SERVER-CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
    // No cerramos el proceso, solo lo logueamos para evitar caídas
  });

  process.on('uncaughtException', (err) => {
    console.error('[SERVER-CRITICAL] Uncaught Exception thrown:', err);
    // En producción podría hacerse un restart suave,  pero aquí evitamos que el servidor se detenga.
  });
}

module.exports = app;
