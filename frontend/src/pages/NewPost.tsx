import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { forumAPI, type ForumPost, type ApiResponse } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { type AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// --- Icons (Heroicons) ---
import { 
  PhotoIcon, 
  XMarkIcon, 
  PaperAirplaneIcon, 
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Mặc định backend vẫn cần type này, nhưng UI sẽ ẩn đi
type PostCategory = "question" | "experience" | "general";

interface NewPostVariables {
  title: string;
  content: string;
  tags: string[];
  images: string[];
  category: PostCategory;
}

// --- STYLES CONSTANTS ---
const CONTAINER_CLASS = "max-w-3xl mx-auto py-10 px-4 sm:px-6";
const CARD_CLASS = "bg-white rounded-3xl shadow-xl shadow-brand-main/10 border border-brand-light/20 overflow-hidden";
const HEADER_CLASS = "bg-brand-main px-8 py-6 text-white"; 
const INPUT_CLASS = "w-full px-4 py-3 rounded-xl border border-brand-light/30 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-all font-bold text-lg text-brand-dark placeholder-gray-400";
const TEXTAREA_CLASS = "w-full px-4 py-3 rounded-xl border border-brand-light/30 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-all text-base text-gray-700 placeholder-gray-400 min-h-[200px] resize-y";

const NewPost: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // Mặc định là 'general'
  const [category] = useState<PostCategory>('general'); 
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false); 

  const { mutate: createPost, isPending } = useMutation<
    AxiosResponse<ApiResponse<ForumPost>>,
    any,
    NewPostVariables
  >({
    mutationFn: forumAPI.createPost,
    onSuccess: (response) => {
      toast.success(response.data.message || 'Bài viết đã được gửi và đang chờ duyệt!', { duration: 4000 });
      navigate('/forum');
    },
    onError: (err: any) => {
      const errorMessage = 'Lỗi: ' + (err.response?.data?.message || err.message);
      toast.error(errorMessage);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prevFiles => [...prevFiles, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setImagePreviews(prevPreviews => {
      const newPreviews = prevPreviews.filter((_, i) => i !== index);
      URL.revokeObjectURL(prevPreviews[index]);
      return newPreviews;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Bạn cần đăng nhập để tạo bài viết.');
    if (!title.trim() || !content.trim()) return toast.error('Tiêu đề và nội dung không được để trống.');

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error('Lỗi cấu hình hệ thống.');
      return;
    }

    let imageUrls: string[] = [];

    if (selectedFiles.length > 0) {
      setIsUploading(true);
      const loadingToast = toast.loading('Đang xử lý hình ảnh...');
      
      try {
        const compressionOptions = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const filesArray = Array.from(selectedFiles);
        const compressedFiles = await Promise.all(filesArray.map(file => imageCompression(file, compressionOptions)));

        const uploadPromises = compressedFiles.map(file => {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);
          formDataUpload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
          return axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, formDataUpload);
        });
        
        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults.map(res => res.data.secure_url);
        toast.success('Tải ảnh thành công!', { id: loadingToast });
      } catch (uploadError: any) {
        toast.error('Lỗi tải ảnh, vui lòng thử lại.', { id: loadingToast });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    createPost({ title, content, tags: [], images: imageUrls, category }); 
  };

  if (!user) return <div className="text-center p-12 text-gray-500">Vui lòng đăng nhập để tiếp tục.</div>;

  return (
    <div className={CONTAINER_CLASS}>
      <div className={CARD_CLASS}>
        
        {/* HEADER */}
        <div className={HEADER_CLASS}>
            <h1 className="text-2xl font-bold flex items-center gap-3">
                <ChatBubbleBottomCenterTextIcon className="w-8 h-8 opacity-80" />
                Tạo thảo luận mới
            </h1>
            <p className="text-brand-light/90 text-sm mt-1 ml-11">Chia sẻ câu hỏi hoặc kinh nghiệm của bạn với cộng đồng</p>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* User Info (Đã bỏ Category Select) */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <img 
                    className="w-12 h-12 rounded-full object-cover border-2 border-brand-accent" 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
                    alt={user.name} 
                />
                <div>
                    <p className="font-bold text-brand-dark text-lg">{user.name}</p>
                    <p className="text-sm text-gray-500">Đang viết bài...</p>
                </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-brand-dark ml-1">Tiêu đề <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="Tóm tắt nội dung chính..."
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-brand-dark ml-1">Nội dung chi tiết <span className="text-red-500">*</span></label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className={TEXTAREA_CLASS}
                        required
                        placeholder="Viết chi tiết câu hỏi hoặc chia sẻ của bạn tại đây..."
                    />
                </div>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-brand-dark ml-1 flex items-center gap-2">
                    <PhotoIcon className="w-5 h-5 text-brand-accent" /> Hình ảnh đính kèm
                </label>
                
                {/* Upload Box */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-brand-light/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-brand-light/5 hover:border-brand-main transition-all group"
                >
                    <div className="w-12 h-12 bg-brand-light/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <PhotoIcon className="w-6 h-6 text-brand-main" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-brand-main">Nhấn để tải ảnh lên</p>
                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG (Tối đa 5MB)</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                </div>

                {/* Preview Grid */}
                {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                        {imagePreviews.map((previewUrl, index) => (
                            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isPending || isUploading}
                    className="w-full py-4 bg-brand-accent hover:bg-yellow-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-brand-accent/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isUploading ? 'Đang tải ảnh...' : isPending ? 'Đang đăng bài...' : (
                        <>Đăng bài ngay <PaperAirplaneIcon className="w-5 h-5 -rotate-45 mb-1" /></>
                    )}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
};

export default NewPost;