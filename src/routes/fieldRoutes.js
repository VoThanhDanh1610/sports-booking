const express = require('express');
const router = express.Router();
const fieldService = require('../services/fieldService');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// API Tạo sân mới (Chỉ Admin/Owner được tạo, cho phép upload ảnh)
router.post('/', verifyToken, authorizeRoles('Admin', 'Owner'), upload.array('images', 5), async (req, res) => {
    try {
        // Lấy đường dẫn các file đã được multer lưu lại
        const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        
        // Lấy ID của người đang đăng nhập gắn làm Chủ sân (owner)
        const fieldData = {
            ...req.body,
            owner: req.user.id 
        };

        const field = await fieldService.createField(fieldData, imageUrls);

        // Phát thông báo real-time cho tất cả client đang kết nối (sử dụng Socket.IO)
        console.log('📢 Chuẩn bị bắn thông báo Socket...');
        req.io.emit('new_field', {
            message: `Sân mới "${field.name}" vừa được thêm vào hệ thống!`,
            fieldId: field._id
        });
        console.log('✅ Đã bắn thông báo xong!');

        res.status(201).json({ message: 'Tạo sân thành công', data: field });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// API Lấy danh sách sân
router.get('/', async (req, res) => {
    try {
        const fields = await fieldService.getAllFields();
        res.status(200).json({ message: 'Lấy danh sách sân thành công', data: fields });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// API Xóa Sân (Ứng dụng Transaction)
router.delete('/:id', verifyToken, authorizeRoles('Admin', 'Owner'), async (req, res) => {
    try {
        const fieldId = req.params.id; // Lấy ID của sân cần xóa từ URL
        await fieldService.deleteField(fieldId);
        res.status(200).json({ message: 'Đã xóa sân và toàn bộ đánh giá liên quan thành công!' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;