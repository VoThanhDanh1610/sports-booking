const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// Kiểm tra lỗi transaction không được hỗ trợ (MongoDB standalone)
function isTransactionUnsupported(err) {
    return err.message?.includes('Transaction numbers are only allowed') ||
           err.codeName === 'IllegalOperation';
}

// Tạo payment khi booking được CONFIRMED — dùng Transaction
async function createPaymentForBooking(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error('Không tìm thấy booking');

    const amount = booking.finalPrice ?? booking.totalPrice;

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        // Dùng insertOne với session để atomic
        const [payment] = await Payment.create([{
            booking: bookingId,
            customer: booking.customer,
            amount,
            type: 'payment',
            status: 'completed'
        }], { session });
        await session.commitTransaction();
        return payment;
    } catch (err) {
        await session.abortTransaction();
        // Fallback: nếu MongoDB standalone không hỗ trợ transaction
        if (isTransactionUnsupported(err)) {
            return Payment.create({
                booking: bookingId,
                customer: booking.customer,
                amount,
                type: 'payment',
                status: 'completed'
            }).catch(e => {
                if (e.code === 11000) return; // Đã tồn tại → bỏ qua
                throw e;
            });
        }
        if (err.code === 11000) return; // Duplicate key → đã tạo rồi
        throw err;
    } finally {
        await session.endSession();
    }
}

// Tạo refund khi booking bị CANCELLED (chỉ khi đã có payment)
async function createRefundForBooking(bookingId) {
    const originalPayment = await Payment.findOne({ booking: bookingId, type: 'payment' });
    if (!originalPayment) return; // Chưa thanh toán → không cần refund

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        await Payment.findByIdAndUpdate(originalPayment._id, { status: 'refunded' }, { session });
        await Payment.create([{
            booking: bookingId,
            customer: originalPayment.customer,
            amount: originalPayment.amount,
            type: 'refund',
            status: 'completed',
            note: 'Hoàn tiền do hủy đặt sân'
        }], { session });
        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        if (isTransactionUnsupported(err)) {
            await Payment.findByIdAndUpdate(originalPayment._id, { status: 'refunded' });
            await Payment.create({
                booking: bookingId,
                customer: originalPayment.customer,
                amount: originalPayment.amount,
                type: 'refund',
                status: 'completed',
                note: 'Hoàn tiền do hủy đặt sân'
            });
            return;
        }
        throw err;
    } finally {
        await session.endSession();
    }
}

const getMyPayments = async (customerId) => {
    return Payment.find({ customer: customerId })
        .populate({ path: 'booking', populate: { path: 'field', select: 'name location' } })
        .sort({ createdAt: -1 });
};

const getAllPayments = async () => {
    return Payment.find()
        .populate('customer', 'fullName email phone')
        .populate({ path: 'booking', populate: { path: 'field', select: 'name location' } })
        .sort({ createdAt: -1 });
};

module.exports = { createPaymentForBooking, createRefundForBooking, getMyPayments, getAllPayments };
