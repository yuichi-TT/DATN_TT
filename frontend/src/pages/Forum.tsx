import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { forumAPI, conversationAPI } from '../services/api';
import type { ForumPost } from '../services/api';
// === THAY ĐỔI 1: IMPORT TOAST ===
import toast from 'react-hot-toast';

import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline';

// --- STYLES CONSTANTS ---
const BUTTON_PRIMARY_CLASS = "inline-flex items-center px-4 py-2 bg-brand-main hover:bg-brand-dark text-white font-medium rounded-lg shadow-sm transition-colors duration-200 gap-2";
const BUTTON_SECONDARY_CLASS = "inline-flex items-center px-3 py-1.5 bg-white border border-brand-accent text-brand-main hover:bg-brand-light font-medium rounded-md text-xs transition-colors duration-200";
const INPUT_CLASS = "w-full p-3 pl-10 border border-brand-accent/50 rounded-lg shadow-sm text-brand-dark focus:ring-2 focus:ring-brand-main focus:border-transparent outline-none transition-all bg-white";
const SELECT_CLASS = "w-full md:w-64 p-3 border border-brand-accent/50 rounded-lg shadow-sm text-brand-dark focus:ring-2 focus:ring-brand-main focus:border-transparent outline-none transition-all bg-white cursor-pointer";
const CARD_CLASS = "bg-white rounded-xl shadow-sm border border-brand-accent/20 p-5 flex flex-col md:flex-row items-start gap-4 transition-all duration-300 hover:shadow-md hover:border-brand-accent/40";

const Forum: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { user } = useAuth();

  const navigate = useNavigate();
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['forum', 'approvedPosts'],
    queryFn: () => forumAPI.getPosts(),
  });

  const allPosts = postsData?.data.data || [];

  const filteredPosts = allPosts.filter(post => {
    const matchesCategory = 
      !selectedCategory || 
      (post.category === selectedCategory) || // Kiểm tra trường category
      (post.tags && post.tags.includes(selectedCategory)); // Hoặc tags
    
    const matchesSearch = 
      !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: 'numeric', 
      month: 'numeric', 
      year: 'numeric'
    });
  };

  const handleStartChat = async (receiverId: string) => {
    if (!user) {
      // === THAY ĐỔI 2: Dùng toast.error ===
      toast.error('Vui lòng đăng nhập để bắt đầu trò chuyện.');
      navigate('/login');
      return;
    }
    if (user._id === receiverId) {
      // === THAY ĐỔI 3: Dùng toast.error ===
      toast.error("Bạn không thể tự nhắn tin cho chính mình.");
      return;
    }

    // Bắt đầu toast loading
    const loadingToastId = toast.loading('Đang khởi tạo cuộc trò chuyện...');
    setChatLoadingId(receiverId);

    try {
      const response = await conversationAPI.findOrCreate(receiverId);
      const conversation = response.data;
      
      // Tắt toast loading thành công
      toast.success('Đã mở cuộc trò chuyện.', { id: loadingToastId });
      
      navigate('/chat', {
        state: { conversationToOpen: conversation },
      });
    } catch (error: any) {
      console.error('Không thể bắt đầu chat:', error);
      // Tắt toast loading thành lỗi
      const errorMessage = 'Lỗi khi bắt đầu chat: ' + (error.response?.data?.message || error.message);
      toast.error(errorMessage, { id: loadingToastId });
    } finally {
      setChatLoadingId(null); 
    }
  };

  const categories = ['Tìm trọ', 'Tìm ở ghép', 'Review', 'Hỏi đáp', 'Góc pass đồ'];

  return (
    <div className="min-h-screen bg-brand-light py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8"> 
        
        {/* === HEADER === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-accent/20 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark">Diễn đàn cộng đồng</h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-brand-main" />
              Chia sẻ kinh nghiệm, tìm bạn ở ghép và hỏi đáp về phòng trọ
            </p>
          </div>
          {user && (
            <Link
              to="/forum/new" 
              className={BUTTON_PRIMARY_CLASS}
            >
              <PlusIcon className="w-5 h-5" />
              Tạo bài viết mới
            </Link>
          )}
        </div>

        {/* === THANH TÌM KIẾM & BỘ LỌC === */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-accent/30 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-grow group">
              <input 
                type="text" 
                placeholder="Tìm kiếm bài viết, tiêu đề..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={INPUT_CLASS}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-accent group-focus-within:text-brand-main transition-colors" />
            </div>
            
            {/* Category Filter */}
            <select 
              className={SELECT_CLASS}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Tất cả chuyên mục</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* === DANH SÁCH BÀI VIẾT === */}
        <div className="space-y-4">
          {isLoading ? (
            // Skeleton Loading
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5 flex items-center animate-pulse border border-brand-accent/10">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                </div>
                <div className="flex-grow">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post: ForumPost) => (
              <div key={post._id} className={CARD_CLASS}>
                
                {/* Cột 1: Avatar */}
                <div className="flex-shrink-0 hidden md:block">
                  <img 
                    className="h-12 w-12 rounded-full object-cover border-2 border-brand-light shadow-sm" 
                    src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.name}&background=random&color=fff`} 
                    alt={post.author.name} 
                  />
                </div>

                {/* Cột 2: Nội dung chính */}
                <div className="flex-grow min-w-0 w-full">
                  {/* Mobile User Info */}
                  <div className="flex items-center gap-3 mb-2 md:hidden">
                    <img 
                      className="h-8 w-8 rounded-full object-cover border border-brand-light" 
                      src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.name}&background=random&color=fff`} 
                      alt={post.author.name} 
                    />
                    <span className="text-sm font-medium text-brand-dark">{post.author.name}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {post.category && (
                        <span className="px-2 py-0.5 bg-brand-light text-brand-main text-xs font-bold rounded-md uppercase tracking-wide border border-brand-accent/20">
                            {post.category}
                        </span>
                    )}
                    <span className="text-xs text-gray-400">• {formatDate(post.createdAt)}</span>
                  </div>

                  <Link 
                    to={`/forum/${post._id}`}
                    className="text-lg font-bold text-brand-dark hover:text-brand-main transition-colors line-clamp-1 block mb-1"
                    title={post.title}
                  >
                    {post.title}
                  </Link>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {post.content}
                  </p>

                  {post.images && post.images.length > 0 && (
                    <div className="mb-3">
                      <img 
                        src={post.images[0]} 
                        alt="Ảnh bài viết" 
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                      {post.images.length > 1 && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          + {post.images.length - 1} ảnh khác
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Tags & Author (Desktop) */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 hidden md:block">
                             Đăng bởi <span className="font-medium text-brand-main">{post.author.name}</span>
                        </span>
                        {post.tags?.length > 0 && (
                            <div className="flex gap-1">
                                {post.tags.map((tag, index) => (
                                <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded hover:bg-gray-200 transition-colors">
                                    #{tag}
                                </span>
                                ))}
                            </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Cột 3: Thống kê & Hành động */}
                <div className="flex-shrink-0 w-full md:w-auto flex md:flex-col justify-between items-end gap-2 md:gap-4 border-t md:border-t-0 md:border-l border-brand-accent/10 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0">
                   
                   {/* Stats */}
                   <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1" title="Bình luận">
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            <span className="font-medium">{post.replies?.length || 0}</span>
                        </div>
                        {/* Bạn có thể thêm icon Like/View ở đây nếu API có trả về */}
                   </div>

                   {/* Action Button */}
                   {user && user._id !== post.author._id && (
                    <button
                      onClick={() => handleStartChat(post.author._id)}
                      disabled={chatLoadingId === post.author._id}
                      className={BUTTON_SECONDARY_CLASS}
                    >
                      {chatLoadingId === post.author._id ? '...' : 'Nhắn tin'}
                    </button>
                  )}
                </div>

              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-brand-accent/30">
              <div className="mx-auto h-16 w-16 bg-brand-light rounded-full flex items-center justify-center mb-4">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-brand-accent" />
              </div>
              <h3 className="text-lg font-bold text-brand-dark">Không tìm thấy bài viết nào</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm || selectedCategory 
                  ? 'Thử thay đổi từ khóa hoặc bộ lọc chuyên mục.'
                  : 'Hãy là người đầu tiên chia sẻ câu chuyện của bạn!'}
              </p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Forum;