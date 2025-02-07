const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    processHistory: [{
        date: { type: Date, default: Date.now },
        count: { type: Number, default: 1 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
