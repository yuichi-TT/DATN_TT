import React from 'react';
import { Link } from 'react-router-dom';
// --- Icons (Heroicons v2) ---
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  ArrowRightIcon,
  HomeIcon,
  // Icon cho phần Khám phá
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  // Icon cho phần Hỗ trợ
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // Style chung cho các link trong footer để gọn code
  const linkItemClass = "group flex items-center gap-2 text-brand-light/70 hover:text-brand-accent transition-colors duration-300";
  const iconClass = "w-5 h-5 text-brand-accent/70 group-hover:text-brand-accent transition-colors";

  return (
    <footer className="bg-brand-dark text-brand-light/80 relative overflow-hidden font-sans pt-20 pb-10 mt-auto border-t-4 border-brand-main">
      
      {/* 1. BACKGROUND DECORATION */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-main/20 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-accent/5 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* 2. NEWSLETTER SECTION */}
        <div className="bg-brand-main/30 backdrop-blur-md border border-brand-light/10 rounded-3xl p-8 md:p-12 mb-16 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-brand-accent"></div>
            
            <div className="md:w-1/2">
                <h3 className="text-2xl font-bold text-white mb-2">Đăng ký nhận tin mới nhất</h3>
                <p className="text-brand-light/70">Nhận thông báo về phòng trọ mới và ưu đãi độc quyền từ RelistayDN.</p>
            </div>
            
            <div className="md:w-1/2 w-full">
                <form className="flex flex-col sm:flex-row gap-3">
                    <input 
                        type="email" 
                        placeholder="Nhập email của bạn..." 
                        className="flex-grow px-5 py-3.5 rounded-xl bg-brand-dark/50 border border-brand-light/20 text-white placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all"
                    />
                    <button 
                        type="button" 
                        className="px-6 py-3.5 bg-brand-accent hover:bg-yellow-500 text-brand-dark font-bold rounded-xl shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                    >
                        Đăng ký <ArrowRightIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Cột 1: Brand Info */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <div className="p-2 bg-brand-main/50 rounded-lg text-brand-accent group-hover:bg-brand-accent group-hover:text-brand-dark transition-all duration-300">
                <HomeIcon className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">
                Relistay<span className="text-brand-accent">DN</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-brand-light/60">
              Nền tảng kết nối sinh viên và chủ trọ uy tín hàng đầu tại Đà Nẵng. Tìm phòng nhanh chóng, an toàn và tiện lợi.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-4 pt-2">
                {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                    <a key={social} href="#" className="w-10 h-10 rounded-full bg-brand-main/40 flex items-center justify-center text-white hover:bg-brand-accent hover:text-brand-dark transition-all duration-300">
                        <span className="capitalize text-xs font-bold">{social[0]}</span>
                    </a>
                ))}
            </div>
          </div>

          {/* Cột 2: Khám phá (ĐÃ THAY ICON) */}
          <div>
            <h5 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                <span className="w-8 h-1 bg-brand-accent rounded-full"></span> Khám phá
            </h5>
            <ul className="space-y-4">
              <li>
                <Link to="/room" className={linkItemClass}>
                  <MagnifyingGlassIcon className={iconClass} />
                  Tìm phòng trọ
                </Link>
              </li>
              <li>
                <Link to="/room?district=HaiChau" className={linkItemClass}>
                  <BuildingOffice2Icon className={iconClass} />
                  Phòng quận Hải Châu
                </Link>
              </li>
              <li>
                <Link to="/room?district=LienChieu" className={linkItemClass}>
                  <AcademicCapIcon className={iconClass} />
                  Phòng gần Bách Khoa
                </Link>
              </li>
              <li>
                <Link to="/forum" className={linkItemClass}>
                  <ChatBubbleLeftRightIcon className={iconClass} />
                  Diễn đàn sinh viên
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ (ĐÃ THÊM ICON) */}
          <div>
            <h5 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                <span className="w-8 h-1 bg-brand-accent rounded-full"></span> Hỗ trợ
            </h5>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className={linkItemClass}>
                  <InformationCircleIcon className={iconClass} />
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to="/faq" className={linkItemClass}>
                  <QuestionMarkCircleIcon className={iconClass} />
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link to="/policy" className={linkItemClass}>
                  <ShieldCheckIcon className={iconClass} />
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/terms" className={linkItemClass}>
                  <DocumentTextIcon className={iconClass} />
                  Điều khoản dịch vụ
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h5 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                <span className="w-8 h-1 bg-brand-accent rounded-full"></span> Liên hệ
            </h5>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <MapPinIcon className="w-6 h-6 text-brand-accent flex-shrink-0 mt-0.5" />
                <span className="text-brand-light/70">54 Nguyễn Lương Bằng, Liên Chiểu, Đà Nẵng</span>
              </li>
              <li className="flex items-center gap-3">
                <EnvelopeIcon className="w-6 h-6 text-brand-accent flex-shrink-0" />
                <a href="mailto:support@relistaydn.vn" className="hover:text-white transition-colors">
                  support@relistaydn.vn
                </a>
              </li>
              <li className="flex items-center gap-3">
                <PhoneIcon className="w-6 h-6 text-brand-accent flex-shrink-0" />
                <a href="tel:0905123456" className="text-lg font-bold text-white hover:text-brand-accent transition-colors">
                  0905 123 456
                </a>
              </li>
            </ul>
          </div>

        </div>
        
        {/* Footer Bottom */}
        <div className="pt-8 border-t border-brand-light/10 flex flex-col md:flex-row justify-between items-center text-sm gap-4 text-brand-light/50">
          <p>&copy; {currentYear} <span className="text-white font-bold">RelistayDN</span>. All rights reserved.</p>
          <div className="flex gap-6">
             <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
             <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
             <span className="hover:text-white cursor-pointer transition-colors">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;