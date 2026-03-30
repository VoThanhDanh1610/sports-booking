const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    field: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SportField',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    // Danh sách các TimeSlot đã đặt (nhiều khung giờ liên tiếp)
    timeSlots: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TimeSlot'
    }],
    startTime:  { type: String, required: true }, // VD: "08:00"
    endTime:    { type: String, required: true }, // VD: "10:00"
    totalPrice: { type: Number, required: true }, // pricePerHour * số giờ
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    note: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
