import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

// Generate JWT token (Cập nhật để bao gồm role và tăng thời gian sống)
const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'your-secret-key', {
    // SỬA: Đặt thời gian hết hạn là 7 ngày để tránh bị logout sớm
    expiresIn: '7d' 
  });
};

// Register user
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      phone,
      role: role || 'student'
    });

    await user.save();

    // SỬA: Truyền thêm role
    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      },
      message: 'User registered successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // SỬA: Truyền thêm role
    const token = generateToken(user._id.toString(), user.role);

    res.json({
      success: true,
      data: {
        user,
        token
      },
      message: 'Login successful'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Login Admin (Giả định nằm trong authController)
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Tìm người dùng bằng email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // 2. Kiểm tra mật khẩu
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // 3. KIỂM TRA VAI TRÒ ADMIN
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Truy cập bị từ chối. Tài khoản không phải quản trị viên.'
      });
    }

    // 4. Nếu tất cả đều đúng, tạo token và gửi phản hồi
    // SỬA: Truyền thêm role
    const token = generateToken(user._id.toString(), user.role);

    res.json({
      success: true,
      data: {
        user,
        token
      },
      message: 'Admin login successful'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    // SỬA: Lấy tất cả thông tin, trừ mật khẩu
    const user = await User.findById(req.user?._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'Profile retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, avatar } = req.body;
    const userId = req.user?._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, avatar },
      { new: true, runValidators: true }
    ).select('-password'); // SỬA: Bỏ password khỏi response

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// === HÀM MỚI: ĐỔI MẬT KHẨU ===
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    // Cập nhật mật khẩu mới (Pre-save hook trong Model sẽ tự động hash)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// === HÀM MỚI: GỬI YÊU CẦU XÁC MINH ===
export const requestVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { frontImage, backImage } = req.body;
    const userId = req.user._id;

    if (!frontImage || !backImage) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ ảnh mặt trước và mặt sau.' });
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { 
        'verification.status': 'pending',
        'verification.frontImage': frontImage,
        'verification.backImage': backImage,
        'verification.message': '', // Xóa lý do từ chối cũ (nếu có)
        'verification.submittedAt': new Date()
      }, 
      { new: true }
    ).select('-password'); // SỬA: Bỏ password khỏi response

    res.json({ success: true, data: user, message: 'Đã gửi hồ sơ xác minh thành công. Vui lòng chờ duyệt.' });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};