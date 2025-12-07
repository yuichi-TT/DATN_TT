import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // Người nhận thông báo
  title: string;
  message: string;
  type: 'system' | 'room' | 'post'; // Loại thông báo
  link?: string; // Đường dẫn khi click vào (vd: /rooms/:id)
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['system', 'room', 'post'], default: 'system' },
  link: { type: String },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);