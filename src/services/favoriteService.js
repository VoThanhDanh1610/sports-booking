const Favorite = require('../models/Favorite');

const toggleFavorite = async (userId, fieldId) => {
    const exists = await Favorite.findOne({ user: userId, field: fieldId });
    if (exists) {
        await Favorite.findByIdAndDelete(exists._id);
        return { message: 'Đã bỏ yêu thích', isFavorite: false };
    }
    await Favorite.create({ user: userId, field: fieldId });
    return { message: 'Đã thêm vào yêu thích', isFavorite: true };
};

const getMyFavorites = async (userId) => {
    return await Favorite.find({ user: userId }).populate('field');
};

module.exports = { toggleFavorite, getMyFavorites };