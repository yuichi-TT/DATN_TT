// src/controllers/notificationController.ts

import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth'; 

// 1. Hàm lấy danh sách thông báo
export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
      
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lấy thông báo' });
  }
};

// 2. Hàm đánh dấu đã đọc
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const updatedNotification = await Notification.findByIdAndUpdate(
      id, 
      { isRead: true },
      { new: true } 
    );
    
    if (!updatedNotification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật thông báo' });
  }
};

// 3. Hàm lấy số lượng thông báo chưa đọc (ĐÃ SỬA LỖI TS)
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    // Thêm kiểm tra xác thực để giải quyết lỗi 'req.user' is possibly 'undefined'
    if (!req.user || !req.user._id) {
        return res.status(401).json({ success: false, message: 'Unauthorized access.' });
    }
    
    const userId = req.user._id;
    
    const unreadCount = await Notification.countDocuments({ 
        recipient: userId, 
        isRead: false 
    });
    res.json({ success: true, count: unreadCount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};