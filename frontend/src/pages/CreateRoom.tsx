import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { roomAPI } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion'; 

// --- Icons ---
import { 
  HomeIcon, MapPinIcon, CurrencyDollarIcon, PhotoIcon, 
  CheckCircleIcon, ChevronRightIcon, ChevronLeftIcon, CloudArrowUpIcon, XMarkIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

import type { Room as RoomType } from '../types'; 

// --- Dữ liệu tĩnh ---
const allAmenities = [
  'WiFi', 'Điều hòa', 'Tủ lạnh', 'Máy giặt', 'Nước nóng', 'Bếp',
  'Tủ quần áo', 'Giường', 'Bàn học', 'Ghế', 'Ban công', 'Sân thượng',
  'Bảo vệ', 'Thang máy', 'Chỗ để xe', 'Camera an ninh'
];
const districtsInDaNang = [
  'Hải Châu', 'Thanh Khê', 'Cẩm Lệ', 'Liên Chiểu', 'Ngũ Hành Sơn', 'Sơn Trà'
];

// --- Types ---
type RoomFormState = Omit<RoomType, '_id' | 'landlord' | 'createdAt' | 'updatedAt' | 'images' | 'status' | 'coordinates'> & {
  city: string;
  isAvailable: boolean;
  electricityPrice: number;
  waterPrice: number;
  otherPrice: number;
};

type CreateRoomApiInput = Omit<RoomType, '_id' | 'landlord' | 'createdAt' | 'updatedAt' | 'status' | 'images'> & {
    images: string[];
    coordinates: { type: 'Point'; coordinates: [number, number] };
    electricityPrice: number;
    waterPrice: number;
    otherPrice: number;
};

// --- Config ---
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Hàm random tọa độ
const getRandomCoordinateInDaNang = (): [number, number] => {
  const minLat = 16.03; const maxLat = 16.08;
  const minLng = 108.18; const maxLng = 108.25;
  return [Math.random() * (maxLng - minLng) + minLng, Math.random() * (maxLat - minLat) + maxLat];
};

const CreateRoom: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE QUẢN LÝ BƯỚC (STEPPER) ---
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<RoomFormState>({
    title: '', description: '', price: 0, area: 0, address: '',
    district: districtsInDaNang[0], city: 'Đà Nẵng', amenities: [], isAvailable: true,
    electricityPrice: 0, waterPrice: 0, otherPrice: 0,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // --- API Mutation ---
  const createRoomMutation = useMutation({
    mutationFn: (newRoomData: CreateRoomApiInput) => roomAPI.createRoom(newRoomData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Đăng tin thành công! Phòng của bạn đang được duyệt.');
      navigate('/');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Tạo phòng thất bại.';
      toast.error(msg);
      setIsSubmitting(false); 
    },
  });

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'number') finalValue = value === '' ? 0 : parseFloat(value);
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericString = value.replace(/\./g, '').replace(/[^0-9]/g, '');
    const numericValue = numericString ? parseInt(numericString, 10) : 0;
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  const formatCurrency = (val: number) => val === 0 ? '' : new Intl.NumberFormat('vi-VN').format(val);

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const newAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(item => item !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]); 
      return newPreviews;
    });
  };

  // --- Submit Logic ---
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error('Lỗi cấu hình hệ thống (Cloudinary).');
      setIsSubmitting(false); return;
    }

    let imageUrls: string[] = []; 
    const loadingToastId = toast.loading('Đang xử lý hình ảnh và đăng tin...'); 

    try {
        const compressionOptions = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFiles = await Promise.all(selectedFiles.map(file => imageCompression(file, compressionOptions)));
        
        const uploadPromises = compressedFiles.map(file => {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            return axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, formDataUpload);
        });

        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults.map(res => res.data.secure_url);

    } catch (err: any) {
        toast.error('Lỗi upload ảnh, vui lòng thử lại.', { id: loadingToastId });
        setIsSubmitting(false); return;
    }

    const finalRoomData: CreateRoomApiInput = {
      ...formData,
      images: imageUrls, 
      coordinates: { type: 'Point', coordinates: getRandomCoordinateInDaNang() },
    };

    createRoomMutation.mutate(finalRoomData, {
        onSettled: () => toast.dismiss(loadingToastId)
    });
  };

  // --- Step Validation ---
  const validateStep = (step: number) => {
    if (step === 1) {
        if (!formData.title || !formData.description) return toast.error("Vui lòng nhập tiêu đề và mô tả");
    }
    if (step === 2) {
        if (!formData.address) return toast.error("Vui lòng nhập địa chỉ");
    }
    if (step === 3) {
        if (!formData.price || !formData.area) return toast.error("Vui lòng nhập giá và diện tích");
    }
    if (step === 4) {
        if (selectedFiles.length === 0) return toast.error("Vui lòng chọn ít nhất 1 ảnh");
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep) === true) {
        if (currentStep < totalSteps) setCurrentStep(c => c + 1);
        else handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  // --- Animation Variants ---
  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-primary-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold text-brand-dark mb-2">Đăng tin phòng trọ</h1>
            <p className="text-gray-500">Giúp hàng ngàn sinh viên tìm thấy ngôi nhà thứ hai của họ.</p>
        </div>

        {/* Stepper */}
        <div className="mb-12">
            <div className="flex justify-between items-center relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-0 rounded-full"></div>
                {/* Thanh tiến trình: Brand Main */}
                <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-main transition-all duration-500 rounded-full"
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                ></div>

                {[1, 2, 3, 4].map((step) => (
                    <div key={step} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        step <= currentStep ? 'bg-brand-main text-white shadow-lg shadow-brand-main/30 scale-110' : 'bg-white text-gray-400 border-2 border-gray-200'
                    }`}>
                        {step < currentStep ? <CheckCircleIcon className="w-6 h-6" /> : step}
                        <div className={`absolute -bottom-8 text-xs font-medium whitespace-nowrap ${step === currentStep ? 'text-brand-main' : 'text-gray-400'}`}>
                            {step === 1 && "Tổng quan"}
                            {step === 2 && "Vị trí"}
                            {step === 3 && "Chi tiết"}
                            {step === 4 && "Hình ảnh"}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Form Content */}
        <div className="bg-white rounded-3xl shadow-xl shadow-brand-main/5 overflow-hidden border-4 border-brand-main/10 relative min-h-[500px] flex flex-col">
            <div className="p-8 md:p-12 flex-grow">
                <AnimatePresence mode='wait' custom={currentStep}>
                    <motion.div
                        key={currentStep}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="h-full"
                    >
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                                    <HomeIcon className="w-8 h-8 text-brand-main" /> Thông tin cơ bản
                                </h2>
                                <div>
                                    <label className="block text-sm font-bold text-brand-dark mb-2">Tiêu đề bài đăng <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" name="title"
                                        value={formData.title} onChange={handleInputChange}
                                        placeholder="VD: Phòng trọ cao cấp, full nội thất gần ĐH Bách Khoa..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none transition-all font-medium text-lg placeholder:font-normal"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-brand-dark mb-2">Mô tả chi tiết <span className="text-red-500">*</span></label>
                                    <textarea
                                        name="description" rows={6}
                                        value={formData.description} onChange={handleInputChange}
                                        placeholder="Mô tả về phòng, không gian, môi trường xung quanh, giờ giấc..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                                    <MapPinIcon className="w-8 h-8 text-brand-main" /> Địa chỉ
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-brand-dark mb-2">Địa chỉ chính xác (Số nhà, đường) <span className="text-red-500">*</span></label>
                                        <input
                                            type="text" name="address"
                                            value={formData.address} onChange={handleInputChange}
                                            placeholder="VD: 54 Nguyễn Lương Bằng"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none transition-all"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">Quận / Huyện</label>
                                        <div className="relative">
                                            <select
                                                name="district" value={formData.district} onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none transition-all appearance-none bg-white cursor-pointer"
                                            >
                                                {districtsInDaNang.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                                <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">Thành phố</label>
                                        <input
                                            type="text" value="Đà Nẵng" disabled
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentStep === 3 && (
                            <div className="space-y-8">
                                <h2 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                                    <CurrencyDollarIcon className="w-8 h-8 text-brand-main" /> Giá & Tiện ích
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-brand-light/10 rounded-2xl border border-brand-light/20">
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">Giá thuê (VNĐ/tháng) <span className="text-red-500">*</span></label>
                                        <input
                                            type="text" name="price"
                                            value={formatCurrency(formData.price)} onChange={handleCurrencyChange}
                                            placeholder="0"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none transition-all text-xl font-bold text-brand-accent text-right"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">Diện tích (m²) <span className="text-red-500">*</span></label>
                                        <input
                                            type="number" name="area"
                                            value={formData.area || ''} onChange={handleInputChange}
                                            placeholder="0"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none transition-all text-xl font-bold text-gray-700 text-right"
                                        />
                                    </div>
                                </div>
                                {/* Dịch vụ */}
                                <div>
                                    <h3 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-brand-accent rounded-full"></span> Chi phí dịch vụ (VNĐ)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Tiền điện (kWh)', name: 'electricityPrice' },
                                            { label: 'Tiền nước (Tháng)', name: 'waterPrice' },
                                            { label: 'Chi phí khác', name: 'otherPrice' },
                                        ].map((item) => (
                                            <div key={item.name}>
                                                <label className="block text-xs uppercase font-bold text-gray-500 mb-1">{item.label}</label>
                                                <input
                                                    type="text" name={item.name}
                                                    value={formatCurrency(formData[item.name as keyof RoomFormState] as number)}
                                                    onChange={handleCurrencyChange}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none text-right font-medium"
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Tiện nghi */}
                                <div>
                                    <h3 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-brand-main rounded-full"></span> Tiện nghi có sẵn
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {allAmenities.map(amenity => {
                                            const isSelected = formData.amenities.includes(amenity);
                                            return (
                                                <div 
                                                    key={amenity}
                                                    onClick={() => toggleAmenity(amenity)}
                                                    className={`cursor-pointer px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-2 select-none ${
                                                        isSelected 
                                                        ? 'border-brand-main bg-brand-light/20 text-brand-dark shadow-sm' 
                                                        : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-brand-main bg-brand-main' : 'border-gray-400'}`}>
                                                        {isSelected && <CheckCircleIcon className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="font-medium text-sm">{amenity}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentStep === 4 && (
                            <div className="space-y-6 h-full flex flex-col">
                                <h2 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                                    <PhotoIcon className="w-8 h-8 text-brand-main" /> Hình ảnh phòng
                                </h2>
                                <div 
                                    className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-brand-light/10 hover:border-brand-main transition-colors cursor-pointer group bg-gray-50"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input 
                                        type="file" multiple accept="image/*" 
                                        ref={fileInputRef} className="hidden" 
                                        onChange={handleFileSelect} 
                                    />
                                    <div className="w-16 h-16 bg-brand-light/20 text-brand-main rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <CloudArrowUpIcon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-700 group-hover:text-brand-main">Click để chọn ảnh hoặc kéo thả vào đây</h3>
                                    <p className="text-sm text-gray-500 mt-2">Hỗ trợ JPG, PNG. Tối đa 5MB/ảnh.</p>
                                </div>
                                {previewUrls.length > 0 && (
                                    <div className="flex-grow overflow-y-auto pr-2 mt-4 custom-scrollbar">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {previewUrls.map((url, idx) => (
                                                <div key={idx} className="relative group aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-brand-light/30">
                                                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                                    <button 
                                                        onClick={() => removeFile(idx)}
                                                        className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* --- FOOTER ACTIONS --- */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
                
                {/* Note */}
                <div className="mb-4 flex items-center justify-end gap-2 text-sm text-brand-accent animate-pulse font-medium">
                    <ExclamationCircleIcon className="w-5 h-5" />
                    <span>Lưu ý: Vui lòng điền đầy đủ các mục có dấu <span className="text-red-500 font-bold">*</span> để tiếp tục.</span>
                </div>

                <div className="flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1 || isSubmitting}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${
                            currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <ChevronLeftIcon className="w-4 h-4" /> Quay lại
                    </button>

                    {/* Nút Tiếp tục/Đăng tin: Brand Main */}
                    <button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-brand-main hover:bg-brand-dark text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-main/30 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span>Đang đăng tin...</span>
                        ) : (
                            currentStep === totalSteps ? (
                                <>Đăng tin ngay <CheckCircleIcon className="w-5 h-5" /></>
                            ) : (
                                <>Tiếp tục <ChevronRightIcon className="w-4 h-4" /></>
                            )
                        )}
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CreateRoom;