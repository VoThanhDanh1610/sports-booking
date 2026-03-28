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

// THÊM HÀM NÀY ĐỂ XỬ LÝ TRANSACTION:
const deleteField = async (fieldId) => {
    // 1. Khởi tạo một phiên giao dịch (Session)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Xóa tất cả các Review thuộc về sân này (nhớ truyền session vào)
        await Review.deleteMany({ field: fieldId }).session(session);

        // 3. Xóa chính cái sân đó
        const deletedField = await SportField.findByIdAndDelete(fieldId).session(session);

        if (!deletedField) {
            throw new Error('Không tìm thấy sân để xóa');
        }

        // 4. Nếu cả 2 bước trên thành công -> Chốt giao dịch (Commit)
        await session.commitTransaction();
        session.endSession();
        return deletedField;

    } catch (error) {
        // 5. Nếu có bất kỳ lỗi gì xảy ra -> Hủy bỏ toàn bộ (Rollback)
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

module.exports = { createField, getAllFields, deleteField };