db = db.getSiblingDB('football');

db.players.drop();
db.comments.drop();

// Inicializar Jugadores
db.players.insertMany([
  {
    name: "Erling Haaland",
    team: "Manchester City",
    league: "Premier League",
    image_url: "https://images.besoccer.com/player/erling-haaland.png",
    entry_date: "2024-01-01",
    location: {
      type: "Point",
      coordinates: [-2.2426, 53.4808] // [lng, lat] estándar en Mongo
    },
    created_at: new Date()
  },
  {
    name: "Jude Bellingham",
    team: "Real Madrid",
    league: "La Liga",
    image_url: "https://images.besoccer.com/player/jude-bellingham.png",
    entry_date: "2024-01-01",
    location: {
      type: "Point",
      coordinates: [-3.7038, 40.4168]
    },
    created_at: new Date()
  }
]);

// Obtener el ID de Haaland para el comentario de ejemplo
const haaland = db.players.findOne({ name: "Erling Haaland" });

// Inicializar Comentarios
db.comments.insertOne({
  player_id: haaland._id,
  user_id: "firebase_uid_1",
  user_name: "Alex",
  content: "Un animal del área 🤖⚽",
  rating: 5,
  location: {
    type: "Point",
    coordinates: [-3.7038, 40.4168]
  },
  created_at: new Date()
});

console.log("MongoDB Initialized with Players and Comments collections.");
