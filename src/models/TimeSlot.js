const mongoose = require('mongoose');

// Mỗi TimeSlot đại diện cho 1 khung giờ của 1 sân vào 1 ngày cụ thể
const timeSlotSchema = new mongoose.Schema({
    field: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SportField',
        required: true
    },
    date: {
        type: Date,    // Chỉ lưu ngày (normalize về 00:00:00 UTC)
        required: true
    },
    startTime: { type: String, required: true }, // VD: "08:00"
    endTime:   { type: String, required: true }, // VD: "09:00"
    status: {
        type: String,
        enum: ['available', 'booked'],
        default: 'available'
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        default: null
    }
}, { timestamps: true });

// Index để tránh trùng lặp slot và tăng tốc truy vấn
timeSlotSchema.index({ field: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
