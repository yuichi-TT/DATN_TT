import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { roomAPI } from '../services/api';
import type { Room as RoomType } from '../types';
import toast from 'react-hot-toast';

// --- Icons ---
import { 
  HomeIcon, MapPinIcon, CurrencyDollarIcon, PhotoIcon, 
  CheckCircleIcon, CloudArrowUpIcon, 
  ArrowLeftIcon, CheckIcon, ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const allAmenities = [
  'WiFi', 'Điều hòa', 'Tủ lạnh', 'Máy giặt', 'Nước nóng', 'Bếp',
  'Tủ quần áo', 'Giường', 'Bàn học', 'Ghế', 'Ban công', 'Sân thượng',
  'Bảo vệ', 'Thang máy', 'Chỗ để xe', 'Camera an ninh'
];
const districtsInDaNang = ['Hải Châu', 'Thanh Khê', 'Cẩm Lệ', 'Liên Chiểu', 'Ngũ Hành Sơn', 'Sơn Trà'];

// --- Types ---
type RoomFormState = Omit<RoomType, '_id' | 'landlord' | 'createdAt' | 'updatedAt' | 'images' | 'status' | 'coordinates'> & {
  city: string;
  isAvailable: boolean;
  electricityPrice: number;
  waterPrice: number;
  otherPrice: number;
};

type UpdateRoomApiInput = Omit<RoomType, '_id' | 'landlord' | 'createdAt' | 'updatedAt' | 'status' | 'images'> & {
    images: string[];
    coordinates: { type: 'Point'; coordinates: [number, number]; };
    electricityPrice: number;
    waterPrice: number;
    otherPrice: number;
};

// --- Styles (Updated Colors) ---
const CARD_CLASS = "bg-white rounded-2xl shadow-sm border border-brand-light/20 overflow-hidden";
const CARD_HEADER_CLASS = "px-6 py-4 border-b border-gray-100 bg-brand-light/5 flex items-center gap-2 font-bold text-lg text-brand-dark";
const CARD_BODY_CLASS = "p-6 space-y-6";
const LABEL_CLASS = "block text-sm font-bold text-brand-dark mb-2";
// Input focus: Brand Main
const INPUT_CLASS = "w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none transition-all text-brand-dark font-medium placeholder-gray-400";

const EditRoom: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE ---
  const [formData, setFormData] = useState<RoomFormState>({
    title: '', description: '', price: 0, area: 0, address: '',
    district: districtsInDaNang[0], city: 'Đà Nẵng', amenities: [], isAvailable: true,
    electricityPrice: 0, waterPrice: 0, otherPrice: 0,
  });

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [previewNewImages, setPreviewNewImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA ---
  const { data: roomResponse, isLoading: isLoadingRoom } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomAPI.getRoom(roomId!),
    enabled: !!roomId,
    retry: false,
  });
  const existingRoom = roomResponse?.data.data;

  // --- POPULATE FORM ---
  useEffect(() => {
    if (existingRoom) {
      setFormData({
        title: existingRoom.title,
        description: existingRoom.description,
        price: existingRoom.price,
        area: existingRoom.area,
        address: existingRoom.address,
        district: existingRoom.district,
        city: existingRoom.city || 'Đà Nẵng',
        amenities: existingRoom.amenities,
        isAvailable: existingRoom.isAvailable,
        electricityPrice: existingRoom.electricityPrice || 0,
        waterPrice: existingRoom.waterPrice || 0,
        otherPrice: existingRoom.otherPrice || 0,
      });
    }
  }, [existingRoom]);

  // --- MUTATIONS ---
  const updateRoomMutation = useMutation({
    mutationFn: (updatedRoomData: UpdateRoomApiInput) => roomAPI.updateRoom(roomId!, updatedRoomData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      toast.success('Đã lưu thay đổi!');
      navigate('/profile'); 
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại.');
      setIsSubmitting(false);
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('images', file));
      return roomAPI.uploadImages(formData);
    },
    onError: () => { 
      toast.error('Lỗi tải ảnh lên.');
      setIsSubmitting(false); 
    }
  });

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'number') finalValue = value === '' ? 0 : parseFloat(value);
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericString = value.replace(/\./g, '').replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [name]: numericString ? parseInt(numericString, 10) : 0 }));
  };

  const formatCurrency = (val: number) => val === 0 ? '' : new Intl.NumberFormat('vi-VN').format(val);

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const newAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(i => i !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
      const newUrls = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setPreviewNewImages(newUrls);
    }
  };

  const clearNewImages = () => {
    setSelectedFiles(null);
    setPreviewNewImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!formData.title || formData.price <= 0) {
      toast.error('Tiêu đề và Giá thuê không được để trống.');
      setIsSubmitting(false); return;
    }

    let newImageUrls: string[] = [];
    let loadingToastId: string | undefined;

    if (selectedFiles && selectedFiles.length > 0) {
        loadingToastId = toast.loading('Đang tải ảnh mới...');
        try {
          const uploadResult = await uploadImagesMutation.mutateAsync(selectedFiles);
          if (uploadResult?.data?.data) newImageUrls = uploadResult.data.data;
          toast.success('Tải ảnh xong!', { id: loadingToastId });
        } catch (error) {
          toast.dismiss(loadingToastId);
          return;
        }
    }

    const finalRoomData: UpdateRoomApiInput = {
      ...formData,
      images: newImageUrls.length > 0 ? newImageUrls : existingRoom!.images,
      coordinates: existingRoom!.coordinates || { type: 'Point', coordinates: [0, 0] },
    };

    updateRoomMutation.mutate(finalRoomData);
  };

  if (isLoadingRoom) return <div className="min-h-screen flex items-center justify-center bg-primary-50"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-brand-main"></div></div>;

  return (
    <div className="min-h-screen bg-primary-50 pb-24 font-sans">
      
      {/* --- STICKY HEADER ACTIONS --- */}
      <div className="bg-white border-b border-brand-light/20 sticky top-0 z-30 shadow-sm px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link to="/profile" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-bold text-brand-dark truncate">Chỉnh sửa tin: {formData.title}</h1>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
                 {/* Nút Hủy */}
                <Link to="/profile" className="flex-1 sm:flex-none px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl text-center">
                    Hủy bỏ
                </Link>
                {/* Nút Lưu: Brand Main */}
                <button 
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-6 py-2 bg-brand-main hover:bg-brand-dark text-white rounded-xl font-bold shadow-md shadow-brand-main/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                >
                    {isSubmitting ? (
                        <>Đang lưu...</>
                    ) : (
                        <><CheckIcon className="w-5 h-5" /> Lưu thay đổi</>
                    )}
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        
        {/* === CARD 1: THÔNG TIN CƠ BẢN === */}
        <section className={CARD_CLASS}>
            <div className={CARD_HEADER_CLASS}>
                <HomeIcon className="w-5 h-5 text-brand-main" /> Thông tin cơ bản
            </div>
            <div className={CARD_BODY_CLASS}>
                <div>
                    <label className={LABEL_CLASS}>Tiêu đề bài đăng <span className="text-red-500">*</span></label>
                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className={LABEL_CLASS}>Mô tả chi tiết</label>
                    <textarea name="description" rows={6} value={formData.description} onChange={handleInputChange} className={INPUT_CLASS} />
                </div>
                {/* Checkbox: Brand Main */}
                <div className="flex items-center gap-3 p-4 bg-brand-light/10 rounded-xl border border-brand-light/20">
                    <input 
                        type="checkbox" id="isAvailable" 
                        checked={formData.isAvailable} 
                        onChange={(e) => setFormData(prev => ({...prev, isAvailable: e.target.checked}))}
                        className="w-5 h-5 text-brand-main rounded focus:ring-brand-main cursor-pointer" 
                    />
                    <div>
                        <label htmlFor="isAvailable" className="font-bold text-brand-dark cursor-pointer">Phòng đang trống</label>
                        <p className="text-sm text-gray-500">Bỏ chọn nếu phòng đã được thuê (Tin sẽ bị ẩn khỏi kết quả tìm kiếm).</p>
                    </div>
                </div>
            </div>
        </section>

        {/* === CARD 2: ĐỊA CHỈ === */}
        <section className={CARD_CLASS}>
            <div className={CARD_HEADER_CLASS}>
                <MapPinIcon className="w-5 h-5 text-brand-main" /> Vị trí
            </div>
            <div className={CARD_BODY_CLASS}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={LABEL_CLASS}>Địa chỉ chính xác</label>
                        <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={INPUT_CLASS} />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Quận / Huyện</label>
                        <div className="relative">
                            <select name="district" value={formData.district} onChange={handleInputChange} className={`${INPUT_CLASS} appearance-none cursor-pointer`}>
                                {districtsInDaNang.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                         <label className={LABEL_CLASS}>Thành phố</label>
                         <input type="text" value="Đà Nẵng" disabled className={`${INPUT_CLASS} bg-gray-100 text-gray-500`} />
                    </div>
                </div>
            </div>
        </section>

        {/* === CARD 3: GIÁ & TIỆN ÍCH === */}
        <section className={CARD_CLASS}>
            <div className={CARD_HEADER_CLASS}>
                <CurrencyDollarIcon className="w-5 h-5 text-brand-main" /> Giá & Tiện ích
            </div>
            <div className={CARD_BODY_CLASS}>
                {/* Giá & Diện tích */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={LABEL_CLASS}>Giá thuê (VNĐ/tháng) <span className="text-red-500">*</span></label>
                        <input type="text" name="price" value={formatCurrency(formData.price)} onChange={handleCurrencyChange} className={`${INPUT_CLASS} text-brand-accent font-extrabold text-lg`} />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Diện tích (m²) <span className="text-red-500">*</span></label>
                        <input type="number" name="area" value={formData.area} onChange={handleInputChange} className={INPUT_CLASS} />
                    </div>
                </div>

                {/* Dịch vụ */}
                <div className="bg-primary-50 p-4 rounded-xl border border-brand-light/20">
                    <h4 className="font-bold text-brand-dark mb-3 text-sm uppercase">Chi phí dịch vụ (VNĐ)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Điện (kWh)', name: 'electricityPrice' },
                            { label: 'Nước (Tháng)', name: 'waterPrice' },
                            { label: 'Khác', name: 'otherPrice' },
                        ].map((item) => (
                            <div key={item.name}>
                                <label className="text-xs text-gray-500 font-medium mb-1 block">{item.label}</label>
                                <input
                                    type="text" name={item.name}
                                    value={formatCurrency(formData[item.name as keyof RoomFormState] as number)}
                                    onChange={handleCurrencyChange}
                                    className={`${INPUT_CLASS} text-sm`}
                                    placeholder="0"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tiện nghi */}
                <div>
                    <label className={LABEL_CLASS}>Tiện nghi có sẵn</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                        {allAmenities.map(amenity => {
                            const isSelected = formData.amenities.includes(amenity);
                            return (
                                <div 
                                    key={amenity}
                                    onClick={() => toggleAmenity(amenity)}
                                    className={`cursor-pointer px-3 py-2 rounded-lg border flex items-center gap-2 select-none transition-colors ${
                                        isSelected 
                                        ? 'border-brand-main bg-brand-light/20 text-brand-main font-bold' 
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-brand-light/50'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-brand-main bg-brand-main' : 'border-gray-300'}`}>
                                        {isSelected && <CheckCircleIcon className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm">{amenity}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>

        {/* === CARD 4: HÌNH ẢNH === */}
        <section className={CARD_CLASS}>
            <div className={CARD_HEADER_CLASS}>
                <PhotoIcon className="w-5 h-5 text-brand-main" /> Hình ảnh
            </div>
            <div className={CARD_BODY_CLASS}>
                {/* Ảnh cũ */}
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Ảnh hiện tại</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                        {existingRoom?.images.map((url, i) => (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden border border-brand-light/30">
                                <img src={url} alt="Room" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upload mới */}
                <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Cập nhật ảnh mới</h3>
                    <div className="flex items-start gap-2 text-sm text-brand-accent bg-brand-soft/20 p-3 rounded-lg border border-brand-accent/20 mb-4">
                        <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                        <span>Chú ý: Tải ảnh mới sẽ <b>thay thế hoàn toàn</b> danh sách ảnh cũ.</span>
                    </div>

                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-brand-light/5 hover:border-brand-main transition-colors cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" multiple accept="image/*" 
                            ref={fileInputRef} className="hidden" 
                            onChange={handleFileChange} 
                        />
                        <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-brand-main" />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-brand-main">Nhấn để chọn ảnh mới</span>
                    </div>

                    {/* Preview ảnh mới */}
                    {previewNewImages.length > 0 && (
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-green-600">Ảnh mới đã chọn ({previewNewImages.length})</span>
                                <button onClick={clearNewImages} type="button" className="text-xs text-red-500 hover:underline">Hủy chọn</button>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                                {previewNewImages.map((url, i) => (
                                    <div key={i} className="aspect-square rounded-lg overflow-hidden border-2 border-green-500 relative">
                                        <img src={url} alt="New" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>

      </div>
    </div>
  );
};

export default EditRoom;