import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomAPI, type User, type Room as RoomType, conversationAPI } from '../services/api'; 
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// --- LEAFLET IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// --- ICONS (LUCIDE REACT) ---
import { 
  MapPin, Phone, MessageCircle, Share2, Heart, CheckCircle2, 
  School, User as UserIcon, Maximize, DollarSign, ShieldCheck, 
  Clock, ChevronLeft, Star, AlertTriangle
} from 'lucide-react';

// --- FIX LEAFLET ICON ---
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- COMPONENT PHỤ: CẬP NHẬT MAP KHI ĐỔI TỌA ĐỘ ---
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);
  return null;
};

// --- HELPERS ---
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// --- DATA CONSTANTS ---
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
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- STYLES CONSTANTS ---
// Sử dụng bg-brand-light cho nền nhạt
const CARD_CLASS = "bg-white rounded-2xl shadow-sm border border-brand-light/30 overflow-hidden";
const HEADING_CLASS = "text-xl font-bold text-brand-main mb-4 flex items-center gap-2";

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

  const mapPosition = useMemo((): [number, number] => {
    if (room?.coordinates?.coordinates) {
      const [lng, lat] = room.coordinates.coordinates;
      if (lat >= 10 && lat <= 20 && lng >= 100 && lng <= 110) {
         return [lat, lng]; 
      }
    }
    return [16.0614, 108.2272]; 
  }, [room]);

  const nearbyUniversities = useMemo(() => {
    if (!room?.coordinates?.coordinates) return [];
    const [roomLng, roomLat] = room.coordinates.coordinates;
    const distances = UNIVERSITIES_DN.map(uni => ({
      ...uni,
      distance: calculateDistance(roomLat, roomLng, uni.lat, uni.lng)
    }));
    return distances.sort((a, b) => a.distance - b.distance).slice(0, 3);
  }, [room]);

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
      toast.error("Bạn không thể tự nhắn tin cho chính mình.");
      return;
    }

    setIsStartingChat(true);
    const loadingToastId = toast.loading('Đang khởi tạo cuộc trò chuyện...');
    
    try {
      const response = await conversationAPI.findOrCreate(receiverId);
      const conversation = response.data;
      toast.success('Đã mở cuộc trò chuyện.', { id: loadingToastId });
      navigate('/chat', { state: { conversationToOpen: conversation } });
    } catch (error: any) {
      console.error('Không thể bắt đầu chat:', error);
      const errorMessage = 'Đã xảy ra lỗi khi bắt đầu chat: ' + (error.response?.data?.message || error.message);
      toast.error(errorMessage, { id: loadingToastId });
    } finally {
      setIsStartingChat(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-primary-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-main"></div></div>;
  if (isError) return <div className="min-h-screen flex items-center justify-center bg-primary-50 text-red-600">Lỗi: {(error as any)?.response?.data?.message || (error as Error).message}</div>;
  if (!room) return <div className="min-h-screen flex items-center justify-center bg-brand-dark text-white">Không tìm thấy phòng trọ này.</div>;

  return (
    <div className="min-h-screen bg-primary-50 font-sans pb-12">
      
      {/* 1. HEADER & BREADCRUMB */}
      <div className="bg-white/95 border-b border-brand-light/30 sticky top-0 z-40 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-brand-main mb-2 transition-colors text-sm font-medium">
                <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách
            </button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-extrabold text-brand-main leading-tight tracking-tight line-clamp-1" title={room.title}>{room.title}</h1>
                    <div className="flex items-center text-gray-600 mt-2 text-sm md:text-base">
                        <MapPin className="w-4 h-4 mr-1.5 text-brand-accent flex-shrink-0" />
                        <span className="font-medium truncate max-w-md">{room.address}, {room.district}, {room.city}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-brand-light/20 hover:text-brand-main hover:border-brand-main transition-all duration-300">
                        <Heart className="w-5 h-5" /> <span className="hidden sm:inline font-medium">Lưu tin</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-brand-light/20 hover:text-brand-main hover:border-brand-main transition-all duration-300">
                        <Share2 className="w-5 h-5" /> <span className="hidden sm:inline font-medium">Chia sẻ</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* 2. IMAGE GALLERY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[350px] md:h-[480px] mb-8 rounded-2xl overflow-hidden shadow-sm border border-brand-light/30">
            {/* Ảnh chính lớn */}
            <div className="md:col-span-3 h-full relative group cursor-pointer" onClick={() => mainImage && window.open(mainImage, '_blank')}>
                <img 
                    src={mainImage || ''} 
                    alt="Main view" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-brand-main/0 group-hover:bg-brand-main/10 transition-colors duration-300"></div>
            </div>
            {/* Cột ảnh nhỏ bên phải */}
            <div className="hidden md:flex flex-col gap-3 h-full">
                {room.images.slice(0, 2).map((img, idx) => (
                    <div key={idx} className="flex-1 relative group cursor-pointer overflow-hidden" onClick={() => setMainImage(img)}>
                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        {/* Viền active dùng màu brand-accent (Vàng cam) */}
                        <div className={`absolute inset-0 transition-all duration-300 ${mainImage === img ? 'ring-4 ring-inset ring-brand-accent/80' : 'bg-black/10 group-hover:bg-transparent'}`}></div>
                    </div>
                ))}
                {room.images.length > 2 && (
                    <div className="flex-1 relative group cursor-pointer bg-brand-light flex items-center justify-center overflow-hidden">
                        <img src={room.images[2]} alt="More" className="w-full h-full object-cover opacity-60 blur-[2px] group-hover:blur-0 group-hover:opacity-80 transition-all duration-300" />
                         <div className="absolute inset-0 flex items-center justify-center bg-brand-main/40 group-hover:bg-brand-main/30">
                            <span className="text-white font-bold text-lg flex items-center">
                              <Maximize className="w-5 h-5 mr-2" />
                              +{room.images.length - 2} ảnh
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 3. LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Tổng quan */}
            <div className={CARD_CLASS}>
                <div className="p-6 md:p-8">
                    <h2 className={HEADING_CLASS}>Tổng quan</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex flex-col items-center text-center p-4 bg-primary-50 rounded-2xl border border-gray-100 hover:border-brand-light transition-colors">
                            <div className="p-3 bg-brand-light/20 rounded-full text-brand-main mb-3">
                              <DollarSign className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Giá thuê</p>
                            {/* Dùng màu Brand Accent (Vàng) cho giá để nổi bật */}
                            <p className="text-lg font-bold text-brand-accent mt-1">{formatPrice(room.price)}</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 bg-primary-50 rounded-2xl border border-gray-100 hover:border-brand-light transition-colors">
                            <div className="p-3 bg-brand-light/20 rounded-full text-brand-main mb-3">
                              <Maximize className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Diện tích</p>
                            <p className="text-lg font-bold text-brand-dark mt-1">{room.area} m²</p>
                        </div>
                         <div className="flex flex-col items-center text-center p-4 bg-primary-50 rounded-2xl border border-gray-100 hover:border-brand-light transition-colors">
                            <div className="p-3 bg-brand-light/20 rounded-full text-brand-main mb-3">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Trạng thái</p>
                            <p className="text-lg font-bold text-green-600 mt-1">Sẵn sàng</p>
                        </div>
                         <div className="flex flex-col items-center text-center p-4 bg-primary-50 rounded-2xl border border-gray-100 hover:border-brand-light transition-colors">
                            <div className="p-3 bg-brand-light/20 rounded-full text-brand-main mb-3">
                              <Clock className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Cập nhật</p>
                            <p className="text-lg font-bold text-brand-dark mt-1">Mới đây</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mô tả */}
            <div className={CARD_CLASS}>
                <div className="p-6 md:p-8">
                    <h2 className={HEADING_CLASS}>Mô tả chi tiết</h2>
                    <div className="prose prose-slate max-w-none text-gray-700 leading-loose whitespace-pre-line font-medium">
                        {room.description}
                    </div>
                </div>
            </div>

            {/* Tiện nghi */}
            <div className={CARD_CLASS}>
                <div className="p-6 md:p-8">
                    <h2 className={HEADING_CLASS}>Tiện nghi có sẵn</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                        {room.amenities.length > 0 ? room.amenities.map((amenity, idx) => (
                            <div key={idx} className="flex items-center p-3.5 rounded-xl bg-primary-50 border border-gray-100 group hover:bg-brand-light/20 hover:border-brand-light transition-all">
                                <CheckCircle2 className="w-5 h-5 text-brand-accent mr-3 flex-shrink-0" />
                                <span className="text-gray-700 font-medium group-hover:text-brand-main">{amenity}</span>
                            </div>
                        )) : (
                            <p className="text-gray-500 italic">Chưa cập nhật tiện nghi.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bản đồ */}
            <div className={CARD_CLASS}>
                <div className="p-6 md:p-8">
                    <h2 className={HEADING_CLASS}>Vị trí & Tiện ích xung quanh</h2>
                    <div className="h-[400px] rounded-xl overflow-hidden border border-brand-light/30 shadow-inner z-0 relative mb-6">
                        <MapContainer center={mapPosition} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapUpdater center={mapPosition} />
                            <Marker position={mapPosition}>
                                <Popup>{room.address}</Popup>
                            </Marker>
                        </MapContainer>
                    </div>

                    {nearbyUniversities.length > 0 && (
                        <div className="bg-brand-light/10 p-5 rounded-2xl border border-brand-light/20">
                            <h3 className="font-bold text-brand-main mb-4 flex items-center">
                                <School className="w-5 h-5 mr-2 text-brand-accent" /> Các trường đại học lân cận
                            </h3>
                            <div className="space-y-3">
                                {nearbyUniversities.map((uni, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <span className="text-gray-700 font-medium">{uni.name}</span>
                                        <span className="text-brand-main font-bold bg-brand-light/20 px-3 py-1 rounded-full text-xs border border-brand-light/30">
                                            {uni.distance.toFixed(1)} km
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* 4. RIGHT SIDEBAR (STICKY) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
                
                {/* Contact Card */}
                <div className={`${CARD_CLASS} ring-1 ring-brand-main/5 shadow-lg shadow-brand-main/5`}>
                    <div className="p-6">
                        <div className="mb-6 pb-6 border-b border-gray-100">
                            <p className="text-sm text-gray-500 mb-1 font-medium">Giá thuê phòng</p>
                            <div className="flex items-baseline text-brand-accent">
                                <span className="text-3xl font-extrabold tracking-tight">{formatPrice(room.price)}</span>
                                <span className="text-gray-400 ml-1 font-medium text-sm">/ tháng</span>
                            </div>
                        </div>

                        {landlord ? (
                            <>
                                <div className="flex items-center mb-6">
                                    <div className="relative">
                                        <img 
                                            src={landlord.avatar || `https://ui-avatars.com/api/?name=${landlord.name}&background=random`} 
                                            alt={landlord.name}
                                            className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-brand-light"
                                        />
                                        <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-bold text-brand-dark text-lg flex items-center gap-1">
                                            {landlord.name}
                                            <Star className="w-4 h-4 text-brand-accent fill-brand-accent" />
                                        </p>
                                        <p className="text-xs text-brand-dark/80 font-bold bg-brand-soft px-2.5 py-1 rounded-full inline-block mt-1">
                                            Chủ nhà uy tín
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* Nút Gọi Điện */}
                                    {showPhone ? (
                                        <div className="w-full py-3.5 px-4 bg-primary-50 rounded-xl flex items-center justify-between border border-gray-200 animate-fade-in-up">
                                            <div className="flex items-center">
                                                <Phone className="w-5 h-5 text-gray-500 mr-2" />
                                                <a href={`tel:${landlord.phone}`} className="font-bold text-brand-dark text-lg hover:text-brand-main transition-colors">{landlord.phone}</a>
                                            </div>
                                            <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-100">Đã hiện số</span>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setShowPhone(true)}
                                            className="w-full py-3.5 px-4 bg-white border-2 border-brand-main text-brand-main hover:bg-brand-light/10 font-bold rounded-xl transition-all duration-300 flex justify-center items-center gap-2 transform active:scale-95 group shadow-sm"
                                        >
                                            <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            <span>Hiện số điện thoại</span>
                                        </button>
                                    )}

                                    {/* Nút Nhắn Tin (Màu Brand Main - Tin cậy) */}
                                    <button 
                                        onClick={() => handleStartChat(landlord._id)}
                                        disabled={isStartingChat || (currentUser?._id === landlord._id)}
                                        className="w-full py-3.5 px-4 bg-brand-main hover:bg-brand-dark text-white font-bold rounded-xl shadow-lg shadow-brand-main/20 transition-all duration-300 flex justify-center items-center gap-2 transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
                                    >
                                        <MessageCircle className="w-5 h-5 group-hover:animate-pulse" />
                                        <span>{isStartingChat ? 'Đang kết nối...' : 'Nhắn tin ngay'}</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                             <div className="text-center py-6 text-gray-500 bg-primary-50 rounded-xl border border-dashed border-gray-300">
                                <UserIcon className="w-10 h-10 mx-auto mb-2 opacity-30 text-brand-dark" />
                                <p className="font-medium">Chưa có thông tin liên hệ</p>
                             </div>
                        )}
                    </div>
                </div>
                
                {/* Safety Tips (Sử dụng màu Brand Soft - Vàng Nhạt cho cảnh báo) */}
                <div className="bg-brand-soft/20 rounded-2xl p-5 border border-brand-accent/20 backdrop-blur-sm">
                    <h4 className="font-bold text-brand-dark flex items-center mb-2">
                        <AlertTriangle className="w-5 h-5 mr-2 text-brand-accent" /> Lưu ý an toàn
                    </h4>
                    <p className="text-sm text-brand-dark/80 leading-relaxed font-medium">
                        Không đặt cọc nếu chưa xem phòng trực tiếp. Hãy báo cáo nếu thấy tin đăng có dấu hiệu lừa đảo để bảo vệ cộng đồng.
                    </p>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Room;