import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [selectedReport, setSelectedReport] = useState('overview');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminAPI.getDashboardStats(),
  });

  const reportTypes = [
    { id: 'overview', name: 'Tổng quan', icon: '📊' },
    { id: 'users', name: 'Người dùng', icon: '👥' },
    { id: 'rooms', name: 'Phòng trọ', icon: '🏠' },
    { id: 'forum', name: 'Diễn đàn', icon: '💬' },
    { id: 'revenue', name: 'Doanh thu', icon: '💰' }
  ];

  const periods = [
    { value: '7', label: '7 ngày qua' },
    { value: '30', label: '30 ngày qua' },
    { value: '90', label: '3 tháng qua' },
    { value: '365', label: '1 năm qua' }
  ];

  const mockData = {
    userGrowth: [
      { date: '2024-01-01', users: 100, students: 80, landlords: 20 },
      { date: '2024-01-02', users: 120, students: 95, landlords: 25 },
      { date: '2024-01-03', users: 140, students: 110, landlords: 30 },
      { date: '2024-01-04', users: 160, students: 125, landlords: 35 },
      { date: '2024-01-05', users: 180, students: 140, landlords: 40 },
    ],
    roomStats: {
      total: 150,
      available: 45,
      occupied: 105,
      averagePrice: 2500000,
      priceRange: {
        min: 1000000,
        max: 8000000
      }
    },
    forumActivity: {
      totalPosts: 89,
      totalReplies: 234,
      activeUsers: 45,
      topCategories: [
        { name: 'Hỏi đáp', count: 45, percentage: 50.6 },
        { name: 'Kinh nghiệm', count: 28, percentage: 31.5 },
        { name: 'Thảo luận', count: 16, percentage: 18.0 }
      ]
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="card p-6 animate-pulse">
              <div className="space-y-3">
                <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                <div className="bg-gray-300 h-8 rounded w-3/4"></div>
                <div className="bg-gray-300 h-3 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.data.data?.users?.total || 0}</p>
              <p className="text-sm text-green-600">+12% so với tháng trước</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng phòng trọ</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.data.data?.rooms?.total || 0}</p>
              <p className="text-sm text-green-600">+8% so với tháng trước</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏠</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tỷ lệ lấp đầy</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.data.data?.rooms?.total ? 
                  Math.round(((stats.data.data.rooms.total - stats.data.data.rooms.available) / stats.data.data.rooms.total) * 100) : 0}%
              </p>
              <p className="text-sm text-green-600">+5% so với tháng trước</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hoạt động diễn đàn</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.data.data?.forum?.totalPosts || 0}</p>
              <p className="text-sm text-green-600">+20% so với tháng trước</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tăng trưởng người dùng</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-gray-500">Biểu đồ tăng trưởng</p>
              <p className="text-sm text-gray-400">Sẽ tích hợp Chart.js</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố phòng trọ</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Phòng trống</span>
              <span className="font-semibold">{mockData.roomStats.available}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(mockData.roomStats.available / mockData.roomStats.total) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Phòng đã thuê</span>
              <span className="font-semibold">{mockData.roomStats.occupied}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${(mockData.roomStats.occupied / mockData.roomStats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsersReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats?.data.data?.users?.students || 0}
          </div>
          <div className="text-sm text-gray-600">Sinh viên</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats?.data.data?.users?.landlords || 0}
          </div>
          <div className="text-sm text-gray-600">Chủ trọ</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {stats?.data.data?.users?.total || 0}
          </div>
          <div className="text-sm text-gray-600">Tổng người dùng</div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân tích người dùng</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tỷ lệ sinh viên</span>
            <span className="font-semibold">
              {stats?.data.data?.users?.total ? 
                Math.round((stats.data.data.users.students / stats.data.data.users.total) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full"
              style={{ 
                width: `${stats?.data.data?.users?.total ? 
                  (stats.data.data.users.students / stats.data.data.users.total) * 100 : 0}%` 
              }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tỷ lệ chủ trọ</span>
            <span className="font-semibold">
              {stats?.data.data?.users?.total ? 
                Math.round((stats.data.data.users.landlords / stats.data.data.users.total) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full"
              style={{ 
                width: `${stats?.data.data?.users?.total ? 
                  (stats.data.data.users.landlords / stats.data.data.users.total) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoomsReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-gray-600 mb-2">
            {stats?.data.data?.rooms?.total || 0}
          </div>
          <div className="text-sm text-gray-600">Tổng phòng</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats?.data.data?.rooms?.available || 0}
          </div>
          <div className="text-sm text-gray-600">Phòng trống</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">
            {stats?.data.data?.rooms?.occupied || 0}
          </div>
          <div className="text-sm text-gray-600">Phòng đã thuê</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {mockData.roomStats.averagePrice.toLocaleString()} VNĐ
          </div>
          <div className="text-sm text-gray-600">Giá trung bình</div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân tích giá thuê</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Giá thấp nhất</span>
            <span className="font-semibold">{mockData.roomStats.priceRange.min.toLocaleString()} VNĐ</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Giá cao nhất</span>
            <span className="font-semibold">{mockData.roomStats.priceRange.max.toLocaleString()} VNĐ</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Giá trung bình</span>
            <span className="font-semibold">{mockData.roomStats.averagePrice.toLocaleString()} VNĐ</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderForumReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {mockData.forumActivity.totalPosts}
          </div>
          <div className="text-sm text-gray-600">Tổng bài viết</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {mockData.forumActivity.totalReplies}
          </div>
          <div className="text-sm text-gray-600">Tổng trả lời</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {mockData.forumActivity.activeUsers}
          </div>
          <div className="text-sm text-gray-600">Người dùng hoạt động</div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố danh mục</h3>
        <div className="space-y-4">
          {mockData.forumActivity.topCategories.map((category, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">{category.name}</span>
                <span className="font-semibold">{category.count} ({category.percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRevenueReport = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Báo cáo doanh thu</h3>
        <p className="text-gray-600 mb-4">
          Tính năng này sẽ được phát triển trong tương lai
        </p>
        <div className="text-sm text-gray-400">
          Bao gồm: Phí đăng tin, gói premium, quảng cáo...
        </div>
      </div>
    </div>
  );

  const renderSelectedReport = () => {
    switch (selectedReport) {
      case 'overview':
        return renderOverviewReport();
      case 'users':
        return renderUsersReport();
      case 'rooms':
        return renderRoomsReport();
      case 'forum':
        return renderForumReport();
      case 'revenue':
        return renderRevenueReport();
      default:
        return renderOverviewReport();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo và phân tích</h1>
        <p className="text-gray-600 mt-2">
          Thống kê chi tiết về hoạt động của hệ thống
        </p>
      </div>

      {/* Report Type Selector */}
      <div className="card p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedReport(type.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedReport === type.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khoảng thời gian
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input-field"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button className="btn-primary">
              Xuất báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {renderSelectedReport()}
    </div>
  );
};

export default Reports;
