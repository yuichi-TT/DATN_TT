import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminLayout from './AdminLayout';

const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();

  // 1. Chờ cho đến khi xác thực xong
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Đang tải...</div>
      </div>
    );
  }

  // 2. Nếu xác thực xong, kiểm tra xem có phải admin không
  // Nếu user tồn tại VÀ có vai trò là 'admin', cho phép truy cập
  if (user && user.role === 'admin') {
    return (
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    );
  }

  // 3. Nếu không phải admin, chuyển hướng về trang đăng nhập của admin
  return <Navigate to="/admin/login" replace />;
};

export default AdminRoute;