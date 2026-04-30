const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    picture: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    blocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// El modelo ya no necesita pre-save para password ni métodos de comparación
// ya que Firebase se encarga de la seguridad de la contraseña.

mongoose.model('User', userSchema);
