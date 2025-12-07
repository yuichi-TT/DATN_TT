import express from 'express';
// Cần import hàm getUnreadCount đã được bạn định nghĩa trong controller
import { getMyNotifications, markAsRead, getUnreadCount } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth'; 

const router = express.Router();

// 1. Lấy danh sách thông báo
// GET /api/notifications
router.get('/', authenticate, getMyNotifications);

// 2. Đánh dấu đã đọc 1 thông báo
// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, markAsRead);

// 3. THÊM ROUTE MỚI: Lấy số lượng thông báo chưa đọc
// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, getUnreadCount);

export default router;