const express = require('express');
const router  = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const paymentService = require('../services/paymentService');

// POST /api/payments/create-link — Customer tạo link thanh toán PayOS
router.post('/create-link', verifyToken, authorizeRoles('Customer'), async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!bookingId) return res.status(400).json({ message: 'Thiếu bookingId' });
        const result = await paymentService.createPaymentLink(bookingId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST /api/payments/webhook — PayOS gọi khi thanh toán xong (không cần auth)
router.post('/webhook', async (req, res) => {
    try {
        const data = await paymentService.handlePayOSWebhook(req.body);
        res.json({ success: true, data });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// GET /api/payments/confirm-return?orderCode=xxx — Frontend gọi sau khi PayOS redirect về
router.get('/confirm-return', async (req, res) => {
    try {
        const { orderCode } = req.query;
        if (!orderCode) return res.status(400).json({ message: 'Thiếu orderCode' });
        const result = await paymentService.confirmReturnPayment(orderCode);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

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
