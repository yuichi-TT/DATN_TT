import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { forumAPI, type ForumPost, type ApiResponse } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { FaImage, FaTimes } from 'react-icons/fa';
import { type AxiosResponse } from 'axios';
import toast from 'react-hot-toast';


const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;


type PostCategory = "question" | "experience" | "general";

interface NewPostVariables {
  title: string;
  content: string;
  tags: string[];
  images: string[];
  category: PostCategory;
}

const NewPost: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory | ''>(''); 
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false); 
  

  const { mutate: createPost, isPending, error } = useMutation<
    
    AxiosResponse<ApiResponse<ForumPost>>,
    any,
    NewPostVariables
  >({
    mutationFn: forumAPI.createPost,
    onSuccess: (response) => {
      
      toast.success(response.data.message || 'Bài viết của bạn đã được gửi và đang chờ duyệt!', {
        // Tùy chọn thời gian tự động đóng
        duration: 4000
      });
      navigate('/forum');
    },
    onError: (err: any) => {
      
      const errorMessage = 'Lỗi: ' + (err.response?.data?.message || err.message);
      toast.error(errorMessage);
    }
  });

  // === HÀM XỬ LÝ KHI CHỌN FILE (Giữ nguyên) ===
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prevFiles => [...prevFiles, ...files]);

      // Tạo preview
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
    // Reset file input để có thể chọn lại file giống nhau
    e.target.value = '';
  };

  // === HÀM XOÁ ẢNH (Giữ nguyên) ===
  const handleRemoveImage = (index: number) => {
    // Xoá file
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    
    // Xoá preview
    setImagePreviews(prevPreviews => {
      const newPreviews = prevPreviews.filter((_, i) => i !== index);
      // Thu hồi Object URL để tránh rò rỉ bộ nhớ
      URL.revokeObjectURL(prevPreviews[index]);
      return newPreviews;
    });
  };

  // === CẬP NHẬT HÀM SUBMIT ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      
      toast.error('Bạn cần đăng nhập để tạo bài viết.');
      return;
    }
    
    if (!category) {
      
      toast.error('Vui lòng chọn chủ đề cho bài viết.');
      return;
    }

    // === KIỂM TRA BIẾN MÔI TRƯỜNG ===
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      
      toast.error('Lỗi cấu hình: Vui lòng kiểm tra lại file .env (Cloudinary) và khởi động lại server frontend.');
      setIsUploading(false);
      return;
    }

    let imageUrls: string[] = [];

    // --- Tải ảnh lên trước (nếu có) ---
    if (selectedFiles.length > 0) {
      setIsUploading(true);
      // Thêm toast loading để thông báo cho người dùng
      const loadingToast = toast.loading('Đang nén và tải ảnh lên Cloudinary...');
      
      try {
        // === NÉN ẢNH & TẢI ẢNH (Giữ nguyên) ===
        console.log('Bắt đầu nén ảnh...');
        const compressionOptions = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        
        const filesArray = Array.from(selectedFiles);
        const compressedFiles = await Promise.all(
          filesArray.map(file => imageCompression(file, compressionOptions))
        );
        console.log('Đã nén xong. Đang tải ảnh lên Cloudinary...');

        const uploadPromises = compressedFiles.map(file => {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);
          formDataUpload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
          
          return axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            formDataUpload
          );
        });
        
        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults.map(res => res.data.secure_url);

        if (imageUrls.length === 0) {
            throw new Error("Upload thất bại, không nhận được URL nào từ Cloudinary.");
        }
        // Tắt toast loading thành công
        toast.success('Tải ảnh hoàn tất!', { id: loadingToast, duration: 2000 });
      } catch (uploadError: any) {
        console.error("Lỗi nén hoặc tải ảnh:", uploadError);
        // === THAY ĐỔI 7: THAY  BẰNG toast.error và tắt toast loading ===
        const uploadErrorMessage = 'Lỗi khi tải ảnh lên: ' + (uploadError.response?.data?.error?.message || uploadError.message || 'Lỗi khi tải ảnh lên Cloudinary.');
        toast.error(uploadErrorMessage, { id: loadingToast });
        setIsUploading(false);
        return; // Dừng lại nếu upload lỗi
      }
      
      setIsUploading(false);
    }
    // ------------------------------------------

    // --- Tạo bài viết với mảng URL ảnh (Giữ nguyên) ---
    console.log('Đang tạo bài viết với URLs:', imageUrls);
    createPost({ 
      title, 
      content, 
      tags: [],
      images: imageUrls,
      category 
    }); 
  };
  // ===================================================

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return <div className="text-center p-8">Vui lòng đăng nhập để tạo bài viết.</div>;
  }
// JSX giữ nguyên...
  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Tạo bài viết</h1>
        </div>
        <hr/>
        <div className="flex items-center space-x-3">
          <img 
            className="w-10 h-10 rounded-full object-cover" 
            src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
            alt={user.name} 
          />
          <div>
            <p className="font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">Đăng vào: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        <div className="space-y-2">
           <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-semibold border-none focus:ring-0 p-2"
            required
            placeholder="Tiêu đề bài viết..."
          />

          <select
            value={category}
            // Thêm ép kiểu (as) để báo cho TypeScript biết giá trị này là hợp lệ
            onChange={(e) => setCategory(e.target.value as PostCategory | '')}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 bg-gray-50"
            required
          >
            <option value="" disabled>-- Chọn chủ đề --</option>
            {/* Các 'value' phải khớp chính xác với kiểu PostCategory */}
            <option value="question">Hỏi đáp</option>
            <option value="experience">Chia sẻ</option>
            <option value="general">Khác</option>
          </select>
          {/* ------------------------------------- */}

          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border-none focus:ring-0 p-2"
            required
            placeholder={`${user.name} ơi, bạn đang nghĩ gì thế?`}
          />
        </div>

        <div className="border rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Thêm vào bài viết của bạn</span>
            <button type="button" onClick={handleImageClick} className="text-green-500 hover:text-green-600 text-2xl">
                <FaImage />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleFileChange}
            />
          </div>
          
          {/* === HIỂN THỊ PREVIEW ẢNH === */}
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {imagePreviews.map((previewUrl, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={previewUrl} 
                    alt={`Xem trước ${index + 1}`} 
                    className="h-24 w-full object-cover rounded-md border" 
                    onLoad={() => {
                      // Thu hồi URL cũ sau khi ảnh đã tải xong để tiết kiệm bộ nhớ
                      if (previewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(previewUrl);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-0 right-0 m-1 p-0.5 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                    aria-label="Xoá ảnh"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            
            Lỗi: {error instanceof Error ? error.message : String(error)}
          </div>
        )}

        <button
          type="submit"
          className="w-full btn-primary disabled:opacity-50"
          disabled={isPending || isUploading}
        >
          {isUploading ? 'Đang tải ảnh...' : (isPending ? 'Đang gửi...' : 'Đăng bài')}
        </button>
      </form>
    </div>
  );
};

export default NewPost;