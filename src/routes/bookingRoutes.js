const express = require('express');
const router  = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const bookingService = require('../services/bookingService');

// GET /api/bookings/fields/:fieldId/timeslots?date=YYYY-MM-DD
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

// POST /api/bookings — Tạo booking mới (Customer)
router.post('/', verifyToken, authorizeRoles('Customer'), async (req, res) => {
    try {
        const { fieldId, date, timeSlotIds, note, promoCode } = req.body;
        if (!fieldId || !date || !timeSlotIds?.length)
            return res.status(400).json({ message: 'Thiếu fieldId, date hoặc timeSlotIds' });

        const booking = await bookingService.createBooking({
            customerId: req.user.id,
            fieldId,
            dateStr: date,
            timeSlotIds,
            note,
            promoCode
        });

        // Thông báo targeted đến Owner của sân (không broadcast tất cả)
        const ownerId = String(booking.field.owner);
        req.io.to(ownerId).emit('newBooking', {
            message: `Có đơn đặt sân mới cho "${booking.field.name}"!`,
            bookingId: booking._id,
            fieldName: booking.field.name
        });
        // Thông báo thêm cho Admin room
        req.io.to('admin').emit('newBooking', {
            message: `Có đơn đặt sân mới cho "${booking.field.name}"!`,
            bookingId: booking._id
        });

        res.status(201).json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /api/bookings/my — Lịch sử của Customer
router.get('/my', verifyToken, authorizeRoles('Customer'), async (req, res) => {
    try {
        const bookings = await bookingService.getMyBookings(req.user.id);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/bookings — Tất cả (Admin)
router.get('/', verifyToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const bookings = await bookingService.getAllBookings();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/bookings/field/:fieldId — Booking theo sân (Owner/Admin)
router.get('/field/:fieldId', verifyToken, authorizeRoles('Owner', 'Admin'), async (req, res) => {
    try {
        const bookings = await bookingService.getBookingsByField(
            req.params.fieldId, req.user.id, req.user.role
        );
        res.json(bookings);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/bookings/:id/status — Đổi trạng thái
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['confirmed', 'cancelled', 'completed'];
        if (!allowed.includes(status))
            return res.status(400).json({ message: `status phải là: ${allowed.join(', ')}` });

        const booking = await bookingService.updateBookingStatus(
            req.params.id, status, req.user.id, req.user.role
        );

        // Gửi notification đến đúng Customer
        const customerId = String(booking.customer);
        if (status === 'confirmed') {
            req.io.to(customerId).emit('bookingConfirmed', {
                message: 'Đặt sân của bạn đã được xác nhận! 🎉',
                bookingId: booking._id
            });
        } else if (status === 'cancelled') {
            req.io.to(customerId).emit('bookingCancelled', {
                message: 'Đặt sân của bạn đã bị hủy.',
                bookingId: booking._id
            });
        } else if (status === 'completed') {
            req.io.to(customerId).emit('bookingCompleted', {
                message: 'Đặt sân hoàn thành! Cảm ơn bạn đã sử dụng dịch vụ 🙏',
                bookingId: booking._id
            });
        }

        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
