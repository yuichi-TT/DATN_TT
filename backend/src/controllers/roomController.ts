import type { Request, Response } from 'express';
import { Room } from '../models/Room';
import { User } from '../models/User';
// 1. IMPORT MODEL NOTIFICATION
import { Notification } from '../models/Notification';

interface AuthRequest extends Request {
  user?: any;
}

// Get all rooms with filters (Public)
export const getRooms = async (req: Request, res: Response) => {
  try {
    const {
      priceMin,
      priceMax,
      areaMin,
      areaMax,
      district,
      amenities,
      isAvailable,
      page = 1,
      limit = 10,
      sortBy = 'createdAt', 
      order = 'desc',
      landlord 
    } = req.query;

    const filters: any = {};
    filters.status = 'approved';
    
    if (priceMin || priceMax) {
      filters.price = {};
      if (priceMin) filters.price.$gte = Number(priceMin);
      if (priceMax) filters.price.$lte = Number(priceMax);
    }

    if (areaMin || areaMax) {
      filters.area = {};
      if (areaMin) filters.area.$gte = Number(areaMin);
      if (areaMax) filters.area.$lte = Number(areaMax);
    }

    if (district) filters.district = district;
    
    if (isAvailable !== undefined) {
       filters.isAvailable = isAvailable === 'true';
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      filters.amenities = { $in: amenitiesArray };
    }

    if (landlord) {
      filters.landlord = landlord;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sortOptions: { [key: string]: 1 | -1 } = {};
    if (typeof sortBy === 'string') {
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    }

    const rooms = await Room.find(filters)
      .populate('landlord', 'name email phone')
      .sort(sortOptions)
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single room (Public)
export const getRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id).populate('landlord', 'name email phone');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      data: room,
      message: 'Room retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new room
export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (user?.verification?.status !== 'verified') {
        return res.status(403).json({ 
            success: false, 
            message: 'Bạn cần xác minh tài khoản trước khi đăng phòng.' 
        });
    }
    const roomData = {
      ...req.body,
      landlord: req.user?._id
    };

    const room = new Room(roomData);
    await room.save();

    await room.populate('landlord', 'name email phone');

    // === 2. TẠO THÔNG BÁO CHO NGƯỜI DÙNG ===
    await Notification.create({
        recipient: req.user?._id, // Gửi cho chính người đăng
        title: 'Đăng tin thành công',
        message: `Phòng "${room.title}" của bạn đã được tiếp nhận và đang chờ duyệt.`,
        type: 'room',
        link: `/room/${room._id}`, // Link xem chi tiết
        isRead: false
    });
    // =======================================

    res.status(201).json({
      success: true,
      data: room,
      message: 'Room created successfully. It is pending approval from admin.'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update room
export const updateRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const room = await Room.findById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.landlord.toString() !== userId.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this room'
      });
    }

    const { isAvailable } = req.body;
    let statusChanged = false;

    if (Object.keys(req.body).length === 1 && req.body.hasOwnProperty('isAvailable')) {
      // Chỉ đổi isAvailable -> Không đổi status
    } else if (req.user?.role !== 'admin') {
      // Đổi thông tin khác -> Cần duyệt lại
      req.body.status = 'pending';
      statusChanged = true;
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('landlord', 'name email phone');

    // (Tùy chọn) Thêm thông báo nếu bài bị chuyển về trạng thái chờ duyệt
    if (statusChanged) {
        await Notification.create({
            recipient: userId,
            title: 'Cập nhật tin đăng',
            message: `Bạn vừa cập nhật phòng "${room.title}". Tin đăng đang chờ duyệt lại.`,
            type: 'room',
            link: `/room/${room._id}`,
            isRead: false
        });
    }

    res.json({
      success: true,
      data: updatedRoom,
      message: 'Room updated successfully.'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete room
export const deleteRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const room = await Room.findById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.landlord.toString() !== userId.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this room'
      });
    }

    await Room.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Upload room images
export const uploadImages = async (req: AuthRequest, res: Response) => {
  try {
    if (!Array.isArray(req.files)) {
      return res.status(400).json({
        success: false,
        message: 'Không có file nào được tải lên hoặc định dạng không đúng.'
      });
    }
    const imageUrls = req.files.map((file: any) => file.path);
    if (!imageUrls || imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tải ảnh lên thất bại, không nhận được URL.'
      });
    }
    res.json({
      success: true,
      data: imageUrls,
      message: 'Images uploaded successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get My Rooms
export const getMyRooms = async (req: AuthRequest, res: Response) => {
  try {
    const landlordId = req.user?._id;
    const filters: any = { landlord: landlordId };
    
    const rooms = await Room.find(filters)
      .populate('landlord', 'name email phone')
      .sort({ createdAt: 'desc' }); 

    const total = await Room.countDocuments(filters);

    res.json({
      success: true,
      data: rooms,
      pagination: {
        page: 1,
        limit: total,
        total,
        pages: 1
      },
      message: 'My rooms retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};