import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { forumAPI, conversationAPI } from '../services/api';
import type { ForumPost } from '../services/api';
import toast from 'react-hot-toast';

// --- ICONS (Lucide React) ---
import { 
  Search, MessageCircle, Plus, 
  TrendingUp, ShieldAlert, MoreHorizontal,
  Heart, Share2, MessageSquare, Clock
} from 'lucide-react';

// --- STYLES CONSTANTS ---
const BUTTON_PRIMARY_CLASS = "inline-flex items-center px-5 py-2.5 bg-brand-accent hover:bg-yellow-600 text-white font-bold rounded-xl shadow-lg shadow-brand-accent/30 transition-all duration-300 transform hover:-translate-y-0.5 gap-2";
const INPUT_CLASS = "w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-brand-dark focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none transition-all placeholder-gray-400";

const Forum: React.FC = () => {
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
    // Chỉ lọc theo từ khóa tìm kiếm (Bỏ lọc category)
    const matchesSearch = !searchTerm || post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleStartChat = async (receiverId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để bắt đầu trò chuyện.');
      navigate('/login');
      return;
    }
    if (user._id === receiverId) {
      toast.error("Đây là bài viết của bạn.");
      return;
    }

    const loadingToastId = toast.loading('Đang kết nối...');
    setChatLoadingId(receiverId);

    try {
      const response = await conversationAPI.findOrCreate(receiverId);
      const conversation = response.data;
      toast.success('Đã kết nối thành công!', { id: loadingToastId });
      navigate('/chat', { state: { conversationToOpen: conversation } });
    } catch (error: any) {
      console.error('Lỗi chat:', error);
      toast.error('Không thể kết nối chat.', { id: loadingToastId });
    } finally {
      setChatLoadingId(null); 
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 pt-6 pb-12 relative overflow-hidden font-sans">
      
      {/* 1. ANIMATED BACKGROUND BLOBS */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-light/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-brand-soft/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-brand-main/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"> 
        
        {/* 2. HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-main tracking-tight drop-shadow-sm">Cộng đồng Relistay</h1>
            <p className="text-brand-dark/70 mt-2 text-lg font-medium max-w-2xl">
              Nơi chia sẻ kinh nghiệm, tìm bạn ở ghép và review phòng trọ uy tín tại Đà Nẵng.
            </p>
          </div>
          {user && (
            <Link to="/forum/new" className={BUTTON_PRIMARY_CLASS}>
              <Plus className="w-5 h-5" />
              <span>Tạo bài viết</span>
            </Link>
          )}
        </div>

        {/* 3. MAIN LAYOUT (GRID) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: SEARCH & POSTS --- */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Search Toolbar (Đã bỏ filter category) */}
            <div className="bg-white/90 p-5 rounded-2xl shadow-lg shadow-brand-main/5 border border-brand-light/20 flex flex-col sm:flex-row gap-4 sticky top-20 z-20 backdrop-blur-xl ring-1 ring-black/5">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm nội dung..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* Post List */}
            <div className="space-y-6">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light/20 animate-pulse">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-5"></div>
                    <div className="h-56 bg-gray-200 rounded-xl"></div>
                  </div>
                ))
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post: ForumPost) => {
                  
                  const images = post.images || [];

                  return (
                    <div key={post._id} className="group bg-white rounded-2xl p-6 shadow-sm border border-brand-light/20 hover:shadow-xl hover:shadow-brand-main/10 hover:border-brand-main/30 hover:-translate-y-1 transition-all duration-300 ease-out">
                      
                      {/* Post Header (Đã bỏ category badge) */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                           <div className="relative">
                             <img 
                                className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-brand-light/30" 
                                src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.name}&background=random`} 
                                alt={post.author.name} 
                              />
                           </div>
                            <div>
                              <p className="text-base font-bold text-brand-dark hover:text-brand-main cursor-pointer transition-colors">{post.author.name}</p>
                              <div className="flex items-center text-xs font-medium text-gray-500 gap-2 mt-0.5">
                                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {formatDate(post.createdAt)}</span>
                              </div>
                            </div>
                        </div>
                        <button className="text-gray-400 hover:text-brand-dark p-1 rounded-full hover:bg-gray-100 transition-colors">
                          <MoreHorizontal className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Post Content */}
                      <div className="mb-5">
                        <Link to={`/forum/${post._id}`}>
                          <h3 className="text-xl font-bold text-brand-dark mb-3 group-hover:text-brand-main transition-colors leading-snug">
                            {post.title}
                          </h3>
                        </Link>
                        <p className="text-gray-600 leading-relaxed mb-4 text-[15px]">
                          {post.content}
                        </p>

                        {/* Images Grid */}
                        {images.length > 0 && (
                          <div className={`grid gap-2 mb-5 rounded-xl overflow-hidden border border-gray-100 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {images.slice(0, 2).map((img, idx) => (
                              <div key={idx} className="relative h-56 md:h-64 overflow-hidden">
                                <img 
                                  src={img} 
                                  alt="Post content" 
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-in-out cursor-zoom-in" 
                                />
                                {idx === 1 && images.length > 2 && (
                                  <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:bg-brand-dark/70 transition-colors">
                                    +{images.length - 2} ảnh
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tags (Vẫn giữ Tags nếu có) */}
                        {post.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-brand-light/20 hover:text-brand-main hover:border-brand-main/30 transition-all cursor-pointer">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post Footer (Actions) */}
                      <div className="flex items-center justify-between pt-4 border-t border-brand-light/20">
                        <div className="flex items-center gap-2 sm:gap-4">
                           <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all group/btn">
                              <Heart className="w-5 h-5 group-hover/btn:fill-red-500 transition-transform group-hover/btn:scale-110" />
                              <span className="text-sm font-semibold">Thích</span>
                           </button>
                           <Link to={`/forum/${post._id}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-brand-light/20 hover:text-brand-main transition-all">
                              <MessageSquare className="w-5 h-5" />
                              <span className="text-sm font-semibold">{post.replies?.length || 0} <span className="hidden sm:inline">Bình luận</span></span>
                           </Link>
                           <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-600 transition-all">
                              <Share2 className="w-5 h-5" />
                              <span className="text-sm font-semibold hidden sm:inline">Chia sẻ</span>
                           </button>
                        </div>

                        {user && user._id !== post.author._id && (
                          <button
                            onClick={() => handleStartChat(post.author._id)}
                            disabled={chatLoadingId === post.author._id}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-main text-brand-main rounded-xl hover:bg-brand-main hover:text-white hover:shadow-lg transition-all text-sm font-bold active:scale-95"
                          >
                            <MessageCircle className="w-4 h-4" />
                            {chatLoadingId === post.author._id ? 'Đang kết nối...' : 'Nhắn tin'}
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-brand-light/30 flex flex-col items-center">
                  <div className="w-24 h-24 bg-brand-light/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-brand-light/20">
                    <Search className="w-12 h-12 text-brand-light" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-dark">Không tìm thấy bài viết</h3>
                  <p className="text-gray-500 mt-2 max-w-sm text-lg">
                    Thử thay đổi từ khóa tìm kiếm.
                  </p>
                  <button onClick={() => {setSearchTerm('')}} className="mt-8 px-6 py-2.5 bg-brand-main text-white font-bold rounded-xl hover:bg-brand-dark transition-all shadow-lg shadow-brand-main/20">
                    Xóa tìm kiếm
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN: SIDEBAR --- */}
          <div className="hidden lg:block lg:col-span-1 space-y-8">
            
            {/* Trending Topics Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-light/20 p-6 sticky top-24">
              <h3 className="text-xl font-extrabold text-brand-dark mb-6 flex items-center pb-4 border-b border-brand-light/20">
                <TrendingUp className="w-6 h-6 mr-3 text-red-500 bg-red-50 p-1 rounded-md" />
                Chủ đề nổi bật
              </h3>
              <ul className="space-y-5">
                {[
                  { title: "Cảnh báo lừa đảo trọ khu vực BK", views: "1.2k" },
                  { title: "Review KTX mới xây giá rẻ", views: "856" },
                  { title: "Tìm nam ở ghép đường Ngô Sĩ Liên", views: "542" },
                  { title: "Pass lại tủ lạnh mini còn bảo hành", views: "320" },
                ].map((item, idx) => (
                  <li key={idx} className="group cursor-pointer">
                    <div className="flex items-start gap-3">
                      <span className={`text-2xl font-black ${idx === 0 ? 'text-brand-accent' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-brand-soft' : 'text-gray-300'} opacity-80`}>0{idx + 1}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800 group-hover:text-brand-main transition-colors line-clamp-2 mb-1 leading-snug">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center font-medium">
                          <TrendingUp className="w-3 h-3 mr-1" /> {item.views} lượt xem
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8 pt-6 border-t border-brand-light/20">
                 <h3 className="text-lg font-bold text-brand-dark mb-4 flex items-center">
                  <ShieldAlert className="w-5 h-5 mr-2 text-brand-main" />
                  Nội quy diễn đàn
                </h3>
                <div className="text-sm text-brand-dark/80 space-y-2.5 bg-brand-light/10 p-5 rounded-2xl border border-brand-light/20 font-medium">
                    <p className="flex items-start"><span className="mr-2 text-brand-accent">•</span> Không đăng tin sai sự thật.</p>
                    <p className="flex items-start"><span className="mr-2 text-brand-accent">•</span> Tôn trọng thành viên khác.</p>
                    <p className="flex items-start"><span className="mr-2 text-brand-accent">•</span> Không spam bài viết.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Forum;