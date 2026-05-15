const mongoose = require('mongoose');

// Esquema de Comentarios (Subdocumento)
const commentSchema = new mongoose.Schema({
    user_id: { type: String },
    autor_name: String, // Cambiado de user_name a autor_name
    content: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' }
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    created_by: String,
    updated_by: String,
    status: { type: Boolean, default: true }
});


// Esquema de Estadio (Venue)
const venueSchema = new mongoose.Schema({
    external_id: Number,
    name: String,
    address: String,
    city: String,
    capacity: Number,
    surface: String,
    image: String
});

// Esquema de Equipo (Para Historial o Actual)
const teamHistorySchema = new mongoose.Schema({
    external_id: Number,
    name: String,
    logo: String,
    country: String,
    founded: Number,
    venue: venueSchema // Cada equipo tiene su estadio
});

// Esquema de Trofeos (Subdocumento)
const trophySchema = new mongoose.Schema({
    league: String,
    country: String,
    season: String,
    place: String
});

// Esquema de Lesiones (Subdocumento)
const injurySchema = new mongoose.Schema({
    type: String,
    reason: String,
    team: String,
    fixture: String
});

// Esquema de Jugadores (Documento Principal)
const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    fullname: String,
    team: { type: String, required: true },
    secondary_team: String,
    league: String,
    age: Number,
    birth_date: String,
    birth_place: String,
    birth_country: String,
    nationality: String,
    height: String,
    weight: String,
    number: Number,
    position: String,
    side: String, // Pie hábil (Left, Right, Both)
    image_url: String,
    user_id: { type: String, required: true },
    external_id: Number, // Para vincular con API-Football
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' }
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    created_by: String,
    updated_by: String,
    status: { type: Boolean, default: true },
    summary: String,
    social_media: {
        facebook: String,
        instagram: String,
        twitter: String,
        website: String
    },
    images: {
        thumb: String,
        poster: String,
        cutout: String,
        cartoon: String,
        banner: String,
        render: String // Imagen transparente
    },
    tsdb_ids: {
        player_id: String,
        team_id: String,
        team_id2: String,
        league_id: String,
        transfermarkt_id: String,
        espn_id: String,
        wikidata_id: String
    },
    is_manual: { type: Boolean, default: true },
    isFavorite: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    comments: [commentSchema]
});

// Compilar el modelo
mongoose.model('Player', playerSchema);
