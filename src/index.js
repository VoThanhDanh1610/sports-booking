require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http'); // Thêm mới
const { Server } = require('socket.io'); // Thêm mới

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

// Cho phép truy cập trực tiếp vào thư mục uploads
app.use('/uploads', express.static('uploads')); 

const fieldRoutes = require('./routes/fieldRoutes');
app.use('/api/fields', fieldRoutes);

const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

const promotionRoutes = require('./routes/promotionRoutes');
app.use('/api/promotions', promotionRoutes);

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Kết nối MongoDB thành công!');
        // CHÚ Ý: Đổi app.listen thành server.listen
        server.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Lỗi kết nối MongoDB:', error.message);
    });