const mongoose = require('mongoose');
const SportField = require('../models/SportField');
const Review = require('../models/Review');

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

const getFieldById = async (fieldId) => {
    const field = await SportField.findById(fieldId)
        .populate('category', 'name')
        .populate('owner', 'fullName email');
    
    if (!field) {
        throw new Error('Không tìm thấy sân này');
    }
    return field;
};

const deleteField = async (fieldId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await Review.deleteMany({ field: fieldId }).session(session);
        const deletedField = await SportField.findByIdAndDelete(fieldId).session(session);

        if (!deletedField) {
            throw new Error('Không tìm thấy sân để xóa');
        }

        await session.commitTransaction();
        session.endSession();
        return deletedField;

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }

};
const updateField = async (id, data) => {
    // Cách mới theo chuẩn 2026
    return await SportField.findByIdAndUpdate(id, data, { returnDocument: 'after' });
};


module.exports = { createField, updateField, getAllFields, getFieldById, deleteField };

module.exports = { createField, getAllFields, deleteField, getFieldById, updateField };

