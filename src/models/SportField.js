const mongoose = require('mongoose');

const sportFieldSchema = new mongoose.Schema({
    name: { type: String, required: true }, // VD: "Sân Pickleball số 1"
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'FieldCategory', // Liên kết sang bảng Category
        required: true 
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Chủ sân là ai
        required: true
    },
    pricePerHour: { type: Number, required: true }, // Giá thuê 1 giờ
    images: [{ type: String }], // Mảng chứa các link ảnh
    location: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Active', 'Maintenance', 'Inactive'], // Đang mở, Bảo trì, Đóng cửa
        default: 'Active' 
    }
}, { timestamps: true });

module.exports = mongoose.model('SportField', sportFieldSchema);