import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Room } from '../types'; 
import { MapPinIcon, HomeModernIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

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

// --- 2. ĐỊNH NGHĨA CÁC ĐIỂM NÓNG (HOTSPOTS) THEO QUẬN ---
// Mỗi quận sẽ có danh sách các tọa độ trung tâm [lng, lat] để fake dữ liệu đa dạng hơn
const DISTRICT_HOTSPOTS: Record<string, [number, number][]> = {
  "Hải Châu": [
    [108.2236, 16.0607], // Gần ĐH Duy Tân
    [108.2224, 16.0611], // Gần ĐH Kiến Trúc
    [108.2135, 16.0567], // Gần ĐH Ngoại Ngữ
    [108.2216, 16.0333], // Gần ĐH Đông Á
  ],
  "Liên Chiểu": [
    [108.1499, 16.0738], // Gần ĐH Bách Khoa
    [108.1553, 16.0771], // Gần ĐH Sư Phạm
  ],
  "Ngũ Hành Sơn": [
    [108.2436, 16.0516], // Gần ĐH Kinh Tế
    [108.2607, 15.9689], // Gần ĐH FPT
    [108.2532, 15.9751], // Gần VKU
  ],
  "Thanh Khê": [
    [108.1900, 16.0550], // Khu vực Điện Biên Phủ
    [108.1800, 16.0600], // Khu vực Hà Huy Tập
  ],
  "Sơn Trà": [
    [108.2400, 16.0700], // Khu vực Phạm Văn Đồng
  ],
  "Cẩm Lệ": [
    [108.2000, 16.0200], // Khu vực Hòa Xuân
  ],
};

// Hàm tính khoảng cách Haversine (km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
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
  
  // === LOGIC TÌM TỌA ĐỘ THÔNG MINH (NÂNG CẤP) ===
  const [lng, lat] = useMemo(() => {
    // 1. Ưu tiên tọa độ thật từ DB
    if (room.coordinates?.coordinates) {
      return room.coordinates.coordinates;
    }
    
    // 2. Nếu không có, lấy danh sách các điểm nóng của Quận đó
    const hotspots = DISTRICT_HOTSPOTS[room.district] || DISTRICT_HOTSPOTS["Hải Châu"];
    
    // 3. Dùng ID phòng để chọn cố định 1 điểm nóng trong danh sách
    const seed = parseInt(room._id.slice(-4), 16) || 9999;
    const selectedHotspot = hotspots[seed % hotspots.length]; // Chọn điểm nóng
    
    // 4. Thêm độ lệch ngẫu nhiên LỚN HƠN (bán kính ~2-3km)
    // 0.02 độ ~ 2.2km. Công thức này tạo độ lệch từ -0.02 đến +0.02
    const offsetLat = (seed % 40) / 1000 - 0.02; 
    const offsetLng = (seed % 40) / 1000 - 0.02;

    return [selectedHotspot[0] + offsetLng, selectedHotspot[1] + offsetLat];
  }, [room]);

  // Tính khoảng cách tới trường gần nhất
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
      className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border border-brand-accent/20"
    >
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden bg-gray-200">
        <img 
          src={room.images?.[0] || 'https://placehold.co/600x400?text=No+Image'} 
          alt={room.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Error'; }}
        />
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
           {room.price < 2500000 && (
             <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wide">
               Giá tốt
             </span>
           )}
        </div>

        <div className="absolute bottom-3 left-3 right-3">
           <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-lg flex justify-between items-center border border-brand-accent/20">
              <span className="text-brand-main font-extrabold text-lg">
                {formatPrice(room.price)}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${room.isAvailable ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-500 border-gray-200 bg-gray-50'}`}>
                {room.isAvailable ? 'CÒN TRỐNG' : 'ĐÃ THUÊ'}
              </span>
           </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center text-gray-500 text-xs mb-2">
          <MapPinIcon className="w-3.5 h-3.5 mr-1 text-brand-accent" />
          <span className="line-clamp-1 font-medium uppercase tracking-wide">{room.district}, {room.city}</span>
        </div>

        <h3 className="text-lg font-bold text-brand-dark line-clamp-2 mb-3 group-hover:text-brand-main transition-colors leading-tight h-[3.5rem]">
          {room.title}
        </h3>

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5 bg-brand-light/30 px-2 py-1 rounded text-brand-dark font-medium border border-brand-accent/10">
            <HomeModernIcon className="w-4 h-4 text-brand-accent" />
            <span>{room.area} m²</span>
          </div>
        </div>

        {/* --- HIỂN THỊ KHOẢNG CÁCH --- */}
        {nearestUniversity && (
          <div className="mt-auto pt-3 border-t border-brand-accent/10">
            <div className="flex items-center gap-2 text-xs text-brand-main bg-brand-light/50 p-2.5 rounded-lg border border-brand-accent/10">
              <AcademicCapIcon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate font-medium">
                Gần <span className="font-bold">ĐH {nearestUniversity.name}</span>
              </span>
              <span className="ml-auto font-bold text-brand-dark bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
                {nearestUniversity.distance} km
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default RoomCard;