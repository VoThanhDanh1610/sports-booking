const mongoose = require('mongoose');

const fieldCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // VD: "Sân Pickleball"
    description: { type: String },
    iconUrl: { type: String } // Link ảnh icon nếu có
}, { timestamps: true });

module.exports = mongoose.model('FieldCategory', fieldCategorySchema);