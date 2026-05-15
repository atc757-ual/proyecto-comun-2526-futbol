const express = require('express');
const router = express.Router();
const ctrlPlayers = require('../controllers/players');
const ctrlComments = require('../controllers/comments');
const ctrlAuth = require('../controllers/auth');
const ctrlAI = require('../controllers/ai'); // Nuevo controlador de IA
const ctrlExternal = require('../controllers/external.controller'); // Nuevo controlador de API externa
const ctrlNews = require('../controllers/news'); // Controlador de noticias persistentes
const ctrlPublicComments = require('../controllers/public-comments'); // Nuevo controlador público
const { authorizeRequest, isAdmin, isMaster } = require('../middleware/auth.middleware');

// ... (en la sección de comentarios públicos)

/**
 * @openapi
 * /news:
 *   get:
 *     summary: Obtiene todas las noticias
 *     responses:
 *       200:
 *         description: Lista de noticias recuperada
 *   post:
 *     summary: Crea una noticia (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               summary: { type: string }
 *               imageUrl: { type: string }
 *     responses:
 *       201:
 *         description: Noticia creada
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
...
 */
router.get('/news/:id', authorizeRequest, ctrlNews.getNewsById);
router.put('/news/:id', authorizeRequest, isAdmin, ctrlNews.updateNews);
router.delete('/news/:id', authorizeRequest, isAdmin, ctrlNews.deleteNews);

// Rutas de carga masiva
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
 */
router.get('/auth/users', authorizeRequest, isMaster, ctrlAuth.getUsers);
router.post('/auth/make-admin', authorizeRequest, isMaster, ctrlAuth.setAdminRole);
router.post('/auth/remove-admin', authorizeRequest, isMaster, ctrlAuth.removeAdminRole);
router.post('/auth/toggle-status', authorizeRequest, isMaster, ctrlAuth.toggleUserStatus);

// --- SERVICIO DE CARGA (Desactivado temporalmente) ---
// router.get('/db-load', ctrlOthers.dbLoad);

/**
 * @openapi
 * /players:
 *   get:
 *     summary: Obtiene la lista de jugadores
 *     description: Retorna todos los jugadores o filtra por nombre, equipo o userId
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Player'
 *   post:
 *     summary: Crea un nuevo jugador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Player'
 *     responses:
 *       201:
 *         description: Jugador creado exitosamente
 */
// --- RUTAS DE JUGADORES ---
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
 */
router.get('/players/all', authorizeRequest, ctrlPlayers.playersListAll);

router.get('/players/public/:playerid', ctrlPlayers.playersReadOne);

router.route('/players/:playerid')
    .get(authorizeRequest, ctrlPlayers.playersReadOne)
    .put(authorizeRequest, ctrlPlayers.playersUpdateOne)
    .delete(authorizeRequest, ctrlPlayers.playersDeleteOne);

router.post('/players/public/:playerid/comments', ctrlComments.commentsCreate);

router.route('/players/:playerid/comments')
    .post(authorizeRequest, ctrlComments.commentsCreate);

/**
 * @openapi
 * /players/{playerid}/comments/{commentid}:
 *   get:
 *     summary: Obtiene un comentario específico
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
 *   put:
 *     summary: Actualiza un comentario
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
 *   delete:
 *     summary: Elimina un comentario
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
 */
router.post('/ai/analyze', authorizeRequest, ctrlAI.analyzeMyTeam);

/**
 * @openapi
 * /external/tsdb/search:
 *   get:
 *     summary: Buscar jugadores en TSDB
 *     security:
 *       - bearerAuth: []
 */
router.get('/external/tsdb/search', authorizeRequest, ctrlExternal.searchTSDBPlayers);
router.get('/external/tsdb/search-teams', authorizeRequest, ctrlExternal.searchTSDBTeams);
router.get('/external/tsdb/search-players-team', authorizeRequest, ctrlExternal.searchTSDBPlayersByTeam);
router.get('/external/tsdb/team-players/:id', authorizeRequest, ctrlExternal.getTSDBPlayersByTeam);
router.get('/external/tsdb/player/:id', authorizeRequest, ctrlExternal.getTSDBPlayerDetails);
router.get('/external/tsdb/team/:id', authorizeRequest, ctrlExternal.getTSDBTeamDetails);
router.get('/external/tsdb/leagues', authorizeRequest, ctrlExternal.getTSDBLeagues);
router.get('/external/tsdb/search-leagues', authorizeRequest, ctrlExternal.searchTSDBLeagues);
router.get('/external/tsdb/tv-country/:country', authorizeRequest, ctrlExternal.getTSDBTVByCountry);

/**
 * @openapi
 * /external/tsdb/live:
 *   get:
 *     summary: Marcadores en vivo (TSDB)
 *     security:
 *       - bearerAuth: []
 */
router.get('/external/tsdb/live', authorizeRequest, ctrlExternal.getTSDBLiveScores);
router.get('/external/tsdb/teams-by-league/:id', authorizeRequest, ctrlExternal.getTSDBTeamsByLeague);
router.get('/external/tsdb/player-teams/:id', authorizeRequest, ctrlExternal.getTSDBPlayerTeams);
router.get('/external/tsdb/player-honours/:id', authorizeRequest, ctrlExternal.getTSDBPlayerHonours);
router.get('/external/tsdb/player-milestones/:id', authorizeRequest, ctrlExternal.getTSDBPlayerMilestones);

module.exports = router;
