const express = require('express');
const router = express.Router();
const ctrlPlayers = require('../controllers/players');
const ctrlComments = require('../controllers/comments');
const ctrlAuth = require('../controllers/auth');
const ctrlAI = require('../controllers/ai'); // Nuevo controlador de IA
const ctrlExternal = require('../controllers/external.controller'); // Nuevo controlador de API externa
const ctrlNews = require('../controllers/news'); // Controlador de noticias persistentes
const ctrlPublicComments = require('../controllers/public-comments'); // Nuevo controlador público
const ctrlGeocoding = require('../controllers/geocoding'); // Nuevo controlador de geocoding
const { authorizeRequest, isAdmin, isMaster } = require('../middleware/auth.middleware');

// --- RUTAS DE GEOCODING ---
/**
 * @openapi
 * /geo:
 *   get:
 *     summary: Geocodificación inversa - obtiene ubicación desde coordenadas
 *     description: Convierte coordenadas (lat, lng) en dirección legible
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitud
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitud
 *     responses:
 *       200:
 *         description: Ubicación obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 */
router.get('/geo', ctrlGeocoding.reverseGeocode);

// ... (en la sección de comentarios públicos)

/**
 * @openapi
 * /news:
 *   get:
 *     summary: Obtiene todas las noticias
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de noticias recuperada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/News'
 *   post:
 *     summary: Crea una nueva noticia (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/News'
 *     responses:
 *       201:
 *         description: Noticia creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/News'
 */
router.get('/news', authorizeRequest, ctrlNews.getNews);
router.post('/news', authorizeRequest, isAdmin, ctrlNews.createNews);

/**
 * @openapi
 * /news/{id}:
 *   get:
 *     summary: Obtiene una noticia por ID (Registrados)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Noticia encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/News'
 *       404:
 *         description: Noticia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   nullable: true
 *                   type: object
 *   put:
 *     summary: Actualiza una noticia (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/News'
 *     responses:
 *       200:
 *         description: Noticia actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/News'
 *   delete:
 *     summary: Elimina una noticia (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Noticia eliminada
 */
router.get('/news/featured', authorizeRequest, ctrlNews.getFeaturedNews);
router.get('/news/:id', authorizeRequest, ctrlNews.getNewsById);
router.put('/news/:id', authorizeRequest, isAdmin, ctrlNews.updateNews);
router.delete('/news/:id', authorizeRequest, isAdmin, ctrlNews.deleteNews);

// Rutas de carga masiva
/**
 * @openapi
 * /news/bulk:
 *   post:
 *     summary: Carga masiva de noticias (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/News'
 *     responses:
 *       201:
 *         description: Noticias creadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/News'
 */
router.post('/news/bulk', authorizeRequest, isAdmin, ctrlNews.bulkCreateNews);

/**
 * @openapi
 * /auth/signin:
 *   post:
 *     summary: Inicia sesión con Firebase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken: { type: string }
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: object
 */
router.post('/auth/signin', ctrlAuth.loginFirebase);

/**
 * @openapi
 * /auth/users:
 *   get:
 *     summary: Lista todos los usuarios (Master Only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/auth/users', authorizeRequest, isMaster, ctrlAuth.getUsers);
/**
 * @openapi
 * /auth/make-admin:
 *   post:
 *     summary: Asigna rol admin a un usuario (Master only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid: { type: string }
 *     responses:
 *       200:
 *         description: Rol asignado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: object
 */
router.post('/auth/make-admin', authorizeRequest, isMaster, ctrlAuth.setAdminRole);

/**
 * @openapi
 * /auth/remove-admin:
 *   post:
 *     summary: Quita rol admin a un usuario (Master only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid: { type: string }
 *     responses:
 *       200:
 *         description: Rol removido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: object
 */
router.post('/auth/remove-admin', authorizeRequest, isMaster, ctrlAuth.removeAdminRole);

/**
 * @openapi
 * /auth/toggle-status:
 *   post:
 *     summary: Alterna el estado de un usuario (Master only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid: { type: string }
 *     responses:
 *       200:
 *         description: Estado alternado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: object
 */
router.post('/auth/toggle-status', authorizeRequest, isMaster, ctrlAuth.toggleUserStatus);


/**
 * @openapi
 * /players:
 *   get:
 *     summary: Obtiene la lista de jugadores
 *     description: Retorna todos los jugadores o filtra por nombre, equipo o userId
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtrar por nombre (LIKE)
 *       - in: query
 *         name: team
 *         schema:
 *           type: string
 *         description: Filtrar por equipo
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filtrar por creador
 *     responses:
 *       200:
 *         description: Lista de jugadores encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Player'
 *   post:
 *     summary: Crea un nuevo jugador
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Player'
 *     responses:
 *       201:
 *         description: Jugador creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/Player'
 */
// --- RUTAS DE JUGADORES ---
/**
 * @openapi
 * /players/public:
 *   get:
 *     summary: Lista pública de jugadores (sin autenticación)
 *     responses:
 *       200:
 *         description: Lista pública de jugadores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Player'
 */
router.get('/players/public', ctrlPlayers.playersPublicList);

router
    .route('/players')
    .get(authorizeRequest, ctrlPlayers.playersList)
    .post(authorizeRequest, ctrlPlayers.playersCreate);


/**
 * @openapi
 * /players/all:
 *   get:
 *     summary: Obtiene la lista COMPLETA de jugadores de la DB
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de jugadores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Player'
 */
router.get('/players/all', authorizeRequest, ctrlPlayers.playersListAll);

/**
 * @openapi
 * /players/public/{playerid}:
 *   get:
 *     summary: Obtiene jugador público por ID
 *     parameters:
 *       - in: path
 *         name: playerid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Jugador público
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/Player'
 */
router.get('/players/public/:playerid', ctrlPlayers.playersReadOne);

router.route('/players/:playerid')
    .get(authorizeRequest, ctrlPlayers.playersReadOne)
    .put(authorizeRequest, ctrlPlayers.playersUpdateOne)
    .delete(authorizeRequest, ctrlPlayers.playersDeleteOne);

/**
 * @openapi
 * /players/public/{playerid}/comments:
 *   post:
 *     summary: Añade un comentario público a un jugador
 *     parameters:
 *       - in: path
 *         name: playerid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Comentario creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 */
router.post('/players/public/:playerid/comments', ctrlComments.commentsCreate);

/**
 * @openapi
 * /players/{playerid}/comments:
 *   post:
 *     summary: Crea un comentario (autenticado)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Comentario creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 */
router.route('/players/:playerid/comments')
    .post(authorizeRequest, ctrlComments.commentsCreate);

/**
 * @openapi
 * /players/{playerid}/comments/{commentid}:
 *   get:
 *     summary: Obtiene un comentario específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerid
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del comentario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *   put:
 *     summary: Actualiza un comentario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerid
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: Comentario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *   delete:
 *     summary: Elimina un comentario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerid
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Comentario eliminado
 */
router.route('/players/:playerid/comments/:commentid')
    .get(authorizeRequest, ctrlComments.commentsReadOne)
    .put(authorizeRequest, ctrlComments.commentsUpdateOne)
    .delete(authorizeRequest, ctrlComments.commentsDeleteOne);

/**
 * @openapi
 * /ai/analyze:
 *   post:
 *     summary: Análisis de equipo con IA
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Análisis generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: object
 */
router.post('/ai/analyze', authorizeRequest, ctrlAI.analyzeMyTeam);

/**
 * @openapi
 * /external/tsdb/search-players:
 *   get:
 *     summary: Buscar jugadores en TSDB
 *     description: Busca jugadores por nombre. El parámetro 'name' es OBLIGATORIO.
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del jugador a buscar (REQUERIDO)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jugadores encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TSDBPlayer'
 *       400:
 *         description: Parámetro 'name' es obligatorio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   nullable: true
 *                   type: object
 */
router.get('/external/tsdb/search-players', authorizeRequest, ctrlExternal.searchTSDBPlayers);

/**
 * @openapi
 * /external/tsdb/search-teams:
 *   get:
 *     summary: Buscar equipos en TSDB
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Equipos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TSDBTeam'
 */
router.get('/external/tsdb/search-teams', authorizeRequest, ctrlExternal.searchTSDBTeams);

/**
 * @openapi
 * /external/tsdb/search-players-team:
 *   get:
 *     summary: Buscar jugadores por nombre de equipo en TSDB
 *     parameters:
 *       - in: query
 *         name: team
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jugadores del equipo encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TSDBPlayer'
 */
router.get('/external/tsdb/search-players-team', authorizeRequest, ctrlExternal.searchTSDBPlayersByTeam);

/**
 * @openapi
 * /external/tsdb/team-players/{id}:
 *   get:
 *     summary: Obtener plantilla de un equipo (TSDB)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jugadores del equipo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TSDBPlayer'
 */
router.get('/external/tsdb/team-players/:id', authorizeRequest, ctrlExternal.getTSDBPlayersByTeam);

/**
 * @openapi
 * /external/tsdb/player/{id}:
 *   get:
 *     summary: Detalles de jugador en TSDB
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detalle del jugador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/TSDBPlayer'
 */
router.get('/external/tsdb/player/:id', authorizeRequest, ctrlExternal.getTSDBPlayerDetails);

/**
 * @openapi
 * /external/tsdb/team/{id}:
 *   get:
 *     summary: Detalles de equipo en TSDB
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detalle del equipo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   $ref: '#/components/schemas/TSDBTeam'
 */
router.get('/external/tsdb/team/:id', authorizeRequest, ctrlExternal.getTSDBTeamDetails);

/**
 * @openapi
 * /external/tsdb/search-leagues:
 *   get:
 *     summary: Buscar ligas en TSDB
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ligas encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TSDBLeague'
 */
router.get('/external/tsdb/search-leagues', authorizeRequest, ctrlExternal.searchTSDBLeagues);

/**
 * @openapi
 * /external/tsdb/tv-country/{country}:
 *   get:
 *     summary: Programación TV por país (TSDB)
 *     parameters:
 *       - in: path
 *         name: country
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eventos de TV
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/external/tsdb/tv-country/:country', authorizeRequest, ctrlExternal.getTSDBTVByCountry);

/**
 * @openapi
 * /external/tsdb/live:
 *   get:
 *     summary: Marcadores en vivo (TSDB)
 *     description: Obtiene los marcadores en vivo de los partidos actuales
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Marcadores en vivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LiveScore'
 */
router.get('/external/tsdb/live', authorizeRequest, ctrlExternal.getTSDBLiveScores);
/**
 * @openapi
 * /external/tsdb/teams-by-league/{id}:
 *   get:
 *     summary: Equipos por liga (TSDB)
 *     description: Obtiene todos los equipos que participan en una liga
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la liga (REQUERIDO)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Equipos de la liga
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TSDBTeam'
 */
router.get('/external/tsdb/teams-by-league/:id', authorizeRequest, ctrlExternal.getTSDBTeamsByLeague);

/**
 * @openapi
 * /external/tsdb/player-teams/{id}:
 *   get:
 *     summary: Carreras/equipos de un jugador (TSDB)
 *     description: Obtiene el historial de equipos en los que ha jugado un jugador
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del jugador (REQUERIDO)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Equipos del jugador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TSDBTeam'
 */
router.get('/external/tsdb/player-teams/:id', authorizeRequest, ctrlExternal.getTSDBPlayerTeams);

/**
 * @openapi
 * /external/tsdb/player-honours/{id}:
 *   get:
 *     summary: Honores de un jugador (TSDB)
 *     description: Obtiene el palmares y honores conseguidos por un jugador
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del jugador (REQUERIDO)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Honores del jugador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/external/tsdb/player-honours/:id', authorizeRequest, ctrlExternal.getTSDBPlayerHonours);

/**
 * @openapi
 * /external/tsdb/player-milestones/{id}:
 *   get:
 *     summary: Hitos de un jugador (TSDB)
 *     description: Obtiene los hitos y estadisticas importantes de un jugador
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del jugador (REQUERIDO)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hitos del jugador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ApiResultMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/external/tsdb/player-milestones/:id', authorizeRequest, ctrlExternal.getTSDBPlayerMilestones);

module.exports = router;
