const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const payos = require('../utils/payos');
const TimeSlot = require('../models/TimeSlot');

const RETURN_URL = 'http://localhost:5173/payment/return';
const CANCEL_URL = 'http://localhost:5173/payment/return?cancelled=true';

function isTransactionUnsupported(err) {
    return err.message?.includes('Transaction numbers are only allowed') ||
           err.codeName === 'IllegalOperation';
}

// Tạo payment record (pending_payment) khi booking được confirmed
async function createPaymentForBooking(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error('Không tìm thấy booking');

    const amount = booking.finalPrice ?? booking.totalPrice;

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const [payment] = await Payment.create([{
            booking: bookingId,
            customer: booking.customer,
            amount,
            type: 'payment',
            status: 'pending_payment'
        }], { session });
        await session.commitTransaction();
        return payment;
    } catch (err) {
        await session.abortTransaction();
        if (isTransactionUnsupported(err)) {
            return Payment.create({
                booking: bookingId,
                customer: booking.customer,
                amount,
                type: 'payment',
                status: 'pending_payment'
            }).catch(e => {
                if (e.code === 11000) return;
                throw e;
            });
        }
        if (err.code === 11000) return;
        throw err;
    } finally {
        await session.endSession();
    }
}

// Tạo link thanh toán PayOS cho booking đã confirmed
async function createPaymentLink(bookingId) {
    const payment = await Payment.findOne({ booking: bookingId, type: 'payment' })
        .populate({ path: 'booking', populate: { path: 'field', select: 'name' } });

    if (!payment) throw new Error('Không tìm thấy thông tin thanh toán');
    if (payment.status === 'completed') throw new Error('Đơn này đã được thanh toán rồi');

    // Nếu đã tạo link trước đó, trả lại link cũ thay vì tạo mới
    if (payment.payosPaymentLinkId) {
        const existing = await payos.paymentRequests.get(payment.payosPaymentLinkId).catch(() => null);
        if (existing && existing.status === 'PENDING') {
            return { checkoutUrl: `https://pay.payos.vn/web/${payment.payosPaymentLinkId}` };
        }
    }

    const orderCode = Number(String(Date.now()).slice(-9));
    const booking = payment.booking;

    const payosRes = await payos.paymentRequests.create({
        orderCode,
        amount: payment.amount,
        description: `Dat san ${booking.field?.name || ''}`.slice(0, 25),
        returnUrl: RETURN_URL,
        cancelUrl: CANCEL_URL,
        items: [{
            name: `Dat san ${booking.field?.name || ''}`.slice(0, 50),
            quantity: 1,
            price: payment.amount
        }]
    });

    await Payment.findByIdAndUpdate(payment._id, {
        payosOrderCode: orderCode,
        payosPaymentLinkId: payosRes.paymentLinkId
    });

    return { checkoutUrl: payosRes.checkoutUrl };
}

// Xử lý webhook từ PayOS
async function handlePayOSWebhook(webhookBody) {
    const data = await payos.webhooks.verify(webhookBody);
    if (data.code === '00') {
        const payment = await Payment.findOneAndUpdate(
            { payosOrderCode: data.orderCode },
            { status: 'completed' },
            { new: true }
        );
        if (payment) await Booking.findByIdAndUpdate(payment.booking, { status: 'confirmed' });
    }
    return data;
}

// Xác nhận thanh toán từ returnUrl (fallback khi webhook không hoạt động local)
async function confirmReturnPayment(orderCode) {
    const payment = await Payment.findOne({ payosOrderCode: Number(orderCode) });
    if (!payment) throw new Error('Không tìm thấy giao dịch');
    if (payment.status === 'completed') return payment; // đã cập nhật rồi

    // Hỏi PayOS xem đã thanh toán chưa
    const info = await payos.paymentRequests.get(Number(orderCode));
    if (info.status === 'PAID') {
        await Payment.findByIdAndUpdate(payment._id, { status: 'completed' });
        // Tự động xác nhận booking khi thanh toán thành công
        await Booking.findByIdAndUpdate(payment.booking, { status: 'confirmed' });
    }
    return info;
}

// Đánh dấu payment là cancelled khi booking bị hủy
async function cancelPaymentForBooking(bookingId) {
    await Payment.findOneAndUpdate(
        { booking: bookingId, type: 'payment' },
        { status: 'cancelled' }
    );
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

module.exports = {
    createPaymentForBooking,
    createPaymentLink,
    confirmReturnPayment,
    handlePayOSWebhook,
    cancelPaymentForBooking,
    getMyPayments,
    getAllPayments
};
