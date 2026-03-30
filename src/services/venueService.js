const Venue = require('../models/Venue');
const SportField = require('../models/SportField');

const getAllVenues = async () => {
    const venues = await Venue.find({ status: 'Active' })
        .populate('owner', 'fullName email')
        .sort({ createdAt: -1 });

    return Promise.all(venues.map(async (venue) => {
        const fieldsCount = await SportField.countDocuments({ venue: venue._id, status: 'Active' });
        return { ...venue.toObject(), fieldsCount };
    }));
};

const getMyVenues = async (ownerId) => {
    return Venue.find({ owner: ownerId })
        .populate('owner', 'fullName email')
        .sort({ createdAt: -1 });
};

const getVenueById = async (venueId) => {
    const venue = await Venue.findById(venueId).populate('owner', 'fullName email');
    if (!venue) throw new Error('Không tìm thấy khu thể thao');
    return venue;
};

const getFieldsByVenue = async (venueId) => {
    return SportField.find({ venue: venueId })
        .populate('category', 'name')
        .sort({ name: 1 });
};

const createVenue = async (data, imageUrls) => {
    const venue = new Venue({ ...data, images: imageUrls });
    return await venue.save();
};

const updateVenue = async (venueId, ownerId, ownerRole, data, imageUrls) => {
    const venue = await Venue.findById(venueId);
    if (!venue) throw new Error('Không tìm thấy khu thể thao');
    if (ownerRole !== 'Admin' && String(venue.owner) !== String(ownerId))
        throw new Error('Bạn không có quyền chỉnh sửa khu này');

    const updateData = { ...data };
    if (imageUrls && imageUrls.length > 0) updateData.images = imageUrls;
    return Venue.findByIdAndUpdate(venueId, updateData, { new: true });
};

const deleteVenue = async (venueId, ownerId, ownerRole) => {
    const venue = await Venue.findById(venueId);
    if (!venue) throw new Error('Không tìm thấy khu thể thao');
    if (ownerRole !== 'Admin' && String(venue.owner) !== String(ownerId))
        throw new Error('Bạn không có quyền xóa khu này');

    // Bỏ liên kết các sân thuộc khu này
    await SportField.updateMany({ venue: venueId }, { venue: null });
    return Venue.findByIdAndDelete(venueId);
};

module.exports = { getAllVenues, getMyVenues, getVenueById, getFieldsByVenue, createVenue, updateVenue, deleteVenue };
