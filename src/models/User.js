const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['Admin', 'Owner', 'Customer'], // 3 quyền cơ bản
        default: 'Customer' 
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true }); // Tự động tạo createdAt và updatedAt

module.exports = mongoose.model('User', userSchema);