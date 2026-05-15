const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../server"); // Al importar server, ya se ejecuta db.js y se conecta
const Player = mongoose.model("Player");
const User = mongoose.model("User");
const { reqAddPlayer, reqUpdatePlayer } = require("./utils/testfixtures/player.test.data");
const { generateJWT } = require("../utils/jwt.util");

let adminToken = generateJWT("admin_uid", "admin");



jest.setTimeout(30000); // 30 segundos de margen global

// Limpiar las colecciones antes de cada prueba para tener tests aislados
beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
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
    }
});

// Desconectar después de todas las pruebas para no dejar hilos abiertos
afterAll(async () => {
    await mongoose.connection.close();
});

// --- PRUEBAS DE LA API ---

describe("CRUD de Jugadores", () => {
    
    // Prueba de creación
    test("Debería crear un nuevo jugador (POST /api/players)", async () => {
        const response = await request(app)
            .post("/api/players")
            .set('Authorization', `Bearer ${adminToken}`)
            .send(reqAddPlayer)
            .expect(201);
            
        expect(response.body.data.name).toBe(reqAddPlayer.name);
    });

    // Prueba de obtención de todos los PROPIOS
    test("Debería retornar la lista de jugadores PROPIOS (GET /api/players)", async () => {
        // El middleware de test inyecta 'test-user-id'
        await Player.create({ ...reqAddPlayer, user_id: 'test-user-id' });
        
        const response = await request(app)
            .get("/api/players")
            .expect('Content-Type', /json/)
            .expect(200);
            
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].user_id).toBe('test-user-id');
    });

    // Prueba de obtención de todos (Base de datos global)
    test("Debería retornar la lista COMPLETA de jugadores (GET /api/players/all)", async () => {
        await Player.create(reqAddPlayer); // user_id: test_user_123
        await Player.create({ ...reqAddPlayer, name: "Otro Jugador", user_id: "otro_id" });
        
        const response = await request(app)
            .get("/api/players/all")
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
            
        expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    // Prueba de obtención de un jugador específico
    test("Debería retornar un jugador por ID (GET /api/players/:playerid)", async () => {
        const newPlayer = await Player.create(reqAddPlayer);
        
        const response = await request(app)
            .get(`/api/players/${newPlayer._id}`)
            .expect(200)
            .expect('Content-Type', /application\/json/);
            
        expect(response.body.data.name).toBe(reqAddPlayer.name);
    });

    // --- TESTS DE CONTROL DE ERRORES ---

    test("Debería retornar 404 si el jugador no existe (GET /api/players/:playerid)", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        await request(app)
            .get(`/api/players/${fakeId}`)
            .expect(404);
    });

    test("Debería retornar error de validación si faltan datos (POST /api/players)", async () => {
        const invalidPlayer = { name: "" }; // Sin equipo ni userId
        const response = await request(app)
            .post("/api/players")
            .set('Authorization', `Bearer ${adminToken}`)
            .send(invalidPlayer)
            .expect(400); // Bad Request
            
        expect(response.body.result.descriptionDetail).toBeDefined();
    });

    // Prueba de actualización
    test("Debería actualizar un jugador existente (PUT /api/players/:playerid)", async () => {
        const newPlayer = await Player.create(reqAddPlayer);
        
        const response = await request(app)
            .put(`/api/players/${newPlayer._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(reqUpdatePlayer)
            .expect(200);
            
        expect(response.body.data.name).toBe(reqUpdatePlayer.name);
        expect(response.body.data.team).toBe(reqUpdatePlayer.team);
    });

    // Prueba de eliminación
    test("Debería eliminar un jugador (DELETE /api/players/:playerid)", async () => {
        const newPlayer = await Player.create(reqAddPlayer);
        
        await request(app)
            .delete(`/api/players/${newPlayer._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(204);
            
        const deletedPlayer = await Player.findById(newPlayer._id);
        expect(deletedPlayer).toBeNull();
    });
});
