
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; 

const AdminLogin: React.FC = () => {
    //  Khai báo state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    //  Lấy hook điều hướng và xác thực
    const navigate = useNavigate();
    const { adminLogin } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); 
        setIsLoading(true); 

        try {
            //  tự động xử lý việc gọi API và lưu token/user
            await adminLogin(email, password);
            
            // Nếu không có lỗi, chuyển hướng đến dashboard
            navigate('/admin', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại');
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            
            <div className="p-8 w-full max-w-md bg-gray-800 rounded-xl shadow-2xl">
                
                <h2 className="text-3xl font-bold text-center text-blue-300 mb-6 border-b border-gray-700 pb-3">
                    Admin Login
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Hiển thị lỗi */}
                    {error && (
                        <p className="p-3 bg-red-800 text-red-200 rounded-lg text-center font-medium">
                            {error}
                        </p>
                    )}
                    
                    {/* Trường Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            // Tailwind classes cho input
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                            placeholder="admin@example.com"
                        />
                    </div>
                    
                    {/* Trường Mật khẩu */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                            Mật khẩu
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            // Tailwind classes cho input
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                            placeholder="Nhập mật khẩu"
                        />
                    </div>
                    
                    {/* Nút Đăng nhập */}
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        // Tailwind classes cho button
                        className={`w-full py-2.5 rounded-lg text-gray-900 font-semibold shadow-md transition duration-200 
                            ${isLoading 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-300 hover:bg-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50'
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang tải...
                            </div>
                        ) : (
                            'Đăng nhập'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;