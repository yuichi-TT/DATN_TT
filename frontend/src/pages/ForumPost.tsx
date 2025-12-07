import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { forumAPI, conversationAPI } from '../services/api';
import type { ForumPost, ForumReply } from '../services/api';
// === THAY ĐỔI 1: IMPORT TOAST ===
import toast from 'react-hot-toast'; 

// === BƯỚC 1: THÊM CÁC ICON TƯƠNG TÁC ===
import { 
  HandThumbUpIcon, 
  ShareIcon, 
  XMarkIcon, 
  PaperAirplaneIcon 
} from '@heroicons/react/24/outline';

import { HandThumbUpIcon as HandThumbUpSolidIcon } from '@heroicons/react/24/solid';


interface SimpleUser {
  _id: string;
  name: string;
  avatar?: string;
}

interface Conversation {
  _id: string;
  participants: SimpleUser[];
  // ...
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "Vài giây trước";
};

// Component cho 1 bình luận
const ReplyCard: React.FC<{ reply: ForumReply }> = ({ reply }) => {
  return (
    <div className="flex space-x-3 py-4 border-t">
      <img 
        className="h-10 w-10 rounded-full object-cover" 
        src={reply.author.avatar || `https://ui-avatars.com/api/?name=${reply.author.name}&background=random&color=fff`} 
        alt={reply.author.name} 
      />
      <div>
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-900">{reply.author.name}</span>
          <span className="text-xs text-gray-500">• {formatTimeAgo(reply.createdAt)}</span>
        </div>
        <p className="text-gray-700">{reply.content}</p>
      </div>
    </div>
  );
};


const ForumPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); 
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newReplyContent, setNewReplyContent] = useState('');
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); 
  const [shareLoadingId, setShareLoadingId] = useState<string | null>(null); 

 
  const { data: postData, isLoading, isError } = useQuery({
    queryKey: ['forum', id], 
    queryFn: () => forumAPI.getPost(id!), 
    enabled: !!id,
  });

  const post: ForumPost | undefined = postData?.data.data;


  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationAPI.getConversations(), 
    enabled: isShareModalOpen && !!user, 
    staleTime: 1000 * 60 * 5, 
  });
  const conversations: Conversation[] | undefined = conversationsData?.data?.data;

  // === LOGIC GỬI BÌNH LUẬN (MUTATION) ===
  const { mutate: addReply, isPending: isReplying } = useMutation({
    mutationFn: (content: string) => forumAPI.createReply(id!,  content ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', id] });
      setNewReplyContent(''); 
      // === THAY ĐỔI 2: Dùng toast.success ===
      toast.success('Bình luận đã được gửi!');
    },
    onError: (err: any) => {
      // === THAY ĐỔI 3: Dùng toast.error ===
      const errorMessage = 'Lỗi khi gửi bình luận: ' + (err.response?.data?.message || err.message);
      toast.error(errorMessage);
    }
  });

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyContent.trim() || !user) return;
    addReply(newReplyContent);
  };

  // === LOGIC LIKE BÀI VIẾT (MUTATION MỚI) ===
  const { mutate: toggleLike, isPending: isLiking } = useMutation({
    mutationFn: () => forumAPI.likePost(id!),
    onSuccess: (response) => {
      queryClient.setQueryData(['forum', id], response);
      // Cập nhật trạng thái like bằng toast
      const isCurrentlyLiked = post?.likes?.includes(user?._id || '');
      const message = isCurrentlyLiked ? 'Đã bỏ thích.' : 'Đã thích bài viết!';
      toast.success(message, { duration: 1500, icon: isCurrentlyLiked ? '👎' : '👍' });
    },
    onError: (err: any) => {
      // === THAY ĐỔI 4: Dùng toast.error ===
      const errorMessage = 'Lỗi khi thích bài viết: ' + (err.response?.data?.message || err.message);
      toast.error(errorMessage);
    }
  });

  const handleLikeClick = () => {
    if (!user) {
      navigate('/login'); 
      return;
    }
    toggleLike();
  };

  // Kiểm tra xem user hiện tại đã like bài viết này chưa
  const hasLiked = post?.likes?.includes(user?._id || '');


  
  const handleStartChat = async (receiverId: string) => {
    if (!user) { navigate('/login'); return; }
    if (user._id === receiverId) { 
      // === THAY ĐỔI 5: Dùng toast.error ===
      toast.error("Bạn không thể tự nhắn tin cho chính mình."); 
      return; 
    }
    
    const loadingToastId = toast.loading('Đang mở cuộc trò chuyện...');
    setChatLoadingId(receiverId);
    try {
      const response = await conversationAPI.findOrCreate(receiverId);
      toast.success('Đã mở cuộc trò chuyện.', { id: loadingToastId });
      navigate('/chat', { state: { conversationToOpen: response.data } });
    } catch (e: any) {
      // === THAY ĐỔI 6: Dùng toast.error ===
      const errorMessage = 'Lỗi khi bắt đầu chat: ' + (e.response?.data?.message || e.message);
      toast.error(errorMessage, { id: loadingToastId });
    } finally {
      setChatLoadingId(null); 
    }
  };

  // === LOGIC GỬI TIN NHẮN SHARE ===
  const { mutate: shareToUser } = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string, content: string }) => 
      conversationAPI.sendMessage(conversationId, content),
    onSuccess: (data, variables) => {
      // === THAY ĐỔI 7: Dùng toast.success ===
      toast.success('Đã chia sẻ bài viết thành công!');
      setShareLoadingId(null); 
      setIsShareModalOpen(false); 
    },
    onError: (err: any, variables) => {
      // === THAY ĐỔI 8: Dùng toast.error ===
      const errorMessage = 'Lỗi khi chia sẻ: ' + (err.response?.data?.message || err.message);
      toast.error(errorMessage);
      setShareLoadingId(null); 
    }
  });

  const handleShareToUser = (conversation: Conversation) => {
    if (!post) return;
    const postUrl = window.location.href;
    const content = `Hãy xem bài viết này: "${post.title}"\n${postUrl}`;
    
    setShareLoadingId(conversation._id); 
    shareToUser({ conversationId: conversation._id, content });
  };
  
  const handleShareClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsShareModalOpen(true); 
  };
  
  // === BƯỚC 4: RENDER GIAO DIỆN "XỊN" ===
  if (isLoading) {
    return <div className="max-w-7xl mx-auto py-8">Đang tải bài viết...</div>;
  }
  if (isError || !post) {
    return <div className="max-w-7xl mx-auto py-8 text-red-600">Không thể tải bài viết.</div>;
  }

  // Nếu code chạy tới đây, 'post' chắc chắn đã được định nghĩa
  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT CHÍNH (NỘI DUNG BÀI VIẾT & BÌNH LUẬN) */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Thông tin tác giả */}
          <div className="p-6 flex items-center space-x-4 border-b">
            <img 
              className="h-12 w-12 rounded-full object-cover" 
              src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.name}&background=random&color=fff`} 
              alt={post.author.name} 
            />
            <div>
              <p className="font-semibold text-lg text-gray-900">{post.author.name}</p>
              <p className="text-sm text-gray-500">Đăng {formatTimeAgo(post.createdAt)}</p>
            </div>
            {user && user._id !== post.author._id && (
              <button
                onClick={() => handleStartChat(post.author._id)}
                disabled={chatLoadingId === post.author._id}
                className="ml-auto px-3 py-1.5 text-sm font-medium border rounded-full text-primary-600 hover:bg-primary-50"
              >
                {chatLoadingId === post.author._id ? 'Đang mở...' : 'Nhắn tin'}
              </button>
            )}
          </div>

          {/* Nội dung bài viết */}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
            <div className="prose max-w-none text-gray-700 whitespace-pre-line">
              {post.content}
            </div>

            {post.images && post.images.length > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {post.images.map((imgUrl, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={imgUrl} 
                      alt={`Ảnh chi tiết ${index + 1}`} 
                      className="w-full h-auto rounded-lg shadow-sm border object-cover hover:opacity-95 transition-opacity cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {post.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* === THANH TƯƠNG TÁC === */}
          <div className="p-4 border-t flex items-center space-x-6">
            {/* Nút Like */}
            <button 
              onClick={handleLikeClick}
              disabled={isLiking}
              className={`flex items-center space-x-1 transition-colors ${
                hasLiked 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600' 
              }`}
            >
              {hasLiked ? (
                <HandThumbUpSolidIcon className="w-5 h-5" />
              ) : (
                <HandThumbUpIcon className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {isLiking ? '...' : (hasLiked ? 'Đã thích' : 'Thích')}
              </span>
              <span className="text-sm">({post.likes?.length || 0})</span>
            </button>
            
            {/* Nút Share (mở modal) */}
            <button 
              onClick={handleShareClick} 
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600" 
            >
              <ShareIcon className="w-5 h-5" />
              <span className="text-sm font-medium">
                Chia sẻ
              </span>
            </button>
          </div>

          {/* Khu vực Bình luận */}
          <div className="p-6 bg-gray-50 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Bình luận ({post.replies?.length || 0})
            </h2>
            
            {/* Form viết bình luận mới */}
            {user ? (
              <form onSubmit={handleSubmitReply} className="mb-6 flex items-start space-x-3">
                <img 
                  className="h-10 w-10 rounded-full object-cover" 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`} 
                  alt={user.name} 
                />
                <div className="flex-1">
                  <textarea 
                    rows={3}
                    value={newReplyContent}
                    onChange={(e) => setNewReplyContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Viết bình luận của bạn..."
                  />
                  <button 
                    type="submit" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 mt-2"
                    disabled={isReplying || !newReplyContent.trim()}
                  >
                    {isReplying ? 'Đang gửi...' : 'Gửi bình luận'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-gray-100 rounded-md text-center">
                <Link to="/login" className="font-medium text-blue-600 hover:underline">
                  Đăng nhập
                </Link> để viết bình luận
              </div>
            )}
            
            {/* Danh sách bình luận cũ */}
            <div className="space-y-4">
              {post.replies && post.replies.length > 0 ? (
                post.replies.map(reply => (
                  <ReplyCard key={reply._id} reply={reply} />
                ))
              ) : (
                <p className="text-gray-500">Chưa có bình luận nào.</p>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHỤ (THÔNG TIN TÁC GIẢ) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
            <h3 className="text-xl font-semibold mb-4">Tác giả</h3>
            <div className="flex items-center space-x-4 mb-4">
              <img 
                className="w-16 h-16 rounded-full object-cover" 
                src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.name}&background=random&color=fff`} 
                alt={post.author.name}
              />
              <div>
                <p className="text-lg font-semibold">{post.author.name}</p>
              </div>
            </div>
            
            {user && user._id !== post.author._id && (
              <button
                onClick={() => handleStartChat(post.author._id)}
                disabled={chatLoadingId === post.author._id}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {chatLoadingId === post.author._id ? 'Đang mở...' : 'Nhắn tin cho tác giả'}
              </button>
            )}
            {user && user._id === post.author._id && (
              <p className="text-sm text-gray-500 text-center">Đây là bài viết của bạn.</p>
            )}
          </div>
        </div>
      </div>

      {/* === MODAL SHARE === */}
      {isShareModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setIsShareModalOpen(false)} 
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Chia sẻ với...</h3>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body (Danh sách user) */}
            <div className="p-4 max-h-80 overflow-y-auto">
              {isLoadingConversations && (
                <div className="text-center text-gray-500">Đang tải danh sách...</div>
              )}
              
              {!isLoadingConversations && !conversations?.length && (
                <div className="text-center text-gray-500">Bạn chưa có cuộc hội thoại nào.</div>
              )}

              {conversations && conversations.length > 0 && (
                <div className="space-y-3">
                  {conversations.map((convo) => {
                    // Tìm người còn lại trong hội thoại
                    const otherUser = convo.participants.find(p => p._id !== user?._id);
                    if (!otherUser) return null; 

                    const isLoadingThis = shareLoadingId === convo._id;
                    
                    return (
                      <div key={convo._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.name}&background=random&color=fff`} 
                            alt={otherUser.name} 
                          />
                          <span className="font-medium">{otherUser.name}</span>
                        </div>
                        <button
                          onClick={() => handleShareToUser(convo)}
                          disabled={isLoadingThis}
                          className="p-2 rounded-full text-blue-600 hover:bg-blue-100 disabled:text-gray-400"
                        >
                          {isLoadingThis ? (
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                          ) : (
                            <PaperAirplaneIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumPostPage;