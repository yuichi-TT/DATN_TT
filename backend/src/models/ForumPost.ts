import mongoose, { Document, Schema, Types } from 'mongoose';

// Interface for a single reply
export interface IForumReply extends Document {
  content: string;
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for a forum post
export interface IForumPost extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  category: 'question' | 'experience' | 'general';
  tags: string[];
  replies: IForumReply[];
  status: 'pending' | 'approved' | 'rejected';
  images: string[];
  likes: Types.ObjectId[]; // <--- THÊM VÀO (1)
  createdAt: Date;
  updatedAt: Date;
}

// Schema for a single reply (to be embedded in ForumPost)
const forumReplySchema = new Schema<IForumReply>({
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [1000, 'Content cannot exceed 1000 characters']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  }
}, {
  timestamps: true
});

// Schema for the main forum post
const forumPostSchema = new Schema<IForumPost>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  category: {
    type: String,
    enum: ['question', 'experience', 'general'],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  replies: [forumReplySchema],
  
  // <--- THÊM VÀO (2)
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  images: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for search optimization
forumPostSchema.index({ 
  category: 1, 
  createdAt: -1 
});

forumPostSchema.index({ 
  tags: 1 
});

export const ForumPost = mongoose.model<IForumPost>('ForumPost', forumPostSchema);