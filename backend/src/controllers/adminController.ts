import type { Request, Response } from 'express';
import { User } from '../models/User';
import { Room } from '../models/Room';
import { ForumPost } from '../models/ForumPost';
import mongoose from 'mongoose';
// === IMPORT THÊM ===
import { Notification } from '../models/Notification'; 

interface AuthRequest extends Request {
  user?: any;
}

// Get all users (Giữ nguyên)
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const filters: any = {};
    if (role) filters.role = role;
    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find(filters)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await User.countDocuments(filters);
    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      message: 'Users retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user (Giữ nguyên)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { name, phone, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user, message: 'User updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete user (Giữ nguyên)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user?._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all rooms for admin (Giữ nguyên)
export const getRooms = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, isAvailable, district } = req.query;
    const filters: any = {};
    if (isAvailable !== undefined) filters.isAvailable = isAvailable === 'true';
    if (district) filters.district = district;
    const skip = (Number(page) - 1) * Number(limit);
    const rooms = await Room.find(filters)
      .populate('landlord', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Room.countDocuments(filters);
    res.json({
      success: true,
      data: rooms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      message: 'Rooms retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update room status (Giữ nguyên)
export const updateRoomStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const room = await Room.findByIdAndUpdate(
      id,
      { isAvailable },
      { new: true, runValidators: true }
    ).populate('landlord', 'name email phone');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, data: room, message: 'Room status updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get dashboard stats (Giữ nguyên)
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: 'student' });
    const landlords = await User.countDocuments({ role: 'landlord' });
    const totalRooms = await Room.countDocuments();
    const totalPosts = await ForumPost.countDocuments();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          name: { $concat: ['Tháng ', { $toString: '$_id.month' }] },
          'Người dùng mới': '$count',
        },
      },
    ]);
    res.status(200).json({
      success: true,
      data: { totalUsers, students, landlords, totalRooms, totalPosts, userGrowth },
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Get pending posts (Giữ nguyên)
export const getPendingPosts = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filters: any = { status: 'pending' };
    if (typeof category === 'string' && category) {
      filters.category = category;
    }
    const posts = await ForumPost.find(filters).populate('author', 'name email').sort({ createdAt: 'desc' });
    res.json({ success: true, data: posts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// === CẬP NHẬT: DUYỆT BÀI VIẾT (Approve Post) ===
export const approvePost = async (req: Request, res: Response) => {
  try {
    const post = await ForumPost.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

    // === TẠO THÔNG BÁO ===
    await Notification.create({
        recipient: post.author, 
        title: 'Bài viết được duyệt ✅',
        message: `Bài viết "${post.title}" của bạn trên diễn đàn đã được duyệt.`,
        type: 'post',
        link: `/forum/${post._id}`,
        isRead: false
    });
    // ====================

    res.json({ success: true, data: post, message: 'Bài viết đã được duyệt.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// === CẬP NHẬT: TỪ CHỐI BÀI VIẾT (Reject Post) ===
export const rejectPost = async (req: Request, res: Response) => {
  try {
    const post = await ForumPost.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

    // === TẠO THÔNG BÁO ===
    await Notification.create({
        recipient: post.author,
        title: 'Bài viết bị từ chối ❌',
        message: `Bài viết "${post.title}" của bạn đã bị từ chối do vi phạm quy định.`,
        type: 'post',
        link: `/forum/${post._id}`, // Hoặc link khác để họ sửa
        isRead: false
    });
    // ====================

    res.json({ success: true, data: post, message: 'Bài viết đã bị từ chối.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// Get all posts for admin (Giữ nguyên)
export const getAllPostsForAdmin = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { category, status } = req.query;
    const filters: any = {};
    if (typeof category === 'string' && category) filters.category = category;
    if (typeof status === 'string' && status) filters.status = status;
    const skip = (page - 1) * limit;
    const posts = await ForumPost.find(filters)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await ForumPost.countDocuments(filters);
    res.json({
      success: true,
      data: posts,
      pagination: {
        page, limit, total, pages: Math.ceil(total / limit)
      },
      message: 'Admin: Posts retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// Get pending rooms (Giữ nguyên)
export const getPendingRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find({ status: 'pending' })
      .populate('landlord', 'name email')
      .sort({ createdAt: 'desc' });
    res.json({ success: true, data: rooms });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// === CẬP NHẬT: DUYỆT PHÒNG (Approve Room) ===
export const approveRoom = async (req: Request, res: Response) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });

    // === TẠO THÔNG BÁO ===
    await Notification.create({
        recipient: room.landlord,
        title: 'Phòng đã được duyệt ✅',
        message: `Tin đăng "${room.title}" của bạn đã được duyệt và đang hiển thị công khai.`,
        type: 'room',
        link: `/room/${room._id}`,
        isRead: false
    });
    // ====================

    res.json({ success: true, data: room, message: 'Phòng đã được duyệt.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// === CẬP NHẬT: TỪ CHỐI PHÒNG (Reject Room) ===
export const rejectRoom = async (req: Request, res: Response) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });

    // === TẠO THÔNG BÁO ===
    await Notification.create({
        recipient: room.landlord,
        title: 'Phòng bị từ chối ❌',
        message: `Tin đăng "${room.title}" chưa đạt yêu cầu. Vui lòng kiểm tra và chỉnh sửa lại.`,
        type: 'room',
        link: `/landlord/edit-room/${room._id}`, // Dẫn về trang sửa
        isRead: false
    });
    // ====================

    res.json({ success: true, data: room, message: 'Phòng đã bị từ chối.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// 1. Lấy danh sách user đang chờ xác minh
// GET /api/admin/verifications
export const getPendingVerifications = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ 'verification.status': 'pending' })
      .select('name email role phone verification createdAt'); // Chỉ lấy thông tin cần thiết
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Xử lý Duyệt/Từ chối
// PUT /api/admin/verifications/:id
export const processVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body; // status: 'verified' | 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { 
        'verification.status': status,
        'verification.message': message || ''
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // === GỬI THÔNG BÁO ===
    const title = status === 'verified' ? 'Xác minh thành công ✅' : 'Xác minh thất bại ❌';
    const notifMsg = status === 'verified' 
      ? 'Tài khoản của bạn đã được xác minh. Bạn có thể đăng tin ngay bây giờ.' 
      : `Hồ sơ xác minh bị từ chối. Lý do: ${message || 'Ảnh không rõ nét'}`;

    await Notification.create({
      recipient: user._id,
      title: title,
      message: notifMsg,
      type: 'system',
      link: '/profile',
      isRead: false
    });

    res.json({ success: true, message: 'Đã cập nhật trạng thái xác minh' });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};