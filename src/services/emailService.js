const transporter = require('../utils/mailer');
const Payment = require('../models/Payment');

// Gửi email xác nhận đặt sân sau khi thanh toán thành công
async function sendBookingConfirmationEmail(paymentId) {
    const payment = await Payment.findById(paymentId)
        .populate('customer', 'fullName email')
        .populate({
            path: 'booking',
            populate: { path: 'field', select: 'name location' }
        });

    if (!payment || !payment.customer?.email) return;

    const customer = payment.customer;
    const booking  = payment.booking;
    const field    = booking.field;

    const bookingDate = new Date(booking.date).toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const amount = payment.amount.toLocaleString('vi-VN');

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f9;">
        <div style="background-color: #1d4ed8; padding: 24px 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px;">
                ✅ Đặt Sân Thành Công
            </h1>
        </div>

        <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <p style="font-size: 16px; color: #1f2937; margin-top: 0;">
                Xin chào <strong>${customer.fullName}</strong>,
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
                Thanh toán của bạn đã được xác nhận thành công. Dưới đây là thông tin chi tiết đơn đặt sân:
            </p>

            <div style="background-color: #eff6ff; border-left: 4px solid #1d4ed8; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <h2 style="color: #1e40af; margin: 0 0 16px 0; font-size: 17px;">Chi Tiết Đơn Đặt</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                    <tr>
                        <td style="padding: 7px 0; color: #6b7280; width: 42%;">Mã đơn:</td>
                        <td style="padding: 7px 0; color: #111827; font-weight: 600; font-size: 12px;">${booking._id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 7px 0; color: #6b7280;">Tên sân:</td>
                        <td style="padding: 7px 0; color: #111827; font-weight: 600;">${field.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 7px 0; color: #6b7280;">Địa điểm:</td>
                        <td style="padding: 7px 0; color: #374151;">${field.location}</td>
                    </tr>
                    <tr>
                        <td style="padding: 7px 0; color: #6b7280;">Ngày đặt:</td>
                        <td style="padding: 7px 0; color: #374151;">${bookingDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 7px 0; color: #6b7280;">Khung giờ:</td>
                        <td style="padding: 7px 0; color: #374151; font-weight: 600;">${booking.startTime} – ${booking.endTime}</td>
                    </tr>
                    ${booking.promoCode ? `
                    <tr>
                        <td style="padding: 7px 0; color: #6b7280;">Mã giảm giá:</td>
                        <td style="padding: 7px 0; color: #7c3aed; font-weight: 600;">${booking.promoCode}</td>
                    </tr>` : ''}
                    <tr>
                        <td style="padding: 7px 0; color: #6b7280;">Số tiền thanh toán:</td>
                        <td style="padding: 7px 0; color: #16a34a; font-weight: 700; font-size: 18px;">${amount} ₫</td>
                    </tr>
                </table>
            </div>

            <p style="color: #4b5563; line-height: 1.6;">
                Vui lòng có mặt đúng giờ. Nếu cần hỗ trợ hoặc muốn hủy đặt sân, hãy liên hệ với chúng tôi trước ít nhất <strong>2 tiếng</strong> trước giờ đặt.
            </p>

            <p style="color: #4b5563; margin-bottom: 0;">
                Trân trọng,<br>
                <strong>Đội ngũ Sports Booking</strong>
            </p>
        </div>

        <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>`;

    await transporter.sendMail({
        from: `"Sports Booking" <${process.env.SMTP_USER}>`,
        to: customer.email,
        subject: `[Sports Booking] Xác nhận đặt sân ${field.name} ngày ${new Date(booking.date).toLocaleDateString('vi-VN')}`,
        html
    });
    console.log(`[Email] Đã gửi xác nhận đặt sân tới ${customer.email}`);
}

module.exports = { sendBookingConfirmationEmail };
