import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// Import API
import { roomAPI } from '../services/api'; 

// Import Icons
import { 
  MagnifyingGlassIcon, 
  MapIcon, 
  ChatBubbleOvalLeftEllipsisIcon 
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['rooms', 'featured'],
    queryFn: () => roomAPI.getRooms({ isAvailable: true, limit: 6 }),
  });

  const featuredRooms = roomsData?.data.data || [];

  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  // Helper format giá
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div>
      
      {/* ================================================================== */}
      {/* === HERO SECTION === */}
      {/* ================================================================== */}
      <section 
        className="relative w-full h-screen min-h-[500px] bg-cover bg-center" 
        style={{ backgroundImage: "url('/hero2.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white p-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center drop-shadow-lg">
            Find Your Best Property
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-center text-gray-200 drop-shadow-md">
            Hệ thống tìm kiếm phòng trọ uy tín tại Đà Nẵng
          </p>

          <Link 
            to="/tim-phong" 
            className="btn-primary px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            Khám phá ngay
          </Link>
        </div>
      </section>

      {/* ================================================================== */}
      {/* === PHÒNG TRỌ NỔI BẬT === */}
      {/* ================================================================== */}
      <motion.section 
        className="py-24 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 items-center">
            <div>
              <span className="text-primary-600 font-semibold mb-2 block uppercase">TỔNG HỢP</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
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
                <div key={index} className="bg-white rounded-lg shadow-lg p-4 animate-pulse">
                  <div className="bg-gray-300 h-56 rounded-lg mb-4"></div>
                  <div className="bg-gray-300 h-4 rounded w-1/2 mb-3"></div>
                  <div className="bg-gray-300 h-5 rounded w-3/4 mb-4"></div>
                </div>
              ))}
            </div>
          ) : featuredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRooms.map((room: any) => (
                <div 
                  key={room._id} 
                  className="bg-white rounded-lg shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full"
                >
                  {/* === 1. CLICK VÀO ẢNH ĐỂ XEM CHI TIẾT (ĐÃ SỬA) === */}
                  {/* Đổi từ /rooms/ thành /room/ */}
                  <Link to={`/room/${room._id}`} className="relative h-56 bg-gray-200 overflow-hidden block">
                    <img
                      src={room.images?.[0] || 'https://placehold.co/600x400?text=No+Image'}
                      alt={room.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Error')}
                    />
                    
                    <div className="absolute top-4 left-4 flex flex-col space-y-2">
                      <span className="bg-brand-main text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                        Mới đăng
                      </span>
                      {room.price < 2000000 && (
                        <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                          Giá tốt
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <p className="text-gray-500 text-sm mb-2 flex items-center">
                       <MapIcon className="w-4 h-4 mr-1" />
                       {room.district}, {room.city}
                    </p>
                    
                    {/* === 2. CLICK VÀO TIÊU ĐỀ (ĐÃ SỬA) === */}
                    <h3 className="font-semibold text-lg text-gray-900 mb-3 line-clamp-2">
                      {/* Đổi từ /rooms/ thành /room/ */}
                      <Link to={`/room/${room._id}`} className="hover:text-brand-main transition-colors">
                        {room.title}
                      </Link>
                    </h3>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xl text-brand-main font-bold">
                        {formatPrice(room.price)}
                        <span className="text-sm font-normal text-gray-500"> /tháng</span>
                      </span>
                      <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded">
                        {room.area}m²
                      </span>
                    </div>

                    {/* === 3. NÚT XEM CHI TIẾT (ĐÃ SỬA) === */}
                    {/* Đổi từ /rooms/ thành /room/ */}
                    <Link
                      to={`/room/${room._id}`}
                      className="btn-primary w-full text-center mt-4 py-2"
                    >
                      Xem chi tiết
                    </Link>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Hiện chưa có phòng trọ nào được đăng.
            </div>
          )}

          <div className="text-center mt-16">
            <Link
              to="/tim-phong"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-brand-main bg-brand-light hover:bg-brand-accent/20 md:text-lg transition-colors"
            >
              Xem tất cả phòng trọ
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ================================================================== */}
      {/* === SECTION "TẠI SAO CHỌN" === */}
      {/* ================================================================== */}
      <motion.section 
        className="py-24 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tại sao chọn StudentHousing?
            </h2>
            <p className="text-gray-600 md:text-lg">
              Hệ thống tìm phòng trọ hiện đại và tiện lợi dành cho sinh viên
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Item 1 */}
            <div className="relative p-8 bg-white rounded-xl shadow-lg border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="absolute top-0 left-0 -mt-4 ml-4">
                <span className="text-6xl font-bold text-gray-100 opacity-80">01</span>
              </div>
              <div className="relative z-10 text-center">
                <div className="mb-4 inline-block p-3 bg-blue-50 rounded-full">
                  <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Tìm kiếm thông minh</h3>
                <p className="text-gray-600">
                  Công cụ lọc mạnh mẽ giúp bạn tìm phòng theo giá, vị trí và tiện nghi mong muốn chỉ trong vài giây.
                </p>
              </div>
            </div>
            
            {/* Item 2 */}
            <div className="relative p-8 bg-white rounded-xl shadow-lg border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="absolute top-0 left-0 -mt-4 ml-4">
                <span className="text-6xl font-bold text-gray-100 opacity-80">02</span>
              </div>
              <div className="relative z-10 text-center">
                <div className="mb-4 inline-block p-3 bg-green-50 rounded-full">
                  <MapIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Bản đồ trực quan</h3>
                <p className="text-gray-600">
                  Xem vị trí phòng trọ trực quan trên bản đồ, tính khoảng cách đến trường học dễ dàng.
                </p>
              </div>
            </div>
            
            {/* Item 3 */}
            <div className="relative p-8 bg-white rounded-xl shadow-lg border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="absolute top-0 left-0 -mt-4 ml-4">
                <span className="text-6xl font-bold text-gray-100 opacity-80">03</span>
              </div>
              <div className="relative z-10 text-center">
                <div className="mb-4 inline-block p-3 bg-purple-50 rounded-full">
                  <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Kết nối cộng đồng</h3>
                <p className="text-gray-600">
                  Tham gia diễn đàn, đọc review chân thực và kết nối trực tiếp với chủ trọ uy tín.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
      
    </div>
  );
};

export default Home;