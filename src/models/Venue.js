const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    address:     { type: String, required: true },
    description: { type: String, default: '' },
    images:      [{ type: String }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Venue', venueSchema);
