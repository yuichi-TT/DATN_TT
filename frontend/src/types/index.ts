export interface User {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: 'student' | 'landlord' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  _id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  address: string;
  district: string;
  city: string;
  // Giữ cấu trúc GeoJSON nếu bạn đã sửa ở model backend
  // Hoặc comment out/xóa hoàn toàn nếu bạn đã xóa ở model backend
  coordinates?: { type: 'Point', coordinates: [number, number] };
  images: string[];
  amenities: string[];
  landlord: User; // Quan trọng: Đảm bảo User type đúng
  isAvailable: boolean;
  status: 'pending' | 'approved' | 'rejected'; // <-- THÊM DÒNG NÀY
  createdAt: string;
  updatedAt: string;
  electricityPrice?: number; // Thêm dấu ? để tránh lỗi nếu dữ liệu cũ chưa có
  waterPrice?: number;
  otherPrice?: number;
}

export interface SearchFilters {
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  district?: string;
  amenities?: string[];
  isAvailable?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  landlord?: string; 
  status?: string;
}

export interface ForumPost {
  _id: string;
  title: string;
  content: string;
  author: User; // Đảm bảo User type đúng
  category: 'question' | 'experience' | 'general';
  tags: string[];
  replies: ForumReply[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  likes?: string[];
  images?: string[];
}

export interface ForumReply {
  _id: string;
  content: string;
  author: User; // Đảm bảo User type đúng
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number; // Tổng số bản ghi
  pages: number; // Tổng số trang
  // Các trường khác có thể có hoặc không tùy API
}
// export interface ApiResponse<T> {
//   success: boolean;
//   // Sửa đổi: data bên trong có thể là một object chứa data và pagination
//   data: {
//       data: T;
//       pagination?: Pagination;
//   } | T; // Hoặc chỉ là T nếu API không trả về pagination
//   message?: string;
// }

// Cập nhật ApiResponse để khớp với cấu trúc trả về thực tế từ backend
// (Thường là một object chứa data và pagination bên trong)
export interface ApiResponse<T> {
  success: boolean;
  data: T; // Dữ liệu chính (ví dụ: Room[] hoặc ForumPost[])
  pagination?: Pagination; // Pagination nằm cùng cấp với data chính
  message?: string;
}

export interface Notification {
  _id: string;
  user: string; // User ID
  message: string;
  type?: 'room_approved' | 'room_rejected' | 'new_reply' | 'system';
  link?: string; // Đường dẫn khi bấm vào (ví dụ: /room/123)
  isRead: boolean;
  createdAt: string;
}
export type Message = {
  _id: string;
  conversationId: string;
  sender: User; // Dùng 'User' type bạn đã có
  text: string;
  createdAt: string; 
  updatedAt: string; 
};

export type Conversation = {
  _id: string;
  participants: User[]; // Mảng các User
  lastMessage?: { // Optional
    text: string;
    sender: User; 
    createdAt: string;
  };
  createdAt: string; 
  updatedAt: string; 
};