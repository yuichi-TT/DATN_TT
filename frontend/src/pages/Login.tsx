import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// --- Icons Components ---
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); 

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      
      {/* --- CỘT TRÁI: ẢNH MINH HỌA --- */}
      {/* Sử dụng bg-brand-dark làm nền gốc */}
      <div className="hidden lg:flex w-1/2 bg-brand-dark relative overflow-hidden">
        {/* Gradient phủ: Brand Dark -> Brand Main */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/95 to-brand-main/80 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
          alt="RelistayDN Living Room" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
        />
        <div className="relative z-20 flex flex-col justify-center h-full px-12 text-white">
          <h2 className="text-4xl font-bold mb-6">Chào mừng trở lại!</h2>
          <p className="text-lg text-gray-200 mb-8">
            Tiếp tục hành trình tìm kiếm không gian sống lý tưởng của bạn tại Đà Nẵng cùng RelistayDN.
          </p>
          <div className="flex gap-4">
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                <p className="font-bold text-2xl">1000+</p>
                <p className="text-sm opacity-80">Phòng trọ xác thực</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                <p className="font-bold text-2xl">24/7</p>
                <p className="text-sm opacity-80">Hỗ trợ tìm kiếm</p>
             </div>
          </div>
        </div>
      </div>

      {/* --- CỘT PHẢI: FORM ĐĂNG NHẬP --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Đăng nhập</h2>
            <p className="mt-2 text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              {/* Link sử dụng brand-accent cho nổi bật và đồng bộ với trang Register */}
              <Link to="/register" className="font-bold text-brand-accent hover:text-yellow-600 transition-colors">
                Tạo tài khoản mới
              </Link>
            </p>
          </div>

          <div className="flex flex-col gap-3">
             <button type="button" className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                <GoogleIcon className="w-5 h-5" />
                <span>Tiếp tục với Google</span>
             </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">Hoặc đăng nhập bằng Email</span></div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm animate-fade-in">
                <p className="font-bold">Lỗi!</p>
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {/* Input focus đổi sang brand-main */}
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="name@example.com"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                   <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                   {/* Link quên mật khẩu dùng brand-main */}
                   <Link to="/forgot-password" className="text-xs font-medium text-brand-main hover:text-brand-dark">Quên mật khẩu?</Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none transition-all bg-gray-50 focus:bg-white pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              {/* Checkbox đổi màu */}
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-brand-main focus:ring-brand-main border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* NÚT ĐĂNG NHẬP: Brand Main */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-main/20 text-sm font-bold text-white bg-brand-main hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-main disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </div>
              ) : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;