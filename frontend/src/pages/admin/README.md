# Admin Dashboard

Giao diện quản trị hoàn chỉnh cho hệ thống Student Housing System.

## 🎯 Tính năng chính

### Dashboard Overview
- **Thống kê tổng quan**: Số liệu người dùng, phòng trọ, hoạt động diễn đàn
- **Biểu đồ trực quan**: Tăng trưởng người dùng, phân bố phòng trọ
- **Hoạt động gần đây**: Timeline các hoạt động mới nhất
- **Metrics cards**: Các chỉ số quan trọng với xu hướng tăng/giảm

### Quản lý người dùng
- **Danh sách người dùng**: Xem tất cả người dùng với phân trang
- **Tìm kiếm và lọc**: Theo tên, email, vai trò
- **Chỉnh sửa thông tin**: Cập nhật thông tin người dùng
- **Phân quyền**: Thay đổi vai trò (student/landlord/admin)
- **Xóa người dùng**: Xóa tài khoản (có xác nhận)

### Quản lý phòng trọ
- **Danh sách phòng trọ**: Xem tất cả phòng với hình ảnh
- **Bộ lọc nâng cao**: Theo quận/huyện, trạng thái, giá
- **Quản lý trạng thái**: Đánh dấu phòng đã thuê/còn trống
- **Thống kê phòng**: Tổng số, phòng trống, phòng đã thuê
- **Xem chi tiết**: Link đến trang chi tiết phòng

### Quản lý diễn đàn
- **Kiểm duyệt bài viết**: Xem và quản lý tất cả bài viết
- **Phân loại nội dung**: Theo danh mục (hỏi đáp, kinh nghiệm, thảo luận)
- **Tìm kiếm nội dung**: Theo tiêu đề, nội dung, tác giả
- **Xóa bài viết**: Xóa nội dung không phù hợp
- **Thống kê diễn đàn**: Số bài viết, trả lời, người dùng hoạt động

### Báo cáo và phân tích
- **Báo cáo tổng quan**: Tổng hợp các chỉ số quan trọng
- **Báo cáo người dùng**: Phân tích tăng trưởng và phân bố
- **Báo cáo phòng trọ**: Thống kê giá thuê và tỷ lệ lấp đầy
- **Báo cáo diễn đàn**: Hoạt động và phân bố danh mục
- **Xuất báo cáo**: Tính năng xuất báo cáo (sẽ phát triển)

## 🛠️ Công nghệ sử dụng

- **React 19** với TypeScript
- **TanStack Query** cho data fetching
- **React Router** cho navigation
- **Tailwind CSS** cho styling
- **Responsive Design** cho mobile/desktop

## 📁 Cấu trúc file

```
src/pages/admin/
├── Dashboard.tsx          # Trang tổng quan
├── Users.tsx             # Quản lý người dùng
├── Rooms.tsx             # Quản lý phòng trọ
├── Forum.tsx             # Quản lý diễn đàn
├── Reports.tsx           # Báo cáo và phân tích
└── README.md            # Tài liệu này

src/components/
└── AdminLayout.tsx       # Layout riêng cho admin

src/pages/
└── Admin.tsx             # Router chính cho admin
```

## 🎨 UI/UX Features

### Layout
- **Sidebar Navigation**: Menu điều hướng với icons và mô tả
- **Responsive Design**: Tự động thu gọn trên mobile
- **User Info**: Hiển thị thông tin admin và nút đăng xuất
- **Breadcrumb**: Đường dẫn hiện tại

### Components
- **Cards**: Hiển thị thông tin dạng card
- **Tables**: Bảng dữ liệu với pagination
- **Modals**: Popup chỉnh sửa thông tin
- **Filters**: Bộ lọc tìm kiếm nâng cao
- **Stats Cards**: Hiển thị số liệu thống kê

### Interactions
- **Loading States**: Skeleton loading cho UX tốt
- **Error Handling**: Xử lý lỗi thân thiện
- **Confirmations**: Xác nhận trước khi xóa
- **Real-time Updates**: Cập nhật dữ liệu real-time

## 🔐 Bảo mật

- **Role-based Access**: Chỉ admin mới truy cập được
- **Authentication Check**: Kiểm tra đăng nhập
- **Permission Validation**: Xác thực quyền truy cập
- **Secure API Calls**: Tất cả API đều có authentication

## 📱 Responsive Design

- **Mobile First**: Thiết kế ưu tiên mobile
- **Breakpoints**: 
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Touch Friendly**: Tối ưu cho touch devices
- **Sidebar Collapse**: Tự động thu gọn trên mobile

## 🚀 Cách sử dụng

1. **Truy cập**: `/admin` (chỉ admin)
2. **Navigation**: Sử dụng sidebar để chuyển trang
3. **Quản lý**: Sử dụng các tính năng CRUD
4. **Báo cáo**: Xem thống kê và xuất báo cáo
5. **Đăng xuất**: Click nút đăng xuất ở sidebar

## 🔮 Tính năng tương lai

- **Real-time Notifications**: Thông báo real-time
- **Advanced Charts**: Biểu đồ nâng cao với Chart.js
- **Export Reports**: Xuất báo cáo PDF/Excel
- **Bulk Operations**: Thao tác hàng loạt
- **Activity Logs**: Nhật ký hoạt động
- **System Settings**: Cài đặt hệ thống
