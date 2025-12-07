import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IUser } from './User'; // Giả sử User.ts export interface IUser

// (Tùy chọn) Định nghĩa interface cho lastMessage
interface ILastMessage {
  text: string;
  sender: Types.ObjectId | IUser; // Có thể là ID hoặc object User
  createdAt: Date;
}

// Interface cho Conversation Document (cho TypeScript)
export interface IConversation extends Document {
  participants: (Types.ObjectId | IUser)[];
  lastMessage?: ILastMessage;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User', // Tham chiếu đến User model của bạn
      },
    ],
    lastMessage: {
      text: String,
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: Date,
    },
  },
  { timestamps: true } // Tự động thêm createdAt, updatedAt
);

const Conversation: Model<IConversation> = mongoose.model<IConversation>('Conversation', conversationSchema);
export default Conversation;