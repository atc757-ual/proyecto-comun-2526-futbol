const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../server");
const Player = mongoose.model("Player");
const User = mongoose.model("User");
const { reqAddPlayer, reqAddComment, reqUpdateComment } = require("./utils/testfixtures/player.test.data");
const { generateJWT } = require("../utils/jwt.util");

let adminToken;

jest.setTimeout(30000);

describe("CRUD de Comentarios", () => {
    let playerId;

    // Antes de cada test, crear un jugador para tener donde comentar
    beforeEach(async () => {
        // Asegurarnos de que estamos conectados
        if (mongoose.connection.readyState !== 1) {
            await new Promise(resolve => mongoose.connection.once('connected', resolve));
        }
        await Player.deleteMany({});
        await User.deleteMany({});
        
        // Crear usuario admin para que el middleware lo encuentre
        await User.create({
            firebaseUid: "admin_uid",
            name: "Admin Test",
            email: "admin@test.com",
            role: "admin",
            is_active: true,
            blocked: false
        });

        const player = await Player.create(reqAddPlayer);
        playerId = player._id;
        
        // Generar un token para las pruebas
        adminToken = generateJWT("admin_uid", "admin");
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test("Debería añadir un comentario (POST /api/players/:playerid/comments)", async () => {
        const response = await request(app)
            .post(`/api/players/${playerId}/comments`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(reqAddComment)
            .expect(201);
            
        expect(response.body.data.content).toBe(reqAddComment.content);
        expect(response.body.data.user_id).toBe(reqAddComment.user_id);
    });

    test("Debería obtener un comentario específico (GET /api/players/:playerid/comments/:commentid)", async () => {
        // Primero añadimos un comentario
        const player = await Player.findById(playerId);
        player.comments.push(reqAddComment);
        const savedPlayer = await player.save();
        const commentId = savedPlayer.comments[savedPlayer.comments.length - 1]._id;

        const response = await request(app)
            .get(`/api/players/${playerId}/comments/${commentId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
            
        expect(response.body.data.content).toBe(reqAddComment.content);
    });

    test("Debería actualizar un comentario (PUT /api/players/:playerid/comments/:commentid)", async () => {
        const player = await Player.findById(playerId);
        player.comments.push(reqAddComment);
        const savedPlayer = await player.save();
        const commentId = savedPlayer.comments[savedPlayer.comments.length - 1]._id;

        const response = await request(app)
            .put(`/api/players/${playerId}/comments/${commentId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(reqUpdateComment)
            .expect(200);
            
        expect(response.body.data.content).toBe(reqUpdateComment.content);
        expect(response.body.data.rating).toBe(reqUpdateComment.rating);
    });

    test("Debería eliminar un comentario (DELETE /api/players/:playerid/comments/:commentid)", async () => {
        const player = await Player.findById(playerId);
        player.comments.push(reqAddComment);
        const savedPlayer = await player.save();
        const commentId = savedPlayer.comments[savedPlayer.comments.length - 1]._id;

        await request(app)
            .delete(`/api/players/${playerId}/comments/${commentId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(204);
            
        const updatedPlayer = await Player.findById(playerId);
        expect(updatedPlayer.comments.length).toBe(0);
    });
});
