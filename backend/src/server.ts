import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { authRoutes } from './routes/auth';
import { roomRoutes } from './routes/rooms';
import { forumRoutes } from './routes/forum';
import { adminRoutes } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authAdminRoutes } from './routes/authAdmin';

// --- TÍCH HỢP SOCKET.IO (IMPORTS) ---
import http from 'http'; 
import { Server } from 'socket.io'; 
import jwt from 'jsonwebtoken'; 
import Message from './models/Message'; 
import Conversation from './models/Conversation'; 
import conversationRoutes from './routes/conversationRoutes';
import notificationRoutes from './routes/notificationRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CẤU HÌNH: Danh sách các tên miền được phép truy cập ---
// Bạn hãy copy link ở cột Forwarded Address của cổng 5173 dán vào dòng dưới
const allowedOrigins = [
  "http://localhost:5173", // Link chạy dưới máy bạn (local)
  "https://vm6lrl9v-5173.asse.devtunnels.ms" // <---  (Link Public)
];

// Middleware
app.use(cors({
  origin: allowedOrigins, // Cho phép tất cả các nguồn (bạn có thể tùy chỉnh theo nhu cầu)
  credentials: true // Cho phép gửi cookie/token
})); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-housing';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/auth/admin', authAdminRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// --- TÍCH HỢP SOCKET.IO (LOGIC) ---
const server = http.createServer(app); 
const io = new Server(server, { 
  cors: {
    origin: allowedOrigins, // Sử dụng danh sách allowedOrigins đã khai báo ở trên
    methods: ["GET", "POST"],
    credentials: true // Quan trọng: Phải có dòng này thì Socket mới nhận được cookie/token
  }
});

// 1. Map để theo dõi (userId -> socket.id)
const userSocketMap = new Map<string, string>();

io.on('connection', (socket) => { 
  console.log(`[Socket.io] Một user đã kết nối: ${socket.id}`);
  
  let userId: string | null = null; // Lưu userId của socket này

  try {
    // 2. Xác thực token và lấy userId
    const tokenWithBearer = socket.handshake.auth.token;
    if (!tokenWithBearer || !tokenWithBearer.startsWith('Bearer ')) {
      throw new Error('Không có token hoặc token không hợp lệ.');
    }
    const token = tokenWithBearer.split(' ')[1];
    
    // Đảm bảo bạn có JWT_SECRET trong file .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    userId = decoded.userId; 

    // 3. Lưu user vào Map
    userSocketMap.set(userId, socket.id);
    console.log(`[Socket.io] User ${userId} (Socket: ${socket.id}) đã xác thực.`);

    // 4. LẮNG NGHE 'sendMessage'
    socket.on('sendMessage', async (data) => {
      console.log(`[Socket.io] Nhận 'sendMessage' từ ${userId}:`, data.text);
      
      const { receiverId, conversationId, text } = data;
      const senderId = userId; // userId của người gửi

      if (!senderId) return; 

      try {
        // Lưu tin nhắn vào DB
        const newMessage = new Message({
          conversationId: conversationId,
          sender: senderId,
          text: text,
        });
        const savedMessage = await newMessage.save();

        // Cập nhật lastMessage cho Conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            text: savedMessage.text,
            sender: savedMessage.sender,
            createdAt: savedMessage.createdAt,
          },
        });

        // Populate thông tin người gửi
        const populatedMessage = await savedMessage.populate(
            'sender', 
            'name avatar' // Lấy trường 'name' và 'avatar'
        );
        
        // Gửi tin nhắn đến người nhận (nếu online)
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
          console.log(`[Socket.io] Gửi 'receiveMessage' tới ${receiverId}`);
          io.to(receiverSocketId).emit('receiveMessage', populatedMessage);
        } else {
          console.log(`[Socket.io] Người nhận ${receiverId} không online.`);
        }

        // Gửi tin nhắn lại cho chính người gửi
        io.to(socket.id).emit('receiveMessage', populatedMessage);

      } catch (dbError) {
        console.error('[Socket.io] Lỗi khi xử lý tin nhắn:', dbError);
      }
    });

    // 5. Lắng nghe khi client ngắt kết nối
    socket.on('disconnect', () => {
      console.log(`[Socket.io] User ${userId} (Socket: ${socket.id}) đã ngắt kết nối.`);
      // Xóa user khỏi Map
      if (userId) {
        userSocketMap.delete(userId);
      }
    });

  } catch (error) {
    if (error instanceof Error) {
      console.error(`[Socket.io] Lỗi xác thực: ${error.message}`);
    } else {
      console.error(`[Socket.io] Lỗi xác thực không xác định: ${String(error)}`);
    }
    socket.disconnect(true);
  }
});
// ------------------------------------

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => { 
    console.log(`Server (bao gồm cả Socket.io) đang chạy trên cổng ${PORT}`);
  });
};

startServer().catch(console.error);