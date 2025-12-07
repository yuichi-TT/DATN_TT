import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { roomAPI } from '../services/api';
import type { Room as RoomType } from '../types'; 
// === THAY ĐỔI 1: IMPORT TOAST ===
import toast from 'react-hot-toast';

// Tiện ích & Quận huyện
const allAmenities = [
  'WiFi', 'Điều hòa', 'Tủ lạnh', 'Máy giặt', 'Nước nóng', 'Bếp',
  'Tủ quần áo', 'Giường', 'Bàn học', 'Ghế', 'Ban công', 'Sân thượng',
  'Bảo vệ', 'Thang máy', 'Chỗ để xe', 'Camera an ninh'
];
const districtsInDaNang = [
  'Hải Châu', 'Thanh Khê', 'Cẩm Lệ', 'Liên Chiểu', 'Ngũ Hành Sơn', 'Sơn Trà'
];


type RoomFormState = Omit<RoomType, '_id' | 'landlord' | 'createdAt' | 'updatedAt' | 'images' | 'status' | 'coordinates'> & {
  city: string;
  isAvailable: boolean;
  
  electricityPrice: number;
  waterPrice: number;
  otherPrice: number;
};

type CreateRoomApiInput = Omit<RoomType, '_id' | 'landlord' | 'createdAt' | 'updatedAt' | 'status' | 'images'> & {
    images: string[];
    coordinates: {
        type: 'Point';
        coordinates: [number, number];
    };
    electricityPrice: number;
    waterPrice: number;
    otherPrice: number;
};

// Constants
const MAX_FILE_SIZE_MB_RAW = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB_RAW * 1024 * 1024;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// --- STYLES CONSTANTS ---
const INPUT_CLASS = "w-full px-3 py-2 border border-brand-accent rounded-md focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent text-brand-dark placeholder-gray-400 bg-white transition-all";
const LABEL_CLASS = "block text-sm font-bold text-brand-dark mb-1";
const SECTION_CLASS = "p-6 rounded-xl shadow-sm border border-brand-accent/30 bg-white";

// Hàm random tọa độ (Giữ nguyên)
const getRandomCoordinateInDaNang = (): [number, number] => {
  const minLat = 16.03; const maxLat = 16.08;
  const minLng = 108.18; const maxLng = 108.25;
  return [Math.random() * (maxLng - minLng) + minLng, Math.random() * (maxLat - minLat) + maxLat];
};

const CreateRoom: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [formData, setFormData] = useState<RoomFormState>({
    title: '',
    description: '',
    price: 0,
    area: 0,
    address: '',
    district: districtsInDaNang[0],
    city: 'Đà Nẵng',
    amenities: [],
    isAvailable: true,
    // Giá trị mặc định
    electricityPrice: 0,
    waterPrice: 0,
    otherPrice: 0,
  });

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  const createRoomMutation = useMutation({
    mutationFn: (newRoomData: CreateRoomApiInput) => roomAPI.createRoom(newRoomData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      // === THAY ĐỔI 4: Dùng toast.success ===
      toast.success('Đăng tin thành công!');
      navigate('/');
    },
    onError: (err: any) => {
      // === THAY ĐỔI 5: Dùng toast.error ===
      const errorMessage = err.response?.data?.message || 'Tạo phòng thất bại.';
      toast.error(errorMessage);
      setError(errorMessage);
      setIsSubmitting(false); 
    },
  });

  // Xử lý input thường
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | number | boolean = value;
    if (type === 'number') {
        finalValue = value === '' ? 0 : parseFloat(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  // === 3. HÀM XỬ LÝ NHẬP TIỀN TỆ DÙNG CHUNG (Giá phòng, Điện, Nước...) ===
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Xóa dấu chấm và ký tự không phải số
    const numericString = value.replace(/\./g, '').replace(/[^0-9]/g, '');
    const numericValue = numericString ? parseInt(numericString, 10) : 0;

    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  // Helper hiển thị giá trị input (Số thường khi focus, Format tiền khi blur)
  const getDisplayValue = (fieldName: keyof RoomFormState, value: number) => {
    if (focusedField === fieldName) {
        return value === 0 ? '' : value; // Đang nhập: Hiện số thô
    }
    return value === 0 ? '' : new Intl.NumberFormat('vi-VN').format(value); // Xong: Hiện dấu chấm
  };

  const handleCheckboxChange = (amenity: string) => { /* Giữ nguyên */
    setFormData(prev => {
      const newAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(item => item !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* Giữ nguyên */
    setError(null);
    const files = e.target.files;
    if (files) { setSelectedFiles(files); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || createRoomMutation.isPending) return;
    setIsSubmitting(true); setError(null);

    // Validate cơ bản
    if (!formData.title || !formData.address || !formData.district || formData.price <= 0 || formData.area <= 0) {
      // === THAY ĐỔI 2: Dùng toast cho lỗi Validate ===
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc: Tiêu đề, Địa chỉ, Giá và Diện tích.');
      setIsSubmitting(false); return;
    }
    if (!selectedFiles || selectedFiles.length === 0) {
      // === THAY ĐỔI 3: Dùng toast cho lỗi ảnh ===
      toast.error('Vui lòng tải lên ít nhất một hình ảnh.');
      setIsSubmitting(false); return;
    }

    // === KIỂM TRA BIẾN MÔI TRƯỜNG ===
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error('Lỗi cấu hình Cloudinary: Vui lòng kiểm tra lại file .env.');
      setIsSubmitting(false); 
      return;
    }

    let imageUrls: string[] = []; 
    // Bắt đầu toast loading
    const loadingToastId = toast.loading('Đang nén và tải ảnh lên Cloudinary...'); 

    // START BLOCK: Logic Upload Cloudinary
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

        // Cập nhật toast loading thành công
        toast.success('Tải ảnh hoàn tất!', { id: loadingToastId });
    } catch (err: any) {
        // Cập nhật toast loading thành lỗi
        const uploadErrorMsg = 'Lỗi upload ảnh: ' + (err.response?.data?.error?.message || err.message || 'Vui lòng kiểm tra kết nối.');
        toast.error(uploadErrorMsg, { id: loadingToastId });
        setError(uploadErrorMsg); 
        setIsSubmitting(false); 
        return;
    }
    // END BLOCK

    const finalRoomData: CreateRoomApiInput = {
      ...formData,
      images: imageUrls, 
      coordinates: { type: 'Point', coordinates: getRandomCoordinateInDaNang() },
    };

    createRoomMutation.mutate(finalRoomData);
  };

  return (
    <div className="min-h-screen bg-brand-light py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8 text-center">Đăng tin phòng trọ mới</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Thông tin cơ bản (Giữ nguyên) */}
          <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold mb-4 text-brand-dark border-b border-brand-accent/20 pb-2">Thông tin cơ bản</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className={LABEL_CLASS}>Tiêu đề tin đăng <span className="text-red-500">*</span></label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} className={INPUT_CLASS} placeholder="Ví dụ: Phòng trọ cao cấp..." required />
              </div>
              <div>
                <label htmlFor="description" className={LABEL_CLASS}>Mô tả chi tiết</label>
                <textarea id="description" name="description" rows={5} value={formData.description} onChange={handleInputChange} className={INPUT_CLASS} required />
              </div>
            </div>
          </div>

          {/* 2. Địa chỉ (Giữ nguyên) */}
          <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold mb-4 text-brand-dark border-b border-brand-accent/20 pb-2">Địa chỉ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="address" className={LABEL_CLASS}>Số nhà, tên đường <span className="text-red-500">*</span></label>
                <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} className={INPUT_CLASS} required />
              </div>
              <div>
                <label htmlFor="district" className={LABEL_CLASS}>Quận / Huyện</label>
                <select id="district" name="district" value={formData.district} onChange={handleInputChange} className={INPUT_CLASS}>
                  {districtsInDaNang.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Chi tiết phòng (GIÁ & DIỆN TÍCH) */}
          <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold mb-4 text-brand-dark border-b border-brand-accent/20 pb-2">Chi tiết phòng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className={LABEL_CLASS}>Giá cho thuê (VND/tháng) <span className="text-red-500">*</span></label>
                <input 
                    type="text" id="price" name="price" 
                    value={getDisplayValue('price', formData.price)}
                    onChange={handleCurrencyChange}
                    onFocus={() => setFocusedField('price')}
                    onBlur={() => setFocusedField(null)}
                    className={INPUT_CLASS} placeholder="Ví dụ: 3.000.000" required 
                />
              </div>
              <div>
                <label htmlFor="area" className={LABEL_CLASS}>Diện tích (m²) <span className="text-red-500">*</span></label>
                <input type="number" id="area" name="area" value={formData.area || ''} onChange={handleInputChange} className={INPUT_CLASS} required min="0" />
              </div>
            </div>
          </div>

          {/* 4. CHI PHÍ DỊCH VỤ */}
          <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold mb-4 text-brand-dark border-b border-brand-accent/20 pb-2">Chi phí dịch vụ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Giá điện */}
                <div>
                    <label htmlFor="electricityPrice" className={LABEL_CLASS}>Tiền điện (VND/kWh)</label>
                    <input 
                        type="text" id="electricityPrice" name="electricityPrice"
                        value={getDisplayValue('electricityPrice', formData.electricityPrice)}
                        onChange={handleCurrencyChange}
                        onFocus={() => setFocusedField('electricityPrice')}
                        onBlur={() => setFocusedField(null)}
                        className={INPUT_CLASS} placeholder="VD: 3.500" 
                    />
                </div>
                {/* Giá nước */}
                <div>
                    <label htmlFor="waterPrice" className={LABEL_CLASS}>Tiền nước (VND/tháng)</label>
                    <input 
                        type="text" id="waterPrice" name="waterPrice"
                        value={getDisplayValue('waterPrice', formData.waterPrice)}
                        onChange={handleCurrencyChange}
                        onFocus={() => setFocusedField('waterPrice')}
                        onBlur={() => setFocusedField(null)}
                        className={INPUT_CLASS} placeholder="VD: 50.000" 
                    />
                </div>
                {/* Chi phí khác */}
                <div>
                    <label htmlFor="otherPrice" className={LABEL_CLASS}>Chi phí khác (VND)</label>
                    <input 
                        type="text" id="otherPrice" name="otherPrice"
                        value={getDisplayValue('otherPrice', formData.otherPrice)}
                        onChange={handleCurrencyChange}
                        onFocus={() => setFocusedField('otherPrice')}
                        onBlur={() => setFocusedField(null)}
                        className={INPUT_CLASS} placeholder="VD: 100.000" 
                    />
                </div>
            </div>
          </div>

          {/* 5. Tiện nghi (Giữ nguyên) */}
          <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold mb-4 text-brand-dark border-b border-brand-accent/20 pb-2">Tiện nghi</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allAmenities.map(amenity => (
                <label key={amenity} className="flex items-center space-x-3 cursor-pointer group">
                  <input type="checkbox" className="rounded text-brand-main focus:ring-brand-main h-4 w-4" checked={formData.amenities.includes(amenity)} onChange={() => handleCheckboxChange(amenity)} />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 6. Hình ảnh (Giữ nguyên) */}
          <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold mb-4 text-brand-dark border-b border-brand-accent/20 pb-2">Hình ảnh</h2>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className={INPUT_CLASS} required />
            {selectedFiles && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                     {Array.from(selectedFiles).map((file, i) => <img key={i} src={URL.createObjectURL(file)} className="h-20 w-full object-cover rounded" />)}
                </div>
            )}
          </div>

          {/* Nút Submit */}
          <div>
            {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded">{error}</div>}
            <button type="submit" className="w-full py-3 bg-brand-main text-white font-bold rounded-lg shadow-md hover:bg-brand-dark" disabled={isSubmitting || createRoomMutation.isPending}>
              {isSubmitting || createRoomMutation.isPending ? 'Đang xử lý...' : 'Đăng tin ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;