const mongoose = require('mongoose');

const automationRequestSchema = new mongoose.Schema({
    direction: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' }
});

module.exports = mongoose.model('AutomationRequest', automationRequestSchema);
