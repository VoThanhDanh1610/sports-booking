const jwt = require('jsonwebtoken');

// 1. Authentication: Kiểm tra xem user có token hợp lệ không
const verifyToken = (req, res, next) => {
    // Lấy token từ header của request (Định dạng: Bearer <token>)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Không tìm thấy Token, vui lòng đăng nhập!' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Giải mã token bằng chìa khóa bí mật
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Gắn thông tin user (id, role) vào req để các API sau sử dụng
        next(); // Cho phép đi tiếp vào Controller/Service
    } catch (error) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

// 2. Authorization: Kiểm tra xem user có quyền truy cập không
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user được lấy từ hàm verifyToken ở trên
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này!' });
        }
        next(); // Đúng quyền thì cho đi tiếp
    };
};

module.exports = { verifyToken, authorizeRoles };