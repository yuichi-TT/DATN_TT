import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Đảm bảo đường dẫn này đúng

const ProtectedRoute: React.FC = () => {
  // --- SỬA LỖI Ở ĐÂY: Bỏ isLoading ---
  // Lấy thông tin user từ AuthContext
  // Giả sử useAuth() chỉ trả về { user: User | null }
  const { user } = useAuth(); // Bỏ isLoading
  // --- KẾT THÚC SỬA LỖI ---
  const location = useLocation();

  // --- SỬA LỖI Ở ĐÂY: Xóa khối kiểm tra isLoading ---
  // // 1. Trường hợp đang kiểm tra trạng thái đăng nhập
  // if (isLoading) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen">
  //       <div className="text-gray-500">Đang tải...</div>
  //     </div>
  //   );
  // }
  // --- KẾT THÚC SỬA LỖI ---


  // 2. Trường hợp *không* có user (chưa đăng nhập)
  if (!user) {
    // Chuyển hướng người dùng về trang đăng nhập
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Trường hợp *có* user (đã đăng nhập)
  // Hiển thị component con
  return <Outlet />;
};

export default ProtectedRoute;

