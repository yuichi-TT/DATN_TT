import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Room } from '../types'; 
// Import Icons từ lucide-react để đồng bộ với các file khác (hoặc giữ Heroicons nếu bạn muốn)
// Ở đây tôi giữ Heroicons như code gốc của bạn để tránh lỗi import
import { MapPinIcon, HomeModernIcon, AcademicCapIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

// --- 1. DANH SÁCH TRƯỜNG ĐẠI HỌC ---
const UNIVERSITIES_DN = [
  { name: "Bách Khoa", lat: 16.0738, lng: 108.1499 },
  { name: "Kinh Tế", lat: 16.0516, lng: 108.2436 },
  { name: "Sư Phạm", lat: 16.0771, lng: 108.1553 },
  { name: "Ngoại Ngữ", lat: 16.0567, lng: 108.2135 },
  { name: "Duy Tân", lat: 16.0607, lng: 108.2236 },
  { name: "Kiến Trúc", lat: 16.0611, lng: 108.2224 },
  { name: "Đông Á", lat: 16.0333, lng: 108.2216 },
  { name: "FPT", lat: 15.9689, lng: 108.2607 },
  { name: "Cao Thắng", lat: 16.0765, lng: 108.2127 },
  { name: "VKU", lat: 15.9751, lng: 108.2532 },
];

// --- 2. HOTSPOTS ---
const DISTRICT_HOTSPOTS: Record<string, [number, number][]> = {
  "Hải Châu": [[108.2236, 16.0607], [108.2224, 16.0611], [108.2135, 16.0567], [108.2216, 16.0333]],
  "Liên Chiểu": [[108.1499, 16.0738], [108.1553, 16.0771]],
  "Ngũ Hành Sơn": [[108.2436, 16.0516], [108.2607, 15.9689], [108.2532, 15.9751]],
  "Thanh Khê": [[108.1900, 16.0550], [108.1800, 16.0600]],
  "Sơn Trà": [[108.2400, 16.0700]],
  "Cẩm Lệ": [[108.2000, 16.0200]],
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

interface RoomCardProps {
  room: Room;
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  
  // === LOGIC TÌM TỌA ĐỘ ===
  const [lng, lat] = useMemo(() => {
    if (room.coordinates?.coordinates) return room.coordinates.coordinates;
    const hotspots = DISTRICT_HOTSPOTS[room.district] || DISTRICT_HOTSPOTS["Hải Châu"];
    const seed = parseInt(room._id.slice(-4), 16) || 9999;
    const selectedHotspot = hotspots[seed % hotspots.length];
    const offsetLat = (seed % 40) / 1000 - 0.02; 
    const offsetLng = (seed % 40) / 1000 - 0.02;
    return [selectedHotspot[0] + offsetLng, selectedHotspot[1] + offsetLat];
  }, [room]);

  // Tính khoảng cách
  const nearestUniversity = useMemo(() => {
    let minDistance = Infinity;
    let nearestName = "";
    UNIVERSITIES_DN.forEach(uni => {
      const dist = calculateDistance(lat, lng, uni.lat, uni.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestName = uni.name;
      }
    });
    return { name: nearestName, distance: minDistance.toFixed(1) };
  }, [lat, lng]);

  return (
    <Link 
      to={`/room/${room._id}`} 
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-brand-main/10 overflow-hidden hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border border-brand-light/20"
    >
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden bg-brand-light/10">
        <img 
          src={room.images?.[0] || 'https://placehold.co/600x400?text=No+Image'} 
          alt={room.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Error'; }}
        />
        
        {/* Overlay gradient nhẹ để text dễ đọc nếu cần */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>

        <div className="absolute top-3 left-3 flex flex-col gap-2">
           {room.price < 2500000 && (
             <span className="bg-brand-accent text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wide border border-white/20">
               Giá tốt
             </span>
           )}
        </div>

        <div className="absolute bottom-3 left-3 right-3">
           <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg flex justify-between items-center border border-white/50">
              {/* Giá tiền: Màu Brand Main (Xanh đậm) */}
              <span className="text-brand-main font-extrabold text-lg">
                {formatPrice(room.price)}
              </span>
              {/* Trạng thái */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${room.isAvailable ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-500 border-gray-200 bg-gray-50'}`}>
                {room.isAvailable ? 'CÒN TRỐNG' : 'ĐÃ THUÊ'}
              </span>
           </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center text-brand-main/70 text-xs mb-2 font-semibold uppercase tracking-wider">
          <MapPinIcon className="w-3.5 h-3.5 mr-1 text-brand-accent" />
          <span className="line-clamp-1">{room.district}, {room.city}</span>
        </div>

        <h3 className="text-lg font-bold text-brand-dark line-clamp-2 mb-3 group-hover:text-brand-main transition-colors leading-tight h-[3.5rem]" title={room.title}>
          {room.title}
        </h3>

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5 bg-brand-light/20 px-2.5 py-1 rounded-lg text-brand-dark font-medium border border-brand-light/30">
            <HomeModernIcon className="w-4 h-4 text-brand-main" />
            <span>{room.area} m²</span>
          </div>
        </div>

        {/* --- KHOẢNG CÁCH --- */}
        {nearestUniversity && (
          <div className="mt-auto mb-4">
            <div className="flex items-center gap-2 text-xs text-brand-dark bg-brand-soft/30 p-2.5 rounded-lg border border-brand-soft/50">
              <AcademicCapIcon className="w-5 h-5 flex-shrink-0 text-brand-main" />
              <span className="truncate font-medium">
                Gần <span className="font-bold text-brand-main">ĐH {nearestUniversity.name}</span>
              </span>
              <span className="ml-auto font-bold text-brand-accent bg-white px-2 py-0.5 rounded shadow-sm border border-brand-light/20">
                {nearestUniversity.distance} km
              </span>
            </div>
          </div>
        )}

        {/* --- NÚT XEM CHI TIẾT (Đã thêm mới & đổi màu) --- */}
        <div className="mt-2">
            <button className="w-full py-2.5 rounded-xl bg-brand-main text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 group-hover:bg-brand-accent shadow-md shadow-brand-main/20 group-hover:shadow-brand-accent/30">
                Xem chi tiết <ArrowRightIcon className="w-4 h-4" />
            </button>
        </div>

      </div>
    </Link>
  );
};

export default RoomCard;