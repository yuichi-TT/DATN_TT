import { useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth'; // Import useAuth để lấy token

// Lấy URL của backend từ biến môi trường
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socketInstance: Socket | null = null;

/**
 * Hook tùy chỉnh để quản lý kết nối Socket.io
 * Nó sẽ tự động kết nối khi user đăng nhập và ngắt kết nối khi logout.
 */
export const useSocket = (): Socket | null => {
  const { user, token } = useAuth(); // Giả sử useAuth trả về cả 'token'

  // useMemo đảm bảo socket chỉ được tạo MỘT LẦN
  const socket = useMemo(() => {
    if (!token) return null; // Nếu không có token, không kết nối

    console.log('[Socket.io] Khởi tạo kết nối...');
    
    // Khởi tạo socket
    const newSocket = io(API_BASE_URL, {
      autoConnect: false, // Chúng ta sẽ kết nối thủ công
      // Gửi token lên server để xác thực
      auth: {
        token: `Bearer ${token}` 
      }
    });

    socketInstance = newSocket;
    return newSocket;

  }, [token]); // Chỉ tạo lại socket nếu token thay đổi

  useEffect(() => {
    if (user && socket) {
      // Bắt đầu kết nối
      socket.connect();

      socket.on('connect', () => {
        console.log('[Socket.io] Đã kết nối tới server:', socket.id);
      });

      socket.on('disconnect', () => {
        console.log('[Socket.io] Đã ngắt kết nối.');
      });

      // (Bạn có thể thêm các listener chung ở đây, ví dụ: 'connect_error')
    
    }

    // Cleanup: Ngắt kết nối khi component unmount hoặc user logout
    return () => {
      if (socket) {
        console.log('[Socket.io] Ngắt kết nối...');
        socket.disconnect();
      }
    };
  }, [user, socket]); // Chạy lại khi user hoặc socket thay đổi

  return socket;
};

// (Tùy chọn) Export một hàm để lấy socket instance ở nơi khác nếu cần
export const getSocket = () => socketInstance;
