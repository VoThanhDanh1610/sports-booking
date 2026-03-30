const Review = require('../models/Review');

const createReview = async (userId, fieldId, rating, comment) => {
    // Tạo đánh giá mới gắn với ID người dùng và ID sân
    const newReview = new Review({
        user: userId,
        field: fieldId,
        rating: rating,
        comment: comment
    });
    return await newReview.save();
};

module.exports = { createReview };