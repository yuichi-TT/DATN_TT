import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminAccess: React.FC = () => {
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAccessAdmin = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else {
      setShowAdminInfo(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Truy cập Admin Dashboard
          </h2>
          <p className="text-gray-600 mb-8">
            Quản lý hệ thống Student Housing
          </p>
        </div>

        <div className="space-y-4">
          {user ? (
            <div className="text-center">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Đăng nhập với tài khoản:</p>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-gray-500">Vai trò: {user.role}</p>
              </div>
              
              {user.role === 'admin' ? (
                <button
                  onClick={handleAccessAdmin}
                  className="btn-primary w-full"
                >
                  🚀 Truy cập Admin Dashboard
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
                    <p className="text-sm">
                      Bạn cần tài khoản admin để truy cập trang quản trị
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowAdminInfo(true)}
                    className="btn-secondary w-full"
                  >
                    ℹ️ Hướng dẫn tạo tài khoản admin
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Link
                to="/login"
                className="btn-primary w-full text-center block"
              >
                Đăng nhập
              </Link>
              
              <button
                onClick={() => setShowAdminInfo(true)}
                className="btn-secondary w-full"
              >
                ℹ️ Hướng dẫn tạo tài khoản admin
              </button>
            </div>
          )}

          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Về trang chủ
            </Link>
          </div>
        </div>

        {/* Admin Info Modal */}
        {showAdminInfo && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    🔧 Hướng dẫn tạo tài khoản admin
                  </h3>
                  
                  <div className="space-y-4 text-sm text-gray-600">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cách 1: Tạo tài khoản admin mới</h4>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>Đăng ký tài khoản mới với vai trò "Chủ trọ"</li>
                        <li>Liên hệ quản trị viên để nâng cấp lên admin</li>
                        <li>Hoặc sử dụng database để thay đổi role</li>
                      </ol>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cách 2: Sử dụng database</h4>
                      <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                        <p>1. Kết nối MongoDB</p>
                        <p>2. Tìm user trong collection "users"</p>
                        <p>3. Cập nhật role: "admin"</p>
                        <p>4. Hoặc tạo user mới với role: "admin"</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cách 3: Sử dụng API</h4>
                      <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                        <p>POST /api/auth/register</p>
                        <p>{`{
                          "email": "admin@studenthousing.vn",
                          "password": "admin123",
                          "name": "Admin",
                          "phone": "0123456789",
                          "role": "admin"
                          }`}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => setShowAdminInfo(false)}
                    className="btn-primary"
                  >
                    Đã hiểu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAccess;
