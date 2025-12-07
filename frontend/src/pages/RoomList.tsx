import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { roomAPI } from '../services/api';
import type { SearchFilters, Room as RoomType } from '../types'; 

// === IMPORT COMPONENT MỚI ===
import RoomCard from '../components/RoomCard'; 
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// --- CONSTANTS STYLES ---
const HERO_SECTION_CLASS = "relative w-full py-28 bg-brand-dark text-white shadow-xl -mt-8 bg-[url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')] bg-cover bg-center bg-no-repeat";
const OVERLAY_CLASS = "absolute inset-0 bg-brand-dark/80"; 
const SEARCH_CONTAINER_CLASS = "relative z-10 w-full max-w-6xl p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 mx-auto";
const LABEL_CLASS = "block text-sm font-bold text-white mb-2 tracking-wide";
const SELECT_CLASS = "w-full p-3.5 border border-white/30 rounded-lg shadow-sm bg-white/90 text-brand-dark font-medium focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all cursor-pointer hover:bg-white";
const SEARCH_BUTTON_CLASS = "w-full h-[50px] bg-brand-main hover:bg-brand-accent text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 border border-white/20 transform hover:-translate-y-0.5";

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
    <div className="bg-brand-light min-h-screen flex flex-col">
      
      {/* HERO & SEARCH */}
      <section className={HERO_SECTION_CLASS}>
        <div className={OVERLAY_CLASS}></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-white drop-shadow-lg">
              Tìm Không Gian Sống Lý Tưởng
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto font-light">
              Khám phá hàng ngàn phòng trọ, căn hộ tiện nghi với giá tốt nhất tại Đà Nẵng.
            </p>
          </div>
          
          <div className={SEARCH_CONTAINER_CLASS}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-1">
                <label className={LABEL_CLASS}>Khu vực</label>
                <select name="district" value={filters.district || ''} onChange={handleDistrictChange} className={SELECT_CLASS}>
                  <option value="">Tất cả khu vực</option>
                  <option value="Hải Châu">Hải Châu</option>
                  <option value="Thanh Khê">Thanh Khê</option>
                  <option value="Cẩm Lệ">Cẩm Lệ</option>
                  <option value="Liên Chiểu">Liên Chiểu</option>
                  <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
                  <option value="Sơn Trà">Sơn Trà</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASS}>Khoảng giá</label>
                <select name="priceRange" value={filters.priceMin !== undefined ? `${filters.priceMin}-${filters.priceMax}` : ''} onChange={handlePriceChange} className={SELECT_CLASS}>
                  <option value="">Tất cả mức giá</option>
                  <option value="0-2000000">Dưới 2 triệu</option>
                  <option value="2000000-3000000">2 - 3 triệu</option>
                  <option value="3000000-5000000">3 - 5 triệu</option>
                  <option value="5000000-10000000">5 - 10 triệu</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASS}>Diện tích</label>
                <select name="areaRange" value={filters.areaMin !== undefined ? `${filters.areaMin}-${filters.areaMax}` : ''} onChange={handleAreaChange} className={SELECT_CLASS}>
                  <option value="">Tất cả diện tích</option>
                  <option value="0-20">Dưới 20m²</option>
                  <option value="20-30">20 - 30m²</option>
                  <option value="30-50">30 - 50m²</option>
                  <option value="50-999">Trên 50m²</option>
                </select>
              </div>
              <div>
                <button type="button" className={SEARCH_BUTTON_CLASS} onClick={() => refetch()} disabled={isLoading}>
                  <MagnifyingGlassIcon className="h-6 w-6" />
                  <span>{isLoading ? 'Đang tìm...' : 'Tìm kiếm'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-brand-accent/20 pb-4 gap-4">
          <h2 className="text-3xl font-bold text-brand-dark">Kết quả tìm kiếm</h2>
          <span className="px-4 py-2 bg-white rounded-full shadow-sm text-brand-main font-semibold border border-brand-accent/30">
            {pagination?.total || 0} phòng trọ phù hợp
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-4 animate-pulse border border-brand-accent/20">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded w-2/3 mb-3"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2 mb-4"></div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-brand-accent/30">
            <div className="mx-auto h-20 w-20 bg-brand-light rounded-full flex items-center justify-center mb-6">
               <MagnifyingGlassIcon className="h-10 w-10 text-brand-main" />
            </div>
            <h3 className="text-2xl font-bold text-brand-dark mb-2">Không tìm thấy phòng nào</h3>
            <p className="text-gray-500 text-lg max-w-md mx-auto">Rất tiếc, không có phòng nào khớp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              // SỬ DỤNG ROOMCARD Ở ĐÂY
              <RoomCard key={room._id} room={room} />
            ))}
          </div>
        )}
        
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center mt-16">
            <nav className="inline-flex rounded-xl shadow-sm bg-white p-1 border border-brand-accent/30" aria-label="Pagination">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 rounded-l-lg text-sm font-medium text-brand-dark hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Trước</button>
              <span className="relative z-10 inline-flex items-center px-6 py-2 bg-brand-main text-sm font-bold text-white rounded-md shadow-md mx-1">{currentPage} / {pagination.pages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))} disabled={currentPage === pagination.pages} className="relative inline-flex items-center px-4 py-2 rounded-r-lg text-sm font-medium text-brand-dark hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Sau</button>
            </nav>
          </div>
        )}
      </section>
    </div>
  );
};

export default RoomList;