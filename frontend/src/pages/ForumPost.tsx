import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { forumAPI, conversationAPI } from '../services/api';
import type { ForumPost, ForumReply } from '../services/api';
import toast from 'react-hot-toast';

// Icons
import { 
  HandThumbUpIcon, 
  ShareIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  FlagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolidIcon } from '@heroicons/react/24/solid';

interface SimpleUser { _id: string; name: string; avatar?: string; }
interface Conversation { _id: string; participants: SimpleUser[]; }

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
  return "Vừa xong";
};

// --- COMPONENT CON: BÌNH LUẬN ---
const ReplyCard: React.FC<{ reply: ForumReply }> = ({ reply }) => (
  <div className="flex gap-4 p-4 border-b border-brand-light/20 hover:bg-brand-light/5 transition-colors">
    <img 
      className="h-10 w-10 rounded-full object-cover border border-brand-light" 
      src={reply.author.avatar || `https://ui-avatars.com/api/?name=${reply.author.name}`} 
      alt={reply.author.name} 
    />
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-bold text-brand-dark text-sm">{reply.author.name}</h4>
        <span className="text-xs text-gray-400">{formatTimeAgo(reply.createdAt)}</span>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed">{reply.content}</p>
    </div>
  </div>
);

const ForumPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); 
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newReplyContent, setNewReplyContent] = useState('');
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); 
  const [shareLoadingId, setShareLoadingId] = useState<string | null>(null); 

  const { data: postData, isLoading, isError } = useQuery({ queryKey: ['forum', id], queryFn: () => forumAPI.getPost(id!), enabled: !!id });
  const post: ForumPost | undefined = postData?.data.data;

  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'], queryFn: () => conversationAPI.getConversations(), enabled: isShareModalOpen && !!user, staleTime: 1000 * 60 * 5, 
  });
  const conversations: Conversation[] | undefined = conversationsData?.data?.data;

  // Mutations
  const { mutate: addReply, isPending: isReplying } = useMutation({
    mutationFn: (content: string) => forumAPI.createReply(id!, content),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['forum', id] }); setNewReplyContent(''); toast.success('Đã gửi bình luận!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi gửi bình luận')
  });

  const { mutate: toggleLike, isPending: isLiking } = useMutation({
    mutationFn: () => forumAPI.likePost(id!),
    onSuccess: (res) => { queryClient.setQueryData(['forum', id], res); },
    onError: () => toast.error('Lỗi thao tác')
  });

  const { mutate: shareToUser } = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string, content: string }) => conversationAPI.sendMessage(conversationId, content),
    onSuccess: () => { toast.success('Đã chia sẻ!'); setIsShareModalOpen(false); setShareLoadingId(null); },
    onError: () => { toast.error('Lỗi chia sẻ'); setShareLoadingId(null); }
  });

  // Handlers
  const handleSubmitReply = (e: React.FormEvent) => { e.preventDefault(); if (!newReplyContent.trim() || !user) return; addReply(newReplyContent); };
  const handleLikeClick = () => { if (!user) return navigate('/login'); toggleLike(); };
  const handleStartChat = async (receiverId: string) => {
    if (!user) return navigate('/login');
    if (user._id === receiverId) return toast.error("Không thể chat với chính mình");
    setChatLoadingId(receiverId);
    try {
        const res = await conversationAPI.findOrCreate(receiverId);
        navigate('/chat', { state: { conversationToOpen: res.data } });
    } catch { toast.error("Lỗi kết nối chat"); } finally { setChatLoadingId(null); }
  };
  const handleShareToUser = (conversation: Conversation) => {
      setShareLoadingId(conversation._id);
      shareToUser({ conversationId: conversation._id, content: `Xem bài viết này: "${post?.title}"\n${window.location.href}` });
  };

  if (isLoading) return <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 border-2 border-brand-main rounded-full border-t-transparent"></div></div>;
  if (isError || !post) return <div className="text-center p-10 text-red-500">Bài viết không tồn tại.</div>;

  const hasLiked = post.likes?.includes(user?._id || '');

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === CỘT TRÁI: BÀI VIẾT === */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-brand-light/30 overflow-hidden">
                {/* Header Bài viết */}
                <div className="p-6 md:p-8">
                    {/* Đã xóa phần hiển thị category */}
                    <div className="flex items-center gap-3 mb-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4"/> {formatTimeAgo(post.createdAt)}</span>
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark mb-4 leading-tight">{post.title}</h1>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed text-base md:text-lg">
                        {post.content}
                    </div>

                    {/* Ảnh bài viết */}
                    {post.images && post.images.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {post.images.map((img, idx) => (
                                <img key={idx} src={img} alt="Post img" className="rounded-xl w-full object-cover border border-brand-light/30 hover:opacity-95 cursor-zoom-in" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Thanh Action */}
                <div className="px-6 py-4 bg-gray-50 border-t border-brand-light/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={handleLikeClick} disabled={isLiking} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${hasLiked ? 'bg-brand-main text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-main hover:text-brand-main'}`}>
                            {hasLiked ? <HandThumbUpSolidIcon className="w-5 h-5"/> : <HandThumbUpIcon className="w-5 h-5"/>}
                            <span>{post.likes?.length || 0}</span>
                        </button>
                        <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-500 border border-gray-200 hover:border-brand-accent hover:text-brand-accent font-bold transition-all">
                            <ShareIcon className="w-5 h-5"/> <span className="hidden sm:inline">Chia sẻ</span>
                        </button>
                    </div>
                    <button className="text-gray-400 hover:text-red-500 transition-colors" title="Báo cáo">
                        <FlagIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Khu vực Bình luận (Giữ nguyên) */}
            <div className="bg-white rounded-3xl shadow-sm border border-brand-light/30 p-6 md:p-8">
                <h3 className="text-xl font-bold text-brand-dark mb-6 flex items-center gap-2">
                    <ChatBubbleLeftIcon className="w-6 h-6 text-brand-main" /> 
                    Bình luận ({post.replies?.length || 0})
                </h3>

                {user ? (
                    <form onSubmit={handleSubmitReply} className="flex gap-4 mb-8">
                        <img className="w-10 h-10 rounded-full object-cover border border-gray-200" src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="" />
                        <div className="flex-1">
                            <textarea 
                                value={newReplyContent} onChange={e => setNewReplyContent(e.target.value)}
                                className="w-full p-4 rounded-xl border border-brand-light/30 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-all resize-none"
                                rows={2} placeholder="Viết bình luận của bạn..."
                            />
                            <div className="flex justify-end mt-2">
                                <button type="submit" disabled={isReplying || !newReplyContent.trim()} className="px-5 py-2 bg-brand-main text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-all shadow-md">
                                    {isReplying ? 'Đang gửi...' : 'Gửi'}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="p-4 bg-brand-light/10 rounded-xl text-center mb-6 border border-brand-light/20">
                        <Link to="/login" className="font-bold text-brand-main hover:underline">Đăng nhập</Link> để tham gia thảo luận.
                    </div>
                )}

                <div className="space-y-2">
                    {post.replies?.map(reply => <ReplyCard key={reply._id} reply={reply} />)}
                    {(!post.replies || post.replies.length === 0) && <p className="text-gray-500 text-center italic py-4">Chưa có bình luận nào.</p>}
                </div>
            </div>
        </div>

        {/* === CỘT PHẢI: THÔNG TIN TÁC GIẢ (Giữ nguyên) === */}
        <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-3xl shadow-lg shadow-brand-main/5 border border-brand-light/20 p-6 text-center">
                <div className="relative inline-block mb-4">
                    <img className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-brand-light" src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.name}`} alt="" />
                    <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <h3 className="text-xl font-bold text-brand-dark">{post.author.name}</h3>
                <p className="text-sm text-gray-500 mb-6">Thành viên tích cực</p>

                {user && user._id !== post.author._id && (
                    <button 
                        onClick={() => handleStartChat(post.author._id)}
                        disabled={chatLoadingId === post.author._id}
                        className="w-full py-3 rounded-xl font-bold border-2 border-brand-main text-brand-main hover:bg-brand-main hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        {chatLoadingId === post.author._id ? 'Đang kết nối...' : (
                            <><PaperAirplaneIcon className="w-5 h-5 -rotate-45" /> Nhắn tin riêng</>
                        )}
                    </button>
                )}
            </div>
        </div>

      </div>

      {/* SHARE MODAL (Giữ nguyên) */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4" onClick={() => setIsShareModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-brand-dark">Chia sẻ bài viết</h3>
                    <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-red-500"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-2 max-h-[60vh] overflow-y-auto">
                    {isLoadingConversations ? <div className="p-4 text-center">Đang tải...</div> : (
                        conversations?.map(conv => {
                            const other = conv.participants.find(p => p._id !== user?._id);
                            if (!other) return null;
                            const isSending = shareLoadingId === conv._id;
                            return (
                                <div key={conv._id} className="flex items-center justify-between p-3 hover:bg-brand-light/10 rounded-xl cursor-pointer group" onClick={() => handleShareToUser(conv)}>
                                    <div className="flex items-center gap-3">
                                        <img className="w-10 h-10 rounded-full border border-gray-200" src={other.avatar || `https://ui-avatars.com/api/?name=${other.name}`} alt="" />
                                        <span className="font-bold text-gray-700 group-hover:text-brand-main">{other.name}</span>
                                    </div>
                                    <button disabled={isSending} className="p-2 bg-brand-light/20 text-brand-main rounded-full group-hover:bg-brand-main group-hover:text-white transition-all">
                                        {isSending ? <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div> : <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />}
                                    </button>
                                </div>
                            )
                        })
                    )}
                    {!isLoadingConversations && (!conversations || conversations.length === 0) && (
                        <div className="p-8 text-center text-gray-500">Bạn chưa có cuộc trò chuyện nào để chia sẻ.</div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ForumPostPage;