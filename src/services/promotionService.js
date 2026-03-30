const Promotion = require('../models/Promotion');

const createPromotion = async (data, adminId) => {
    const existing = await Promotion.findOne({ code: data.code.toUpperCase() });
    if (existing) throw new Error('Mã giảm giá đã tồn tại');
    if (data.discountType === 'percent' && data.discountValue > 100)
        throw new Error('Phần trăm giảm giá không được vượt quá 100%');
    return Promotion.create({ ...data, code: data.code.toUpperCase(), createdBy: adminId });
};

const getAllPromotions = async () => {
    return Promotion.find().sort({ createdAt: -1 });
};

const verifyPromoCode = async (code, orderValue) => {
    const promo = await Promotion.findOne({ code: code.toUpperCase() });
    if (!promo)               throw new Error('Mã giảm giá không tồn tại');
    if (!promo.isActive)      throw new Error('Mã giảm giá đã bị vô hiệu hóa');
    if (promo.expiresAt < new Date()) throw new Error('Mã giảm giá đã hết hạn');
    if (promo.usedCount >= promo.maxUsage) throw new Error('Mã giảm giá đã hết lượt sử dụng');
    if (orderValue < promo.minOrderValue)
        throw new Error(`Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString()}đ để dùng mã này`);

    const discount = promo.discountType === 'percent'
        ? Math.floor(orderValue * promo.discountValue / 100)
        : promo.discountValue;
    const finalPrice = Math.max(0, orderValue - discount);
    return { discount, finalPrice };
};

const applyPromoCode = async (code) => {
    await Promotion.findOneAndUpdate(
        { code: code.toUpperCase() },
        { $inc: { usedCount: 1 } }
    );
};

const togglePromotion = async (id) => {
    const promo = await Promotion.findById(id);
    if (!promo) throw new Error('Không tìm thấy mã giảm giá');
    promo.isActive = !promo.isActive;
    return promo.save();
};

const deletePromotion = async (id) => {
    const deleted = await Promotion.findByIdAndDelete(id);
    if (!deleted) throw new Error('Không tìm thấy mã giảm giá');
    return deleted;
};

module.exports = { createPromotion, getAllPromotions, verifyPromoCode, applyPromoCode, togglePromotion, deletePromotion };
