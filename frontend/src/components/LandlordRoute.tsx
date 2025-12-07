import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; 
// import Layout from './Layout'; // <-- XÓA DÒNG NÀY

/**
 * Component này bảo vệ các route chỉ dành cho Landlord.
 * ...
 */
const LandlordRoute: React.FC = () => {
  const { user, loading } = useAuth(); // Giả sử useAuth trả về 'loading'

  if (loading) {
    return <div>Đang tải...</div>;
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đăng nhập nhưng không phải landlord, chuyển hướng về trang chủ
  if (user.role !== 'landlord') {
    return <Navigate to="/" replace />;
  }

  // Nếu là landlord, chỉ cần hiển thị nội dung trang con (Outlet)
  // Layout đã được bọc ở App.tsx
  return <Outlet />; // <-- SỬA LẠI THÀNH DÒNG NÀY
};

export default LandlordRoute;