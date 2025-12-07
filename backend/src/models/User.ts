import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId; 
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'student' | 'landlord' | 'admin';
  avatar?: string;
  
  // === 1. CẬP NHẬT INTERFACE: Thêm thông tin xác minh ===
  verification: {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    frontImage?: string; // Ảnh mặt trước
    backImage?: string;  // Ảnh mặt sau
    message?: string;    // Lý do từ chối (nếu có)
    submittedAt?: Date;
  };
  // =====================================================

  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10,11}$/, 'Please enter a valid phone number']
  },
  role: {
    type: String,
    enum: ['student', 'landlord', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: ''
  },

  // === 2. CẬP NHẬT SCHEMA: Cấu trúc lưu trữ xác minh ===
  verification: {
    status: { 
      type: String, 
      enum: ['unverified', 'pending', 'verified', 'rejected'], 
      default: 'unverified' 
    },
    frontImage: { type: String, default: '' },
    backImage: { type: String, default: '' },
    message: { type: String, default: '' }, // Lưu lý do từ chối để hiển thị cho user
    submittedAt: { type: Date }
  }
  // ====================================================

}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.model<IUser>('User', userSchema);