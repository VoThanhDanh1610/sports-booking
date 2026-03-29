const mongoose = require('mongoose');
const SportField = require('../models/SportField');
const Review = require('../models/Review'); // Nhúng thêm Model Review

const createField = async (data, imageUrls) => {
    const newField = new SportField({
        ...data,
        images: imageUrls
    });
    return await newField.save();
};

const getAllFields = async () => {
    return await SportField.find()
        .populate('category', 'name')
        .populate('owner', 'fullName email');
};

const deleteField = async (fieldId) => {
    const deletedField = await SportField.findByIdAndDelete(fieldId);
    if (!deletedField) throw new Error('Không tìm thấy sân để xóa');
    await Review.deleteMany({ field: fieldId });
    return deletedField;
};

const updateField = async (fieldId, data, imageUrls) => {
    const updateData = { ...data };
    if (imageUrls && imageUrls.length > 0) updateData.images = imageUrls;
    const updated = await SportField.findByIdAndUpdate(fieldId, updateData, { new: true });
    if (!updated) throw new Error('Không tìm thấy sân để cập nhật');
    return updated;
};

const getFieldById = async (fieldId) => {
    const field = await SportField.findById(fieldId)
        .populate('category', 'name')
        .populate('owner', 'fullName email');
    if (!field) throw new Error('Không tìm thấy sân');
    return field;
};

module.exports = { createField, updateField, getAllFields, getFieldById, deleteField };