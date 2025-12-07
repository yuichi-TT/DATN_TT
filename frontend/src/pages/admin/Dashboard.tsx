import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI, roomAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Home, Building, ArrowUpRight } from 'lucide-react';

// Component Card thống kê 
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; change: string; changeType: 'increase' | 'decrease' }> = ({ title, value, icon, change, changeType }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <span className="text-gray-500 font-medium">{title}</span>
            {icon}
        </div>
        <div className="mt-4">
            <p className="text-3xl font-bold">{value}</p>
            <div className="flex items-center text-sm mt-1">
                <span className={`flex items-center font-semibold ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                    <ArrowUpRight size={16} className="mr-1" />
                    {change}
                </span>
                <span className="text-gray-400 ml-2">so với tháng trước</span>
            </div>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    // Query 1: Lấy dữ liệu thống kê chung
    const { data: statsResponse, isLoading: isLoadingStats } = useQuery({
        queryKey: ['adminDashboardStats'],
        queryFn: adminAPI.getDashboardStats,
    });

    // Query 2: Lấy 5 phòng trọ mới nhất
    const { data: roomsResponse, isLoading: isLoadingRooms } = useQuery({
        queryKey: ['recentRooms'],
        queryFn: () => roomAPI.getRooms({ limit: 5, sortBy: 'createdAt', order: 'desc' }),
    });

    // Xử lý dữ liệu từ API
    const stats = statsResponse?.data.data || {};
    const recentRooms = roomsResponse?.data.data || [];

    const userRoleData = [
        { name: 'Sinh viên', value: stats.students || 0 },
        { name: 'Chủ trọ', value: stats.landlords || 0 },
    ];
    const COLORS = ['#0088FE', '#00C49F'];

    const isLoading = isLoadingStats || isLoadingRooms;

    if (isLoading) {
        return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Tổng quan hệ thống</h1>
                <p className="text-gray-500 mt-1">Thống kê và phân tích tổng quan về hoạt động của hệ thống</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Tổng người dùng" value={stats.totalUsers || 0} icon={<Users className="text-blue-500" />} change="+12%" changeType="increase" />
                <StatCard title="Sinh viên" value={stats.students || 0} icon={<Users className="text-green-500" />} change="+8%" changeType="increase" />
                <StatCard title="Chủ trọ" value={stats.landlords || 0} icon={<Home className="text-orange-500" />} change="+15%" changeType="increase" />
                <StatCard title="Tổng phòng trọ" value={stats.totalRooms || 0} icon={<Building className="text-purple-500" />} change="+5%" changeType="increase" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-4">Tăng trưởng người dùng (6 tháng)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.userGrowth || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Người dùng mới" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-4">Phân bổ người dùng</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={userRoleData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label>
                                {userRoleData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
      
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-lg mb-4">Phòng trọ mới đăng</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="p-4">Tiêu đề</th>
                                <th className="p-4">Giá</th>
                                <th className="p-4">Ngày đăng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentRooms.length > 0 ? recentRooms.map((room: any) => (
                                <tr key={room._id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium">{room.title}</td>
                                    <td className="p-4 text-green-600 font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)}</td>
                                    <td className="p-4 text-gray-500">{new Date(room.createdAt).toLocaleDateString('vi-VN')}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-gray-500">Chưa có phòng trọ nào được đăng.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;