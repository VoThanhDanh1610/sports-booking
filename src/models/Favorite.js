const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    field: { type: mongoose.Schema.Types.ObjectId, ref: 'SportField', required: true }
}, { timestamps: true });

// Tránh việc 1 user tim 1 sân 2 lần
favoriteSchema.index({ user: 1, field: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);