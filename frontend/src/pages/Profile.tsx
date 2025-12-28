import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { authAPI, roomAPI, forumAPI } from '../services/api'; 
import type { User, Room, ForumPost } from '../types';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { Link, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import { 
  UserIcon, 
  HomeModernIcon, 
  ChatBubbleBottomCenterTextIcon, 
  KeyIcon, 
  CameraIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  PencilIcon, 
  TrashIcon,
  ShieldCheckIcon, 
  DocumentArrowUpIcon, 
  ClockIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// Env
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

type ActiveTab = 'profile' | 'my-rooms' | 'my-posts' | 'password' | 'verification';

// --- STYLES CONSTANTS (UPDATED COLOR PALETTE) ---
// Nền trang dùng tông brand-light/10 hoặc primary-50
const PAGE_WRAPPER = "min-h-screen bg-primary-50 py-8 px-4 sm:px-6 lg:px-8";
// Card dùng hiệu ứng kính nhưng viền màu brand-light
const GLASS_CARD = "bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-brand-main/5 border border-brand-light/20 overflow-hidden";
// Input focus dùng brand-main
const INPUT_CLASS = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-all font-medium text-brand-dark";
// Button chính dùng brand-main
const BUTTON_PRIMARY = "px-6 py-2.5 bg-brand-main text-white rounded-xl shadow-lg shadow-brand-main/30 hover:bg-brand-dark hover:scale-[1.02] active:scale-[0.98] transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed";
// Button phụ
const BUTTON_SECONDARY = "px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-brand-main/50 transition-all font-bold flex items-center justify-center gap-2";

// --- COMPONENT CON: QUẢN LÝ PHÒNG (LANDLORD) ---
const LandlordRooms: React.FC<{ userId: string }> = ({ userId }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
  
    const { data: roomsResponse, isLoading } = useQuery({
      queryKey: ['myRooms', userId],
      queryFn: async () => (await roomAPI.getMyRooms()).data,
      staleTime: 5 * 60 * 1000,
    });
  
    const rooms: Room[] = roomsResponse?.data ?? [];
  
    const deleteRoomMutation = useMutation({
      mutationFn: (roomId: string) => roomAPI.deleteRoom(roomId),
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['myRooms', userId] }); toast.success('Đã xoá phòng!'); },
      onError: () => toast.error('Xoá thất bại.')
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, isAvailable }: { id: string, isAvailable: boolean }) => roomAPI.updateRoom(id, { isAvailable }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['myRooms', userId] }); toast.success('Đã cập nhật trạng thái'); }
    });
  
    if (isLoading) return <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 border-2 border-brand-main border-t-transparent rounded-full"></div></div>;
  
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-brand-dark">Danh sách phòng ({rooms.length})</h3>
          <Link to="/landlord/dang-tin" className={BUTTON_PRIMARY}>+ Đăng tin mới</Link>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-16 bg-brand-light/10 rounded-3xl border border-dashed border-brand-light/40">
             <HomeModernIcon className="w-16 h-16 text-brand-light mx-auto mb-4" />
             <p className="text-gray-500">Bạn chưa đăng tin phòng trọ nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {rooms.map((room) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={room._id} className="bg-white p-4 rounded-2xl shadow-sm border border-brand-light/20 flex gap-4 hover:shadow-lg hover:shadow-brand-main/5 transition-all">
                <img src={room.images?.[0]} alt="" className="w-32 h-24 object-cover rounded-xl bg-gray-200" />
                <div className="flex-grow min-w-0 py-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <Link to={`/room/${room._id}`} className="font-bold text-brand-dark text-lg hover:text-brand-main truncate pr-4 block">{room.title}</Link>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${room.status === 'approved' ? 'bg-green-100 text-green-700' : room.status === 'pending' ? 'bg-brand-soft/50 text-brand-dark' : 'bg-red-100 text-red-700'}`}>
                                {room.status === 'approved' ? 'Đã duyệt' : room.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{room.address}, {room.district}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-brand-accent">{(room.price || 0).toLocaleString()}đ</span>
                        <div className="flex gap-2">
                            <button onClick={() => navigate(`/landlord/edit-room/${room._id}`)} className="p-2 text-gray-500 hover:text-brand-main hover:bg-brand-light/20 rounded-lg"><PencilIcon className="w-4 h-4"/></button>
                            <button onClick={() => updateStatusMutation.mutate({id: room._id, isAvailable: !room.isAvailable})} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${room.isAvailable ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200 text-gray-500 bg-gray-50'}`}>
                                {room.isAvailable ? 'Còn trống' : 'Đã thuê'}
                            </button>
                            <button onClick={() => { if(confirm('Xoá phòng này?')) deleteRoomMutation.mutate(room._id) }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
};

// === COMPONENT CON: BÀI VIẾT CỦA TÔI ===
const MyPostsList: React.FC<{ userId: string }> = ({ userId }) => {
    const queryClient = useQueryClient();
    const { data: postsResponse, isLoading } = useQuery({
      queryKey: ['myPosts', userId],
      queryFn: async () => (await forumAPI.getMyPosts()).data,
      staleTime: 5 * 60 * 1000,
    });
    const posts: ForumPost[] = postsResponse?.data ?? [];
    
    const deleteMutation = useMutation({
        mutationFn: (id: string) => forumAPI.deletePost(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['myPosts', userId] }); toast.success('Đã xoá bài viết'); }
    });

    if (isLoading) return <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 border-2 border-brand-main border-t-transparent rounded-full"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-brand-dark">Bài viết ({posts.length})</h3>
                <Link to="/forum/new" className={BUTTON_PRIMARY}>Viết bài mới</Link>
            </div>
            {posts.length === 0 ? (
                <div className="text-center py-16 bg-brand-light/10 rounded-3xl border border-dashed border-brand-light/40">
                    <ChatBubbleBottomCenterTextIcon className="w-16 h-16 text-brand-light mx-auto mb-4" />
                    <p className="text-gray-500">Bạn chưa có bài thảo luận nào.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {posts.map(post => (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={post._id} className="bg-white p-5 rounded-2xl shadow-sm border border-brand-light/20 hover:shadow-lg hover:shadow-brand-main/5 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <Link to={`/forum/${post._id}`} className="font-bold text-brand-dark text-lg hover:text-brand-main line-clamp-1">{post.title}</Link>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link to={`/forum/edit/${post._id}`} className="p-1.5 text-gray-400 hover:text-brand-main bg-gray-50 rounded-md"><PencilIcon className="w-4 h-4"/></Link>
                                    <button onClick={() => { if(confirm('Xoá bài?')) deleteMutation.mutate(post._id) }} className="p-1.5 text-red-400 hover:text-red-600 bg-red-50 rounded-md"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.content}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                                <span className={`px-2 py-0.5 rounded-full ${post.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-brand-soft/30 text-brand-dark'}`}>
                                    {post.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                                </span>
                                <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                                <span>{post.replies?.length || 0} bình luận</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

// === COMPONENT CON: XÁC MINH ===
const VerificationTab: React.FC<{ user: User }> = ({ user }) => {
    const [frontImage, setFrontImage] = useState<File | null>(null);
    const [backImage, setBackImage] = useState<File | null>(null);
    const [frontPreview, setFrontPreview] = useState<string | null>(null);
    const [backPreview, setBackPreview] = useState<string | null>(null);
    const currentStatus = (user as any).verification?.status || 'unverified';
    const queryClient = useQueryClient();

    const uploadToCloudinary = async (file: File) => {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error('Missing Env');
        const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, formData);
        return res.data.secure_url;
    };

    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!frontImage || !backImage) throw new Error("Thiếu ảnh.");
            const [frontUrl, backUrl] = await Promise.all([uploadToCloudinary(frontImage), uploadToCloudinary(backImage)]);
            return authAPI.submitVerification({ frontImage: frontUrl, backImage: backUrl, identityType: user.role === 'landlord' ? 'cccd' : 'student_card' });
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile', user._id] }); setFrontImage(null); setBackImage(null); },
        onError: (err) => console.error(err)
    });

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
        const file = e.target.files?.[0];
        if (file) {
            if (type === 'front') { setFrontImage(file); setFrontPreview(URL.createObjectURL(file)); }
            else { setBackImage(file); setBackPreview(URL.createObjectURL(file)); }
        }
    };

    const handleSubmit = () => {
        if (!frontImage || !backImage) return toast.error("Vui lòng chọn đủ 2 ảnh");
        if(confirm("Xác nhận thông tin chính xác?")) {
            toast.promise(submitMutation.mutateAsync(), { loading: 'Đang gửi...', success: 'Gửi thành công!', error: 'Gửi thất bại' });
        }
    }

    if (currentStatus === 'verified') return (
        <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow"><ShieldCheckIcon className="w-10 h-10 text-green-600" /></div>
            <h3 className="text-2xl font-bold text-gray-800">Tài khoản đã xác minh</h3>
            <p className="text-gray-500 mt-2">Bạn là thành viên uy tín của RelistayDN.</p>
        </div>
    );

    if (currentStatus === 'pending') return (
        <div className="text-center py-12">
            <div className="w-20 h-20 bg-brand-soft/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><ClockIcon className="w-10 h-10 text-brand-accent" /></div>
            <h3 className="text-2xl font-bold text-brand-dark">Đang chờ duyệt</h3>
            <p className="text-gray-500 mt-2">Hồ sơ của bạn đang được kiểm tra (12-24h).</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="bg-brand-light/10 border border-brand-light/30 rounded-2xl p-5 flex gap-4">
                <ShieldCheckIcon className="w-8 h-8 text-brand-main flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-brand-main">Xác minh danh tính</h4>
                    <p className="text-sm text-brand-dark/70 mt-1">Vui lòng tải lên ảnh 2 mặt của {user.role === 'landlord' ? 'CCCD' : 'Thẻ Sinh Viên'} để mở khóa các tính năng cao cấp.</p>
                </div>
            </div>

            {currentStatus === 'rejected' && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 text-sm font-medium">
                    ❌ Hồ sơ bị từ chối: {(user as any).verification?.message || 'Thông tin không hợp lệ'}.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { type: 'front', label: 'Mặt trước', preview: frontPreview, setter: 'front-upload' },
                    { type: 'back', label: 'Mặt sau', preview: backPreview, setter: 'back-upload' }
                ].map((item: any) => (
                    <div key={item.type} onClick={() => document.getElementById(item.setter)?.click()} 
                        className="relative h-64 border-2 border-dashed border-gray-300 rounded-3xl bg-gray-50 hover:bg-white hover:border-brand-main transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                        {item.preview ? (
                            <>
                                <img src={item.preview} className="w-full h-full object-contain" alt="" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-bold flex gap-2"><CameraIcon className="w-5 h-5"/> Đổi ảnh</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-gray-400 group-hover:text-brand-main">
                                <DocumentArrowUpIcon className="w-12 h-12 mx-auto mb-2" />
                                <p className="font-medium">{item.label}</p>
                            </div>
                        )}
                        <input id={item.setter} type="file" hidden accept="image/*" onChange={(e) => handleFile(e, item.type)} />
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <button onClick={handleSubmit} disabled={submitMutation.isPending} className={BUTTON_PRIMARY}>
                    {submitMutation.isPending ? 'Đang gửi...' : 'Gửi hồ sơ xác minh'}
                </button>
            </div>
        </div>
    );
};

// === COMPONENT: ĐỔI MẬT KHẨU ===
const ChangePasswordForm = () => {
    const [data, setData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const changePass = useMutation({
        mutationFn: authAPI.changePassword,
        onSuccess: () => { toast.success('Đổi mật khẩu thành công!'); setData({currentPassword:'', newPassword:'', confirmPassword:''}); },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi')
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); if(data.newPassword !== data.confirmPassword) return toast.error('Mật khẩu không khớp'); changePass.mutate(data); }} className="space-y-5 max-w-lg">
            <div><label className="font-bold text-gray-700 text-sm mb-1 block">Mật khẩu hiện tại</label><input type="password" value={data.currentPassword} onChange={e => setData({...data, currentPassword: e.target.value})} className={INPUT_CLASS} required /></div>
            <div><label className="font-bold text-gray-700 text-sm mb-1 block">Mật khẩu mới</label><input type="password" value={data.newPassword} onChange={e => setData({...data, newPassword: e.target.value})} className={INPUT_CLASS} required /></div>
            <div><label className="font-bold text-gray-700 text-sm mb-1 block">Xác nhận mật khẩu</label><input type="password" value={data.confirmPassword} onChange={e => setData({...data, confirmPassword: e.target.value})} className={INPUT_CLASS} required /></div>
            <button type="submit" disabled={changePass.isPending} className={BUTTON_PRIMARY}>{changePass.isPending ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}</button>
        </form>
    );
};

// === MAIN PAGE ===
const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['profile', user?._id],
    queryFn: async () => { if (!user?._id) return null; const res = await authAPI.getProfile(); return res.data; },
    enabled: !!user?._id,
  });

  const displayProfile = profileResponse?.data || user;
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  
  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => { if (displayProfile) setFormData({ name: displayProfile.name, phone: displayProfile.phone || '' }); }, [displayProfile]);
  if (!user) return null;

  const updateProfile = useMutation({
      mutationFn: authAPI.updateProfile,
      onSuccess: (res) => { queryClient.setQueryData(['profile', user._id], (old: any) => ({...old, data: res.data.data})); setIsEditing(false); toast.success('Đã lưu!'); },
      onError: () => toast.error('Lỗi cập nhật')
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setAvatarUploading(true);
      try {
          const compressed = await imageCompression(file, { maxSizeMB: 1, useWebWorker: true });
          const form = new FormData(); form.append('file', compressed); form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET!);
          const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, form);
          updateProfile.mutate({ avatar: res.data.secure_url });
      } catch { toast.error('Lỗi upload ảnh'); } finally { setAvatarUploading(false); }
  };

  const MENU_ITEMS = [
      { id: 'profile', label: 'Thông tin cá nhân', icon: UserIcon },
      { id: 'verification', label: 'Xác minh tài khoản', icon: ShieldCheckIcon },
      ...(user.role === 'landlord' ? [{ id: 'my-rooms', label: 'Quản lý tin đăng', icon: HomeModernIcon }] : []),
      { id: 'my-posts', label: 'Bài viết của tôi', icon: ChatBubbleBottomCenterTextIcon },
      { id: 'password', label: 'Đổi mật khẩu', icon: KeyIcon },
  ];

  return (
    <div className={PAGE_WRAPPER}>
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR */}
        <aside className="lg:col-span-4 space-y-6">
            <div className={`${GLASS_CARD} p-8 flex flex-col items-center text-center relative`}>
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-brand-main to-brand-light shadow-lg mb-4">
                        <img src={displayProfile?.avatar || `https://ui-avatars.com/api/?name=${displayProfile?.name}`} className="w-full h-full rounded-full object-cover border-4 border-white bg-white" alt="" />
                    </div>
                    <div className="absolute bottom-4 right-0 bg-white p-2 rounded-full shadow-md text-brand-main group-hover:scale-110 transition-transform">
                        {avatarUploading ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <CameraIcon className="w-5 h-5" />}
                    </div>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
                </div>
                
                <h2 className="text-2xl font-extrabold text-brand-main mb-1">{displayProfile?.name}</h2>
                <p className="text-gray-500 mb-4 font-medium">{displayProfile?.email}</p>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${displayProfile?.role === 'landlord' ? 'bg-purple-100 text-purple-700' : 'bg-brand-soft/30 text-brand-dark'}`}>
                    {displayProfile?.role === 'landlord' ? 'Chủ nhà' : 'Sinh viên'}
                </span>
            </div>

            <div className={`${GLASS_CARD} p-4`}>
                <nav className="space-y-2">
                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as ActiveTab)}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${
                                activeTab === item.id 
                                ? 'bg-brand-main text-white shadow-lg shadow-brand-main/30' 
                                : 'text-gray-600 hover:bg-brand-light/10 hover:text-brand-main'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-gray-400'}`} />
                            {item.label}
                        </button>
                    ))}
                    <div className="h-px bg-gray-100 my-2 mx-4"></div>
                </nav>
            </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className={`lg:col-span-8 ${GLASS_CARD} min-h-[600px] flex flex-col`}>
            {/* Header */}
            <div className="p-8 border-b border-gray-100 bg-white/40 flex items-center justify-between">
                <h2 className="text-2xl font-black text-brand-main">
                    {MENU_ITEMS.find(i => i.id === activeTab)?.label}
                </h2>
                {activeTab === 'profile' && !isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="flex items-center gap-2 text-sm font-bold text-brand-main hover:bg-brand-light/20 px-4 py-2 rounded-xl transition-all group"
                    >
                        <PencilIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Chỉnh sửa</span>
                    </button>
                )}
            </div>
            
            <div className="p-8 flex-grow">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'profile' && (
                            <div className="max-w-2xl">
                                {isEditing ? (
                                    <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(formData); }} className="space-y-6">
                                        <div><label className="font-bold text-gray-700 block mb-2">Họ và tên</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={INPUT_CLASS} /></div>
                                        <div><label className="font-bold text-gray-700 block mb-2">Số điện thoại</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={INPUT_CLASS} /></div>
                                        <div className="flex gap-4 pt-4">
                                            <button type="submit" disabled={updateProfile.isPending} className={BUTTON_PRIMARY}>Lưu thay đổi</button>
                                            <button type="button" onClick={() => setIsEditing(false)} className={BUTTON_SECONDARY}>Hủy bỏ</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="group">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Họ tên</label>
                                            <div className="p-4 bg-gray-50 rounded-2xl text-brand-dark font-medium text-lg shadow-sm ring-1 ring-black/5 transition-all group-hover:bg-white group-hover:shadow-md group-hover:ring-brand-main/20">
                                                {displayProfile?.name}
                                            </div>
                                        </div>
                                        
                                        <div className="group">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Email</label>
                                            <div className="p-4 bg-gray-50 rounded-2xl text-brand-dark font-medium text-lg shadow-sm ring-1 ring-black/5 transition-all group-hover:bg-white group-hover:shadow-md group-hover:ring-brand-main/20">
                                                {displayProfile?.email}
                                            </div>
                                        </div>
                                        
                                        <div className="group">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Số điện thoại</label>
                                            <div className="p-4 bg-gray-50 rounded-2xl text-brand-dark font-medium text-lg shadow-sm ring-1 ring-black/5 transition-all group-hover:bg-white group-hover:shadow-md group-hover:ring-brand-main/20">
                                                {displayProfile?.phone || <span className="text-gray-400 italic font-normal">Chưa cập nhật</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'verification' && displayProfile && <VerificationTab user={displayProfile as User} />}
                        {activeTab === 'my-rooms' && <LandlordRooms userId={user._id} />}
                        {activeTab === 'my-posts' && <MyPostsList userId={user._id} />}
                        {activeTab === 'password' && <ChangePasswordForm />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;