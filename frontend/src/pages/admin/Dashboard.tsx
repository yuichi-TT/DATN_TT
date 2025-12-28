import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI, roomAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Home, Building, ArrowUpRight, TrendingUp } from 'lucide-react';


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; change: string; colorClass: string }> = ({ title, value, icon, change, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
                
                {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
                    className: `w-6 h-6 ${colorClass.replace('bg-', 'text-')}` 
                }) : icon}
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <ArrowUpRight size={14} />
                {change}
            </span>
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { data: statsResponse, isLoading: isLoadingStats } = useQuery({
        queryKey: ['adminDashboardStats'],
        queryFn: adminAPI.getDashboardStats,
    });

    const { data: roomsResponse, isLoading: isLoadingRooms } = useQuery({
        queryKey: ['recentRooms'],
        queryFn: () => roomAPI.getRooms({ limit: 5, sortBy: 'createdAt', order: 'desc' }),
    });

    const stats = statsResponse?.data.data || {};
    const recentRooms = roomsResponse?.data.data || [];

    // Data biểu đồ
    const userRoleData = [
        { name: 'Sinh viên', value: stats.students || 0 },
        { name: 'Chủ trọ', value: stats.landlords || 0 },
    ];
    // Màu biểu đồ Pie: Tím (Brand Main) & Xanh Mint (Brand Accent)
    const COLORS = ['#53629E', '#87BAC3']; 

    const isLoading = isLoadingStats || isLoadingRooms;

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 animate-pulse">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
                <p className="text-gray-500 text-sm mt-1">Chào mừng quay trở lại, đây là báo cáo hôm nay.</p>
            </div>

            {/* === 2. Stats Grid === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Tổng người dùng" 
                    value={stats.totalUsers || 0} 
                    icon={<Users />} 
                    change="+12%" 
                    colorClass="bg-blue-500" // Icon xanh dương
                />
                <StatCard 
                    title="Sinh viên" 
                    value={stats.students || 0} 
                    icon={<Users />} 
                    change="+8%" 
                    colorClass="bg-brand-main" // Icon Tím (Brand)
                />
                <StatCard 
                    title="Chủ trọ" 
                    value={stats.landlords || 0} 
                    icon={<Home />} 
                    change="+15%" 
                    colorClass="bg-orange-500" // Icon Cam
                />
                <StatCard 
                    title="Tổng phòng trọ" 
                    value={stats.totalRooms || 0} 
                    icon={<Building />} 
                    change="+5%" 
                    colorClass="bg-brand-accent" // Icon Xanh Ngọc (Brand)
                />
            </div>

            {/* === 3. Charts Section === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-brand-main" />
                            Tăng trưởng người dùng
                        </h3>
                        <select className="text-xs bg-gray-50 border-none rounded-lg py-1 px-2 text-gray-500 outline-none cursor-pointer">
                            <option>6 tháng qua</option>
                            <option>Năm nay</option>
                        </select>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.userGrowth || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: '#f9fafb'}}
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                                />
                                <Bar dataKey="Người dùng mới" fill="#53629E" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-6">Phân bổ người dùng</h3>
                    <div className="flex-1 flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie 
                                    data={userRoleData} 
                                    cx="50%" cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {userRoleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text Trick */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-gray-800">{stats.totalUsers || 0}</span>
                            <span className="text-xs text-gray-500">Tổng số</span>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-center gap-4">
                        {userRoleData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
      
            {/* === 4. Recent Rooms Table (Modern Style) === */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">Phòng trọ mới đăng</h3>
                    <button className="text-brand-main text-sm font-medium hover:underline">Xem tất cả</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-xs uppercase text-gray-400 font-semibold">
                            <tr>
                                <th className="p-4 rounded-l-xl">Tiêu đề</th>
                                <th className="p-4">Giá thuê</th>
                                <th className="p-4 rounded-r-xl text-right">Ngày đăng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentRooms.length > 0 ? recentRooms.map((room: any) => (
                                <tr key={room._id} className="group hover:bg-indigo-50/30 transition-colors">
                                    <td className="p-4">
                                        <p className="font-semibold text-gray-800 group-hover:text-brand-main transition-colors line-clamp-1">
                                            {room.title}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-bold">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right text-sm text-gray-500">
                                        {new Date(room.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-400 italic">
                                        Chưa có dữ liệu phòng trọ.
                                    </td>
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