import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { authAPI, roomAPI, forumAPI } from '../services/api'; 
import type { User, Room, ForumPost } from '../types';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { Link, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast'; // 1. Import Toast

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
  ClockIcon 
} from '@heroicons/react/24/outline';

// Lấy biến môi trường
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Thêm tab 'verification'
type ActiveTab = 'profile' | 'my-rooms' | 'my-posts' | 'password' | 'verification';

// Style chung
const INPUT_CLASS = "input-field w-full px-3 py-2 border border-brand-accent rounded-md focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent text-brand-dark placeholder-gray-400";
const BUTTON_PRIMARY_CLASS = "px-4 py-2 bg-brand-main hover:bg-brand-dark text-white rounded-md shadow-sm transition-colors font-medium disabled:opacity-70 flex items-center justify-center gap-2";
const BUTTON_SECONDARY_CLASS = "px-4 py-2 bg-white border border-brand-accent text-brand-main hover:bg-brand-light rounded-md transition-colors font-medium";

// --- CÁC COMPONENT CON (Giữ nguyên LandlordRooms và MyPostsList) ---
const LandlordRooms: React.FC<{ userId: string }> = ({ userId }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
  
    const { data: roomsResponse, isLoading: isLoadingRooms } = useQuery({
      queryKey: ['myRooms', userId],
      queryFn: async () => (await roomAPI.getMyRooms()).data,
      enabled: !!userId, 
      staleTime: 5 * 60 * 1000,
    });
  
    const rooms: Room[] = roomsResponse?.data ?? [];
  
    const deleteRoomMutation = useMutation({
      mutationFn: (roomId: string) => roomAPI.deleteRoom(roomId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['myRooms', userId] });
        toast.success('Xóa phòng thành công!'); 
      },
      onError: (error: any) => toast.error(error.response?.data?.message || 'Xóa phòng thất bại.')
    });
  
    const updateAvailabilityMutation = useMutation({
          mutationFn: ({ roomId, isAvailable }: { roomId: string; isAvailable: boolean }) =>
              roomAPI.updateRoom(roomId, { isAvailable }),
          onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['myRooms', userId] });
              toast.success('Cập nhật trạng thái phòng thành công');
          },
          onError: (error: any) => {
              console.error("Lỗi cập nhật trạng thái:", error);
              toast.error(error.response?.data?.message || 'Cập nhật thất bại.');
          }
      });
  
    const handleDelete = (roomId: string) => {
      if (window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
        deleteRoomMutation.mutate(roomId);
      }
    };
  
    const handleToggleAvailability = (roomId: string, currentAvailability: boolean) => {
          updateAvailabilityMutation.mutate({ roomId, isAvailable: !currentAvailability });
      };
  
    if (isLoadingRooms) return <div className="text-center p-4 text-brand-dark">Đang tải danh sách phòng...</div>;
  
    return (
      <div className="bg-white p-6 rounded-xl shadow border border-brand-accent/30">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-brand-accent/20 pb-4">
          <h2 className="text-xl font-bold text-brand-dark">Quản lý tin đăng ({rooms.length})</h2>
          <Link to="/landlord/dang-tin" className={BUTTON_PRIMARY_CLASS}>Đăng tin mới</Link>
        </div>
        {rooms.length === 0 ? (
          <div className="text-center py-8 bg-brand-light/30 rounded-lg border border-dashed border-brand-accent">
              <p className="text-gray-600 mb-4">Bạn chưa đăng tin nào.</p>
              <Link to="/landlord/dang-tin" className="text-brand-main hover:underline font-medium">Đăng tin ngay</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => (
              <div key={room._id} className="border border-brand-accent/30 p-4 rounded-lg flex flex-col md:flex-row items-start gap-4 hover:bg-brand-light/20 transition-colors shadow-sm">
                <div className="flex gap-4 flex-grow w-full md:w-auto">
                      <img src={room.images?.[0] || 'https://placehold.co/100x80/eee/ccc?text=No+Image'} alt={room.title} className="w-24 h-24 object-cover rounded-md border-4 border-brand-accent/20 bg-gray-100 flex-shrink-0" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/100x80/eee/ccc?text=Error'; }} />
                      <div className="flex-grow min-w-0 space-y-1">
                        <Link to={`/room/${room._id}`} className="font-semibold text-brand-dark hover:text-brand-main line-clamp-1 text-lg block">{room.title}</Link>
                        <p className="text-sm text-gray-500 line-clamp-1">📍 {room.address}, {room.district}</p>
                        <p className="text-sm font-medium text-gray-700">
                           <span className="text-brand-main text-base font-bold">{(room.price || 0).toLocaleString('vi-VN')} đ</span><span className="text-brand-accent mx-2">|</span><span>{room.area || '?'} m²</span>
                        </p>
                         <div className="flex items-center gap-2 mt-2 flex-wrap">
                             <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${room.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : room.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{room.status === 'approved' ? 'Đã duyệt' : room.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}</span>
                             <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${room.isAvailable ? 'bg-brand-light text-brand-main border-brand-accent' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>{room.isAvailable ? 'Còn trống' : 'Đã thuê'}</span>
                         </div>
                      </div>
                </div>
                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto md:ml-auto justify-end">
                  <button onClick={() => navigate(`/landlord/edit-room/${room._id}`)} className="btn-sm text-brand-main bg-white border border-brand-accent hover:bg-brand-light w-full md:w-auto text-center px-3 py-1 rounded">Sửa</button>
                  <button onClick={() => handleToggleAvailability(room._id, room.isAvailable)} disabled={updateAvailabilityMutation.isPending} className="btn-sm w-full md:w-auto text-center border bg-brand-light/50 hover:bg-brand-light text-brand-dark border-brand-accent px-3 py-1 rounded">{room.isAvailable ? 'Đã thuê?' : 'Còn trống?'}</button>
                  <button onClick={() => handleDelete(room._id)} disabled={deleteRoomMutation.isPending} className="btn-sm bg-white border border-red-200 text-red-600 hover:bg-red-50 w-full md:w-auto text-center px-3 py-1 rounded">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
};

const MyPostsList: React.FC<{ userId: string }> = ({ userId }) => {
    const queryClient = useQueryClient();
    
    const { data: postsResponse, isLoading } = useQuery({
      queryKey: ['myPosts', userId],
      queryFn: async () => (await forumAPI.getMyPosts()).data,
      enabled: !!userId, 
      staleTime: 5 * 60 * 1000,
    });
  
    const posts: ForumPost[] = postsResponse?.data ?? [];
  
    const deletePostMutation = useMutation({
      mutationFn: (id: string) => forumAPI.deletePost(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['myPosts', userId] });
        toast.success('Đã xoá bài viết!'); 
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi khi xoá bài viết')
    });
  
    const handleDelete = (id: string) => {
      if (window.confirm('Bạn có chắc chắn muốn xoá bài viết này?')) {
        deletePostMutation.mutate(id);
      }
    };
  
    if (isLoading) return <div className="text-center p-8 text-gray-500">Đang tải bài viết...</div>;
  
    return (
      <div className="bg-white p-8 rounded-xl shadow border border-brand-accent/30">
        
        {posts.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mb-4">
                  <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-brand-main" />
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-2">Bài viết của tôi</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Danh sách các bài viết bạn đã đăng trên diễn đàn sẽ sớm được cập nhật tại đây. Hiện tại bạn chưa có bài viết nào.
              </p>
              <Link 
                  to="/forum/new" 
                  className={`${BUTTON_PRIMARY_CLASS} inline-block`}
              >
                  Đăng bài viết mới
              </Link>
           </div>
        ) : (
          <>
              <div className="flex justify-between items-center mb-6 border-b border-brand-accent/20 pb-4">
                  <h2 className="text-xl font-bold text-brand-dark">Bài viết của tôi ({posts.length})</h2>
                  <Link to="/forum/new" className="btn-sm bg-brand-main text-white px-3 py-1 rounded hover:bg-brand-dark transition-colors">Viết bài mới</Link>
              </div>
              <div className="space-y-4">
              {posts.map(post => (
                  <div key={post._id} className="border border-brand-accent/30 rounded-lg p-4 hover:bg-brand-light/20 transition-colors flex flex-col sm:flex-row gap-4 group">
                  {/* Ảnh thumbnail (nếu có) */}
                  {post.images && post.images.length > 0 ? (
                      <img 
                      src={post.images[0]} 
                      alt="Thumbnail" 
                      className="w-full sm:w-28 h-24 object-cover rounded-md border border-brand-accent/20 bg-gray-100 flex-shrink-0"
                      />
                  ) : (
                      <div className="w-full sm:w-28 h-24 bg-brand-light/50 rounded-md flex items-center justify-center text-brand-accent flex-shrink-0 border border-brand-accent/20">
                          <ChatBubbleBottomCenterTextIcon className="w-8 h-8" />
                      </div>
                  )}
                  
                  <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                          post.status === 'approved' ? 'bg-green-100 text-green-700' :
                          post.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                          }`}>
                          {post.status === 'approved' ? 'Đã duyệt' : post.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}
                          </span>
                          <span className="text-xs text-gray-400">• {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      
                      <Link to={`/forum/${post._id}`} className="text-lg font-bold text-brand-dark hover:text-brand-main line-clamp-1 mb-1 block" title={post.title}>
                          {post.title}
                      </Link>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.content}</p>
                      
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <span className="flex items-center gap-1"><span className="font-medium">{post.replies?.length || 0}</span> bình luận</span>
                          <span className="flex items-center gap-1"><span className="font-medium">{post.likes?.length || 0}</span> thích</span>
                          <span className="bg-brand-light px-2 py-0.5 rounded text-brand-dark capitalize">{post.category}</span>
                      </div>
                  </div>
  
                  {/* Nút hành động */}
                  <div className="flex sm:flex-col gap-2 justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity sm:border-l sm:pl-4 sm:border-brand-accent/20 min-w-[80px]">
                      <Link to={`/forum/edit/${post._id}`} className="btn-sm text-brand-main bg-white border border-brand-accent hover:bg-brand-light flex items-center justify-center gap-1 w-full px-2 py-1 rounded" title="Sửa">
                          <PencilIcon className="w-4 h-4" /> <span className="sm:hidden">Sửa</span>
                      </Link>
                      <button 
                          onClick={() => handleDelete(post._id)} 
                          disabled={deletePostMutation.isPending}
                          className="btn-sm bg-white border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1 w-full px-2 py-1 rounded" 
                          title="Xoá"
                      >
                          <TrashIcon className="w-4 h-4" /> <span className="sm:hidden">Xoá</span>
                      </button>
                  </div>
                  </div>
              ))}
              </div>
          </>
        )}
      </div>
    );
};


// === COMPONENT MỚI: FORM XÁC MINH DANH TÍNH (ĐÃ CẬP NHẬT ĐẦY ĐỦ) ===
const VerificationTab: React.FC<{ user: User }> = ({ user }) => {
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  
  
  const currentStatus = (user as any).verification?.status || 'unverified';
  const queryClient = useQueryClient();


  const uploadToCloudinary = async (file: File) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Chưa cấu hình biến môi trường Cloudinary (VITE_CLOUDINARY_CLOUD_NAME)');
    }
    
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
    const compressedFile = await imageCompression(file, options);

    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData
    );
    return res.data.secure_url; // Trả về URL ảnh
  };

  // Mutation xử lý toàn bộ: Upload 2 ảnh -> Gọi API Backend
  const submitVerificationMutation = useMutation({
    mutationFn: async () => {
      if (!frontImage || !backImage) throw new Error("Vui lòng chọn đủ 2 mặt ảnh.");

      // 1. Upload 2 ảnh song song (Parallel) để tiết kiệm thời gian
      const [frontUrl, backUrl] = await Promise.all([
        uploadToCloudinary(frontImage),
        uploadToCloudinary(backImage)
      ]);

      // 2. Gọi API Backend để lưu thông tin (sử dụng hàm mới thêm trong api.ts)
      return authAPI.submitVerification({
        frontImage: frontUrl,
        backImage: backUrl,
        identityType: user.role === 'landlord' ? 'cccd' : 'student_card'
      });
    },
    onSuccess: () => {
      // SỬA: Thay vì setStatus, ta invalidate query profile để tải lại dữ liệu
      // Điều này sẽ đảm bảo component Profile cha re-render với trạng thái mới nhất từ Backend (pending)
      queryClient.invalidateQueries({ queryKey: ['profile', user._id] }); 
      // Reset form state
      setFrontImage(null);
      setBackImage(null);
    },
    onError: (error: any) => {
      console.error("Lỗi xác minh:", error);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'front') {
        setFrontImage(file);
        setFrontPreview(URL.createObjectURL(file));
      } else {
        setBackImage(file);
        setBackPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = () => {
    if (!frontImage || !backImage) return toast.error("Vui lòng tải lên đủ 2 mặt giấy tờ.");
    
    if (window.confirm("Bạn có chắc chắn thông tin trên giấy tờ là chính xác?")) {
      // Sử dụng toast.promise để hiển thị trạng thái Loading, Success, Error tự động
      toast.promise(
        submitVerificationMutation.mutateAsync(),
        {
          loading: 'Đang tải ảnh và gửi hồ sơ...',
          success: 'Gửi thành công! Quản trị viên sẽ duyệt trong 24h.',
          error: (err) => `Gửi thất bại: ${err.message || 'Lỗi server'}`
        }
      );
    }
  };

  // 1. GIAO DIỆN ĐÃ XÁC MINH
  if (currentStatus === 'verified') {
    return (
      <div className="bg-white p-10 rounded-xl shadow border border-brand-accent/30 text-center animate-fadeIn">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheckIcon className="w-14 h-14 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-brand-dark mb-2">Tài khoản đã xác minh</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Chúc mừng! Bạn là thành viên uy tín của cộng đồng RelistayDN. Tin đăng của bạn sẽ được ưu tiên hiển thị.
        </p>
      </div>
    );
  }

  // 2. GIAO DIỆN CHỜ DUYỆT (Ảnh 2)
  if (currentStatus === 'pending') {
    return (
      <div className="bg-white p-10 rounded-xl shadow border border-brand-accent/30 text-center animate-fadeIn">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ClockIcon className="w-14 h-14 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-brand-dark mb-2">Hồ sơ đang chờ duyệt</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Chúng tôi đang kiểm tra thông tin của bạn. Quá trình này thường mất từ 12-24 giờ làm việc. Vui lòng quay lại sau.
        </p>
      </div>
    );
  }
  
  // 3. GIAO DIỆN FORM UPLOAD (CHƯA XÁC MINH HOẶC BỊ TỪ CHỐI)
  const isRejected = currentStatus === 'rejected';
  return (
    <div className="bg-white rounded-xl shadow border border-brand-accent/30 overflow-hidden">
      <div className="p-6 border-b border-brand-accent/20 bg-brand-light/20">
        <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-brand-main" />
            Xác minh danh tính
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Để đảm bảo an toàn cho cộng đồng, vui lòng cung cấp hình ảnh 
          <span className="font-bold text-brand-dark"> {user.role === 'landlord' ? 'Căn cước công dân (CCCD)' : 'Thẻ sinh viên'} </span> 
          chính chủ.
        </p>
      </div>
      
      <div className="p-6 md:p-8">
          {/* THÊM THÔNG BÁO BỊ TỪ CHỐI */}
          {isRejected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex gap-4 items-start">
              <div className="bg-red-100 p-2 rounded-full">
                <XMarkIcon className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-sm text-red-800">
                <p className="font-bold mb-1">Hồ sơ xác minh bị từ chối</p>
                <p>Lý do: {(user as any).verification?.message || 'Không rõ.'} Vui lòng kiểm tra và gửi lại.</p>
              </div>
            </div>
          )}
          
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 flex gap-4 items-start">
           <div className="bg-blue-100 p-2 rounded-full">
                <KeyIcon className="w-5 h-5 text-blue-600" />
           </div>
           <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">Cam kết bảo mật thông tin</p>
              <p>Hình ảnh giấy tờ của bạn được mã hóa và chỉ sử dụng duy nhất cho mục đích xác thực tài khoản. Chúng tôi cam kết không chia sẻ với bên thứ ba.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Mặt trước */}
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-3">Mặt trước {user.role === 'landlord' ? 'CCCD' : 'Thẻ SV'}</label>
            <div 
              className="relative w-full h-56 border-2 border-dashed border-brand-accent/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-brand-light/30 transition-all bg-gray-50 overflow-hidden group"
              onClick={() => document.getElementById('front-upload')?.click()}
            >
              {frontPreview ? (
                <>
                    <img src={frontPreview} alt="Front" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium flex items-center gap-2"><CameraIcon className="w-5 h-5"/> Thay đổi</span>
                    </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-3 text-brand-main">
                    <DocumentArrowUpIcon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Tải ảnh mặt trước</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, tối đa 5MB</p>
                </div>
              )}
              <input id="front-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} />
            </div>
          </div>

          {/* Mặt sau */}
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-3">Mặt sau {user.role === 'landlord' ? 'CCCD' : 'Thẻ SV'}</label>
            <div 
              className="relative w-full h-56 border-2 border-dashed border-brand-accent/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-brand-light/30 transition-all bg-gray-50 overflow-hidden group"
              onClick={() => document.getElementById('back-upload')?.click()}
            >
              {backPreview ? (
                <>
                    <img src={backPreview} alt="Back" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium flex items-center gap-2"><CameraIcon className="w-5 h-5"/> Thay đổi</span>
                    </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-3 text-brand-main">
                    <DocumentArrowUpIcon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Tải ảnh mặt sau</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, tối đa 5MB</p>
                </div>
              )}
              <input id="back-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'back')} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-brand-accent/10">
          <button 
            onClick={handleSubmit} 
            disabled={submitVerificationMutation.isPending || !frontImage || !backImage}
            className={`${BUTTON_PRIMARY_CLASS} px-8 py-3 text-lg shadow-md disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {submitVerificationMutation.isPending ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <ShieldCheckIcon className="w-5 h-5" />}
            {submitVerificationMutation.isPending ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ xác minh'}
          </button>
        </div>
      </div>
    </div>
  );
};


// === PAGE: PROFILE (MAIN) ===
const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch Profile Data
  const { data: profileResponse, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', user?._id],
    queryFn: async () => {
        if (!user?._id) throw new Error("User ID is missing");
        const response = await authAPI.getProfile();
        return response.data;
    },
    enabled: !!user?._id,
    staleTime: 5 * 60 * 1000,
  });

  // SỬA LỖI: Cập nhật biến profile chính để nó chứa dữ liệu mới nhất từ query
  const profile: User | null = profileResponse?.data || user || null;
  const displayProfile = profile || user;

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({ name: '', phone: '' });
  
  // Avatar States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (profile && !isEditing) {
      setEditFormData({ name: profile.name, phone: profile.phone });
    }
  }, [profile, isEditing]);

  useEffect(() => {
    if (!isLoadingProfile && !profile && !user) navigate('/login');
  }, [isLoadingProfile, profile, user, navigate]);

  const updateProfileMutation = useMutation({
    mutationFn: (updatedData: Partial<User>) => authAPI.updateProfile(updatedData),
    onSuccess: (response) => {
        const updatedUser = response.data.data;
        queryClient.setQueryData(['profile', user?._id], (old: any) => old ? {...old, data: updatedUser} : undefined);
        setIsEditing(false);
        toast.success('Cập nhật thông tin thành công!');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Cập nhật thất bại.')
  });

  const { mutate: uploadAvatar } = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error('Lỗi cấu hình Cloudinary');
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, formData);
      return authAPI.updateProfile({ avatar: res.data.secure_url });
    },
    onSuccess: (res) => {
      toast.success('Đổi ảnh đại diện thành công!');
      queryClient.setQueryData(['profile', user?._id], (old: any) => old ? {...old, data: res.data.data} : undefined);
      handleCancelAvatar();
    },
    onError: (err: any) => toast.error('Lỗi upload: ' + err.message),
    onSettled: () => setIsUploading(false)
  });

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
    e.target.value = '';
  };
  const handleCancelAvatar = () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); setAvatarFile(null); setAvatarPreview(null); };

  // --- COMPONENT CON: FORM ĐỔI MẬT KHẨU ---
  const ChangePasswordForm = () => {
    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const changePassMutation = useMutation({
      mutationFn: (data: any) => authAPI.changePassword(data),
      onSuccess: () => { toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.'); setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
      onError: (err: any) => { toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại'); }
    });
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault(); setError('');
      if (passData.newPassword !== passData.confirmPassword) return toast.error('Mật khẩu xác nhận không khớp!');
      if (passData.newPassword.length < 6) return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      changePassMutation.mutate({ currentPassword: passData.currentPassword, newPassword: passData.newPassword });
    };
    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">{error}</div>}
        <div><label className="block text-sm font-medium text-brand-dark mb-1">Mật khẩu hiện tại</label><input type="password" required className={INPUT_CLASS} value={passData.currentPassword} onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })} /></div>
        <div><label className="block text-sm font-medium text-brand-dark mb-1">Mật khẩu mới</label><input type="password" required className={INPUT_CLASS} value={passData.newPassword} onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })} /></div>
        <div><label className="block text-sm font-medium text-brand-dark mb-1">Xác nhận mật khẩu mới</label><input type="password" required className={INPUT_CLASS} value={passData.confirmPassword} onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })} /></div>
        <div className="pt-2"><button type="submit" disabled={changePassMutation.isPending} className={BUTTON_PRIMARY_CLASS + " w-full sm:w-auto"}>{changePassMutation.isPending ? 'Đang xử lý...' : 'Lưu mật khẩu'}</button></div>
      </form>
    );
  };

  // --- GIAO DIỆN CHÍNH ---
  if (!user && isLoadingProfile) return <div className="p-10 text-center text-brand-dark">Đang tải...</div>;
  if (!user && !profile) return null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-brand-light min-h-[calc(100vh-64px)]">
      {/* 2. Đặt Toaster tại đây để hiển thị thông báo */}
      <Toaster position="top-right" reverseOrder={false} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* SIDEBAR */}
        <aside className="md:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-brand-accent/30 p-6 flex flex-col items-center text-center">
                <div className="relative w-28 h-28 mb-4 group">
                    <img src={avatarPreview || displayProfile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayProfile?.name || 'U')}&background=0ea5e9&color=fff`} alt="Avatar" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md" />
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarFileChange} />
                    {!avatarPreview && (
                        <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow border border-brand-accent hover:bg-gray-100 text-brand-dark"><CameraIcon className="w-5 h-5" /></button>
                    )}
                </div>
                {avatarPreview && (
                    <div className="flex gap-2 mb-3 justify-center">
                        <button onClick={() => avatarFile && uploadAvatar(avatarFile)} className="btn-sm bg-brand-main text-white px-3 py-1 rounded flex gap-1 items-center" disabled={isUploading}>{isUploading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />} Lưu</button>
                        <button onClick={handleCancelAvatar} className="btn-sm bg-white text-red-600 border border-red-200 px-3 py-1 rounded flex gap-1 items-center" disabled={isUploading}><XMarkIcon className="w-4 h-4" /> Huỷ</button>
                    </div>
                )}
                <h2 className="text-xl font-bold text-brand-dark truncate w-full flex items-center justify-center gap-1">
                  {displayProfile?.name}
                </h2>
                <p className="text-sm text-gray-500 truncate w-full mb-3">{displayProfile?.email}</p>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-main/10 text-brand-main capitalize">{displayProfile?.role === 'landlord' ? 'Chủ trọ' : 'Sinh viên'}</span>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-brand-accent/30 overflow-hidden">
                <nav className="flex flex-col">
                    {[
                        { id: 'profile', name: 'Thông tin cá nhân', icon: UserIcon },
                        { id: 'verification', name: 'Xác minh tài khoản', icon: ShieldCheckIcon },
                        ...(displayProfile?.role === 'landlord' ? [{ id: 'my-rooms', name: 'Quản lý tin đăng', icon: HomeModernIcon }] : []),
                        { id: 'my-posts', name: 'Bài viết của tôi', icon: ChatBubbleBottomCenterTextIcon },
                        { id: 'password', name: 'Đổi mật khẩu', icon: KeyIcon },
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as ActiveTab)} 
                            className={`flex items-center gap-3 p-4 text-sm font-medium transition-all border-l-4 ${
                                activeTab === tab.id 
                                ? 'bg-brand-main/5 text-brand-dark border-brand-main' 
                                : 'text-gray-600 hover:bg-brand-light/50 border-transparent hover:text-brand-main'
                            }`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-brand-main' : 'text-brand-accent'}`} /> 
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </aside>

        {/* CONTENT */}
        <main className="md:col-span-9">
          {activeTab === 'profile' && (
             <div className="bg-white rounded-xl shadow-sm border border-brand-accent/30 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-brand-accent/20">
                    <h2 className="text-lg font-bold text-brand-dark">Thông tin chi tiết</h2>
                    {!isEditing && <button onClick={() => setIsEditing(true)} className="text-sm text-brand-main hover:underline font-medium">Chỉnh sửa</button>}
                </div>
                <div className="p-6 md:p-8">
                    {isEditing ? (
                        <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(editFormData); }} className="space-y-6 max-w-xl">
                            <div><label className="block text-sm font-medium text-brand-dark mb-1">Họ và tên</label><input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className={INPUT_CLASS} required /></div>
                            <div><label className="block text-sm font-medium text-brand-dark mb-1">SĐT</label><input type="tel" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className={INPUT_CLASS} required /></div>
                            <div className="flex gap-3 pt-4"><button type="submit" className={BUTTON_PRIMARY_CLASS} disabled={updateProfileMutation.isPending}>{updateProfileMutation.isPending ? 'Lưu...' : 'Lưu thay đổi'}</button><button type="button" onClick={() => setIsEditing(false)} className={BUTTON_SECONDARY_CLASS}>Hủy</button></div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 py-3 border-b border-brand-accent/10"><span className="text-gray-500 font-medium">Họ tên</span><span className="col-span-2 font-medium text-brand-dark">{displayProfile?.name}</span></div>
                            <div className="grid grid-cols-3 gap-4 py-3 border-b border-brand-accent/10"><span className="text-gray-500 font-medium">Email</span><span className="col-span-2 text-brand-dark">{displayProfile?.email}</span></div>
                            <div className="grid grid-cols-3 gap-4 py-3 border-b border-brand-accent/10"><span className="text-gray-500 font-medium">SĐT</span><span className="col-span-2 text-brand-dark">{displayProfile?.phone || '---'}</span></div>
                        </div>
                    )}
                </div>
             </div>
          )}

          {/* === TAB XÁC MINH MỚI === */}
          {activeTab === 'verification' && displayProfile && <VerificationTab user={displayProfile} />}
          {/* ========================= */}

          {activeTab === 'my-rooms' && user?.role === 'landlord' && <LandlordRooms userId={user?._id || ""} />}
          
          {activeTab === 'my-posts' && <MyPostsList userId={user?._id || ""} />}

          {activeTab === 'password' && (
            <div className="bg-white rounded-xl shadow-sm border border-brand-accent/30 overflow-hidden">
              <div className="p-6 border-b border-brand-accent/20">
                <h2 className="text-lg font-bold text-brand-dark">Đổi mật khẩu</h2>
                <p className="text-sm text-gray-500">Vui lòng nhập mật khẩu hiện tại để thay đổi mật khẩu mới.</p>
              </div>
              <div className="p-6 md:p-8 max-w-xl">
                <ChangePasswordForm />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;