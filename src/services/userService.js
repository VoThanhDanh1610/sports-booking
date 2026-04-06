const User = require('../models/User');
const SportField = require('../models/SportField');
const Venue = require('../models/Venue');

const getAllOwners = async () => {
    return User.find({ role: 'Owner' }).select('-password').sort({ createdAt: -1 });
};

const getAllCustomers = async () => {
    return User.find({ role: 'Customer' }).select('-password').sort({ createdAt: -1 });
};

const toggleUserActive = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new Error('Không tìm thấy người dùng');
    if (user.role === 'Admin') throw new Error('Không thể khóa tài khoản Admin');
    user.isActive = !user.isActive;
    await user.save();

    // Khóa/mở Owner → ẩn/hiện sân + venue theo
    if (user.role === 'Owner') {
        const newStatus = user.isActive ? 'Active' : 'Inactive';
        await SportField.updateMany({ owner: userId }, { status: newStatus });
        await Venue.updateMany({ owner: userId }, { status: newStatus });
    }

    return user;
};

module.exports = { getAllOwners, getAllCustomers, toggleUserActive };
