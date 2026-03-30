const Review = require('../models/Review');

const createReview = async (userId, fieldId, rating, comment) => {
    const newReview = new Review({ user: userId, field: fieldId, rating, comment });
    return await newReview.save();
};

const getReviewsByField = async (fieldId) => {
    return Review.find({ field: fieldId })
        .populate('user', 'fullName')
        .sort({ createdAt: -1 });
};

module.exports = { createReview, getReviewsByField };