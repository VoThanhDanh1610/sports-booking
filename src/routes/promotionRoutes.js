const express = require('express');
const router  = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const promotionService = require('../services/promotionService');

// POST /api/promotions/verify — Kiểm tra mã giảm giá (Customer)
router.post('/verify', verifyToken, authorizeRoles('Customer'), async (req, res) => {
    try {
        const { code, orderValue } = req.body;
        if (!code || !orderValue) return res.status(400).json({ message: 'Thiếu code hoặc orderValue' });
        const result = await promotionService.verifyPromoCode(code, orderValue);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /api/promotions — Tất cả mã (Owner)
router.get('/', verifyToken, authorizeRoles('Owner'), async (req, res) => {
    try {
        const promos = await promotionService.getAllPromotions();
        res.json(promos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/promotions — Tạo mã mới (Owner)
router.post('/', verifyToken, authorizeRoles('Owner'), async (req, res) => {
    try {
        const promo = await promotionService.createPromotion(req.body, req.user.id);
        res.status(201).json(promo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/promotions/:id/toggle — Bật/tắt mã (Owner)
router.put('/:id/toggle', verifyToken, authorizeRoles('Owner'), async (req, res) => {
    try {
        const promo = await promotionService.togglePromotion(req.params.id);
        res.json(promo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/promotions/:id — Xóa mã (Owner)
router.delete('/:id', verifyToken, authorizeRoles('Owner'), async (req, res) => {
    try {
        await promotionService.deletePromotion(req.params.id);
        res.json({ message: 'Đã xóa mã giảm giá' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
