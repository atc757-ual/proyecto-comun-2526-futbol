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
            },
            {
                url: '/api',
                description: 'Proxy Nginx / producción (ruta relativa)'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                ApiResultMeta: {
                    type: 'object',
                    description: 'Metadatos estándar de la respuesta API',
                    properties: {
                        transactionId: { type: 'string', format: 'uuid' },
                        code: { type: 'string', description: 'Código HTTP como string' },
                        description: { type: 'string', enum: ['OK', 'NOK'] },
                        descriptionDetail: { type: 'string' },
                        responseTimestamp: { type: 'string', format: 'date-time' }
                    }
                },
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
                ,
                News: {
                    type: 'object',
                    required: ['title', 'body', 'author'],
                    properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        summary: { type: 'string' },
                        body: { type: 'string' },
                        author: { type: 'string' },
                        published_at: { type: 'string', format: 'date-time' }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        uid: { type: 'string' },
                        email: { type: 'string' },
                        displayName: { type: 'string' },
                        roles: { type: 'array', items: { type: 'string' } }
                    }
                },
                Location: {
                    type: 'object',
                    description: 'Ubicación geográfica con dirección',
                    properties: {
                        latitude: { type: 'number', description: 'Latitud' },
                        longitude: { type: 'number', description: 'Longitud' },
                        address: { type: 'string', description: 'Dirección legible' },
                        city: { type: 'string', description: 'Ciudad' },
                        country: { type: 'string', description: 'País' }
                    }
                },
                TSDBPlayer: {
                    type: 'object',
                    description: 'Jugador desde TSDB (base de datos externa)',
                    properties: {
                        id: { type: 'string', description: 'ID en TSDB' },
                        name: { type: 'string' },
                        team: { type: 'string' },
                        position: { type: 'string' },
                        nationality: { type: 'string' },
                        birth_date: { type: 'string', format: 'date' }
                    }
                },
                TSDBTeam: {
                    type: 'object',
                    description: 'Equipo desde TSDB',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        league: { type: 'string' },
                        country: { type: 'string' },
                        logo_url: { type: 'string' }
                    }
                },
                TSDBLeague: {
                    type: 'object',
                    description: 'Liga desde TSDB',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        country: { type: 'string' },
                        season: { type: 'string' }
                    }
                },
                LiveScore: {
                    type: 'object',
                    description: 'Marcador en vivo',
                    properties: {
                        match_id: { type: 'string' },
                        home_team: { type: 'string' },
                        away_team: { type: 'string' },
                        score: {
                            type: 'object',
                            properties: {
                                home: { type: 'integer' },
                                away: { type: 'integer' }
                            }
                        },
                        status: { type: 'string', enum: ['live', 'finished', 'upcoming'] },
                        start_time: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    },
    apis: ['./app_api/routes/*.js'] // Buscamos la documentación en las rutas
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
module.exports = swaggerDocs;
