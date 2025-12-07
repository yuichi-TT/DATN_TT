import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';

// Interface để thêm 'user' (từ middleware xác thực) vào Request
interface AuthRequest extends Request {
  user?: {
    id: string; // Hoặc _id, tùy thuộc vào cách bạn tạo token
  };
}

/**
 * @desc    Lấy tất cả hội thoại của user đã đăng nhập
 * @route   GET /api/conversations
 * @access  Private
 * @body    { "receiverId": "ID_CUA_NGUOI_NHAN" }
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id; // Lấy ID từ auth middleware
    if (!userId) {
      return res.status(401).json({ message: 'Chưa xác thực' });
    }

    const conversations = await Conversation.find({
      participants: userId, // 1. Tìm tất cả hội thoại có user này
    })
      .populate({
        path: 'participants', // 2. Lấy thông tin chi tiết của TẤT CẢ người tham gia
        select: 'name avatar email', // (Frontend sẽ tự lọc ra user hiện tại)
      })
      .populate({
        path: 'lastMessage.sender', // 3. Lấy thông tin người gửi tin nhắn cuối
        select: 'name avatar',
      })
      .sort({ updatedAt: -1 }); // 4. Xếp hội thoại mới nhất lên đầu

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Lỗi khi lấy hội thoại:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

/**
 * @desc    Lấy tất cả tin nhắn của một hội thoại
 * @route   GET /api/messages/:conversationId
 * @access  Private
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;

    // (Tùy chọn) Kiểm tra xem user có thuộc hội thoại này không
    // const userId = req.user?.id;
    // const conversation = await Conversation.findById(conversationId);
    // if (!conversation?.participants.includes(userId)) {
    //   return res.status(403).json({ message: 'Không có quyền truy cập' });
    // }

    const messages = await Message.find({
      conversationId: conversationId,
    })
      .populate({
        path: 'sender', // 1. Lấy thông tin người gửi
        select: 'name avatar',
      })
      .sort({ createdAt: 'asc' }); // 2. Xếp tin nhắn cũ nhất lên đầu (để đọc)

    res.status(200).json(messages);
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
export const findOrCreateConversation = async (req: AuthRequest, res: Response) => {
  const senderId = req.user?.id;
  const { receiverId } = req.body;

  if (!receiverId) {
    return res.status(400).json({ message: 'Thiếu receiverId' });
  }

  try {
    // 1. Kiểm tra xem hội thoại đã tồn tại giữa 2 người này chưa
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // 2. Nếu chưa, hãy tạo mới
    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
      });
      await conversation.save();
    }

    // 3. Trả về thông tin hội thoại (dù là cũ hay mới)
    // Populate đầy đủ thông tin để frontend có thể dùng ngay
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name avatar email')
      .populate('lastMessage.sender', 'name avatar');

    res.status(200).json(populatedConversation);
    
  } catch (error) {
    console.error('Lỗi khi tìm/tạo hội thoại:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};