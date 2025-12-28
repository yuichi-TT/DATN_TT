import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { roomAPI } from '../services/api';
import type { SearchFilters, Room as RoomType } from '../types'; 

// Import Component
import RoomCard from '../components/RoomCard'; 
// Import Icons
import { Search, MapPin, DollarSign, Maximize2, Filter, Home } from 'lucide-react';

// --- STYLES CONSTANTS ---

// 1. HERO SECTION: 
// Sử dụng bg-brand-main (Japanese Indigo) làm nền chủ đạo
const HERO_SECTION_CLASS = "relative w-full pt-32 pb-48 bg-brand-main text-white overflow-hidden";
const HERO_BG_IMAGE = "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"; 

// 2. SEARCH CONTAINER
const SEARCH_CONTAINER_CLASS = "relative z-20 w-full max-w-6xl mx-auto -mt-24 px-4 sm:px-6 lg:px-8";
const SEARCH_BOX_CLASS = "bg-white p-6 rounded-2xl shadow-2xl shadow-brand-main/10 border border-brand-light/20 grid grid-cols-1 md:grid-cols-4 gap-4 items-end";

// 3. INPUT/SELECT STYLES
const INPUT_GROUP_CLASS = "space-y-1.5";
const LABEL_CLASS = "flex items-center text-sm font-semibold text-brand-main gap-2"; 
const SELECT_WRAPPER_CLASS = "relative";

// Focus ring dùng brand-main, Border hover dùng brand-main
const SELECT_CLASS = "w-full appearance-none pl-10 pr-4 py-3.5 bg-brand-light/10 border border-brand-light/30 rounded-xl text-brand-dark font-medium focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none transition-all cursor-pointer hover:bg-white hover:border-brand-main/50";

// 4. BUTTON STYLE: 
// Gradient từ Brand Accent (Gamboge) sang Brand Soft (Flax) tạo hiệu ứng vàng sang trọng
const SEARCH_BUTTON_CLASS = "w-full h-[52px] bg-gradient-to-r from-brand-accent to-brand-soft hover:from-brand-soft hover:to-brand-accent text-brand-dark font-bold text-lg rounded-xl shadow-lg shadow-brand-accent/30 hover:shadow-brand-accent/50 transition-all flex items-center justify-center space-x-2 transform active:scale-95";

const RoomList: React.FC = () => {
  
  const [filters, setFilters] = useState<SearchFilters>({
    district: undefined,
    priceMin: undefined,
    priceMax: undefined,
    areaMin: undefined,
    areaMax: undefined,
  });

  const [currentPage, setCurrentPage] = useState(1);

  const getQueryParams = () => {
    const params: SearchFilters = { 
      isAvailable: true, 
      page: currentPage, 
      limit: 12,
      ...filters 
    };
    
    Object.keys(params).forEach(key => {
      const k = key as keyof SearchFilters;
      if (params[k] === undefined || params[k] === '') {
        delete params[k];
      }
    });
    return params;
  };

  const { data: roomsData, isLoading, refetch } = useQuery({
    queryKey: ['rooms', 'search', filters, currentPage],
    queryFn: () => roomAPI.getRooms(getQueryParams()),
  });

  const rooms: RoomType[] = roomsData?.data.data || [];
  const pagination = roomsData?.data.pagination;

  // --- HANDLERS ---
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, district: e.target.value || undefined }));
    setCurrentPage(1);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    let priceMin: number | undefined = undefined;
    let priceMax: number | undefined = undefined;
    if (value) {
      [priceMin, priceMax] = value.split('-').map(Number) as [number, number];
    }
    setFilters(prev => ({ ...prev, priceMin, priceMax }));
    setCurrentPage(1);
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    let areaMin: number | undefined = undefined;
    let areaMax: number | undefined = undefined;
    if (value) {
      [areaMin, areaMax] = value.split('-').map(Number) as [number, number];
    }
    setFilters(prev => ({ ...prev, areaMin, areaMax }));
    setCurrentPage(1);
  };

  return (
    <div className="bg-primary-50 min-h-screen flex flex-col font-sans">
      
      {/* 1. HERO SECTION */}
      <section className={HERO_SECTION_CLASS}>
        <div className="absolute inset-0 z-0">
            <img src={HERO_BG_IMAGE} alt="Background" className="w-full h-full object-cover" />
            {/* Gradient Overlay: Sử dụng Brand Main đậm đà */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-main/95 via-brand-main/80 to-brand-dark/50"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-brand-main via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="max-w-3xl">
            {/* Badge: Nền Brand Accent nhạt, Chữ Brand Soft */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-accent/20 border border-brand-accent/30 text-brand-soft text-sm font-medium mb-6 backdrop-blur-sm">
                <Home className="w-4 h-4 mr-2" />
                Nền tảng tìm phòng trọ số 1 Đà Nẵng
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-white leading-tight">
              Tìm không gian sống <br/>
              {/* Text Gradient: Từ Brand Accent (Vàng cam) sang Brand Soft (Vàng nhạt) */}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-soft">
                đẳng cấp & tiện nghi
              </span>
            </h1>
            <p className="text-lg md:text-xl text-brand-light/90 max-w-2xl font-light leading-relaxed">
              Kết nối trực tiếp với hàng ngàn chủ nhà uy tín. Không môi giới, không phí ẩn, trải nghiệm tìm phòng mượt mà nhất.
            </p>
          </div>
        </div>
      </section>

      {/* 2. SEARCH BAR */}
      <div className={SEARCH_CONTAINER_CLASS}>
        <div className={SEARCH_BOX_CLASS}>
          
          {/* Khu vực */}
          <div className={INPUT_GROUP_CLASS}>
            <label className={LABEL_CLASS}><MapPin className="w-4 h-4 text-brand-main"/> Khu vực</label>
            <div className={SELECT_WRAPPER_CLASS}>
              <select name="district" value={filters.district || ''} onChange={handleDistrictChange} className={SELECT_CLASS}>
                <option value="">Toàn bộ Đà Nẵng</option>
                <option value="Hải Châu">Quận Hải Châu</option>
                <option value="Thanh Khê">Quận Thanh Khê</option>
                <option value="Cẩm Lệ">Quận Cẩm Lệ</option>
                <option value="Liên Chiểu">Quận Liên Chiểu</option>
                <option value="Ngũ Hành Sơn">Quận Ngũ Hành Sơn</option>
                <option value="Sơn Trà">Quận Sơn Trà</option>
              </select>
            </div>
          </div>

          {/* Khoảng giá */}
          <div className={INPUT_GROUP_CLASS}>
            {/* Icon dùng brand-accent (Vàng) */}
            <label className={LABEL_CLASS}><DollarSign className="w-4 h-4 text-brand-accent"/> Khoảng giá</label>
            <div className={SELECT_WRAPPER_CLASS}>
              <select name="priceRange" value={filters.priceMin !== undefined ? `${filters.priceMin}-${filters.priceMax}` : ''} onChange={handlePriceChange} className={SELECT_CLASS}>
                <option value="">Tất cả mức giá</option>
                <option value="0-2000000">Dưới 2 triệu</option>
                <option value="2000000-3000000">2 - 3 triệu</option>
                <option value="3000000-5000000">3 - 5 triệu</option>
                <option value="5000000-10000000">5 - 10 triệu</option>
              </select>
            </div>
          </div>

          {/* Diện tích */}
          <div className={INPUT_GROUP_CLASS}>
             <label className={LABEL_CLASS}><Maximize2 className="w-4 h-4 text-brand-main"/> Diện tích</label>
             <div className={SELECT_WRAPPER_CLASS}>
              <select name="areaRange" value={filters.areaMin !== undefined ? `${filters.areaMin}-${filters.areaMax}` : ''} onChange={handleAreaChange} className={SELECT_CLASS}>
                <option value="">Mọi diện tích</option>
                <option value="0-20">Dưới 20m²</option>
                <option value="20-30">20 - 30m²</option>
                <option value="30-50">30 - 50m²</option>
                <option value="50-999">Trên 50m²</option>
              </select>
            </div>
          </div>

          {/* Button Tìm kiếm */}
          <div>
            <button type="button" className={SEARCH_BUTTON_CLASS} onClick={() => refetch()} disabled={isLoading}>
              <Search className="h-5 w-5" />
              <span>{isLoading ? 'Đang lọc...' : 'Tìm Phòng Ngay'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* RESULTS SECTION */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-8 pb-4 gap-4 border-b border-brand-light/30">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                Kết quả phù hợp
                {pagination?.total ? <span className="text-sm font-normal text-brand-dark bg-brand-soft px-2 py-1 rounded-full">({pagination.total})</span> : null}
            </h2>
            <p className="text-gray-500 text-sm mt-1">Hiển thị các phòng tốt nhất dựa trên tiêu chí của bạn</p>
          </div>
          
          <button className="hidden sm:flex items-center space-x-2 text-sm font-medium text-brand-dark/70 hover:text-brand-main transition-colors">
            <Filter className="w-4 h-4" />
            <span>Bộ lọc nâng cao</span>
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse border border-gray-100">
                <div className="bg-gray-200 h-56 rounded-xl mb-4"></div>
                <div className="bg-gray-200 h-5 rounded w-3/4 mb-3"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2 mb-4"></div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-brand-light">
            <div className="mx-auto h-24 w-24 bg-brand-light/30 rounded-full flex items-center justify-center mb-6">
               <Search className="h-10 w-10 text-brand-main" />
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-2">Không tìm thấy kết quả</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">Chúng tôi không tìm thấy phòng nào phù hợp với bộ lọc hiện tại.</p>
            <button 
                onClick={() => {
                    setFilters({ district: undefined, priceMin: undefined, priceMax: undefined, areaMin: undefined, areaMax: undefined });
                    refetch();
                }}
                className="text-brand-main font-bold hover:underline"
            >
                Xóa bộ lọc và tìm lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <RoomCard key={room._id} room={room} />
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center mt-16">
            <nav className="inline-flex items-center space-x-2" aria-label="Pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1} 
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-brand-light text-brand-dark hover:bg-brand-light/20 hover:border-brand-main hover:text-brand-main disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                &larr;
              </button>
              
              <span className="px-4 h-10 flex items-center justify-center rounded-lg bg-brand-main text-white font-semibold shadow-md shadow-brand-main/20">
                Trang {currentPage} / {pagination.pages}
              </span>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))} 
                disabled={currentPage === pagination.pages} 
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-brand-light text-brand-dark hover:bg-brand-light/20 hover:border-brand-main hover:text-brand-main disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                &rarr;
              </button>
            </nav>
          </div>
        )}
      </section>
    </div>
  );
};

export default RoomList;