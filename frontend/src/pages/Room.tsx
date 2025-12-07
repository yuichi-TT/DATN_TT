import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomAPI, type User, type Room as RoomType, conversationAPI } from '../services/api'; 
import { useAuth } from '../hooks/useAuth';
// === THAY ĐỔI 1: IMPORT TOAST ===
import toast from 'react-hot-toast';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';


import { AcademicCapIcon } from '@heroicons/react/24/outline'; 


import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


const IconMapPin: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const IconCheck: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const IconPrice: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const IconArea: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18"></path><path d="M12.5 12.5L18 18"></path><path d="M18 12.5V18h-5.5"></path></svg>
);
const IconPhone: React.FC<{className?: string}> = ({className}) => (
 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
);

// Hàm định dạng giá tiền
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// --- DỮ LIỆU & HÀM TÍNH KHOẢNG CÁCH ---
const UNIVERSITIES_DN = [
  { name: "ĐH Bách Khoa - ĐHĐN", lat: 16.0738, lng: 108.1499 },
  { name: "ĐH Kinh Tế - ĐHĐN", lat: 16.0516, lng: 108.2436 },
  { name: "ĐH Sư Phạm - ĐHĐN", lat: 16.0771, lng: 108.1553 },
  { name: "ĐH Ngoại Ngữ - ĐHĐN", lat: 16.0567, lng: 108.2135 },
  { name: "ĐH Duy Tân (Quang Trung)", lat: 16.0607, lng: 108.2236 },
  { name: "ĐH Kiến Trúc Đà Nẵng", lat: 16.0611, lng: 108.2224 },
  { name: "ĐH Đông Á", lat: 16.0333, lng: 108.2216 },
  { name: "FPT University (FPT City)", lat: 15.9689, lng: 108.2607 },
  { name: "CĐ Công Nghệ (Cao Thắng)", lat: 16.0765, lng: 108.2127 },
  { name: "ĐH CNTT & TT Việt - Hàn (VKU)", lat: 15.9751, lng: 108.2532 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Bán kính trái đất (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
// --------------------------------------

// --- STYLES CONSTANTS ---
const BUTTON_PRIMARY_CLASS = "w-full py-3 px-4 bg-brand-main hover:bg-brand-dark text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2";
const SECTION_CLASS = "bg-white border border-brand-accent/30 shadow-sm rounded-xl p-6";
const HEADING_CLASS = "text-xl font-bold text-brand-dark mb-4 border-b border-brand-accent/20 pb-2";

const Room: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { data: roomData, isLoading, isError, error } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomAPI.getRoom(id!), 
    enabled: !!id, 
  });

  const [mainImage, setMainImage] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const room: RoomType | undefined = roomData?.data.data;
  const landlord: User | undefined = room?.landlord;

  // === TÍNH TOÁN VỊ TRÍ CHO LEAFLET ===
  const mapPosition = useMemo((): [number, number] => {
    if (room?.coordinates?.coordinates) {
      const [lng, lat] = room.coordinates.coordinates;
      if (lat >= 15 && lat <= 17 && lng >= 107 && lng <= 109) {
         return [lat, lng]; 
      }
    }
    return [16.0614, 108.2272]; 
  }, [room]);

  // === TÍNH TOÁN KHOẢNG CÁCH ĐẾN TRƯỜNG ===
  const nearbyUniversities = useMemo(() => {
    if (!room?.coordinates?.coordinates) return [];
    
    const [roomLng, roomLat] = room.coordinates.coordinates;

    // Tính khoảng cách tới TẤT CẢ các trường
    const distances = UNIVERSITIES_DN.map(uni => ({
      ...uni,
      distance: calculateDistance(roomLat, roomLng, uni.lat, uni.lng)
    }));

    // Sắp xếp từ gần đến xa và lấy 3 trường gần nhất
    return distances.sort((a, b) => a.distance - b.distance).slice(0, 3);
  }, [room]);
  // ==========================================

  useEffect(() => {
    if (room && room.images.length > 0) {
      setMainImage(room.images[0]);
    }
  }, [room]);

  const handleStartChat = async (receiverId: string) => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để bắt đầu trò chuyện.');
      navigate('/login');
      return;
    }

    if (currentUser._id === receiverId) {
      // === THAY ĐỔI 2: Dùng toast.error ===
      toast.error("Bạn không thể tự nhắn tin cho chính mình.");
      return;
    }

    setIsStartingChat(true);
    // Bắt đầu toast loading
    const loadingToastId = toast.loading('Đang khởi tạo cuộc trò chuyện...');
    
    try {
      const response = await conversationAPI.findOrCreate(receiverId);
      const conversation = response.data;
      
      // Tắt toast loading thành công
      toast.success('Đã mở cuộc trò chuyện.', { id: loadingToastId });
      
      navigate('/chat', {
        state: {
          conversationToOpen: conversation,
        },
      });
    } catch (error: any) {
      console.error('Không thể bắt đầu chat:', error);
      // === THAY ĐỔI 3: Dùng toast.error ===
      const errorMessage = 'Đã xảy ra lỗi khi bắt đầu chat: ' + (error.response?.data?.message || error.message);
      toast.error(errorMessage, { id: loadingToastId });
    } finally {
      setIsStartingChat(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-light text-brand-dark">Đang tải chi tiết phòng...</div>;
  }

  if (isError) {
    const errorMessage = (error as any)?.response?.data?.message || (error as Error).message;
    return <div className="min-h-screen flex items-center justify-center bg-brand-light text-red-600">Lỗi: {errorMessage}</div>;
  }

  if (!room) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-light text-brand-dark">Không tìm thấy phòng trọ này.</div>;
  }

  return (
    // Nền trang màu Mint
    <div className="min-h-screen bg-brand-light py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 4.1. Tiêu đề và Địa chỉ */}
        <div>
          <h1 className="text-3xl font-extrabold text-brand-dark">{room.title}</h1>
          <div className="flex items-center text-gray-600 mt-2">
            <IconMapPin className="text-brand-main" />
            <span className="ml-2 font-medium">{room.address}, {room.district}, {room.city}</span>
          </div>
        </div>

        {/* 4.2. Thư viện ảnh (Gallery) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ảnh chính */}
          <div className="md:col-span-2 h-96 bg-gray-200 rounded-xl overflow-hidden border border-brand-accent/20 shadow-sm">
            {mainImage ? (
              <img 
                src={mainImage} 
                alt="Ảnh chính" 
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-500">Ảnh chính</div>
            )}
          </div>
          {/* Danh sách ảnh thumbnails */}
          <div className="md:col-span-1 h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {room.images.length > 0 ? room.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Ảnh ${index + 1}`}
                onClick={() => setMainImage(image)}
                className={`w-full h-24 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                  mainImage === image ? 'border-brand-main opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              />
            )) : (
              <p className="text-gray-500">Không có ảnh nào khác.</p>
            )}
          </div>
        </div>

        {/* 4.3. Bố cục 2 cột: Thông tin & Chủ trọ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cột trái: Thông tin chi tiết */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Thông tin chính (Giá, Diện tích) */}
            <div className={SECTION_CLASS}>
               <div className="grid grid-cols-2 gap-4">
                 <div className="flex items-center space-x-3">
                    <div className="p-3 bg-brand-light/50 rounded-full text-brand-main">
                        <IconPrice className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Giá thuê</p>
                      <p className="text-xl font-bold text-brand-main">{formatPrice(room.price)}</p>
                    </div>
                 </div>
                 <div className="flex items-center space-x-3">
                    <div className="p-3 bg-brand-light/50 rounded-full text-brand-accent">
                        <IconArea className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Diện tích</p>
                      <p className="text-xl font-bold text-brand-dark">{room.area} m²</p>
                    </div>
                 </div>
               </div>
            </div>

            {/* Mô tả chi tiết */}
            <div className={SECTION_CLASS}>
              <h2 className={HEADING_CLASS}>Mô tả chi tiết</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{room.description}</p>
            </div>

            {/* Tiện nghi */}
            <div className={SECTION_CLASS}>
              <h2 className={HEADING_CLASS}>Tiện nghi</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {room.amenities.length > 0 ? room.amenities.map(amenity => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <div className="text-brand-main">
                        <IconCheck />
                    </div>
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                )) : (
                  <p className="text-gray-500 col-span-full">Không có tiện nghi nào được liệt kê.</p>
                )}
              </div>
            </div>

            {/* === BẢN ĐỒ & KHOẢNG CÁCH TRƯỜNG === */}
            <div className={SECTION_CLASS}>
              <h2 className={HEADING_CLASS}>Vị trí trên bản đồ</h2>
              <div className="h-80 rounded-lg overflow-hidden z-0 border border-brand-accent/20 mb-6">
                <MapContainer 
                  center={mapPosition} 
                  zoom={16} 
                  scrollWheelZoom={false} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={mapPosition}>
                    <Popup>
                      {room.address}, {room.district} <br /> (Vị trí tương đối)
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              {/* === DANH SÁCH TRƯỜNG GẦN ĐÂY === */}
              {nearbyUniversities.length > 0 && (
                <div className="bg-brand-light/30 rounded-lg p-4 border border-brand-accent/20">
                  <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2">
                    <AcademicCapIcon className="w-6 h-6 text-brand-main" />
                    Trường học lân cận (Top 3)
                  </h3>
                  <div className="space-y-3">
                    {nearbyUniversities.map((uni, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-2.5 rounded shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-sm font-medium text-gray-700 flex-grow">{uni.name}</span>
                        <span className="text-sm font-bold text-brand-main bg-brand-light/50 px-3 py-1 rounded-full ml-2 min-w-[70px] text-center border border-brand-accent/10">
                          {uni.distance.toFixed(1)} km
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 italic flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    Khoảng cách được tính theo đường chim bay.
                  </p>
                </div>
              )}
              {/* ================================== */}
            </div>

          </div>

          {/* Cột phải: Thông tin chủ trọ */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`${SECTION_CLASS} sticky top-24 border-t-4 border-t-brand-main`}>
              <h3 className="text-xl font-bold text-brand-dark mb-6 text-center">Thông tin chủ trọ</h3>
              {landlord ? (
                <div className="flex flex-col items-center mb-6">
                  <img 
                    src={landlord.avatar || `https://ui-avatars.com/api/?name=${landlord.name}&background=random`} 
                    alt={landlord.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-brand-light shadow-sm mb-3"
                  />
                  <p className="text-lg font-bold text-brand-dark">{landlord.name}</p>
                  <span className="text-sm text-brand-accent font-medium bg-brand-light/50 px-3 py-1 rounded-full mt-1">Chủ trọ uy tín</span>
                </div>
              ) : (
                <p className="text-gray-500 mb-6 text-center">Không có thông tin chủ trọ.</p>
              )}

              {/* === NÚT HIỂN THỊ SĐT === */}
              {landlord && (
                <div className="mb-3">
                  {showPhone ? (
                    <div className="flex items-center justify-center p-3 bg-brand-light/30 border border-brand-accent/30 rounded-lg">
                      <IconPhone className="text-brand-main" />
                      <a 
                        href={`tel:${landlord.phone}`} 
                        className="ml-2 text-lg font-bold text-brand-dark tracking-wider hover:text-brand-main"
                      >
                        {landlord.phone}
                      </a>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowPhone(true)}
                      className={BUTTON_PRIMARY_CLASS}
                    >
                      <IconPhone className="w-5 h-5" />
                      Hiện số điện thoại
                    </button>
                  )}
                </div>
              )}

              {/* === NÚT NHẮN TIN === */}
              {landlord && (
                <button 
                  className="w-full py-3 px-4 bg-white border border-brand-main text-brand-main hover:bg-brand-light font-bold rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                  onClick={() => handleStartChat(landlord._id)}
                  disabled={isStartingChat || (currentUser?._id === landlord._id)}
                >
                  {isStartingChat 
                    ? 'Đang mở...' 
                    : (currentUser?._id === landlord._id ? 'Đây là tin của bạn' : 'Nhắn tin ngay')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;