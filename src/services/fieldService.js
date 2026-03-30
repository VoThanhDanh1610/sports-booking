const SportField = require('../models/SportField');
const Venue = require('../models/Venue');
const Review = require('../models/Review');

// Kiểm tra venue có thuộc về owner không (dùng chung)
async function assertVenueBelongsToOwner(venueId, ownerId) {
    const venue = await Venue.findById(venueId);
    if (!venue) throw new Error('Không tìm thấy khu thể thao');
    if (String(venue.owner) !== String(ownerId))
        throw new Error('Bạn không có quyền gán sân vào khu thể thao này');
}

// CREATE
const createField = async (data, imageUrls, requesterId, requesterRole) => {
    // Nếu gán vào venue, chỉ được gán venue của chính mình
    if (data.venue && requesterRole === 'Owner') {
        await assertVenueBelongsToOwner(data.venue, requesterId);
    }

    const newField = new SportField({ ...data, images: imageUrls });
    return await newField.save();
};

// GET MY FIELDS (chỉ sân của owner đang đăng nhập)
const getMyFields = async (ownerId) => {
    return await SportField.find({ owner: ownerId })
        .populate('category', 'name')
        .populate('venue', 'name address')
        .sort({ createdAt: -1 });
};

// GET ALL (hỗ trợ lọc theo city, district, category)
const getAllFields = async ({ city, district, category } = {}) => {
    const filter = {};
    if (city)     filter.city     = city;
    if (district) filter.district = district;
    if (category) filter.category = category;
    return await SportField.find(filter)
        .populate('category', 'name')
        .populate('owner', 'fullName email')
        .populate('venue', 'name address');
};

// GET BY ID
const getFieldById = async (fieldId) => {
    const field = await SportField.findById(fieldId)
        .populate('category', 'name')
        .populate('owner', 'fullName email')
        .populate('venue', 'name address');

    if (!field) throw new Error('Không tìm thấy sân');
    return field;
};

// UPDATE
const updateField = async (fieldId, data, imageUrls, requesterId, requesterRole) => {
    const field = await SportField.findById(fieldId);
    if (!field) throw new Error('Không tìm thấy sân để cập nhật');

    // Owner chỉ được sửa sân của chính mình
    if (requesterRole === 'Owner' && String(field.owner) !== String(requesterId))
        throw new Error('Bạn không có quyền chỉnh sửa sân này');

    // Nếu thay đổi venue, chỉ được gán venue của chính mình
    if (data.venue && requesterRole === 'Owner') {
        await assertVenueBelongsToOwner(data.venue, requesterId);
    }

    const updateData = { ...data };
    if (imageUrls && imageUrls.length > 0) updateData.images = imageUrls;

    return await SportField.findByIdAndUpdate(fieldId, updateData, { new: true });
};

// DELETE
const deleteField = async (fieldId, requesterId, requesterRole) => {
    const field = await SportField.findById(fieldId);
    if (!field) throw new Error('Không tìm thấy sân để xóa');

    // Owner chỉ được xóa sân của chính mình
    if (requesterRole === 'Owner' && String(field.owner) !== String(requesterId))
        throw new Error('Bạn không có quyền xóa sân này');

    await Review.deleteMany({ field: fieldId });
    return await SportField.findByIdAndDelete(fieldId);
};

module.exports = { createField, getAllFields, getMyFields, getFieldById, updateField, deleteField };
