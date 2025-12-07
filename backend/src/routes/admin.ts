import { Router } from 'express';
import { 
  getUsers, 
  updateUser, 
  deleteUser, 
  getRooms, 
  updateRoomStatus, 
  getDashboardStats,
  getPendingPosts,
  approvePost,
  rejectPost,
  getAllPostsForAdmin,
  getPendingRooms,
  approveRoom,
  rejectRoom,
  getPendingVerifications,
  processVerification
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// 1. User management
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// === 2. VERIFICATION MANAGEMENT (MỚI) ===
router.get('/verifications', getPendingVerifications); // Lấy danh sách chờ duyệt
router.put('/verifications/:id', processVerification); // Duyệt hoặc Từ chối

// 3. Room management
router.get('/rooms', getRooms); // Lấy danh sách phòng (có bộ lọc)
router.put('/rooms/:id/status', updateRoomStatus); // Cập nhật trạng thái (cũ)
router.get('/rooms/pending', getPendingRooms); // Lấy phòng chờ duyệt
router.patch('/rooms/:id/approve', approveRoom); // Duyệt phòng
router.patch('/rooms/:id/reject', rejectRoom); // Từ chối phòng

// 4. Forum Management
router.get('/forum/posts', getAllPostsForAdmin); // Lấy tất cả bài viết
router.get('/forum/pending', getPendingPosts); // Lấy bài viết chờ duyệt
router.patch('/forum/posts/:id/approve', approvePost); // Duyệt bài viết
router.patch('/forum/posts/:id/reject', rejectPost); // Từ chối bài viết

// 5. Dashboard
router.get('/dashboard/stats', getDashboardStats);

export { router as adminRoutes };