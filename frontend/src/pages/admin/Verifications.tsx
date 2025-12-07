import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// SỬA: Import adminAPI thay vì axios
import { adminAPI } from '../../services/api'; // Giả sử api.ts nằm ở '../../services/api'
import { CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import type { User } from '../../types'; // Import type User nếu đã định nghĩa

// Định nghĩa các trạng thái có thể có
type VerificationStatus = 'pending' | 'verified' | 'rejected';


const ImageModal = ({ src, onClose }: { src: string, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <img src={src} alt="Proof" className="max-w-full max-h-full rounded-lg" />
  </div>
);

const Verifications: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending');


  const { data: usersResponse, isLoading, isError } = useQuery({
    // Key phụ thuộc vào status để gọi lại API mỗi khi tab thay đổi
    queryKey: ['admin_verifications', verificationStatus], 
    queryFn: async () => {
      // Gọi API với tham số status
      const res = await adminAPI.getVerifications(verificationStatus); 
      return res.data.data;
    }
  });

  // Mutation xử lý duyệt/từ chối - SỬ DỤNG adminAPI
  const processMutation = useMutation({
    mutationFn: async ({ id, status, message }: { id: string, status: string, message?: string }) => {
      if (status === 'verified') {
        await adminAPI.verifyUser(id);
      } else if (status === 'rejected' && message) {
        await adminAPI.rejectUser(id, message);
      }
      return status; 
    },
    onSuccess: (status) => {
      // Invalidate query để cập nhật lại danh sách, người dùng sẽ chuyển tab nếu cần
      queryClient.invalidateQueries({ queryKey: ['admin_verifications'] });
      console.log(`Đã xử lý xong: ${status}`); 
    },
    onError: (error) => {
        console.error("Lỗi xử lý xác minh:", error);
    }
  });

  const handleReject = (id: string) => {
    // SỬA: Dùng prompt tạm thời để lấy lý do từ chối (nên dùng Modal UI)
    const reason = prompt("Nhập lý do từ chối (Ví dụ: Ảnh mờ, không khớp tên...):");
    if (reason !== null && reason.trim() !== '') {
        processMutation.mutate({ id, status: 'rejected', message: reason });
    } else if (reason === '') {
        console.log("Không thể từ chối vì lý do trống.");
    }
  };
  
  // Lấy toàn bộ dữ liệu (giả sử Backend đang gửi đúng)
  // SỬA LỖI: Sử dụng as User[] để khai báo rõ ràng kiểu trả về là một mảng User (kể cả khi thiếu type)
  const allUsers = usersResponse as User[] || [];
  
  // === LOGIC LỌC DỮ LIỆU TẠI FRONTEND ===
  // SỬA LỖI: Sử dụng 'user as any' để bỏ qua lỗi kiểm tra type 'verification'
  const users = allUsers.filter(user => (user as any).verification?.status === verificationStatus);
  // =====================================

  // Mảng định nghĩa các tab
  const tabs: { key: VerificationStatus, label: string }[] = [
    { key: 'pending', label: 'Yêu cầu chờ duyệt' },
    { key: 'verified', label: 'Đã duyệt' },
    { key: 'rejected', label: 'Đã từ chối' },
  ];

  if (isLoading) return <div className="p-8">Đang tải danh sách...</div>;
  
  if (isError) return <div className="p-8 text-red-600">Lỗi tải dữ liệu. Admin cần đăng nhập hoặc Token đã hết hạn.</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Quản lý xác minh</h2>
      </div>

      {/* THÊM: Thanh Tab chuyển đổi trạng thái */}
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setVerificationStatus(tab.key)}
            className={`py-3 px-6 text-sm font-medium transition-all ${
              verificationStatus === tab.key
                ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {/* SỬA HIỂN THỊ COUNT: Đếm số lượng user TỪ DANH SÁCH allUsers (danh sách đầy đủ) */}
            {tab.label} ({allUsers.filter(u => (u as any).verification?.status === tab.key).length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
            <tr>
              <th className="p-4">Người dùng</th>
              <th className="p-4">Vai trò</th>
              <th className="p-4">Giấy tờ (Trước/Sau)</th>
              <th className="p-4">Ngày gửi</th>
              {/* THÊM/SỬA: Thay đổi cột header tùy theo trạng thái */}
              <th className="p-4">
                {verificationStatus === 'pending' ? 'Hành động' : (verificationStatus === 'verified' ? 'Ngày duyệt' : 'Ngày từ chối')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">
                    Không có người dùng nào ở trạng thái "{tabs.find(t => t.key === verificationStatus)?.label.toLowerCase()}".
                </td></tr>
            ) : users.map((user: any) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-bold text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400">{user.phone}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'landlord' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {/* SỬA LỖI: Sử dụng 'user as any' */}
                    <button onClick={() => setSelectedImage((user as any).verification?.frontImage)} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200" disabled={!(user as any).verification?.frontImage}>
                        <EyeIcon className="w-3 h-3" /> Mặt trước
                    </button>
                    <button onClick={() => setSelectedImage((user as any).verification?.backImage)} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200" disabled={!(user as any).verification?.backImage}>
                        <EyeIcon className="w-3 h-3" /> Mặt sau
                    </button>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="p-4 text-right space-x-2">
                  {verificationStatus === 'pending' ? (
                    // Hiển thị nút Duyệt/Từ chối cho trạng thái Pending
                    <>
                      <button 
                        onClick={() => processMutation.mutate({ id: user._id, status: 'verified' })}
                        disabled={processMutation.isPending}
                        className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition text-sm font-medium"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-1" /> Duyệt
                      </button>
                      <button 
                        onClick={() => handleReject(user._id)}
                        disabled={processMutation.isPending}
                        className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition text-sm font-medium"
                      >
                        <XCircleIcon className="w-4 h-4 mr-1" /> Từ chối
                      </button>
                    </>
                  ) : (
                    // Hiển thị ngày duyệt hoặc ngày từ chối
                    <div className="text-sm text-gray-500 font-medium">
                      {/* SỬA LỖI: Sử dụng 'user as any' */}
                      {new Date((user as any).verification?.updatedAt).toLocaleDateString('vi-VN')}
                      {/* Thêm lý do từ chối nếu có */}
                      {verificationStatus === 'rejected' && (user as any).verification?.message && (
                          <p className="text-xs text-red-500 mt-1 italic max-w-xs">{(user as any).verification.message}</p>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedImage && <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
};

export default Verifications;