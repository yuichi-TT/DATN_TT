import React from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'; // Icon cho liên hệ

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"> {/* Tăng padding */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Cột 1: Logo và Giới thiệu */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              {/* Bạn có thể dùng logo SVG ở đây */}
              <span className="text-2xl font-bold text-white">StudentHousing</span>
            </Link>
            <p className="text-sm text-gray-400">
              Hệ thống tìm kiếm phòng trọ sinh viên uy tín và hiện đại hàng đầu tại Đà Nẵng.
            </p>
          </div>

          {/* Cột 2: Liên kết nhanh */}
          <div>
            <h5 className="font-semibold text-white uppercase mb-4">Liên kết nhanh</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/room" className="hover:text-white transition-colors">Tìm phòng</Link></li>
              <li><Link to="/forum" className="hover:text-white transition-colors">Diễn đàn</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Về chúng tôi</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Liên hệ</Link></li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ */}
          <div>
            <h5 className="font-semibold text-white uppercase mb-4">Hỗ trợ</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="hover:text-white transition-colors">Câu hỏi thường gặp (FAQ)</Link></li>
              <li><Link to="/policy" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link></li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h5 className="font-semibold text-white uppercase mb-4">Liên hệ</h5>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center">
                <EnvelopeIcon className="w-5 h-5 mr-2 text-primary-400" />
                <a href="mailto:support@studenthousing.vn" className="hover:text-white transition-colors">
                  support@studenthousing.vn
                </a>
              </li>
              <li className="flex items-center">
                <PhoneIcon className="w-5 h-5 mr-2 text-primary-400" />
                <a href="tel:0123456789" className="hover:text-white transition-colors">
                  0123 456 789
                </a>
              </li>
            </ul>
          </div>

        </div>
        
        {/* Đường kẻ ngang và Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} StudentHousing. Phát triển bởi Gemini & bạn.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;