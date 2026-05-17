/**
 * Archivo de Inicialización para MongoDB (football db)
 * Uso: mongosh mongodb://localhost:27017/football init-mongo.js
 */

db = db.getSiblingDB('football');

// Limpiar colecciones
db.players.drop();
db.users.drop();

print("Collections dropped.");

// Inicializar Usuarios (Admin de prueba)
db.users.insertMany([
  {
    uid: "admin_uid",
    email: "admin@scouting.com",
    role: "admin",
    is_active: true,
    blocked: false,
    created_at: new Date()
  }
]);

// Inicializar Jugadores con la nueva estructura completa
db.players.insertMany([
  {
    name: "Neymar Canhembe",
    fullname: "Amâncio João Pita Canhembe",
    age: 28,
    birth_date: "1997-11-16",
    birth_place: "Maputo",
    birth_country: "Mozambique",
    nationality: "Mozambique",
    height: "180 cm",
    weight: "70 kg",
    number: 8,
    position: "Midfielder",
    image_url: "https://media.api-sports.io/football/players/154833.png",
    team: "Custom Team",
    user_id: "admin_uid",
    created_at: new Date(),
    updated_at: new Date(),
    created_by: "admin@scouting.com",
    updated_by: "admin@scouting.com",
    status: true,
    summary: "Neymar Canhembe, conocido como Neymar, es un centrocampista mozambiqueño que destaca por su despliegue físico y visión de juego. Ha sido una pieza clave en su selección y en los clubes por los que ha pasado, demostrando una madurez táctica excepcional.",
    social_media: {
      facebook: "www.facebook.com/neymar.canhembe",
      instagram: "www.instagram.com/neymar_canhembe",
      twitter: "www.twitter.com/neymar_c",
      website: "www.neymarcanhembe.mz"
    },
    images: {
      thumb: "https://media.api-sports.io/football/players/154833.png",
      poster: "https://r2.thesportsdb.com/images/media/player/poster/4vgz4c1741866974.jpg",
      cutout: "https://r2.thesportsdb.com/images/media/player/cutout/e0i2051750317027.png",
      cartoon: "https://r2.thesportsdb.com/images/media/player/cartoon/kzz67d1768229024.png",
      banner: "https://r2.thesportsdb.com/images/media/player/banner/yzrspt1549398433.jpg"
    },
    tsdb_ids: {
      player_id: "154833",
      team_id: "1234",
      team2_id: "5678",
      league_id: "4321"
    },
    location: {
      type: "Point",
      coordinates: [32.5732, -25.9692]
    },
    comments: [
      {
        user_id: "firebase_uid_1",
        autor_name: "Alex",
        content: "El mejor de la historia 🐐",
        rating: 5,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: "admin@scouting.com",
        updated_by: "admin@scouting.com",
        status: true
      }
    ]
  }
]);

print("MongoDB Initialized with Complete Player Profile (DB: football).");
