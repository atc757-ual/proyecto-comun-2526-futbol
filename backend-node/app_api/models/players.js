const mongoose = require('mongoose');

// Esquema de Comentarios (Subdocumento)
const commentSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    user_name: String,
    content: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' }
    },
    created_at: { type: Date, default: Date.now }
});

// Esquema de Jugadores (Documento Principal)
const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    team: { type: String, required: true },
    league: String,
    image_url: String,
    entry_date: String,
    user_id: { type: String, required: true },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' }
    },
    created_at: { type: Date, default: Date.now },
    comments: [commentSchema] // Array de subdocumentos estilo TRWM
});

// Compilar el modelo
mongoose.model('Player', playerSchema);
