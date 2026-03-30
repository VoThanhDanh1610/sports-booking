const express = require('express');
const router  = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const bookingService = require('../services/bookingService');

// ─── TIMESLOT ────────────────────────────────────────────────────────────────

// GET /api/bookings/fields/:fieldId/timeslots?date=YYYY-MM-DD
// Lấy tất cả khung giờ của 1 sân theo ngày (public)
router.get('/fields/:fieldId/timeslots', async (req, res) => {
    try {
        const { fieldId } = req.params;
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Thiếu tham số date (YYYY-MM-DD)' });

        const slots = await bookingService.getTimeSlotsByFieldAndDate(fieldId, date);
        res.json(slots);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── BOOKING ─────────────────────────────────────────────────────────────────

// POST /api/bookings
// Tạo booking mới (chỉ Customer)
router.post('/', verifyToken, authorizeRoles('Customer'), async (req, res) => {
    try {
        const { fieldId, date, timeSlotIds, note } = req.body;
        if (!fieldId || !date || !timeSlotIds?.length)
            return res.status(400).json({ message: 'Thiếu fieldId, date hoặc timeSlotIds' });

        const booking = await bookingService.createBooking({
            customerId: req.user.id,
            fieldId,
            dateStr: date,
            timeSlotIds,
            note
        });

        // Thông báo realtime cho Owner / Admin
        req.io.emit('newBooking', {
            message: 'Có đơn đặt sân mới!',
            bookingId: booking._id,
            fieldId
        });

        res.status(201).json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /api/bookings/my
// Lịch sử đặt sân của customer đang đăng nhập
router.get('/my', verifyToken, authorizeRoles('Customer'), async (req, res) => {
    try {
        const bookings = await bookingService.getMyBookings(req.user.id);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/bookings
// Tất cả booking - chỉ Admin
router.get('/', verifyToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const bookings = await bookingService.getAllBookings();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/bookings/field/:fieldId
// Booking theo sân - Owner hoặc Admin
router.get('/field/:fieldId', verifyToken, authorizeRoles('Owner', 'Admin'), async (req, res) => {
    try {
        const bookings = await bookingService.getBookingsByField(
            req.params.fieldId,
            req.user.id,
            req.user.role
        );
        res.json(bookings);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/bookings/:id/status
// Cập nhật trạng thái: confirmed | cancelled | completed
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['confirmed', 'cancelled', 'completed'];
        if (!allowed.includes(status))
            return res.status(400).json({ message: `status phải là: ${allowed.join(', ')}` });

        const booking = await bookingService.updateBookingStatus(
            req.params.id,
            status,
            req.user.id,
            req.user.role
        );
        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
