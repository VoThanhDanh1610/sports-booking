const express = require('express');
const router = express.Router();
const reviewService = require('../services/reviewService');
const { verifyToken } = require('../middlewares/authMiddleware');

// Lấy danh sách đánh giá theo sân
router.get('/field/:fieldId', async (req, res) => {
    try {
        const reviews = await reviewService.getReviewsByField(req.params.fieldId);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API Gửi đánh giá (Bắt buộc phải đăng nhập - verifyToken)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { field, rating, comment } = req.body;
        // req.user.id có được là nhờ middleware verifyToken dịch từ Token ra
        const review = await reviewService.createReview(req.user.id, field, rating, comment);
        
        res.status(201).json({ message: 'Đánh giá thành công!', data: review });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;