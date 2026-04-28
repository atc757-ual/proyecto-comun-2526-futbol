-- Borrar tablas si existen para reiniciar limpiamente (Postgres syntax)
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS players;

-- Tabla de Jugadores
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team VARCHAR(100) NOT NULL,
    league VARCHAR(100),
    image_url TEXT,
    entry_date DATE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    user_id VARCHAR(128) NOT NULL, -- Agregado para coincidir con la entidad Java
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Comentarios
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    user_id VARCHAR(128) NOT NULL, -- UID de Firebase
    user_name VARCHAR(100),         -- Nombre para mostrar (opcional)
    content VARCHAR(1000) NOT NULL,
    rating INTEGER CHECK (rating >= 0 AND rating <= 5),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Datos de ejemplo (Añadido user_id a players)
INSERT INTO players (name, team, league, image_url, entry_date, latitude, longitude, user_id) VALUES 
('Lionel Messi', 'Inter Miami', 'MLS', 'https://images.besoccer.com/player/lionel-messi.png', '2024-01-01', 25.7617, -80.1918, 'admin_uid'),
('Cristiano Ronaldo', 'Al Nassr', 'Saudi Pro League', 'https://images.besoccer.com/player/cristiano-ronaldo.png', '2024-01-01', 24.7136, 46.6753, 'admin_uid');

INSERT INTO comments (player_id, user_id, user_name, content, rating, latitude, longitude) VALUES 
(1, 'firebase_uid_1', 'Alex', 'El mejor de la historia 🐐', 5, 40.4168, -3.7038);
