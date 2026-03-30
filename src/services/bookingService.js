const TimeSlot = require('../models/TimeSlot');
const Booking  = require('../models/Booking');
const SportField = require('../models/SportField');

// Khung giờ hoạt động mặc định: 06:00 - 22:00
const OPEN_HOUR  = 6;
const CLOSE_HOUR = 22;

// Chuẩn hóa ngày về 00:00:00 UTC để tránh lệch múi giờ
function normalizeDate(dateStr) {
    const d = new Date(dateStr);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Tạo toàn bộ TimeSlot cho 1 sân vào 1 ngày nếu chưa có
async function generateTimeSlotsForDay(fieldId, date) {
    const slots = [];
    for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
        const startTime = `${String(h).padStart(2, '0')}:00`;
        const endTime   = `${String(h + 1).padStart(2, '0')}:00`;
        slots.push({ field: fieldId, date, startTime, endTime });
    }
    // BUG FIX: MongoBulkWriteError khi ordered:false có thể có code ở nhiều cấp
    await TimeSlot.insertMany(slots, { ordered: false }).catch(err => {
        const isDuplicateOnly =
            err.code === 11000 ||
            (err.writeErrors && err.writeErrors.every(e => e.code === 11000));
        if (!isDuplicateOnly) throw err;
    });
}

// GET: Lấy danh sách TimeSlot của 1 sân theo ngày
async function getTimeSlotsByFieldAndDate(fieldId, dateStr) {
    // BUG FIX: validate sân tồn tại trước khi sinh slots
    const field = await SportField.findById(fieldId);
    if (!field) throw new Error('Sân không tồn tại');

    const date = normalizeDate(dateStr);
    await generateTimeSlotsForDay(fieldId, date);
    return TimeSlot.find({ field: fieldId, date }).sort({ startTime: 1 });
}

// POST: Tạo booking mới
async function createBooking({ customerId, fieldId, dateStr, timeSlotIds, note }) {
    const date = normalizeDate(dateStr);

    const field = await SportField.findById(fieldId);
    if (!field) throw new Error('Sân không tồn tại');
    if (field.status !== 'Active') throw new Error('Sân hiện không hoạt động');

    const slots = await TimeSlot.find({
        _id: { $in: timeSlotIds },
        field: fieldId,
        date
    });

    if (slots.length !== timeSlotIds.length)
        throw new Error('Một số khung giờ không hợp lệ');

    const bookedSlot = slots.find(s => s.status === 'booked');
    if (bookedSlot)
        throw new Error(`Khung giờ ${bookedSlot.startTime} - ${bookedSlot.endTime} đã được đặt`);

    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    const startTime  = slots[0].startTime;
    const endTime    = slots[slots.length - 1].endTime;
    const totalPrice = field.pricePerHour * slots.length;

    const booking = await Booking.create({
        customer: customerId,
        field: fieldId,
        date,
        timeSlots: timeSlotIds,
        startTime,
        endTime,
        totalPrice,
        note: note || ''
    });

    await TimeSlot.updateMany(
        { _id: { $in: timeSlotIds } },
        { status: 'booked', booking: booking._id }
    );

    return booking.populate([
        { path: 'field', select: 'name location pricePerHour' },
        { path: 'timeSlots', select: 'startTime endTime' }
    ]);
}

// GET: Lịch sử đặt sân của customer đang đăng nhập
async function getMyBookings(customerId) {
    return Booking.find({ customer: customerId })
        .populate('field', 'name location images')
        .populate('timeSlots', 'startTime endTime')
        .sort({ createdAt: -1 });
}

// GET: Tất cả booking (Admin)
async function getAllBookings() {
    return Booking.find()
        .populate('customer', 'fullName email phone')
        .populate('field', 'name location')
        .populate('timeSlots', 'startTime endTime')
        .sort({ createdAt: -1 });
}

// GET: Booking theo sân (Owner xem sân của mình)
async function getBookingsByField(fieldId, requesterId, requesterRole) {
    // BUG FIX: Owner chỉ được xem sân của chính mình
    if (requesterRole === 'Owner') {
        const field = await SportField.findById(fieldId);
        if (!field) throw new Error('Sân không tồn tại');
        if (String(field.owner) !== String(requesterId))
            throw new Error('Bạn không có quyền xem booking của sân này');
    }
    return Booking.find({ field: fieldId })
        .populate('customer', 'fullName email phone')
        .populate('timeSlots', 'startTime endTime')
        .sort({ date: 1, createdAt: 1 });
}

// PUT: Đổi trạng thái booking (confirm / cancel / complete)
async function updateBookingStatus(bookingId, newStatus, requesterId, requesterRole) {
    const booking = await Booking.findById(bookingId).populate('field');
    if (!booking) throw new Error('Booking không tồn tại');

    // Customer chỉ được cancel booking của chính mình
    if (requesterRole === 'Customer') {
        if (String(booking.customer) !== String(requesterId))
            throw new Error('Không có quyền thực hiện');
        if (newStatus !== 'cancelled')
            throw new Error('Customer chỉ được phép hủy booking');
    }

    // Owner chỉ được thao tác trên sân của mình
    if (requesterRole === 'Owner') {
        if (String(booking.field.owner) !== String(requesterId))
            throw new Error('Không có quyền thực hiện');
    }

    const oldStatus = booking.status;
    booking.status = newStatus;
    await booking.save();

    // Nếu cancel -> trả lại slot về available
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        await TimeSlot.updateMany(
            { booking: bookingId },
            { status: 'available', booking: null }
        );
    }

    return booking;
}

module.exports = {
    getTimeSlotsByFieldAndDate,
    createBooking,
    getMyBookings,
    getAllBookings,
    getBookingsByField,
    updateBookingStatus
};
