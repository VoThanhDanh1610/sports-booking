const mongoose = require('mongoose');
const SportField = require('../models/SportField');
const Review = require('../models/Review');

// CREATE
const createField = async (data, imageUrls) => {
    const newField = new SportField({
        ...data,
        images: imageUrls
    });
    return await newField.save();
};

// GET ALL
const getAllFields = async () => {
    return await SportField.find()
        .populate('category', 'name')
        .populate('owner', 'fullName email');
};

// GET BY ID
const getFieldById = async (fieldId) => {
    const field = await SportField.findById(fieldId)
        .populate('category', 'name')
        .populate('owner', 'fullName email');

    if (!field) {
        throw new Error('Không tìm thấy sân');
    }
    return field;
};

// UPDATE (giữ luôn logic ảnh)
const updateField = async (fieldId, data, imageUrls) => {
    const updateData = { ...data };

    if (imageUrls && imageUrls.length > 0) {
        updateData.images = imageUrls;
    }

    const updated = await SportField.findByIdAndUpdate(
        fieldId,
        updateData,
        { new: true } // chuẩn mongoose phổ biến hơn
    );

    if (!updated) {
        throw new Error('Không tìm thấy sân để cập nhật');
    }

    return updated;
};

// DELETE (Đã bỏ Transaction để chạy mượt trên Localhost)
const deleteField = async (fieldId) => {
    // 1. Xóa sạch các đánh giá (Review) liên quan đến sân này
    await Review.deleteMany({ field: fieldId });

    // 2. Xóa chính cái sân đó
    const deletedField = await SportField.findByIdAndDelete(fieldId);

    if (!deletedField) {
        throw new Error('Không tìm thấy sân để xóa');
    }

    return deletedField;
};

module.exports = {
    createField,
    getAllFields,
    getFieldById,
    updateField,
    deleteField
};