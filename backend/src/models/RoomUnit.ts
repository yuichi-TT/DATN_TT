import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomUnit extends Document {
  roomTypeId: mongoose.Types.ObjectId; // Liên kết với bài đăng gốc
  name: string; // Tên phòng: P.101, P.102
  status: 'available' | 'rented' | 'maintenance';
  currentTenantName?: string; // Tên người thuê (quản lý đơn giản)
  currentTenantPhone?: string;
  createdAt: Date;
}

const roomUnitSchema = new Schema<IRoomUnit>({
  roomTypeId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['available', 'rented', 'maintenance'], 
    default: 'available' 
  },
  currentTenantName: { type: String },
  currentTenantPhone: { type: String }
}, { timestamps: true });

export const RoomUnit = mongoose.model<IRoomUnit>('RoomUnit', roomUnitSchema);