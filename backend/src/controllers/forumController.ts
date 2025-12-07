import type { Request, Response } from 'express';
import { ForumPost } from '../models/ForumPost';
import type { IForumReply, IForumPost } from '../models/ForumPost'; 
import mongoose from 'mongoose';
// === 1. IMPORT MODEL THÔNG BÁO ===
import { User } from '../models/User';
import { Notification } from '../models/Notification';

interface AuthRequest extends Request {
  user?: {
    _id: mongoose.Types.ObjectId;
    role: string;
  };
}

// ... (Giữ nguyên các hàm getPosts, getPost) ...
// Get all approved forum posts
export const getPosts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { category } = req.query;

    const filters: any = { status: 'approved' }; 
    if (typeof category === 'string' && category) {
      filters.category = category;
    }

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
      message: 'Posts retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// Get single post
export const getPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid post ID' });

    const post = await ForumPost.findById(id)
      .populate('author', 'name email')
      .populate('replies.author', 'name email');
    
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.status !== 'approved') {
      const userId = req.user?._id;
      const userRole = req.user?.role;
      if (userRole !== 'admin' && post.author._id.toString() !== userId?.toString()) {
        return res.status(404).json({ success: false, message: 'Post not found or you do not have permission to view it' });
      }
    }

    res.json({ success: true, data: post, message: 'Post retrieved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// === CẬP NHẬT: CREATE POST ===
// Create new post
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const user = await User.findById(req.user._id);
    if (user?.verification?.status !== 'verified') {
        return res.status(403).json({ 
            success: false, 
            message: 'Vui lòng xác minh tài khoản để có thể đăng bài .' 
        });
    }
    const { title, content, tags, images } = req.body;

    if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung là bắt buộc' });
    }

    const post = await ForumPost.create({
      title, content, tags, images,
      author: req.user?._id
    });

    await post.populate('author', 'name email');

    // === TẠO THÔNG BÁO CHO NGƯỜI DÙNG ===
    await Notification.create({
        recipient: req.user?._id, // Gửi cho chính tác giả
        title: 'Đăng bài thành công',
        message: `Bài viết "${post.title}" của bạn đã được gửi và đang chờ quản trị viên duyệt.`,
        type: 'post', // Loại thông báo là bài viết
        link: `/forum/${post._id}`, 
        isRead: false
    });
    // =====================================

    res.status(201).json({
      success: true,
      data: post,
      message: 'Bài viết đã được gửi và đang chờ duyệt.'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Failed to create post: ' + error.message });
  }
};

// === CẬP NHẬT: UPDATE POST ===
// Update post
export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid post ID' });

    const post = await ForumPost.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.author.toString() !== userId?.toString() && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    }

    // Logic kiểm tra status
    let statusChanged = false;
    if (userRole !== 'admin') {
      req.body.status = 'pending';
      statusChanged = true;
    }

    const updatedPost = await ForumPost.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    // === TẠO THÔNG BÁO NẾU CẦN DUYỆT LẠI ===
    if (statusChanged) {
        await Notification.create({
            recipient: userId,
            title: 'Cập nhật bài viết',
            message: `Bạn vừa chỉnh sửa bài viết "${post.title}". Bài viết đang chờ duyệt lại.`,
            type: 'post',
            link: `/forum/${post._id}`,
            isRead: false
        });
    }
    // ========================================

    res.json({
      success: true,
      data: updatedPost,
      message: 'Post updated successfully. It may require re-approval.'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Failed to update post: ' + error.message });
  }
};

// ... (Giữ nguyên deletePost) ...
// Delete post
export const deletePost = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?._id;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post ID' });
      }
  
      const post = await ForumPost.findById(id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
  
      // Check if user is the author or admin
      if (post.author.toString() !== userId?.toString() && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this post'
        });
      }
  
      await ForumPost.findByIdAndDelete(id);
  
      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Server Error: ' + error.message
      });
    }
  };

// === CẬP NHẬT: CREATE REPLY (BÌNH LUẬN) ===
// Create reply
export const createReply = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const commenterId = req.user?._id; // ID người bình luận

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid post ID' });
    if (!content) return res.status(400).json({ success: false, message: 'Reply content cannot be empty' });

    const post = await ForumPost.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.status !== 'approved') return res.status(403).json({ success: false, message: 'Cannot reply to a post that is not approved.' });

    const reply = {
      content,
      author: commenterId,
    } as IForumReply;

    post.replies.push(reply);
    await post.save();
    await post.populate('replies.author', 'name email');

    // === TẠO THÔNG BÁO CHO TÁC GIẢ BÀI VIẾT ===
    // Chỉ gửi nếu người bình luận KHÁC tác giả bài viết
    if (post.author.toString() !== commenterId?.toString()) {
        await Notification.create({
            recipient: post.author, // Gửi cho tác giả bài viết gốc
            title: 'Bình luận mới',
            message: `Có người vừa bình luận vào bài viết "${post.title}" của bạn.`,
            type: 'post',
            link: `/forum/${post._id}`,
            isRead: false
        });
    }
    // ==========================================

    res.status(201).json({
      success: true,
      data: post.replies[post.replies.length - 1],
      message: 'Reply created successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Failed to create reply: ' + error.message });
  }
};

// ... (Giữ nguyên likePost, getMyPosts) ...
export const likePost = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?._id;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post ID' });
      }
  
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
  
      // === BƯỚC 2: TÌM BÀI VIẾT ===
      const post = await ForumPost.findById(id);
  
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
  
      // === BƯỚC 3: SỬA LỖI TYPESCRIPT BẰNG CÁCH ÉP KIỂU ===
      // Giờ đây 'typedPost' sẽ có kiểu Mongoose Document VÀ các thuộc tính của IForumPost
      const typedPost = post as (mongoose.Document & IForumPost);
  
      // Chỉ cho phép like/unlike bài viết đã được duyệt
      if (typedPost.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Cannot interact with a post that is not approved.'
        });
      }
  
      // Chuyển mảng likes (ObjectId) thành mảng string để so sánh
      // === SỬA: DÙNG typedPost THAY VÌ post ===
      const likesAsStrings = typedPost.likes.map(likeId => likeId.toString());
      const hasLiked = likesAsStrings.includes(userId.toString());
  
      if (hasLiked) {
        // Nếu đã like -> Bỏ like (unlike)
        typedPost.likes = typedPost.likes.filter(
          likeId => likeId.toString() !== userId.toString()
        ) as mongoose.Types.ObjectId[]; // Ép kiểu mảng kết quả
      } else {
        // Nếu chưa like -> Thêm like
        typedPost.likes.push(userId as any); // Thêm userId
      }
  
      await typedPost.save();
      
      // Populate lại thông tin để trả về cho frontend (cập nhật cache)
      await typedPost.populate('author', 'name email');
      await typedPost.populate('replies.author', 'name email');
  
      res.json({
        success: true,
        data: typedPost, // Trả về post đã cập nhật
        message: 'Post like toggled successfully'
      });
  
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Server Error: ' + error.message
      });
    }
  };
  export const getMyPosts = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
  
      // Lấy tất cả bài viết của user này (bao gồm cả approved, pending, rejected)
      // Sắp xếp theo thời gian tạo mới nhất trước
      const posts = await ForumPost.find({ author: userId })
        .sort({ createdAt: -1 }); 
  
      res.json({
        success: true,
        data: posts,
        message: 'User posts retrieved successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Server Error: ' + error.message
      });
    }
  };