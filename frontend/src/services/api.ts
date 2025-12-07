import axios, { type AxiosResponse } from 'axios';
import type { User, Room, SearchFilters, ForumPost, ForumReply, AuthResponse, ApiResponse, Notification, Message, Conversation } from '../types';

// --- CẤU HÌNH TỰ ĐỘNG CHỌN URL API ---
const getBaseUrl = () => {
  // 1. Ưu tiên biến môi trường (nếu có cấu hình trên Vercel/Netlify)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Kiểm tra xem có đang chạy trên localhost không
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Nếu chạy local, gọi thẳng vào cổng 5000 của máy (nhanh và ổn định)
    return 'http://localhost:5000/api';
  }

  // 3. Nếu không phải local (tức là đang xem qua link DevTunnels), dùng link Public
  return 'https://vm6lrl9v-5000.asse.devtunnels.ms/api';
};

const API_BASE_URL = getBaseUrl();
console.log('Current API URL:', API_BASE_URL); // In ra để bạn kiểm tra xem nó đang nhận link nào

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để tự động thêm token vào header Authorization
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Lấy token từ localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Gắn token vào header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error); // Chuyển tiếp lỗi request
  }
);

// Response interceptor để xử lý lỗi 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response, // Trả về response nếu thành công
  (error) => {
    // Nếu lỗi là 401 (token hết hạn hoặc không hợp lệ)
    if (error.response?.status === 401) {
      localStorage.removeItem('token'); // Xóa token cũ
      localStorage.removeItem('user'); // Xóa thông tin user cũ
      // Tránh reload vòng lặp nếu đang ở trang login
      if (window.location.pathname !== '/login') {
         window.location.href = '/login'; 
      }
    }
    return Promise.reject(error); // Chuyển tiếp lỗi response
  }
);

// --- AUTH API ---
export const authAPI = {
  login: (email: string, password: string): Promise<AxiosResponse<ApiResponse<AuthResponse>>> =>
    api.post('/auth/login', { email, password }),

  adminLogin: (email: string, password: string): Promise<AxiosResponse<ApiResponse<AuthResponse>>> =>
    api.post('/auth/admin/login', { email, password }), // API đăng nhập admin

  register: (userData: {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: 'student' | 'landlord';
  }): Promise<AxiosResponse<ApiResponse<AuthResponse>>> =>
    api.post('/auth/register', userData), // API đăng ký user thường

  getProfile: (): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get('/auth/profile'), // Lấy thông tin user hiện tại

  updateProfile: (userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put('/auth/profile', userData), // Cập nhật thông tin user
  changePassword: (data: any) => api.put('/auth/change-password', data),
  submitVerification: (data: { frontImage: string; backImage: string; identityType: string }) => {
    return api.post('/auth/verify-identity', data);
  }
};

// --- ROOM API (Public & Landlord) ---
export const roomAPI = {
  // Lấy danh sách phòng (public, đã duyệt, 'Còn trống')
  getRooms: (filters?: SearchFilters): Promise<AxiosResponse<ApiResponse<Room[]>>> =>
    api.get('/rooms', { params: filters }),

  // Lấy chi tiết một phòng (public, đã duyệt)
  getRoom: (id: string): Promise<AxiosResponse<ApiResponse<Room>>> =>
    api.get(`/rooms/${id}`),

  // === HÀM MỚI: LẤY PHÒNG CỦA CHỦ TRỌ (PRIVATE) ===
  // Hàm này sẽ gọi /api/rooms/my-rooms và lấy TẤT CẢ phòng (kể cả đã thuê)
  getMyRooms: (): Promise<AxiosResponse<ApiResponse<Room[]>>> =>
    api.get('/rooms/my-rooms'),
  // ===========================================

  // Chủ trọ tạo phòng mới (sẽ ở trạng thái pending)
  createRoom: (roomData: Omit<Room, '_id' | 'landlord' | 'createdAt' | 'updatedAt' | 'status'>): Promise<AxiosResponse<ApiResponse<Room>>> =>
    api.post('/rooms', roomData),

  // Chủ trọ cập nhật phòng (có thể cần duyệt lại)
  updateRoom: (id: string, roomData: Partial<Room>): Promise<AxiosResponse<ApiResponse<Room>>> =>
    api.put(`/rooms/${id}`, roomData),

  // Chủ trọ hoặc admin xóa phòng
  deleteRoom: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    api.delete(`/rooms/${id}`),

  // Chủ trọ tải ảnh lên khi tạo/sửa phòng
  uploadImages: (formData: FormData): Promise<AxiosResponse<ApiResponse<string[]>>> =>
    api.post('/rooms/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' } // Quan trọng khi gửi file
    }),
};

// Định nghĩa kiểu dữ liệu cho việc tạo bài viết mới (Forum)
interface NewPostData {
  title: string;
  content: string;
  category: 'question' | 'experience' | 'general'; // Thêm category
  tags: string[];
  // images: string[]; // Bỏ images nếu createPost không xử lý
}

// --- FORUM API (Public & Authenticated User) ---
export const forumAPI = {
  // Lấy danh sách bài viết (public, đã duyệt)
  getPosts: (category?: string): Promise<AxiosResponse<ApiResponse<ForumPost[]>>> =>
    api.get('/forum/posts', { params: { category } }),

  // Lấy chi tiết một bài viết (public, đã duyệt)
  getPost: (id: string): Promise<AxiosResponse<ApiResponse<ForumPost>>> =>
    api.get(`/forum/posts/${id}`),

  // User tạo bài viết mới (sẽ ở trạng thái pending)
  createPost: (postData: NewPostData): Promise<AxiosResponse<ApiResponse<ForumPost>>> =>
    api.post('/forum/posts', postData),
  
  // === BƯỚC 3: THÊM HÀM getMyPosts ===
  getMyPosts: (): Promise<AxiosResponse<ApiResponse<ForumPost[]>>> =>
    api.get('/forum/posts/my-posts'),
  // ==================================

  // User cập nhật bài viết (có thể cần duyệt lại)
  updatePost: (id: string, postData: Partial<ForumPost>): Promise<AxiosResponse<ApiResponse<ForumPost>>> =>
    api.put(`/forum/posts/${id}`, postData),

  // User hoặc admin xóa bài viết
  deletePost: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    api.delete(`/forum/posts/${id}`),

  // User tạo trả lời cho bài viết đã duyệt
  createReply: (postId: string, content: string): Promise<AxiosResponse<ApiResponse<ForumReply>>> =>
    api.post(`/forum/posts/${postId}/replies`, { content }),
  
  // === THÊM HÀM LIKE/UNLIKE BÀI VIẾT ===
  likePost: (id: string): Promise<AxiosResponse<ApiResponse<ForumPost>>> =>
    api.patch(`/forum/posts/${id}/like`),
  // ===================================
};

// --- ADMIN API ---
export const adminAPI = {
  // === User Management ===
  getUsers: (params?: { page?: number; limit?: number; role?: string }): Promise<AxiosResponse<ApiResponse<User[]>>> =>
    api.get('/admin/users', { params }),

  updateUser: (id: string, userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put(`/admin/users/${id}`, userData),

  deleteUser: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    api.delete(`/admin/users/${id}`),
  // === Verification Management ===
  getVerifications: (status?: 'pending' | 'verified' | 'rejected'): Promise<AxiosResponse<ApiResponse<User[]>>> =>
    api.get('/admin/verifications', { params: { status } }), 

  verifyUser: (id: string): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put(`/admin/verifications/${id}`, { status: 'verified' }),

  rejectUser: (id: string, message: string): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put(`/admin/verifications/${id}`, { status: 'rejected', message }),
  // === Room Management ===
  // Lấy tất cả phòng (bao gồm cả pending, approved, rejected) cho admin quản lý chung
  getRooms: (params?: { page?: number; limit?: number; district?: string; isAvailable?: boolean; status?: string }): Promise<AxiosResponse<ApiResponse<Room[]>>> =>
    api.get('/admin/rooms', { params }), 

  // Cập nhật trạng thái "Còn trống"/"Đã thuê"
  updateRoomStatus: (id: string, isAvailable: boolean): Promise<AxiosResponse<ApiResponse<Room>>> =>
    api.put(`/admin/rooms/${id}/status`, { isAvailable }),

  // --- HÀM MỚI CHO DUYỆT PHÒNG ---
  getPendingRooms: (params?: { page?: number; limit?: number; search?: string }): Promise<AxiosResponse<ApiResponse<Room[]>>> =>
    api.get('/admin/rooms/pending', { params }), 

  approveRoom: (id: string): Promise<AxiosResponse<ApiResponse<Room>>> =>
    api.patch(`/admin/rooms/${id}/approve`), 

  rejectRoom: (id: string): Promise<AxiosResponse<ApiResponse<Room>>> =>
    api.patch(`/admin/rooms/${id}/reject`), 
  // -----------------------------

  // === Dashboard ===
  getDashboardStats: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/admin/dashboard/stats'),

  // === Forum Management ===
  // Lấy tất cả bài viết forum cho admin quản lý chung
  getAllPostsForAdmin: (params?: { page?: number; limit?: number; category?: string; status?: string }): Promise<AxiosResponse<ApiResponse<ForumPost[]>>> =>
    api.get('/admin/forum/posts', { params }),

  // Lấy bài viết forum đang chờ duyệt
  getPendingPosts: (category?: string): Promise<AxiosResponse<ApiResponse<ForumPost[]>>> =>
    api.get('/admin/forum/pending', { params: { category } }),

  // Duyệt bài viết forum
  approvePost: (id: string): Promise<AxiosResponse<ApiResponse<ForumPost>>> =>
    api.patch(`/admin/forum/posts/${id}/approve`),

  // Từ chối bài viết forum
  rejectPost: (id: string): Promise<AxiosResponse<ApiResponse<ForumPost>>> =>
    api.patch(`/admin/forum/posts/${id}/reject`),
  
  
};


export const notificationAPI = {
  // Lấy tất cả thông báo của user đã đăng nhập
  getNotifications: (): Promise<AxiosResponse<ApiResponse<Notification[]>>> =>
    api.get('/notifications'),

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: (): Promise<AxiosResponse<ApiResponse<{ count: number }>>> =>
    api.get('/notifications/unread-count'),

  // Đánh dấu tất cả là đã đọc
  markAllAsRead: (): Promise<AxiosResponse<ApiResponse<void>>> =>
    api.post('/notifications/mark-all-read'),
  
  // (Tùy chọn) Đánh dấu 1 cái là đã đọc
  markOneAsRead: (id: string): Promise<AxiosResponse<ApiResponse<Notification>>> =>
    api.patch(`/notifications/${id}/read`),
};
// ==========================================

export const conversationAPI = {
  // Lấy tất cả hội thoại (đã làm ở controller)
  getConversations: (): Promise<AxiosResponse<ApiResponse<Conversation[]>>> =>
    api.get('/conversations'),

  // Lấy tin nhắn (đã làm ở controller)
  getMessages: (convId: string): Promise<AxiosResponse<ApiResponse<Message[]>>> =>
    api.get(`/conversations/${convId}/messages`),

  sendMessage: (conversationId: string, content: string): Promise<AxiosResponse<ApiResponse<Message>>> =>
    api.post(`/conversations/${conversationId}/messages`, { content }),
  // ======================================

  // Tìm hoặc tạo hội thoại (ĐÂY LÀ HÀM SỬA LỖI 404)
  findOrCreate: (receiverId: string): Promise<AxiosResponse<ApiResponse<Conversation>>> =>
    api.post('/conversations', { receiverId }), // <-- Chỉ cần '/conversations'
};

export default api; 
export type { User, Room, SearchFilters, ForumPost, ForumReply, AuthResponse, ApiResponse, Notification, Message, Conversation };