import React, { useState, useEffect } from 'react'; 
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { notificationAPI, conversationAPI } from '../services/api'; 

import Footer from '../components/Footer';

// --- SVG Icons ---
const IconMessage: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const IconBell: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
  </svg>
);

const IconChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const isTransparentHeaderPage = location.pathname === '/' || location.pathname === '/room';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20); 
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isSolidHeader = isScrolled || !isTransparentHeaderPage;
  const isActive = (path: string) => location.pathname === path;

  // 1. Query lấy thông báo
  const { data: unreadData } = useQuery({
      queryKey: ['unreadCount'],
      queryFn: () => notificationAPI.getUnreadCount(),
      enabled: !!user,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true, 
  });
  const unreadCount = unreadData?.data?.data?.count || 0;

  // 2. Query lấy tin nhắn
  const { data: conversations } = useQuery({
    queryKey: ['conversations_check'], 
    queryFn: async () => {
        const res = await conversationAPI.getConversations();
        return (res.data as any) || [];
    },
    enabled: !!user,
  });
  
  const hasMessages = conversations && conversations.length > 0;

  // --- CLASS CONSTANTS ---
  const NAV_LINK_BASE = "inline-flex items-center h-16 px-1 pt-1 border-b-2 text-sm font-bold transition-all duration-300";
  const NAV_LINK_ACTIVE_SOLID = "border-brand-main text-brand-main";
  const NAV_LINK_ACTIVE_TRANSPARENT = "border-white text-white";
  const NAV_LINK_INACTIVE_SOLID = "border-transparent text-gray-600 hover:text-brand-main hover:border-brand-accent/50";
  const NAV_LINK_INACTIVE_TRANSPARENT = "border-transparent text-white/90 hover:text-white hover:border-white/50";

  return (
    <div className="flex flex-col min-h-screen bg-brand-light">
      
      <header 
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
          ${isSolidHeader 
            ? 'bg-white/95 backdrop-blur-md shadow-md' 
            : 'bg-transparent' 
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* === LOGO === */}
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div 
                className={`
                  text-2xl font-extrabold tracking-tight transition-colors duration-300 flex items-center gap-2
                  ${isSolidHeader ? 'text-brand-dark' : 'text-white'}
                `}
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-300">🏠</span> 
                <span>RelistayDN</span>
              </div>
            </Link>
            
            {/* === NAVIGATION === */}
            <nav className="hidden md:flex space-x-8">
              {[
                { path: '/', label: 'Trang chủ' },
                { path: '/room', label: 'Tìm phòng' },
                { path: '/forum', label: 'Diễn đàn' },
                ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Quản trị' }] : [])
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    ${NAV_LINK_BASE}
                    ${isActive(link.path) 
                      ? (isSolidHeader ? NAV_LINK_ACTIVE_SOLID : NAV_LINK_ACTIVE_TRANSPARENT)
                      : (isSolidHeader ? NAV_LINK_INACTIVE_SOLID : NAV_LINK_INACTIVE_TRANSPARENT)
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* === USER MENU === */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  {/* Nút Đăng tin */}
                  {user.role === 'landlord' && (
                    <Link
                      to="/landlord/dang-tin"
                      className={`
                        px-4 py-2 rounded-full text-sm font-bold shadow-md transition-all transform hover:scale-105 hidden sm:block
                        ${isSolidHeader 
                            ? 'bg-brand-main text-white hover:bg-brand-dark' 
                            : 'bg-white text-brand-main hover:bg-gray-100'
                        }
                      `}
                    >
                      Đăng tin mới
                    </Link>
                  )}
                  
                  {/* === ICON TIN NHẮN === */}
                  <Link 
                    to="/chat"
                    className={`
                        relative p-2 rounded-full focus:outline-none transition-colors duration-300
                        ${isSolidHeader 
                        ? 'text-gray-600 hover:bg-brand-light hover:text-brand-main' 
                        : 'text-white hover:bg-white/20'
                        }
                    `}
                  >
                    <IconMessage className="h-6 w-6" />
                    {hasMessages && (
                        <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                    )}
                  </Link>

                  {/* === ICON THÔNG BÁO (Đã cập nhật chấm đỏ) === */}
                  <Link 
                    to="/notifications"
                    className={`
                        relative p-2 rounded-full focus:outline-none transition-colors duration-300
                        ${isSolidHeader 
                        ? 'text-gray-600 hover:bg-brand-light hover:text-brand-main' 
                        : 'text-white hover:bg-white/20'
                        }
                    `}
                  >
                    <IconBell className="h-6 w-6" />
                    
                    {/* SỬA ĐỔI: Thay hiển thị số bằng chấm đỏ */}
                    {unreadCount > 0 && (
                         <span className="absolute top-1.5 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                    )}
                  </Link>
                  
                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                      className="flex items-center space-x-1 rounded-full focus:outline-none group"
                    >
                      <img 
                        className={`h-9 w-9 rounded-full object-cover border-2 transition-colors ${isSolidHeader ? 'border-brand-accent' : 'border-white/80'}`}
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                        alt={user.name} 
                        onError={(e) => (e.currentTarget.src = `https://placehold.co/40x40/E2E8F0/718096?text=${user.name[0]}`)}
                      />
                      <IconChevronDown 
                        className={`
                          h-4 w-4 transition-colors duration-300
                          ${isSolidHeader ? 'text-gray-600 group-hover:text-brand-main' : 'text-white group-hover:text-gray-200'}
                        `} 
                      />
                    </button>

                    {isDropdownOpen && (
                      <div 
                        className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden animate-fadeIn z-50"
                        onMouseLeave={() => setIsDropdownOpen(false)} 
                      >
                        <div className="px-4 py-4 border-b border-brand-accent/20 bg-brand-light/30">
                          <p className="text-sm font-bold text-brand-dark truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        
                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-light hover:text-brand-main transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            👤 Trang cá nhân
                          </Link>
                          {user.role === 'landlord' && (
                            <Link
                              to="/landlord/dang-tin"
                              className="block sm:hidden px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-light hover:text-brand-main transition-colors" 
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              📝 Đăng tin mới
                            </Link>
                          )}
                          
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => {
                              logout();
                              setIsDropdownOpen(false);
                            }}
                            className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                          >
                            🚪 Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                
                // Nút Login/Register
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className={`
                      text-sm font-bold transition-colors
                      ${isSolidHeader 
                        ? 'text-gray-600 hover:text-brand-main' 
                        : 'text-white hover:text-gray-200'
                      }
                    `}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className={`
                        px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all transform hover:scale-105
                        ${isSolidHeader
                            ? 'bg-brand-main text-white hover:bg-brand-dark'
                            : 'bg-white text-brand-main hover:bg-gray-100'
                        }
                    `}
                  >
                    Đăng ký ngay
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`flex-grow ${isTransparentHeaderPage ? '' : 'pt-20 pb-8'}`}>
        {children}
      </main>

      <Footer />
      
    </div>
  );
};

export default Layout;