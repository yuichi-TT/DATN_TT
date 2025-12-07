import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Tải biến môi trường từ file .env
dotenv.config();

// Cấu hình Cloudinary bằng các biến trong file .env
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Cấu hình lưu trữ cho Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req: any, file: any) => {
    return {
      folder: 'student-housing-uploads', // Tên thư mục bạn muốn lưu trên Cloudinary
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Các định dạng ảnh cho phép
      // public_id: file.originalname, // (Tùy chọn) Đặt tên file
    };
  },
});

// Khởi tạo multer với cấu hình lưu trữ
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 } // Giới hạn kích thước file, ví dụ 5MB
});

export default upload;

