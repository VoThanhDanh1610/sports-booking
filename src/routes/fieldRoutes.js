const express = require('express');
const router = express.Router();
const fieldService = require('../services/fieldService');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');


// ======================
// 1. LẤY DANH SÁCH SÂN
// ======================
router.get('/', async (req, res) => {
    try {
        const { city, district, category } = req.query;
        const fields = await fieldService.getAllFields({ city, district, category });
        res.status(200).json({ data: fields });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// ======================
// 2. LẤY SÂN CỦA OWNER ĐANG ĐĂNG NHẬP
// ======================
router.get('/my', verifyToken, authorizeRoles('Owner', 'Admin'), async (req, res) => {
    try {
        const fields = await fieldService.getMyFields(req.user.id);
        res.status(200).json({ data: fields });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// ======================
// 3. LẤY CHI TIẾT SÂN
// ======================
router.get('/:id', async (req, res) => {
    try {
        const field = await fieldService.getFieldById(req.params.id);
        res.status(200).json({ data: field });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});


// ======================
// 4. TẠO SÂN (có upload hoặc URL)
// ======================
router.post(
    '/',
    verifyToken,
    authorizeRoles('Admin', 'Owner'),
    upload.array('images'), // hỗ trợ upload nhiều ảnh
    async (req, res) => {
        try {
            // Ưu tiên file upload
            const imageUrls = (req.files && req.files.length > 0)
                ? req.files.map(file => `/uploads/${file.filename}`)
                : [].concat(req.body.images || []);

            const fieldData = {
                ...req.body,
                owner: req.user.id
            };

            const field = await fieldService.createField(fieldData, imageUrls, req.user.id, req.user.role);

            res.status(201).json({
                message: 'Tạo sân thành công',
                data: field
            });

        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
);


// ======================
// 4. UPDATE SÂN
// ======================
router.put(
    '/:id',
    verifyToken,
    authorizeRoles('Admin', 'Owner'),
    upload.array('images'),
    async (req, res) => {
        try {
            const imageUrls = (req.files && req.files.length > 0)
                ? req.files.map(file => `/uploads/${file.filename}`)
                : [].concat(req.body.images || []);

            const field = await fieldService.updateField(
                req.params.id,
                req.body,
                imageUrls,
                req.user.id,
                req.user.role
            );

            res.status(200).json({
                message: 'Cập nhật sân thành công',
                data: field
            });

        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
);


// ======================
// 5. XÓA SÂN
// ======================
router.delete(
    '/:id',
    verifyToken,
    authorizeRoles('Admin', 'Owner'),
    async (req, res) => {
        try {
            await fieldService.deleteField(req.params.id, req.user.id, req.user.role);
            res.status(200).json({ message: 'Đã xóa sân thành công!' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
);


// ======================
// 6. UPLOAD 1 ẢNH (Ant Design)
// ======================
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có file nào được gửi lên' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({ imageUrl });
});


module.exports = router;