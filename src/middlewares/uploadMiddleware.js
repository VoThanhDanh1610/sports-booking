const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu file và tên file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Lưu thẳng vào thư mục uploads vừa tạo
    },
    filename: function (req, file, cb) {
        // Đổi tên file thành timestamp để không bị trùng tên (VD: 169123456.png)
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

module.exports = upload;