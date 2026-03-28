const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Ai là người đánh giá
        required: true 
    },
    field: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'SportField', // Đánh giá sân nào
        required: true 
    },
    rating: { type: Number, required: true, min: 1, max: 5 }, // Chấm điểm 1-5 sao
    comment: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);