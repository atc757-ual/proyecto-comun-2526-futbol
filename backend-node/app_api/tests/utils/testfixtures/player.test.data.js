const reqAddPlayer = {
    name: "Lionel Messi Test",
    team: "Inter Miami Test",
    league: "MLS",
    image_url: "https://example.com/messi.jpg",
    user_id: "test_user_123",
    location: {
        type: "Point",
        coordinates: [-80.128, 25.761]
    }
};

const reqUpdatePlayer = {
    name: "Lionel Messi Updated",
    team: "Inter Miami Updated",
    league: "MLS",
    image_url: "https://example.com/messi_updated.jpg"
};

const reqAddComment = {
    user_id: "comment_user_456",
    user_name: "Juan Perez",
    content: "Excelente jugador, muy habilidoso.",
    rating: 5,
    location: {
        type: "Point",
        coordinates: [-80.128, 25.761]
    }
};

const reqUpdateComment = {
    content: "Contenido actualizado del comentario.",
    rating: 4
};

module.exports = {
    reqAddPlayer,
    reqUpdatePlayer,
    reqAddComment,
    reqUpdateComment
};
