// backend/routes/authAdmin.ts

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User'; 

const router = Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Tìm người dùng và kiểm tra mật khẩu
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác.' });
        }

        // 2. Kiểm tra vai trò admin
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Truy cập bị từ chối. Bạn không phải là quản trị viên.' 
            });
        }

        // 3. Tạo JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: '1h',
        });

        // SỬA LỖI: Trả về đúng cấu trúc dữ liệu mà frontend mong đợi
        // Gửi về cả đối tượng user và token
        res.status(200).json({
            success: true,
            data: {
                user: user.toObject(), // Chuyển Mongoose document thành object thuần
                token,
            },
            message: 'Admin login successful'
        });

    } catch (err) {
        const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred';
        console.error(errorMessage);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
});

export { router as authAdminRoutes };