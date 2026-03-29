const express = require('express');
const router  = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const paymentService = require('../services/paymentService');

// GET /api/payments/my — Lịch sử thanh toán của Customer
router.get('/my', verifyToken, authorizeRoles('Customer'), async (req, res) => {
    try {
        const payments = await paymentService.getMyPayments(req.user.id);
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/payments — Tất cả thanh toán (Admin)
router.get('/', verifyToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const payments = await paymentService.getAllPayments();
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
