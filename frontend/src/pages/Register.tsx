import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Import Icons
import { User, Mail, Phone, Lock, Building, GraduationCap, ArrowRight, Loader2 } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'landlord'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role: 'student' | 'landlord') => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Input styles reusable - Sử dụng màu Brand Main cho viền khi focus
  const inputContainerClass = "relative group";
  const inputClass = "block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-all duration-300";
  const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-main transition-colors duration-300";

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* 1. ANIMATED BACKGROUND BLOBS (Đã cập nhật theo bảng màu) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Blob 1: Brand Light (Iceberg) */}
        <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-brand-light rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        {/* Blob 2: Brand Soft (Flax) */}
        <div className="absolute top-[-20%] right-[-20%] w-96 h-96 bg-brand-soft rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        {/* Blob 3: Brand Accent (Gamboge) nhạt */}
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-brand-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      {/* 2. MAIN CARD */}
      <div className="max-w-xl w-full relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-brand-main/10 border border-white/50 p-8 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-brand-main tracking-tight">
              Tạo tài khoản mới
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Tham gia cộng đồng <span className="font-bold text-brand-accent">RelistayDN</span> ngay hôm nay
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center animate-shake">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            
            {/* Role Selection (Custom UI) */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div 
                    onClick={() => handleRoleSelect('student')}
                    className={`cursor-pointer rounded-xl p-3 border-2 flex flex-col items-center justify-center transition-all duration-200 ${formData.role === 'student' ? 'border-brand-main bg-brand-light/20 text-brand-main' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-brand-light hover:bg-white'}`}
                >
                    <GraduationCap className={`w-6 h-6 mb-1 ${formData.role === 'student' ? 'text-brand-main' : 'text-gray-400'}`} />
                    <span className="font-bold text-sm">Sinh viên</span>
                </div>
                <div 
                    onClick={() => handleRoleSelect('landlord')}
                    className={`cursor-pointer rounded-xl p-3 border-2 flex flex-col items-center justify-center transition-all duration-200 ${formData.role === 'landlord' ? 'border-brand-main bg-brand-light/20 text-brand-main' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-brand-light hover:bg-white'}`}
                >
                    <Building className={`w-6 h-6 mb-1 ${formData.role === 'landlord' ? 'text-brand-main' : 'text-gray-400'}`} />
                    <span className="font-bold text-sm">Chủ trọ</span>
                </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className={inputContainerClass}>
                <User className={iconClass} />
                <input
                  id="name" name="name" type="text" required
                  value={formData.name} onChange={handleChange}
                  className={inputClass}
                  placeholder="Họ và tên hiển thị"
                />
              </div>

              <div className={inputContainerClass}>
                <Mail className={iconClass} />
                <input
                  id="email" name="email" type="email" required
                  value={formData.email} onChange={handleChange}
                  className={inputClass}
                  placeholder="Địa chỉ Email"
                />
              </div>

              <div className={inputContainerClass}>
                <Phone className={iconClass} />
                <input
                  id="phone" name="phone" type="tel" required
                  value={formData.phone} onChange={handleChange}
                  className={inputClass}
                  placeholder="Số điện thoại liên hệ"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={inputContainerClass}>
                    <Lock className={iconClass} />
                    <input
                    id="password" name="password" type="password" required
                    value={formData.password} onChange={handleChange}
                    className={inputClass}
                    placeholder="Mật khẩu"
                    />
                </div>

                <div className={inputContainerClass}>
                    <Lock className={iconClass} />
                    <input
                    id="confirmPassword" name="confirmPassword" type="password" required
                    value={formData.confirmPassword} onChange={handleChange}
                    className={inputClass}
                    placeholder="Xác nhận mật khẩu"
                    />
                </div>
              </div>
            </div>

            {/* Submit Button - Brand Main */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-brand-main hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-main transition-all shadow-lg hover:shadow-brand-main/30 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                    <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Đang xử lý...</>
                ) : (
                    <>Đăng ký tài khoản <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Bạn đã có tài khoản?{' '}
                {/* Link dùng màu Brand Accent (Vàng cam) */}
                <Link
                  to="/login"
                  className="font-bold text-brand-accent hover:text-yellow-600 transition-colors underline decoration-transparent hover:decoration-brand-accent"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;