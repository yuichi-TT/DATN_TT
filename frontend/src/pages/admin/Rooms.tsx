import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api'; 
import type { Room, Pagination } from '../../types'; 
import { 
  MapPinIcon, HomeModernIcon, CheckIcon, XMarkIcon, 
  MagnifyingGlassIcon, UserCircleIcon, ClockIcon, BuildingOfficeIcon
} from '@heroicons/react/24/outline';

// === 1. QUAN TRỌNG: Phải có | '' ở cuối ===
type RoomStatus = 'pending' | 'approved' | 'rejected' | ''; 

// Định nghĩa key query
type RoomsQueryKey = ['admin', 'rooms', RoomStatus, number, string];

const Rooms: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // === 2. QUAN TRỌNG: Khai báo generic <RoomStatus> ===
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus>('pending');

  const queryClient = useQueryClient();

  // Fetching Data
  const { data: roomsResponse, isLoading } = useQuery({
    queryKey: ['admin', 'rooms', selectedStatus, currentPage, searchTerm] as RoomsQueryKey,
    queryFn: async ({ queryKey }) => {
       const [_key1, _key2, status, page] = queryKey;
       // Nếu là pending gọi API riêng (tuỳ logic backend của bạn)
       if (status === 'pending') {
          const res = await adminAPI.getPendingRooms({ page, limit: 9 });
          return res.data;
       }
       // Các trường hợp khác
       const params: any = { page, limit: 9 };
       if (status) params.status = status; // Nếu status rỗng thì không gửi param này
       const res = await adminAPI.getRooms(params);
       return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const approveRoomMutation = useMutation({
    mutationFn: (id: string) => adminAPI.approveRoom(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] }),
  });

  const rejectRoomMutation = useMutation({
    mutationFn: (id: string) => adminAPI.rejectRoom(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] }),
  });

  const allRooms: Room[] = roomsResponse?.data ?? [];
  const pagination: Pagination | undefined = roomsResponse?.pagination;

  // === 3. LOGIC FILTER ===
  const filteredRooms = allRooms.filter(room => {
    // TypeScript sẽ không báo lỗi nữa vì selectedStatus được phép là ''
    if (selectedStatus !== '' && room.status !== selectedStatus) return false;

    return (
        (room.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.landlord?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const tabs = [
    { id: 'pending', label: 'Chờ duyệt' },
    { id: 'approved', label: 'Đã duyệt' },
    { id: 'rejected', label: 'Đã từ chối' },
    { id: '', label: 'Tất cả' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý phòng trọ</h1>
          <p className="text-gray-500 text-sm">Kiểm duyệt và quản lý tin đăng</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex p-1 bg-gray-100/80 rounded-xl gap-1 w-full xl:w-auto overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        // Ép kiểu id thành RoomStatus để khớp type
                        onClick={() => { setSelectedStatus(tab.id as RoomStatus); setCurrentPage(1); }}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 md:flex-none ${
                            selectedStatus === tab.id 
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="relative group w-full xl:w-80">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên, địa chỉ..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
            </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
             {[1,2,3].map(i => <div key={i} className="h-80 bg-gray-200 rounded-2xl" />)}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold">Không tìm thấy phòng trọ nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div key={room._id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 flex flex-col h-full">
               <div className="relative h-56 bg-gray-200 overflow-hidden shrink-0">
                  <img 
                    src={room.images?.[0] || 'https://placehold.co/600x400?text=No+Image'} 
                    alt={room.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                     <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md ${
                        room.status === 'pending' ? 'bg-amber-400/90 text-white' :
                        room.status === 'approved' ? 'bg-emerald-500/90 text-white' : 
                        room.status === 'rejected' ? 'bg-red-500/90 text-white' : 'bg-gray-500/90 text-white'
                     }`}>
                        {room.status === 'pending' ? 'Chờ duyệt' : room.status === 'approved' ? 'Đã duyệt' : room.status === 'rejected' ? 'Từ chối' : room.status}
                     </span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-gray-900/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                      {(room.price || 0).toLocaleString('vi-VN')} đ/tháng
                  </div>
               </div>

               <div className="p-5 flex flex-col flex-grow">
                  <div className="mb-4">
                      <h3 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">{room.title}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                         <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                         <span className="truncate">{room.address || 'N/A'}, {room.district}</span>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                     <div className="flex items-center gap-1.5"><HomeModernIcon className="w-4 h-4 text-indigo-500" /><span>{room.area || 0} m²</span></div>
                     <div className="flex items-center gap-1.5"><UserCircleIcon className="w-4 h-4 text-indigo-500" /><span className="truncate">{room.landlord?.name || 'Ẩn danh'}</span></div>
                     <div className="flex items-center gap-1.5 col-span-2 mt-1 pt-1 border-t border-gray-200"><ClockIcon className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-400">Đăng: {new Date(room.createdAt).toLocaleDateString('vi-VN')}</span></div>
                  </div>

                  <div className="mt-auto flex gap-2">
                     <Link to={`/room/${room._id}`} target="_blank" className="flex-1 py-2.5 text-center text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all">Xem chi tiết</Link>
                     {(selectedStatus === 'pending' || (selectedStatus === '' && room.status === 'pending')) && (
                        <>
                            <button onClick={() => approveRoomMutation.mutate(room._id)} disabled={approveRoomMutation.isPending} className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-xs flex justify-center items-center gap-1 hover:bg-emerald-100 transition-all">
                                {approveRoomMutation.isPending ? '...' : <><CheckIcon className="w-3.5 h-3.5" /> Duyệt</>}
                            </button>
                            <button onClick={() => rejectRoomMutation.mutate(room._id)} disabled={rejectRoomMutation.isPending} className="px-3 py-2.5 bg-red-50 text-red-700 border border-red-100 rounded-xl hover:bg-red-100 transition-all">
                                {rejectRoomMutation.isPending ? '...' : <XMarkIcon className="w-4 h-4" />}
                            </button>
                        </>
                     )}
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
      
       {/* Pagination (Giữ nguyên) */}
       {pagination && pagination.pages > 1 && (
         <div className="flex justify-center pt-6 border-t border-gray-200">
             <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">&lt;</button>
                <span className="text-sm font-medium text-gray-600 px-2">Trang {currentPage} / {pagination.pages}</span>
                <button onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))} disabled={currentPage === pagination.pages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">&gt;</button>
             </div>
         </div>
      )}
    </div>
  );
};

export default Rooms;