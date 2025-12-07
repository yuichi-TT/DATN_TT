/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Quét tất cả các file trong thư mục src
  ],
  theme: {
    extend: {
      colors: {
        // 1. Bộ màu thương hiệu mới (Dùng chính xác mã màu bạn cung cấp)
        brand: {
          dark: '#473472',    // Tím đậm (Dùng cho Tiêu đề, Chữ đậm)
          main: '#53629E',    // Tím xanh (Dùng cho Nút bấm chính, Link)
          accent: '#87BAC3',  // Xanh ngọc (Dùng cho Viền, Icon trang trí)
          light: '#D6F4ED',   // Xanh Mint (Dùng cho Nền background)
        },

        // 2. Cập nhật Primary (Để tự động đổi màu các component cũ đang dùng class primary)
        // Tôi đã map các mã màu của bạn vào các thang độ đậm nhạt tương ứng
        primary: {
          50: '#f4fbf9',       // Rất nhạt
          100: '#D6F4ED',      // <== Màu Mint (Nền nhẹ)
          200: '#aedce4',
          300: '#87BAC3',      // <== Màu Accent (Viền)
          400: '#6d8eb0',
          500: '#53629E',      // <== Màu Chính (Nút bấm chuẩn)
          600: '#4a578e',      // Đậm hơn chút (Dùng cho hover nút)
          700: '#473472',      // <== Màu Dark (Chữ đậm/Nền tối)
          800: '#392a5b',
          900: '#2b1f44',
        },

        // 3. Secondary (Giữ nguyên hoặc tùy chỉnh thêm)
        secondary: {
          200: '#e5e7eb', 
          300: '#d1d5db', 
          800: '#1f2937', 
        },
      },
      // ... các phần extend khác nếu có
    },
  },
  plugins: [],
}