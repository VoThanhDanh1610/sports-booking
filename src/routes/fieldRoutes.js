const express = require('express');
const router = express.Router();
const fieldService = require('../services/fieldService');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// 1. Lấy danh sách sân
router.get('/', async (req, res) => {
    try {

        // Ưu tiên file upload trực tiếp, nếu không thì dùng URLs đã upload sẵn từ body
        const imageUrls = (req.files && req.files.length > 0)
            ? req.files.map(file => `/uploads/${file.filename}`)
            : [].concat(req.body.images || []);
        
        // Lấy ID của người đang đăng nhập gắn làm Chủ sân (owner)
        const fieldData = {
            ...req.body,
            owner: req.user.id 
        };

        const field = await fieldService.createField(fieldData, imageUrls);

        const fields = await fieldService.getAllFields();
        res.status(200).json({ data: fields });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// 2. Lấy chi tiết 1 sân (QUAN TRỌNG: Để trang chi tiết hoạt động)
router.get('/:id', async (req, res) => {
    try {
        const field = await fieldService.getFieldById(req.params.id);
        res.status(200).json({ data: field });
    } catch (error) {
        res.status(404).json({ message: "Không tìm thấy thông tin sân!" });
    }
});

// 3. Tạo sân mới
router.post('/', verifyToken, authorizeRoles('Admin', 'Owner'), async (req, res) => {
    try {
        const fieldData = { ...req.body, owner: req.user.id };
        const field = await fieldService.createField(fieldData, req.body.images);
        res.status(201).json({ message: 'Tạo sân thành công', data: field });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// API Upload ảnh riêng (dùng cho Upload component ở Frontend)
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Không có file nào được gửi lên' });
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });
});

// API Lấy danh sách sân
router.get('/', async (req, res) => {

// 4. Cập nhật sân (PUT)
router.put('/:id', verifyToken, authorizeRoles('Admin', 'Owner'), async (req, res) => {

    try {
        const field = await fieldService.updateField(req.params.id, req.body);
        res.status(200).json({ message: 'Cập nhật thành công', data: field });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// API Lấy chi tiết 1 sân theo ID
router.get('/:id', async (req, res) => {
    try {
        const field = await fieldService.getFieldById(req.params.id);
        res.status(200).json({ message: 'Lấy chi tiết sân thành công', data: field });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// API Chỉnh sửa sân
router.put('/:id', verifyToken, authorizeRoles('Admin', 'Owner'), async (req, res) => {
    try {
        const imageUrls = [].concat(req.body.images || []);
        const field = await fieldService.updateField(req.params.id, req.body, imageUrls);
        res.status(200).json({ message: 'Cập nhật sân thành công', data: field });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// API Xóa Sân (Ứng dụng Transaction)

// 5. Xóa sân

router.delete('/:id', verifyToken, authorizeRoles('Admin', 'Owner'), async (req, res) => {
    try {
        await fieldService.deleteField(req.params.id);
        res.status(200).json({ message: 'Đã xóa sân thành công!' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 6. Cổng upload ảnh lẻ cho Ant Design
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Thiếu file!' });
    res.status(200).json({ imageUrl: `/uploads/${req.file.filename}` });
});

module.exports = router;