const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

// API Đăng ký
router.post('/register', async (req, res) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({ message: 'Đăng ký thành công', data: user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// API Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.status(200).json({ message: 'Đăng nhập thành công', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;