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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ruta para la documentación Swagger (Registrar ANTES que la API)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Usar el enrutador de la API con el prefijo /api
app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Football Backend (Node.js) is running!',
    status: 'Database connected and API ready'
  });
});

// Captura de errores 404
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint no encontrado" });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;

