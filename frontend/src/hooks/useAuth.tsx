import React, { useState, useEffect, createContext, useContext } from 'react';
import type { User, AuthResponse } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>; // Sửa tham số
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // SỬA LỖI: Logic useEffect được dọn dẹp
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) { 
        // LƯU Ý: Không cần setToken ở đây, vì axios Interceptor (trong api.ts) 
        // sẽ dùng storedToken để gửi kèm trong request getProfile.
        
        try {
          // Gọi API để lấy Profile. Nếu token hợp lệ, request sẽ thành công.
          const response = await authAPI.getProfile(); 
          
          // Nếu thành công, cập nhật state.
          setUser(response.data.data);
          setToken(storedToken); // Cập nhật token state từ storedToken
        } catch (error) {
          // Nếu API trả về lỗi (ví dụ 401), Interceptor sẽ xử lý xóa token.
          // Ta chỉ cần đảm bảo state là null.
          console.error("Token không hợp lệ hoặc đã hết hạn. Đang đăng xuất tự động.");
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Hàm chung để xử lý phản hồi xác thực
  const handleAuthResponse = (authData: AuthResponse) => {
    const { user, token } = authData;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    setToken(token);
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    handleAuthResponse(response.data.data);
  };

  // SỬA LỖI: adminLogin gọi API trực tiếp
  const adminLogin = async (email: string, password: string) => {
    const response = await authAPI.adminLogin(email, password);
    const authData = response.data.data;

    // SỬA LỖI: Thêm kiểm tra an toàn
    // Chỉ kiểm tra vai trò nếu authData và authData.user tồn tại
    if (!authData || !authData.user) {
      // Nếu backend trả về lỗi, response.data.data sẽ là undefined.
      // Ném ra một lỗi chung để component Login có thể bắt được.
      throw new Error(response.data.message || 'Dữ liệu trả về không hợp lệ.');
    }

    if (authData.user.role !== 'admin') {
      throw new Error('Truy cập bị từ chối. Tài khoản không phải quản trị viên.');
    }
    
    handleAuthResponse(authData);
  };

  const register = async (userData: any) => {
    const response = await authAPI.register(userData);
    handleAuthResponse(response.data.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  // SỬA LỖI: Lưu đúng đối tượng user vào localStorage
  const updateProfile = async (userData: Partial<User>) => {
    const response = await authAPI.updateProfile(userData);
    const updatedUser = response.data.data;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = { 
    user, 
    token, 
    loading, 
    login, 
    adminLogin, 
    register, 
    logout, 
    updateProfile 
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};