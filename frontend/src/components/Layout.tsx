import React, { useState, useEffect, useRef } from 'react'; 
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { notificationAPI, conversationAPI } from '../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';

import Footer from '../components/Footer';

// --- Heroicons v2 ---
import { 
  ChatBubbleOvalLeftEllipsisIcon, 
  BellIcon, 
  PlusIcon, 
  ChevronDownIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

import { 
  ChatBubbleOvalLeftEllipsisIcon as ChatIconSolid,
  BellIcon as BellIconSolid 
} from '@heroicons/react/24/solid';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // === CẤU HÌNH TRANG TRÀN VIỀN ===
  // Chỉ những trang này Header mới trong suốt đè lên ảnh
  const immersivePages = ['/', '/room']; 
  const isImmersivePage = immersivePages.includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Header Solid khi cuộn xuống HOẶC không phải trang tràn viền
  const isSolidHeader = isScrolled || !isImmersivePage;
  const isActive = (path: string) => location.pathname === path;

  // Data fetching
  const { data: unreadData } = useQuery({
      queryKey: ['unreadCount'],
      queryFn: () => notificationAPI.getUnreadCount(),
      enabled: !!user,
      staleTime: 5 * 60 * 1000, 
  });
  const unreadCount = unreadData?.data?.data?.count || 0;

  const { data: conversations } = useQuery({
    queryKey: ['conversations_check'], 
    queryFn: async () => {
        const res = await conversationAPI.getConversations();
        return (res.data as any) || [];
    },
    enabled: !!user,
  });
  const hasMessages = conversations && conversations.length > 0;

  // --- STYLES ---
  const NAV_LINK = `relative text-sm font-bold transition-all duration-300 hover:opacity-80 flex flex-col items-center gap-1 group`;

  return (
    <div className="flex flex-col min-h-screen bg-primary-50 font-sans selection:bg-brand-main selection:text-white">
      
      <header 
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b
          ${isSolidHeader 
            ? 'bg-white/95 backdrop-blur-xl shadow-sm border-brand-light/20 py-2 h-20' 
            : 'bg-transparent border-transparent py-4 h-24' 
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            
            {/* === 1. LOGO MỚI === */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className={`p-2.5 rounded-xl transition-all duration-500 ${isSolidHeader ? 'bg-brand-main text-white shadow-lg shadow-brand-main/30' : 'bg-white/20 text-white backdrop-blur-md'}`}>
                <HomeIcon className="w-6 h-6" />
              </div>
              <span className={`text-2xl font-black tracking-tighter uppercase font-mono ${isSolidHeader ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-main to-brand-light' : 'text-white drop-shadow-md'}`}>
                Relistay<span className={isSolidHeader ? 'text-brand-dark' : 'text-white'}>DN</span>
              </span>
            </Link>
            
            {/* === 2. NAVIGATION === */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { path: '/', label: 'Trang chủ' },
                { path: '/room', label: 'Tìm phòng' },
                { path: '/forum', label: 'Diễn đàn' },
                ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Quản trị' }] : [])
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`${NAV_LINK} ${isSolidHeader ? (isActive(link.path) ? 'text-brand-main' : 'text-brand-dark/70') : (isActive(link.path) ? 'text-white' : 'text-white/80')}`}
                >
                  {link.label}
                  {/* Active Indicator: Dùng Brand Accent (Vàng) để nổi bật */}
                  <span className={`h-1 w-1 rounded-full mt-0.5 transition-all duration-300 ${
                      isActive(link.path) 
                        ? (isSolidHeader ? 'bg-brand-accent w-5' : 'bg-white w-5') 
                        : 'bg-transparent w-0 group-hover:w-1.5 group-hover:bg-current'
                  }`}></span>
                </Link>
              ))}
            </nav>

            {/* === 3. USER ACTIONS === */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {user.role === 'landlord' && (
                    /* Nút Đăng tin: Dùng Brand Accent (Vàng) để thôi thúc hành động */
                    <Link to="/landlord/dang-tin" className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brand-accent/20 transition-all hover:scale-105 active:scale-95 bg-brand-accent hover:bg-yellow-600 text-white mr-2">
                      <PlusIcon className="w-5 h-5 stroke-2" />
                      <span>Đăng tin</span>
                    </Link>
                  )}
                  
                  <Link to="/chat" className={`relative p-2.5 rounded-full transition-all duration-300 group ${isSolidHeader ? 'hover:bg-brand-light/10 text-brand-dark hover:text-brand-main' : 'hover:bg-white/20 text-white'}`}>
                    {hasMessages ? <ChatIconSolid className="w-6 h-6" /> : <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />}
                    {hasMessages && <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>}
                  </Link>

                  <Link to="/notifications" className={`relative p-2.5 rounded-full transition-all duration-300 group ${isSolidHeader ? 'hover:bg-brand-light/10 text-brand-dark hover:text-brand-main' : 'hover:bg-white/20 text-white'}`}>
                    {unreadCount > 0 ? <BellIconSolid className="w-6 h-6" /> : <BellIcon className="w-6 h-6" />}
                    {unreadCount > 0 && <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>}
                  </Link>
                  
                  {/* === PROFILE DROPDOWN === */}
                  <div className="relative ml-1" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                        className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border transition-all duration-300 ${isSolidHeader ? 'border-brand-light/30 bg-white hover:shadow-md' : 'border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20'}`}
                    >
                      <img 
                        className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm" 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                        alt={user.name} 
                        onError={(e) => (e.currentTarget.src = `https://placehold.co/40x40/E2E8F0/718096?text=${user.name[0]}`)} 
                      />
                      <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''} ${isSolidHeader ? 'text-brand-dark' : 'text-white/80'}`} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-3 w-72 origin-top-right rounded-2xl shadow-2xl shadow-brand-main/10 bg-white ring-1 ring-black/5 focus:outline-none overflow-hidden z-50 border border-brand-light/10"
                        >
                            <div className="px-5 py-5 bg-gradient-to-br from-brand-main/5 to-brand-light/10 border-b border-brand-light/20 flex items-center gap-3">
                                <img className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md" src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="" />
                                <div className="overflow-hidden">
                                    <p className="text-base font-bold text-brand-dark truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate font-medium">{user.email}</p>
                                </div>
                            </div>
                            <div className="p-2 space-y-1">
                                <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-brand-light/10 hover:text-brand-main transition-colors" onClick={() => setIsDropdownOpen(false)}>
                                    <UserCircleIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-main" /> Hồ sơ cá nhân
                                </Link>
                                {user.role === 'landlord' && (
                                    <Link to="/landlord/dang-tin" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-brand-light/10 hover:text-brand-main transition-colors" onClick={() => setIsDropdownOpen(false)}>
                                        <BuildingStorefrontIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-main" /> Quản lý tin đăng
                                    </Link>
                                )}
                            </div>
                            <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                                <button onClick={() => { logout(); setIsDropdownOpen(false); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 rounded-xl hover:bg-red-50 transition-colors">
                                    <ArrowRightOnRectangleIcon className="w-5 h-5" /> Đăng xuất
                                </button>
                            </div>
                        </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${isSolidHeader ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/20'}`}>Đăng nhập</Link>
                  {/* Nút Đăng ký: Brand Main */}
                  <Link to="/register" className={`px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brand-main/20 transition-all transform hover:scale-105 active:scale-95 ${isSolidHeader ? 'bg-brand-main text-white hover:bg-brand-dark' : 'bg-white text-brand-main hover:bg-gray-100'}`}>Đăng ký ngay</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* === FIX KHOẢNG TRẮNG === */}
      <main className={`flex-grow ${isImmersivePage ? '' : 'pt-20'}`}>
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;