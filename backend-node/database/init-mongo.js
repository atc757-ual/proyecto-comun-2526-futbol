db = db.getSiblingDB('football');

db.players.drop();
db.comments.drop(); // Ya no usaremos esta colección por separado

// Inicializar Jugadores con sus comentarios embebidos (Patrón de subdocumentos TRWM)
db.players.insertMany([
  {
    name: "Lionel Messi",
    team: "Inter Miami",
    league: "MLS",
    image_url: "https://images.besoccer.com/player/lionel-messi.png",
    entry_date: "2024-01-01",
    user_id: "admin_uid",
    location: {
      type: "Point",
      coordinates: [-80.1918, 25.7617]
    },
    created_at: new Date(),
    comments: [
      {
        user_id: "firebase_uid_1",
        user_name: "Alex",
        content: "El mejor de la historia 🐐",
        rating: 5,
        location: {
          type: "Point",
          coordinates: [-3.7038, 40.4168]
        },
        created_at: new Date()
      }
    ]
  },
  {
    name: "Cristiano Ronaldo",
    team: "Al Nassr",
    league: "Saudi Pro League",
    image_url: "https://images.besoccer.com/player/cristiano-ronaldo.png",
    entry_date: "2024-01-01",
    user_id: "admin_uid",
    location: {
      type: "Point",
      coordinates: [46.6753, 24.7136]
    },
    created_at: new Date(),
    comments: [] // Empieza sin comentarios
  }
]);

console.log("MongoDB Initialized with Embedded Comments (TRWM Pattern).");
