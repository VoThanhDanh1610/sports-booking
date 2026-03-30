const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType:   { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue:  { type: Number, required: true },
    minOrderValue:  { type: Number, default: 0 },
    maxUsage:       { type: Number, required: true },
    usedCount:      { type: Number, default: 0 },
    expiresAt:      { type: Date, required: true },
    isActive:       { type: Boolean, default: true },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);
