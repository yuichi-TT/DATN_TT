import { Router } from 'express';
// Import thêm requestVerification và changePassword
import { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  requestVerification, 
  changePassword 
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (Cần đăng nhập)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);


// Route gửi yêu cầu xác minh (CCCD/Thẻ SV)
router.post('/verify-identity', authenticate, requestVerification);

// Route đổi mật khẩu (Nếu controller đã có hàm này)
router.put('/change-password', authenticate, changePassword);

export { router as authRoutes };