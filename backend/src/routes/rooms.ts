import { Router } from 'express';
import { 
  getRooms, 
  getRoom, 
  createRoom, 
  updateRoom, 
  deleteRoom, 
  uploadImages,
  getMyRooms // <-- THÊM IMPORT HÀM MỚI
} from '../controllers/roomController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// === THÊM ROUTE MỚI (PRIVATE) CHO CHỦ TRỌ ===
// Phải đặt trước '/:id' để 'my-rooms' không bị nhầm là ID
router.get('/my-rooms', authenticate, authorize('landlord'), getMyRooms);
// ========================================

// Public routes
router.get('/', getRooms);
router.get('/:id', getRoom);

// Protected routes
router.post('/', authenticate, authorize('landlord', 'admin'), createRoom);
router.put('/:id', authenticate, updateRoom);
router.delete('/:id', authenticate, deleteRoom);

router.post('/upload', authenticate, upload.array('images', 10), uploadImages);

export { router as roomRoutes };
