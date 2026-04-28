const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Jugadores de Fútbol',
            version: '1.0.0',
            description: 'API para gestionar jugadores y comentarios (Stack Node.js - TRWM)',
            contact: {
                name: 'Soporte API Fútbol',
                email: 'soporte@futbolapp.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Servidor de desarrollo'
            }
        ],
        components: {
            schemas: {
                Comment: {
                    type: 'object',
                    required: ['user_id', 'content', 'rating'],
                    properties: {
                        user_id: { type: 'string', description: 'ID del usuario que comenta' },
                        user_name: { type: 'string', description: 'Nombre del usuario' },
                        content: { type: 'string', description: 'Contenido del comentario' },
                        rating: { type: 'number', minimum: 0, maximum: 5, description: 'Puntuación' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Player: {
                    type: 'object',
                    required: ['name', 'team', 'user_id'],
                    properties: {
                        id: { type: 'string', description: 'ID autogenerado' },
                        name: { type: 'string', description: 'Nombre del jugador' },
                        team: { type: 'string', description: 'Equipo actual' },
                        league: { type: 'string', description: 'Liga' },
                        image_url: { type: 'string', description: 'URL de la foto' },
                        user_id: { type: 'string', description: 'ID del creador' },
                        comments: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Comment' }
                        }
                    }
                }
            }
        }
    },
    apis: ['./app_api/routes/*.js'] // Buscamos la documentación en las rutas
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
module.exports = swaggerDocs;
