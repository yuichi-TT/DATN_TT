import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { roomAPI } from '../services/api';
import type { Room as RoomType } from '../types';
// === THAY ĐỔI 1: IMPORT TOAST ===
import toast from 'react-hot-toast';


const allAmenities = [
  'WiFi', 'Điều hòa', 'Tủ lạnh', 'Máy giặt', 'Nước nóng', 'Bếp',
  'Tủ quần áo', 'Giường', 'Bàn học', 'Ghế', 'Ban công', 'Sân thượng',
  'Bảo vệ', 'Thang máy', 'Chỗ để xe', 'Camera an ninh'
];
const districtsInDaNang = ['Hải Châu', 'Thanh Khê', 'Cẩm Lệ', 'Liên Chiểu', 'Ngũ Hành Sơn', 'Sơn Trà'];


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

// Styles
const INPUT_CLASS = "w-full px-3 py-2 border border-brand-accent rounded-md focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent text-brand-dark placeholder-gray-400 bg-white transition-all";
const LABEL_CLASS = "block text-sm font-bold text-brand-dark mb-1";
const SECTION_CLASS = "p-6 rounded-xl shadow-sm border border-brand-accent/30 bg-white";

const EditRoom: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  // State quản lý Focus
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [formData, setFormData] = useState<RoomFormState | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dữ liệu cũ
  const { data: roomResponse, isLoading: isLoadingRoom, isError: isRoomError } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomAPI.getRoom(roomId!),
    enabled: !!roomId,
    retry: false,
  });

  const existingRoom = roomResponse?.data.data;

  // === 2. ĐỔ DỮ LIỆU CŨ VÀO FORM (Bao gồm các trường mới) ===
  useEffect(() => {
    if (existingRoom) {
      const { 
        title, description, price, area, address, district, 
        city, amenities, isAvailable, 
        // Lấy thêm các trường giá dịch vụ (fallback về 0 nếu chưa có)
        electricityPrice, waterPrice, otherPrice
      } = existingRoom;
      
      setFormData({
        title, description, price, area, address, district, 
        city: city || 'Đà Nẵng', 
        amenities, isAvailable,
        electricityPrice: electricityPrice || 0,
        waterPrice: waterPrice || 0,
        otherPrice: otherPrice || 0,
      });
    }
  }, [existingRoom]);

  // Mutation Update
  const updateRoomMutation = useMutation({
    mutationFn: (updatedRoomData: UpdateRoomApiInput) => roomAPI.updateRoom(roomId!, updatedRoomData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      // === THAY ĐỔI 2: Dùng toast.success ===
      toast.success('Cập nhật tin thành công!');
      navigate('/profile');
    },
    onError: (err: any) => {
      // === THAY ĐỔI 3: Dùng toast.error ===
      const errorMessage = err.response?.data?.message || 'Cập nhật thất bại.';
      toast.error(errorMessage);
      setError(errorMessage);
      setIsSubmitting(false);
    },
  });

  // Mutation Upload Ảnh (Giữ nguyên)
  const uploadImagesMutation = useMutation({
    mutationFn: (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('images', file));
      return roomAPI.uploadImages(formData);
    },
    onError: (err: any) => { 
      // === THAY ĐỔI 4: Dùng toast.error ===
      toast.error('Lỗi tải ảnh lên. Vui lòng thử lại.');
      setError('Tải ảnh thất bại.'); 
      setIsSubmitting(false); 
    }
  });

  // === 3. XỬ LÝ NHẬP LIỆU (Giống CreateRoom) ===
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!formData) return;
    const { name, value, type } = e.target;
    let finalValue: string | number | boolean = value;
    if (type === 'number') { finalValue = value === '' ? 0 : parseFloat(value); }
    setFormData(prev => ({ ...prev!, [name]: finalValue }));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    const numericString = value.replace(/\./g, '').replace(/[^0-9]/g, '');
    const numericValue = numericString ? parseInt(numericString, 10) : 0;
    setFormData(prev => ({ ...prev!, [name]: numericValue }));
  };

  const getDisplayValue = (fieldName: keyof RoomFormState, value: number) => {
    if (focusedField === fieldName) return value === 0 ? '' : value;
    return value === 0 ? '' : new Intl.NumberFormat('vi-VN').format(value);
  };

  const handleCheckboxChange = (amenity: string) => { /* Giữ nguyên logic */
    if (!formData) return;
    setFormData(prev => {
        const newAmenities = prev!.amenities.includes(amenity) ? prev!.amenities.filter(i => i !== amenity) : [...prev!.amenities, amenity];
        return { ...prev!, amenities: newAmenities };
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setSelectedFiles(e.target.files); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !existingRoom) return;
    if (isSubmitting) return;
    setIsSubmitting(true); setError(null);

    // Validate
    if (!formData.title || formData.price <= 0) {
        // === THAY ĐỔI 5: Dùng toast cho lỗi Validate ===
        toast.error('Vui lòng nhập đầy đủ Tiêu đề và Giá thuê.');
        setError('Vui lòng nhập đủ thông tin.'); setIsSubmitting(false); return;
    }

    let newImageUrls: string[] = [];
    let loadingToastId: string | undefined;

    if (selectedFiles && selectedFiles.length > 0) {
        loadingToastId = toast.loading('Đang tải ảnh lên...'); // Bắt đầu toast loading
        try {
          const uploadResult = await uploadImagesMutation.mutateAsync(selectedFiles);
          if (uploadResult?.data?.data) newImageUrls = uploadResult.data.data;
          
          toast.success('Tải ảnh hoàn tất!', { id: loadingToastId });
        } catch (e) { 
          // toast.error đã được gọi trong uploadImagesMutation onError, chỉ cần tắt loading
          toast.dismiss(loadingToastId); 
          setIsSubmitting(false); 
          return; 
        }
    }

    const finalRoomData: UpdateRoomApiInput = {
      ...formData,
      // Nếu có ảnh mới, sử dụng ảnh mới. Nếu không, giữ ảnh cũ
      images: newImageUrls.length > 0 ? newImageUrls : existingRoom.images,
      coordinates: existingRoom.coordinates || { type: 'Point', coordinates: [0, 0] },
    };

    updateRoomMutation.mutate(finalRoomData);
  };

  if (isLoadingRoom) return <div>Loading...</div>;
  if (!formData) return <div>Error loading form</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Chỉnh sửa tin</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className={SECTION_CLASS}>
          <h2 className="text-xl font-bold mb-4">Thông tin cơ bản</h2>
          <div className="space-y-4">
             <div><label className={LABEL_CLASS}>Tiêu đề</label><input name="title" value={formData.title} onChange={handleInputChange} className={INPUT_CLASS} /></div>
             <div><label className={LABEL_CLASS}>Mô tả</label><textarea name="description" rows={5} value={formData.description} onChange={handleInputChange} className={INPUT_CLASS} /></div>
          </div>
        </div>

        {/* Địa chỉ (Giữ nguyên) */}
        <div className={SECTION_CLASS}>
             <h2 className="text-xl font-bold mb-4">Địa chỉ</h2>
             <div className="grid md:grid-cols-2 gap-4">
                 <input name="address" value={formData.address} onChange={handleInputChange} className={INPUT_CLASS} />
                 <select name="district" value={formData.district} onChange={handleInputChange} className={INPUT_CLASS}>
                     {districtsInDaNang.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
             </div>
        </div>

        {/* Chi tiết phòng */}
        <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold mb-4">Chi tiết phòng</h2>
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Giá thuê</label>
                    <input name="price" value={getDisplayValue('price', formData.price)} onChange={handleCurrencyChange} onFocus={() => setFocusedField('price')} onBlur={() => setFocusedField(null)} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className={LABEL_CLASS}>Diện tích</label>
                    <input type="number" name="area" value={formData.area} onChange={handleInputChange} className={INPUT_CLASS} />
                </div>
            </div>
        </div>

        {/* === 4. CHI PHÍ DỊCH VỤ === */}
        <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold mb-4 text-brand-dark border-b border-brand-accent/20 pb-2">Chi phí dịch vụ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Điện (VND/kWh)</label>
                    <input name="electricityPrice" value={getDisplayValue('electricityPrice', formData.electricityPrice)} onChange={handleCurrencyChange} onFocus={() => setFocusedField('electricityPrice')} onBlur={() => setFocusedField(null)} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className={LABEL_CLASS}>Nước (VND/tháng)</label>
                    <input name="waterPrice" value={getDisplayValue('waterPrice', formData.waterPrice)} onChange={handleCurrencyChange} onFocus={() => setFocusedField('waterPrice')} onBlur={() => setFocusedField(null)} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className={LABEL_CLASS}>Khác (VND)</label>
                    <input name="otherPrice" value={getDisplayValue('otherPrice', formData.otherPrice)} onChange={handleCurrencyChange} onFocus={() => setFocusedField('otherPrice')} onBlur={() => setFocusedField(null)} className={INPUT_CLASS} />
                </div>
            </div>
        </div>

        {/* Tiện nghi & Ảnh (Giữ nguyên logic) */}
        <div className={SECTION_CLASS}>
             <h2 className="text-xl font-bold mb-4">Tiện nghi</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {allAmenities.map(amenity => (
                     <label key={amenity} className="flex space-x-2">
                         <input type="checkbox" checked={formData.amenities.includes(amenity)} onChange={() => handleCheckboxChange(amenity)} />
                         <span>{amenity}</span>
                     </label>
                 ))}
             </div>
        </div>
        
        <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold mb-4">Hình ảnh</h2>
            <div className="mb-4">
                <p className="text-sm text-gray-500">Ảnh hiện tại:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {existingRoom?.images.map((url, i) => (
                    <img key={i} src={url} alt={`Ảnh cũ ${i+1}`} className="h-20 w-20 object-cover rounded border" />
                  ))}
                </div>
                <p className="text-xs text-red-500 mt-2">Lưu ý: Nếu bạn chọn ảnh mới, các ảnh cũ sẽ bị thay thế hoàn toàn.</p>
            </div>
            <input type="file" multiple onChange={handleFileChange} className={INPUT_CLASS} />
        </div>

        <button type="submit" className="w-full py-3 bg-brand-main text-white font-bold rounded-lg" disabled={isSubmitting || updateRoomMutation.isPending}>
            {isSubmitting || updateRoomMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
};

export default EditRoom;