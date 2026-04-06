const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Lấy danh sách Owner
router.get('/owners', verifyToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const owners = await userService.getAllOwners();
        res.json({ data: owners });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Lấy danh sách Customer
router.get('/customers', verifyToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const customers = await userService.getAllCustomers();
        res.json({ data: customers });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Khóa / Mở tài khoản
router.put('/:id/toggle-active', verifyToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const user = await userService.toggleUserActive(req.params.id);
        res.json({ message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản', data: user });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
