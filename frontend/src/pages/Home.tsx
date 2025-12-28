import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// Import API
import { roomAPI } from '../services/api'; 

// Import Icons
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  HomeModernIcon
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  // Lấy dữ liệu phòng
  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['rooms', 'featured'],
    queryFn: () => roomAPI.getRooms({ isAvailable: true, limit: 6 }),
  });

  const featuredRooms = roomsData?.data.data || [];

  // Xử lý tìm kiếm
  const handleSearch = () => {
    if (keyword.trim()) {
      navigate(`/tim-phong?search=${encodeURIComponent(keyword)}`);
    }
  };

  const handleQuickTagClick = (tag: string) => {
    navigate(`/tim-phong?search=${encodeURIComponent(tag)}`);
  };

  // Helper format giá
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="font-sans text-brand-dark bg-white">
      
      {/* ================================================================== */}
      {/* === HERO SECTION === */}
      {/* ================================================================== */}
      <section className="relative w-full h-[90vh] min-h-[600px] flex flex-col items-center pt-40 overflow-hidden bg-brand-main">
        {/* GIỮ NGUYÊN PHẦN ẢNH NHƯ YÊU CẦU */}
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('/hero2.jpg')", filter: "brightness(0.85)" }}
        />
        {/* Gradient Overlay: Brand Main đậm dần xuống dưới */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/40 via-transparent to-brand-main/90" />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge: Dùng Brand Accent (Vàng) làm điểm nhấn */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6 shadow-lg">
              <SparklesIcon className="w-4 h-4 text-brand-accent animate-pulse" />
              <span>Trải nghiệm tìm trọ kiểu mới</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-xl">
              Nơi tốt nhất để <br className="hidden md:block" />
              {/* Gradient Text: Brand Light -> Brand Soft (Xanh nhạt -> Vàng nhạt) */}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light via-white to-brand-soft">
                bắt đầu cuộc sống sinh viên
              </span>
            </h1>
            
            {/* Search Gateway */}
            <div className="bg-white/95 backdrop-blur-xl p-3 rounded-3xl shadow-2xl shadow-brand-dark/20 max-w-3xl mx-auto mt-24 transform transition-transform hover:scale-[1.01] duration-300">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="flex-1 w-full relative group">
                  <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-brand-main transition-colors" />
                  <input 
                    type="text"
                    placeholder="Nhập khu vực, tên trường hoặc đường..."
                    className="w-full pl-12 pr-4 py-4 bg-primary-50 rounded-2xl outline-none text-brand-dark placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-main/20 transition-all font-medium"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                
                {/* Search Button: Brand Accent (Vàng) */}
                <button 
                  onClick={handleSearch}
                  className="w-full md:w-auto px-10 py-4 bg-brand-accent hover:bg-yellow-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-accent/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <MagnifyingGlassIcon className="w-5 h-5 stroke-2" />
                  <span>Tìm ngay</span>
                </button>
              </div>
            </div>

            {/* Quick Tags */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="text-white/80 text-sm font-medium py-1">Xu hướng:</span>
              {['Hải Châu', 'Gần ĐH Bách Khoa', 'Sơn Trà', 'Căn hộ mini'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleQuickTagClick(tag)}
                  className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm hover:bg-brand-light hover:text-brand-dark transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* === FEATURED ROOMS === */}
      {/* ================================================================== */}
      <section className="py-24 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 items-center">
            <div>
              <span className="text-brand-main font-bold mb-2 block uppercase tracking-wider text-sm">TỔNG HỢP</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-brand-dark">
                Phòng trọ nổi bật
              </h2>
            </div>
            <p className="text-gray-600 md:text-lg">
              Những phòng trọ được đánh giá cao bởi sinh viên, cập nhật liên tục với mức giá tốt nhất thị trường.
            </p>
          </div>

          {isLoading ? (
            // Skeleton Loading
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-4 animate-pulse border border-brand-light/20">
                  <div className="bg-gray-200 h-56 rounded-xl mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2 mb-3"></div>
                  <div className="bg-gray-200 h-5 rounded w-3/4 mb-4"></div>
                </div>
              ))}
            </div>
          ) : featuredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRooms.map((room: any) => (
                // === CLASSIC CARD DESIGN ===
                <div 
                  key={room._id} 
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-brand-main/10 overflow-hidden group transition-all duration-300 flex flex-col h-full border border-brand-light/20"
                >
                  {/* Image Section */}
                  <Link to={`/room/${room._id}`} className="relative h-64 bg-gray-200 overflow-hidden block">
                    <img
                      src={room.images?.[0] || 'https://placehold.co/600x400?text=No+Image'}
                      alt={room.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    <div className="absolute top-4 left-4">
                      {/* Badge Mới: Brand Accent */}
                      <span className="bg-brand-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-md border border-white/20">
                        Mới đăng
                      </span>
                    </div>
                  </Link>
                  
                  {/* Content Section */}
                  <div className="p-6 flex flex-col flex-grow">
                    <p className="text-brand-main/70 text-xs font-bold mb-2 flex items-center uppercase tracking-wide">
                       <MapPinIcon className="w-3.5 h-3.5 mr-1 text-brand-accent" />
                       {room.district}, {room.city}
                    </p>
                    
                    <h3 className="font-bold text-lg text-brand-dark mb-3 line-clamp-2 leading-snug">
                      <Link to={`/room/${room._id}`} className="hover:text-brand-main transition-colors">
                        {room.title}
                      </Link>
                    </h3>
                    
                    {/* Price and Area Row */}
                    <div className="mt-auto pt-4 flex justify-between items-center mb-5 border-t border-dashed border-gray-100">
                      <span className="text-xl text-brand-main font-extrabold">
                        {formatPrice(room.price)}
                        <span className="text-sm font-medium text-gray-400"> /tháng</span>
                      </span>
                      <span className="text-brand-dark text-sm font-bold bg-brand-soft/30 px-2.5 py-1 rounded-lg border border-brand-soft/50">
                        {room.area}m²
                      </span>
                    </div>

                    {/* Button "Xem chi tiết": Brand Main */}
                    <Link
                      to={`/room/${room._id}`}
                      className="block w-full py-3 text-center text-white bg-brand-main hover:bg-brand-dark rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-main/20 hover:shadow-brand-main/40"
                    >
                      Xem chi tiết
                    </Link>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Hiện chưa có phòng trọ nào.
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/tim-phong"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-brand-main text-base font-bold rounded-full text-brand-main hover:bg-brand-light/10 md:text-lg transition-colors"
            >
              Xem tất cả phòng trọ
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* === BENTO GRID === */}
      {/* ================================================================== */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-extrabold text-brand-dark mb-6 leading-tight">
                Tại sao chọn <br/>
                <span className="text-brand-main">StudentHousing?</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed font-medium">
                Hệ thống tìm phòng trọ hiện đại, tiện lợi và an toàn nhất dành cho sinh viên.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: ShieldCheckIcon, title: 'Thông tin xác thực', desc: 'Mọi phòng trọ đều được kiểm duyệt kỹ càng.' },
                  { icon: HomeModernIcon, title: 'Tiện nghi đầy đủ', desc: 'Bộ lọc thông minh giúp tìm phòng như ý.' },
                  { icon: UserGroupIcon, title: 'Cộng đồng văn minh', desc: 'Kết nối sinh viên, review chân thực.' }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-2xl hover:bg-primary-50 transition-colors border border-transparent hover:border-brand-light/20">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-brand-light/20 flex items-center justify-center">
                      <item.icon className="w-7 h-7 text-brand-main" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-brand-dark">{item.title}</h4>
                      <p className="text-gray-500 mt-1 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
               <div className="absolute -inset-4 bg-gradient-to-r from-brand-light/30 to-brand-soft/30 rounded-full opacity-50 blur-3xl z-0" />
               <div className="relative z-10 grid grid-cols-2 gap-4">
                 <img src="https://images.unsplash.com/photo-1522771753024-5145a8752948?auto=format&fit=crop&w=600&q=80" alt="Room 1" className="rounded-2xl shadow-2xl shadow-brand-main/20 w-full h-64 object-cover mt-12 transform hover:-translate-y-2 transition-transform duration-500" />
                 <img src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80" alt="Room 2" className="rounded-2xl shadow-2xl shadow-brand-dark/20 w-full h-64 object-cover transform hover:translate-y-2 transition-transform duration-500" />
               </div>
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;