const express = require('express');
const router = express.Router();
const venueService = require('../services/venueService');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Upload ảnh venue
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Không có file nào được gửi lên' });
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Lấy tất cả venue (public)
router.get('/', async (req, res) => {
    try {
        const venues = await venueService.getAllVenues();
        res.json({ data: venues });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Lấy venue của Owner đang đăng nhập
router.get('/my', verifyToken, authorizeRoles('Owner', 'Admin'), async (req, res) => {
    try {
        const venues = await venueService.getMyVenues(req.user.id);
        res.json({ data: venues });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Lấy chi tiết venue (public)
router.get('/:id', async (req, res) => {
    try {
        const venue = await venueService.getVenueById(req.params.id);
        res.json({ data: venue });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
});

// Lấy danh sách sân trong venue (public)
router.get('/:id/fields', async (req, res) => {
    try {
        const fields = await venueService.getFieldsByVenue(req.params.id);
        res.json({ data: fields });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Tạo venue mới
router.post('/', verifyToken, authorizeRoles('Owner', 'Admin'), upload.array('images'), async (req, res) => {
    try {
        const imageUrls = (req.files && req.files.length > 0)
            ? req.files.map(f => `/uploads/${f.filename}`)
            : [].concat(req.body.images || []);
        const venue = await venueService.createVenue({ ...req.body, owner: req.user.id }, imageUrls);
        res.status(201).json({ message: 'Tạo khu thể thao thành công', data: venue });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Cập nhật venue
router.put('/:id', verifyToken, authorizeRoles('Owner', 'Admin'), upload.array('images'), async (req, res) => {
    try {
        const imageUrls = (req.files && req.files.length > 0)
            ? req.files.map(f => `/uploads/${f.filename}`)
            : [].concat(req.body.images || []);
        const venue = await venueService.updateVenue(req.params.id, req.user.id, req.user.role, req.body, imageUrls);
        res.json({ message: 'Cập nhật thành công', data: venue });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Xóa venue
router.delete('/:id', verifyToken, authorizeRoles('Owner', 'Admin'), async (req, res) => {
    try {
        await venueService.deleteVenue(req.params.id, req.user.id, req.user.role);
        res.json({ message: 'Đã xóa khu thể thao' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
