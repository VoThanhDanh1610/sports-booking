const FieldCategory = require('../models/FieldCategory');

// Tạo danh mục mới
const createCategory = async (data) => {
    const { name, description } = data;
    
    // Kiểm tra trùng tên
    const existingCategory = await FieldCategory.findOne({ name });
    if (existingCategory) throw new Error('Tên danh mục đã tồn tại');

    const newCategory = new FieldCategory({ name, description });
    return await newCategory.save();
};

// Lấy danh sách tất cả danh mục
const getAllCategories = async () => {
    return await FieldCategory.find();
};

module.exports = { createCategory, getAllCategories };