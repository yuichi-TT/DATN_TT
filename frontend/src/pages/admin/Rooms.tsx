import React, { useState } from 'react';
// Import các hook và type cần thiết
import { useQuery, useMutation, useQueryClient, type QueryFunctionContext } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api'; 
import type { Room, ApiResponse, Pagination } from '../../types'; 

// === THÊM KIỂU DỮ LIỆU MỚI CHO TRẠNG THÁI ===
type RoomStatus = 'pending' | 'approved' | 'rejected' | ''; 

// Định nghĩa kiểu dữ liệu cho Query Key
type RoomsQueryKey = ['admin', 'rooms', RoomStatus, number, string];

// Đổi tên component
const Rooms: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  // === THÊM STATE CHO STATUS ===
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus>('pending');

  const queryClient = useQueryClient();

  //  LẤY DANH SÁCH PHÒNG THEO STATUS
  const { data: roomsResponse, isLoading } = useQuery({
    queryKey: ['admin', 'rooms', selectedStatus, currentPage, searchTerm] as RoomsQueryKey,
    queryFn: async ({ queryKey }: QueryFunctionContext<RoomsQueryKey>) => {
       const [_key1, _key2, status, page, search] = queryKey;
       
       if (status === 'pending') {
          const response = await adminAPI.getPendingRooms({ page: page, limit: 9 });
          return response.data;
       }
       
       
       const params: { page: number, limit: number, status?: string } = {
        page: page,
        limit: 9,
      };
      
      // Chỉ thêm status vào params nếu nó không phải là 'Tất cả' ('')
      if (status) {
          params.status = status;
      }
      
      // Dùng API 'getRooms' chung cho các status khác
       const response = await adminAPI.getRooms(params);
       
      return response.data; // Trả về phần data bên trong AxiosResponse
    },
    staleTime: 5 * 60 * 1000,
  });


  // 2. THÊM MUTATIONS CHO DUYỆT/TỪ CHỐI
   const approveRoomMutation = useMutation({
    mutationFn: (id: string) => adminAPI.approveRoom(id),
    onSuccess: () => {
      // === SỬA LỖI: CẬP NHẬT TẤT CẢ CÁC LIST ===
      // Khi duyệt 1 phòng, nó sẽ MẤT ở list 'pending' và XUẤT HIỆN ở list 'approved'
      // Bằng cách invalidate 'admin', 'rooms', ta báo cho React Query biết
      // tất cả các query 'admin', 'rooms' (bao gồm cả 'pending' và 'approved') đều đã cũ.
      queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] });
    },
    onError: (error) => {
      console.error("Lỗi khi duyệt phòng:", error);
    }
  });

  const rejectRoomMutation = useMutation({
    mutationFn: (id: string) => adminAPI.rejectRoom(id),
    onSuccess: () => {
      // Tương tự, cập nhật tất cả
      queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] });
    },
     onError: (error) => {
      console.error("Lỗi khi từ chối phòng:", error);
    }
  });

  // Lấy dữ liệu phòng từ query
  // LƯU Ý: Nếu Backend không lọc, `roomsResponse.data` sẽ chứa tất cả các trạng thái.
  // Ta phải lọc lại ở Frontend để đảm bảo tab hiển thị đúng.
  const allRooms: Room[] = roomsResponse?.data ?? [];
  const pagination: Pagination | undefined = roomsResponse?.pagination;

  // === THÊM BƯỚC LỌC DỮ LIỆU CHÍNH XÁC THEO TRẠNG THÁI (Nếu Backend không lọc) ===
  const statusFilteredRooms = allRooms.filter(room => {
    // Nếu status là 'Tất cả' ('') thì giữ lại hết
    if (selectedStatus === '') return true;
    // Ngược lại, chỉ giữ lại phòng có status khớp
    return room.status === selectedStatus;
  });

  // Lọc phía client (vẫn giữ nguyên)
  const filteredRooms = statusFilteredRooms.filter(room =>
    (room.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.landlord?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  // ==============================================================================


  // Hàm hiển thị trạng thái (vẫn giữ nguyên)
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      case 'approved':
         return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Đã duyệt</span>;
       case 'rejected':
         return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Đã từ chối</span>;
      default:
         return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>{status || 'N/A'}</span>;
    }
  };

  // === COMPONENT MỚI: NÚT TAB ===
  const TabButton: React.FC<{status: RoomStatus, label: string}> = ({ status, label }) => (
    <button
      onClick={() => {
        setSelectedStatus(status);
        setCurrentPage(1); // Reset về trang 1 khi đổi tab
      }}
      className={`px-4 py-3 text-sm font-medium ${
        selectedStatus === status
          ? 'border-b-2 border-primary-600 text-primary-600'
          : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý phòng trọ</h1>
          <p className="text-gray-600 mt-2">
            Kiểm duyệt và quản lý tất cả các tin đăng phòng trọ.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 bg-white rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm (trong danh sách hiện tại)
            </label>
            <input
              id="search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset page khi tìm kiếm
              }}
              placeholder="Tìm theo tiêu đề, địa chỉ, chủ trọ..."
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="btn-secondary w-full md:w-auto"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* === TABS CHỌN STATUS MỚI === */}
      <div className="card bg-white rounded-lg shadow border overflow-hidden">
        <div className="flex border-b border-gray-200">
            <TabButton status="pending" label="Chờ duyệt" />
            <TabButton status="approved" label="Đã duyệt" />
            <TabButton status="rejected" label="Bị từ chối" />
            <TabButton status="" label="Tất cả" />
        </div>
      
        {/* Rooms Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Đang tải danh sách phòng...</div>
        ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20">
                <p className="text-gray-500 text-lg">Không có phòng nào trong mục này.</p>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredRooms.map((room) => (
              <div key={room._id} className="bg-white overflow-hidden border border-gray-200 rounded-lg shadow-sm transition-shadow hover:shadow-md flex flex-col">
                <div className="h-48 bg-gray-100 relative group flex-shrink-0">
                  {room.images && room.images.length > 0 ? (
                    <img
                      src={room.images[0]}
                      alt={`Ảnh phòng ${room.title}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://placehold.co/600x400/eee/ccc?text=Ảnh+lỗi';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                      Không có ảnh
                    </div>
                  )}
                   <div className="absolute top-2 right-2 z-10">
                      {getStatusBadge(room.status)}
                   </div>
                </div>

                <div className="p-4 flex flex-col justify-between flex-grow space-y-3">
                  {/* Thông tin */}
                  <div>
                      <h3 title={room.title} className="font-semibold text-lg line-clamp-1 text-gray-800 hover:text-primary-600 transition-colors">
                        {room.title || 'N/A'}
                      </h3>
                      <p title={`${room.address || 'N/A'}, ${room.district || 'N/A'}, ${room.city || 'N/A'}`} className="text-gray-500 text-sm mt-1 line-clamp-1">
                        📍 {room.address || 'N/A'}, {room.district || 'N/A'}
                      </p>
                      <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-primary-600 font-bold">
                          {(room.price || 0).toLocaleString('vi-VN')} VNĐ
                        </span>
                        <span className="text-gray-500">{room.area || '?'} m²</span>
                      </div>
                       <div className="text-sm text-gray-600 pt-2 mt-2 border-t border-gray-100 flex justify-between items-center">
                        <span>Đăng bởi: {room.landlord?.name || 'N/A'}</span>
                        <span className="text-xs text-gray-400">
                           {room.createdAt ? new Date(room.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                         </span>
                      </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex space-x-2 pt-2 border-t border-gray-100">
                     <Link
                       to={`/room/${room._id}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       title="Xem chi tiết tin đăng (tab mới)"
                       className="btn-secondary flex-1 text-center text-sm"
                     >
                       Xem trước
                     </Link>
                     
                     {/* Chỉ hiển thị nút nếu ở tab 'pending' */}
                     {selectedStatus === 'pending' && (
                        <>
                            <button
                                onClick={() => approveRoomMutation.mutate(room._id)}
                                disabled={isLoading || approveRoomMutation.isPending || (rejectRoomMutation.isPending && rejectRoomMutation.variables === room._id)}
                                title="Duyệt tin đăng này"
                                className="btn-sm bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {approveRoomMutation.isPending && approveRoomMutation.variables === room._id ? '...' : 'Duyệt'}
                            </button>
                            <button
                                onClick={() => rejectRoomMutation.mutate(room._id)}
                                disabled={isLoading || rejectRoomMutation.isPending || (approveRoomMutation.isPending && approveRoomMutation.variables === room._id)}
                                title="Từ chối tin đăng này"
                                className="btn-sm bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {rejectRoomMutation.isPending && rejectRoomMutation.variables === room._id ? '...' : 'Từ chối'}
                            </button>
                        </>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center p-6 border-t border-gray-200">
             <div className="flex items-center space-x-1">
               <button
                 onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                 disabled={currentPage === 1 || isLoading}
                 className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                 aria-label="Trang trước"
               >
                 &lt; Trước
               </button>
               {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === pagination.pages || Math.abs(page - currentPage) <= 1 || (page === currentPage - 2) || (page === currentPage + 2))
                  .map((page, index, arr) => (
                      <React.Fragment key={page}>
                          {index > 0 && page !== arr[index - 1] + 1 && (
                               <span className="px-3 py-1.5 text-sm text-gray-500">...</span>
                          )}
                           <button
                             onClick={() => setCurrentPage(page)}
                             disabled={isLoading}
                             className={`px-3 py-1.5 border rounded-md text-sm font-medium ${
                               currentPage === page
                                 ? 'bg-primary-600 text-white border-primary-600 z-10 ring-1 ring-primary-600'
                                 : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                             }`}
                             aria-current={currentPage === page ? 'page' : undefined}
                           >
                             {page}
                           </button>
                      </React.Fragment>
               ))}
               <button
                 onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                 disabled={currentPage === pagination.pages || isLoading}
                 className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Trang sau"
               >
                 Sau &gt;
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms; // Đổi tên component