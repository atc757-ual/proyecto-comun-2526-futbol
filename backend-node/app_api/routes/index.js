const express = require('express');
const router = express.Router();
const ctrlPlayers = require('../controllers/players');
const ctrlComments = require('../controllers/comments');
const ctrlAuth = require('../controllers/auth');
const ctrlAI = require('../controllers/ai'); // Nuevo controlador de IA
const ctrlExternal = require('../controllers/external.controller'); // Nuevo controlador de API externa
const ctrlNews = require('../controllers/news'); // Controlador de noticias persistentes
const { authorizeRequest, isAdmin, isMaster } = require('../middleware/auth.middleware');

// --- RUTAS DE NOTICIAS ---
router.get('/news', ctrlNews.getNews);
router.get('/news/bulk', authorizeRequest, isAdmin, ctrlNews.bulkCreateNews); // Test GET bulk if needed or just use POST
router.post('/news/bulk', authorizeRequest, isAdmin, ctrlNews.bulkCreateNews);
router.get('/news/:id', ctrlNews.getNewsById);
router.post('/news', authorizeRequest, isAdmin, ctrlNews.createNews);
router.put('/news/:id', authorizeRequest, isAdmin, ctrlNews.updateNews);
router.delete('/news/:id', authorizeRequest, isAdmin, ctrlNews.deleteNews);

// --- RUTAS DE AUTENTICACIÓN ---
router.post('/auth/signin', ctrlAuth.loginFirebase);
router.post('/auth/make-admin', authorizeRequest, isMaster, ctrlAuth.setAdminRole);
router.post('/auth/remove-admin', authorizeRequest, isMaster, ctrlAuth.removeAdminRole);
router.get('/auth/users', authorizeRequest, isMaster, ctrlAuth.getUsers);
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
    .get(ctrlPlayers.playersList)
    .post((req, res, next) => { req.auth = { uid: "admin_uid" }; next(); }, ctrlPlayers.playersCreate);

/**
 * @openapi
 * /players/{playerid}:
 *   get:
 *     summary: Obtiene un jugador por ID
 *     parameters:
 *       - in: path
 *         name: playerid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del jugador
 *       404:
 *         description: Jugador no encontrado
 *   put:
 *     summary: Actualiza un jugador existente
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
 *             $ref: '#/components/schemas/Player'
 *     responses:
 *       200:
 *         description: Jugador actualizado
 *   delete:
 *     summary: Elimina un jugador
 *     parameters:
 *       - in: path
 *         name: playerid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Jugador eliminado
 */
router.route('/players/:playerid')
    .get(authorizeRequest, ctrlPlayers.playersReadOne)
    .put(authorizeRequest, isAdmin, ctrlPlayers.playersUpdateOne)
    .delete(authorizeRequest, isAdmin, ctrlPlayers.playersDeleteOne);

/**
 * @openapi
 * /players/{playerid}/comments:
 *   post:
 *     summary: Añade un comentario a un jugador
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
 *         description: Comentario añadido
 */
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
    .get(ctrlComments.commentsReadOne)
    .put(authorizeRequest, ctrlComments.commentsUpdateOne)
    .delete(authorizeRequest, ctrlComments.commentsDeleteOne);

// --- RUTA DE IA (Análisis de Equipo) ---
router.post('/ai/analyze', authorizeRequest, ctrlAI.analyzeMyTeam);

// --- RUTAS DE API EXTERNA (TheSportsDB) ---
router.get('/external/tsdb/search', authorizeRequest, ctrlExternal.searchTSDBPlayers);
router.get('/external/tsdb/search-teams', authorizeRequest, ctrlExternal.searchTSDBTeams);
router.get('/external/tsdb/team-players/:id', authorizeRequest, ctrlExternal.getTSDBPlayersByTeam);
router.get('/external/tsdb/player/:id', authorizeRequest, ctrlExternal.getTSDBPlayerDetails);
router.get('/external/tsdb/team/:id', authorizeRequest, ctrlExternal.getTSDBTeamDetails);
router.get('/external/tsdb/leagues', authorizeRequest, ctrlExternal.getTSDBLeagues);
router.get('/external/tsdb/search-leagues', authorizeRequest, ctrlExternal.searchTSDBLeagues);
router.get('/external/tsdb/tv/:sport', authorizeRequest, ctrlExternal.getTSDBTVBySport);
router.get('/external/tsdb/teams-by-league/:id', authorizeRequest, ctrlExternal.getTSDBTeamsByLeague);
router.get('/external/tsdb/player-teams/:id', authorizeRequest, ctrlExternal.getTSDBPlayerTeams);
router.get('/external/tsdb/player-honours/:id', authorizeRequest, ctrlExternal.getTSDBPlayerHonours);

module.exports = router;
