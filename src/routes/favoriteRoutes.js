const express = require('express');
const router = express.Router();
const favoriteService = require('../services/favoriteService');
const { verifyToken } = require('../middlewares/authMiddleware');

// Like/Unlike sân
router.post('/toggle', verifyToken, async (req, res) => {
    try {
        const result = await favoriteService.toggleFavorite(req.user.id, req.body.fieldId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Xem danh sách đã lưu
router.get('/my', verifyToken, async (req, res) => {
    const favorites = await favoriteService.getMyFavorites(req.user.id);
    res.json(favorites);
});

module.exports = router;