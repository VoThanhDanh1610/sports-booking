const express = require('express');
const router = express.Router();
const categoryService = require('../services/categoryService');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// API Tạo danh mục (Bắt buộc đăng nhập VÀ phải là Admin hoặc Owner)
router.post('/', verifyToken, authorizeRoles('Admin', 'Owner'), async (req, res) => {
    try {
        const category = await categoryService.createCategory(req.body);
        res.status(201).json({ message: 'Tạo danh mục thành công', data: category });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// API Lấy danh sách (Không cần token, ai cũng xem được)
router.get('/', async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();
        res.status(200).json({ message: 'Lấy danh sách thành công', data: categories });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;