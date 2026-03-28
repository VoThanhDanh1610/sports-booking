const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (data) => {
    const { fullName, email, password, phone, role } = data;
    
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Email đã được sử dụng');

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Lưu user mới vào DB
    const newUser = new User({
        fullName, 
        email, 
        password: hashedPassword, 
        phone, 
        role
    });
    await newUser.save();
    
    // Không trả về password trong response
    newUser.password = undefined; 
    return newUser;
};

const login = async (email, password) => {
    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) throw new Error('Email không tồn tại');

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Mật khẩu không chính xác');

    // Tạo JWT Token (thẻ thông hành)
    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' } // Token có hạn 1 ngày
    );

    user.password = undefined;
    return { user, token };
};

module.exports = { register, login };