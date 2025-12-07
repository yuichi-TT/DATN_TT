import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, type IUser} from '../models/User';
  
export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // 1. Giải mã Token để lấy userId và role
    // SỬA: Ép kiểu kết quả giải mã Token thành một đối tượng cơ bản
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string, role: string };
    
    // 2. Truy vấn DB để lấy đối tượng User đầy đủ (KHÔNG BAO GỒM PASSWORD)
    // Lấy chính xác các trường cần thiết để controllers hoạt động mượt mà
    const user = await User.findById(decoded.userId).select('name email role phone avatar verification createdAt');
    
    if (!user) {
      // Token hợp lệ nhưng User không còn tồn tại trong DB
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // 3. Gán đối tượng User đã được làm sạch (có đầy đủ role) vào req.user
    req.user = user;
    next();
  } catch (error) {
    // Xử lý lỗi Token hết hạn hoặc chữ ký không hợp lệ
    res.status(401).json({
      success: false,
      message: 'Invalid token or token expired.'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Kiểm tra xem đã có user từ middleware authenticate chưa
    if (!req.user || !req.user._id) { 
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated or ID missing.'
      });
    }
    console.log('Authorized user ID:', req.user);
    // 2. Kiểm tra vai trò (Middleware này hoạt động chính xác vì req.user đã được populate role)
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};