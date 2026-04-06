require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http'); // Thêm mới
const { Server } = require('socket.io'); // Thêm mới
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Tạo server HTTP và tích hợp Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' } 
});

// Lắng nghe kết nối realtime
io.on('connection', (socket) => {
    console.log('⚡ Client kết nối Socket thành công:', socket.id);

    // Client gửi userId để join room cá nhân
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`📌 Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Client đã thoát');
    });
});

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Gắn biến io vào req để các file Route có thể dùng để phát thông báo
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Test API
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Sports Booking API!' });
});

// Các route liên quan đến xác thực (Đăng ký, Đăng nhập)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Các route liên quan đến danh mục
const categoryRoutes = require('./routes/categoryRoutes');
app.use('/api/categories', categoryRoutes);


const fieldRoutes = require('./routes/fieldRoutes');
app.use('/api/fields', fieldRoutes);
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

const promotionRoutes = require('./routes/promotionRoutes');
app.use('/api/promotions', promotionRoutes);

const venueRoutes = require('./routes/venueRoutes');
app.use('/api/venues', venueRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const favoriteRoutes = require('./routes/favoriteRoutes');
app.use('/api/favorites', favoriteRoutes);

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Kết nối MongoDB thành công!');
        server.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại port ${PORT}`);
        });

        // Auto-cancel: hủy booking pending quá 10 phút chưa thanh toán
        const Booking  = require('./models/Booking');
        const TimeSlot = require('./models/TimeSlot');
        const paymentService = require('./services/paymentService');
        setInterval(async () => {
            try {
                const expired = await Booking.find({
                    status: 'pending',
                    expiresAt: { $lt: new Date() }
                });
                for (const booking of expired) {
                    booking.status = 'cancelled';
                    await booking.save();
                    await TimeSlot.updateMany(
                        { booking: booking._id },
                        { status: 'available', booking: null }
                    );
                    await paymentService.cancelPaymentForBooking(booking._id).catch(() => {});
                    console.log(`⏰ Auto-cancel booking ${booking._id} (hết hạn 10 phút)`);
                }
            } catch (err) {
                console.error('Auto-cancel error:', err.message);
            }
        }, 60 * 1000); // chạy mỗi 60 giây

        // Auto-complete: chuyển booking confirmed → completed khi đã qua giờ kết thúc
        setInterval(async () => {
            try {
                const now = new Date();
                const confirmed = await Booking.find({ status: 'confirmed' });
                for (const booking of confirmed) {
                    const [endHour, endMin] = booking.endTime.split(':').map(Number);
                    // booking.date lưu theo UTC midnight; giờ đặt theo UTC+7 (Việt Nam)
                    const bookingEnd = new Date(booking.date);
                    bookingEnd.setUTCHours(endHour - 7, endMin, 0, 0);
                    if (now >= bookingEnd) {
                        booking.status = 'completed';
                        await booking.save();
                        io.to(String(booking.customer)).emit('bookingCompleted', { bookingId: booking._id });
                        console.log(`✅ Auto-complete booking ${booking._id} (hết giờ ${booking.endTime})`);
                    }
                }
            } catch (err) {
                console.error('Auto-complete error:', err.message);
            }
        }, 60 * 1000); // chạy mỗi 60 giây
    })
    .catch((error) => {
        console.error('❌ Lỗi kết nối MongoDB:', error.message);
    });