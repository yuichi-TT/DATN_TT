import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IUser } from './User'; // Giả sử User.ts export interface IUser
import { IConversation } from './Conversation'; // Import từ file trên

// Interface cho Message Document (cho TypeScript)
export interface IMessage extends Document {
  conversationId: Types.ObjectId | IConversation;
  sender: Types.ObjectId | IUser;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Tham chiếu đến User model của bạn
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // Tự động thêm createdAt, updatedAt
);

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);
export default Message;