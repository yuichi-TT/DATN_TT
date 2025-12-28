import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Import Icons hiện đại (Thay cho Emojis)
import { 
  Squares2X2Icon,       // Tổng quan
  UsersIcon,            // Người dùng
  ShieldCheckIcon,      // Xác minh
  HomeModernIcon,       // Phòng trọ
  ChatBubbleLeftRightIcon, // Diễn đàn
  ChartBarIcon,         // Báo cáo
  Bars3Icon,            // Menu Toggle
  XMarkIcon,            // Close Menu
  MagnifyingGlassIcon,  // Search
  BellIcon,             // Thông báo
  ArrowRightOnRectangleIcon // Logout
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Định nghĩa menu với icon chuẩn
  const menuItems = [
    {
      group: 'Dashboard',
      items: [
        { name: 'Tổng quan', path: '/admin', icon: Squares2X2Icon },
      ]
    },
    {
      group: 'Quản lý',
      items: [
        { name: 'Người dùng', path: '/admin/users', icon: UsersIcon },
        { name: 'Xác minh', path: '/admin/verifications', icon: ShieldCheckIcon },
        { name: 'Phòng trọ', path: '/admin/rooms', icon: HomeModernIcon },
        { name: 'Diễn đàn', path: '/admin/forum', icon: ChatBubbleLeftRightIcon },
      ]
    },
    {
      group: 'Thống kê',
      items: [
        { name: 'Báo cáo', path: '/admin/reports', icon: ChartBarIcon },
      ]
    }
  ];

  // Kiểm tra quyền Admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <ShieldCheckIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Truy cập bị từ chối</h1>
          <p className="text-gray-600 mb-6">Bạn không có quyền truy cập trang quản trị.</p>
          <Link to="/" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex font-sans text-slate-800">
      
      {/* ========================================================= */}
      {/* === MOBILE OVERLAY === */}
      {/* ========================================================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* === SIDEBAR (Style: Directory Dashboard) === */}
      {/* ========================================================= */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:shadow-none border-r border-gray-100 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Area */}
        <div className="flex items-center justify-between h-20 px-8 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
               <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">
              RelistayDN
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
          {menuItems.map((group, groupIdx) => (
            <div key={groupIdx}>
              <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                {group.group}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                        ${isActive 
                          ? 'bg-[#1e1b4b] text-white shadow-md shadow-indigo-900/20' // Active: Màu tối đậm như ảnh mẫu
                          : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600' // Inactive
                        }
                      `}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-300' : 'text-gray-400 group-hover:text-indigo-600'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Mini (Bottom Sidebar) */}
        <div className="p-4 border-t border-gray-50">
           <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Đăng xuất">
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
           </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* === MAIN CONTENT === */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 h-20">
          <div className="flex items-center justify-between h-full px-6 lg:px-8">
            {/* Left: Mobile Toggle & Search */}
            <div className="flex items-center gap-6 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 p-2 -ml-2 rounded-lg hover:bg-gray-100"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>

              {/* Search Bar (Style giống ảnh mẫu) */}
              <div className="hidden md:flex items-center w-full max-w-md bg-[#F3F4F6] rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
                <input 
                  type="text" 
                  placeholder="Search here..." 
                  className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
               {/* Notification Bell */}
               <button className="relative p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-50">
                  <BellIcon className="w-6 h-6" />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
               </button>
               
               <Link to="/" className="text-sm font-medium text-gray-500 hover:text-indigo-600 hidden sm:block">
                 Về trang chủ
               </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;