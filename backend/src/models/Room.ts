import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  title: string;
  description: string;
  price: number;
  area: number;
  address: string;
  district: string;
  city: string;

  electricityPrice: number;
  waterPrice: number;
  waterCostType: 'fixed' | 'per_m3';
  otherPrice: number;

  images: string[];
  amenities: string[];
  landlord: mongoose.Types.ObjectId;
  isAvailable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  area: {
    type: Number,
    required: [true, 'Area is required'],
    min: [1, 'Area must be at least 1m²']
  },
  
  // === 2. CẬP NHẬT SCHEMA: Cấu hình lưu trữ cho các trường mới ===
  electricityPrice: {
    type: Number,
    default: 0,
    min: [0, 'Electricity price cannot be negative']
  },
  waterPrice: {
    type: Number,
    default: 0,
    min: [0, 'Water price cannot be negative']
  },
  waterCostType: {
    type: String,
    enum: ['fixed', 'per_m3'], // 'fixed': Theo tháng, 'per_m3': Theo khối
    default: 'fixed' // Mặc định là theo tháng
  },
  otherPrice: {
    type: Number,
    default: 0,
    min: [0, 'Other price cannot be negative']
  },
  // ============================================================

  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    enum: [
      'Hải Châu',
      'Thanh Khê',
      'Cẩm Lệ',
      'Liên Chiểu',
      'Ngũ Hành Sơn',
      'Sơn Trà'
    ]
  },
  city: {
    type: String,
    default: 'Đà Nẵng'
  },
  
  // Phần coordinates bạn đã xóa (giữ nguyên hiện trạng đã xóa)
  
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  amenities: [{
    type: String,
    enum: [
      'WiFi', 'Điều hòa', 'Tủ lạnh', 'Máy giặt', 'Nước nóng', 'Bếp',
      'Tủ quần áo', 'Giường', 'Bàn học', 'Ghế', 'Ban công', 'Sân thượng',
      'Bảo vệ', 'Thang máy', 'Chỗ để xe', 'Camera an ninh'
    ]
  }],
  landlord: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Landlord is required']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for search optimization
roomSchema.index({
  district: 1,
  price: 1,
  area: 1,
  isAvailable: 1,
  status: 1
});

export const Room = mongoose.model<IRoom>('Room', roomSchema);