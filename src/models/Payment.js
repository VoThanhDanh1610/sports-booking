const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true // mỗi booking chỉ có 1 payment record
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount:             { type: Number, required: true },
    type:               { type: String, enum: ['payment', 'refund'], default: 'payment' },
    status:             { type: String, enum: ['pending_payment', 'completed', 'cancelled'], default: 'pending_payment' },
    note:               { type: String, default: '' },
    payosOrderCode:     { type: Number, unique: true, sparse: true },
    payosPaymentLinkId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
