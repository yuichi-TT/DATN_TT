/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. Cấu hình Màu sắc (Đã cập nhật theo bảng màu Japanese Indigo & Gamboge)
      colors: {
        brand: {
          main: '#1E424D',   // Japanese Indigo: Màu chính (Header, Text tiêu đề, Nền tối)
          light: '#77B5D3',  // Iceberg: Màu nền gradient nhạt, các thẻ Card
          dark: '#122E36',   // Màu tối hơn của main (Dùng khi hover hoặc text đậm)
          accent: '#E19E11', // Gamboge: Màu vàng cam (Nút "Đăng ký", điểm nhấn quan trọng)
          soft: '#E5D595',   // Flax: Màu vàng nhạt (Nền button phụ, tag, badge)
        },
        // Map màu brand vào primary để tương thích code cũ
        primary: {
          50: '#f0f9ff',     // Xanh rất nhạt (Nền chung)
          100: '#E5D595',    // Flax (Brand Soft)
          200: '#bae6fd',    // Xanh trời nhạt
          300: '#77B5D3',    // Iceberg (Brand Light)
          400: '#38bdf8',    // Xanh sáng
          500: '#1E424D',    // Japanese Indigo (Brand Main)
          600: '#16333d',    // Đậm hơn xíu
          700: '#122E36',    // Brand Dark
          800: '#0e2329',
          900: '#081417',
        },
        secondary: {
          200: '#e5e7eb',
          300: '#d1d5db',
          800: '#1f2937',
        },
      },

      // 2. Cấu hình Background Image (Mới thêm cho đồng bộ)
      backgroundImage: {
        'hero-pattern': "linear-gradient(to right bottom, #f0f9ff, #e0f2fe, #77B5D3)", // Gradient xanh mát mẻ
      },

      // 3. Cấu hình Animation (Giữ nguyên cho Admin 2025)
      animation: {
        'blob': "blob 7s infinite", // Hiệu ứng nền Login
        'shake': "shake 0.5s cubic-bezier(.36,.07,.19,.97) both", // Hiệu ứng báo lỗi
        'fade-in-up': 'fadeInUp 0.5s ease-out', // Hiệu ứng xuất hiện nội dung
      },
      
      // 4. Định nghĩa Keyframes cho Animation
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" }
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}