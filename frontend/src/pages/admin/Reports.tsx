import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
// Import các icon từ lucide-react
import { 
  BarChart3, 
  Users, 
  Home, 
  MessageSquare, 
  TrendingUp, 
  Download, 
  DollarSign,
  UserCheck,
  UserCog,
  Building,
  CheckCircle2,
  XCircle,
  MessageCircle,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [selectedReport, setSelectedReport] = useState('overview');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminAPI.getDashboardStats(),
  });

  // Cập nhật mảng reportTypes với icon component thay vì string emoji
  const reportTypes = [
    { id: 'overview', name: 'Tổng quan', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'users', name: 'Người dùng', icon: <Users className="w-5 h-5" /> },
    { id: 'rooms', name: 'Phòng trọ', icon: <Home className="w-5 h-5" /> },
    { id: 'forum', name: 'Diễn đàn', icon: <MessageSquare className="w-5 h-5" /> },
    //{ id: 'revenue', name: 'Doanh thu', icon: <DollarSign className="w-5 h-5" /> }
  ];

  const periods = [
    { value: '7', label: '7 ngày qua' },
    { value: '30', label: '30 ngày qua' },
    { value: '90', label: '3 tháng qua' },
    { value: '365', label: '1 năm qua' }
  ];

  const mockData = {
    roomStats: {
      total: 150,
      available: 45,
      occupied: 105,
      averagePrice: 2500000,
      priceRange: { min: 1000000, max: 8000000 }
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
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.data.data?.users?.total || 0}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" /> +12% so với tháng trước
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng phòng trọ</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.data.data?.rooms?.total || 0}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" /> +8% so với tháng trước
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <Home className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tỷ lệ lấp đầy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.data.data?.rooms?.total ? 
                  Math.round(((stats.data.data.rooms.total - stats.data.data.rooms.available) / stats.data.data.rooms.total) * 100) : 0}%
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" /> +5% so với tháng trước
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <Building className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hoạt động diễn đàn</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.data.data?.forum?.totalPosts || 0}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" /> +20% so với tháng trước
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
            Tăng trưởng người dùng
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">Biểu đồ tăng trưởng</p>
              <p className="text-sm text-gray-400">Sẽ tích hợp Chart.js</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
             <Home className="w-5 h-5 mr-2 text-primary-600" />
             Phân bố phòng trọ
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 flex items-center">
                   <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" /> Phòng trống
                </span>
                <span className="font-semibold">{mockData.roomStats.available}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(mockData.roomStats.available / mockData.roomStats.total) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 flex items-center">
                   <UserCheck className="w-4 h-4 mr-1 text-red-500" /> Phòng đã thuê
                </span>
                <span className="font-semibold">{mockData.roomStats.occupied}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(mockData.roomStats.occupied / mockData.roomStats.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsersReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
             <UserCog className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.data.data?.users?.students || 0}
          </div>
          <div className="text-sm font-medium text-gray-500">Sinh viên</div>
        </div>
        
        <div className="card p-6 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
             <Home className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.data.data?.users?.landlords || 0}
          </div>
          <div className="text-sm font-medium text-gray-500">Chủ trọ</div>
        </div>
        
        <div className="card p-6 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3">
             <Users className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.data.data?.users?.total || 0}
          </div>
          <div className="text-sm font-medium text-gray-500">Tổng người dùng</div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Phân tích đối tượng người dùng</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Tỷ lệ sinh viên</span>
              <span className="font-semibold text-blue-600">
                {stats?.data.data?.users?.total ? 
                  Math.round((stats.data.data.users.students / stats.data.data.users.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${stats?.data.data?.users?.total ? 
                    (stats.data.data.users.students / stats.data.data.users.total) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div>
             <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Tỷ lệ chủ trọ</span>
              <span className="font-semibold text-green-600">
                {stats?.data.data?.users?.total ? 
                  Math.round((stats.data.data.users.landlords / stats.data.data.users.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${stats?.data.data?.users?.total ? 
                    (stats.data.data.users.landlords / stats.data.data.users.total) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoomsReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex flex-col h-full justify-between">
            <div className="mb-2">
                <span className="p-2 bg-gray-100 rounded-lg inline-block">
                    <Building className="w-6 h-6 text-gray-600" />
                </span>
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900">{stats?.data.data?.rooms?.total || 0}</div>
                <div className="text-sm text-gray-500">Tổng phòng</div>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex flex-col h-full justify-between">
            <div className="mb-2">
                <span className="p-2 bg-green-100 rounded-lg inline-block">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                </span>
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900">{stats?.data.data?.rooms?.available || 0}</div>
                <div className="text-sm text-gray-500">Phòng trống</div>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
           <div className="flex flex-col h-full justify-between">
            <div className="mb-2">
                <span className="p-2 bg-red-100 rounded-lg inline-block">
                    <XCircle className="w-6 h-6 text-red-600" />
                </span>
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900">{stats?.data.data?.rooms?.occupied || 0}</div>
                <div className="text-sm text-gray-500">Đã thuê</div>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
           <div className="flex flex-col h-full justify-between">
            <div className="mb-2">
                <span className="p-2 bg-blue-100 rounded-lg inline-block">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                </span>
            </div>
            <div>
                <div className="text-lg font-bold text-gray-900 truncate" title={`${mockData.roomStats.averagePrice} VNĐ`}>
                    {(mockData.roomStats.averagePrice/1000000).toFixed(1)}Tr
                </div>
                <div className="text-sm text-gray-500">Giá trung bình</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân tích khoảng giá</h3>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="p-3 bg-white rounded-full shadow-sm mr-4">
                <TrendingUp className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Thấp nhất</span>
                    <span className="font-semibold">{mockData.roomStats.priceRange.min.toLocaleString()} VNĐ</span>
                </div>
                 <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">Cao nhất</span>
                    <span className="font-semibold">{mockData.roomStats.priceRange.max.toLocaleString()} VNĐ</span>
                </div>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
             <div className="p-3 bg-white rounded-full shadow-sm mr-4">
                <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
             <div className="flex-1 flex justify-between items-center">
                <span className="text-sm text-blue-700 font-medium">Mức giá trung bình toàn sàn</span>
                <span className="font-bold text-blue-700 text-lg">{mockData.roomStats.averagePrice.toLocaleString()} VNĐ</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderForumReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
             <div className="text-2xl font-bold text-gray-900">{mockData.forumActivity.totalPosts}</div>
             <div className="text-sm text-gray-500">Tổng bài viết</div>
          </div>
        </div>
        
        <div className="card p-6 flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
             <div className="text-2xl font-bold text-gray-900">{mockData.forumActivity.totalReplies}</div>
             <div className="text-sm text-gray-500">Tổng phản hồi</div>
          </div>
        </div>
        
        <div className="card p-6 flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
             <div className="text-2xl font-bold text-gray-900">{mockData.forumActivity.activeUsers}</div>
             <div className="text-sm text-gray-500">User hoạt động</div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Chủ đề thảo luận phổ biến</h3>
        <div className="space-y-6">
          {mockData.forumActivity.topCategories.map((category, index) => {
             const Icon = index === 0 ? HelpCircle : index === 1 ? Lightbulb : MessageSquare;
             return (
                <div key={index}>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{category.count} ({category.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-blue-500' : 
                        index === 1 ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${category.percentage}%` }}
                    ></div>
                </div>
                </div>
            )
          })}
        </div>
      </div>
    </div>
  );

  const renderRevenueReport = () => (
    <div className="space-y-6">
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <DollarSign className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Báo cáo doanh thu</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Tính năng này đang được phát triển. Bạn sẽ sớm có thể theo dõi doanh thu từ các gói dịch vụ và quảng cáo.
        </p>
        <div className="inline-flex items-center text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
           <Building className="w-4 h-4 mr-2" />
           Dự kiến ra mắt: Q2/2025
        </div>
      </div>
    </div>
  );

  const renderSelectedReport = () => {
    switch (selectedReport) {
      case 'overview': return renderOverviewReport();
      case 'users': return renderUsersReport();
      case 'rooms': return renderRoomsReport();
      case 'forum': return renderForumReport();
      case 'revenue': return renderRevenueReport();
      default: return renderOverviewReport();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo thống kê</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Theo dõi hiệu quả hoạt động của hệ thống RelistayDN
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {reportTypes.map((type) => (
                <button
                    key={type.id}
                    onClick={() => setSelectedReport(type.id)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedReport === type.id
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                    {type.icon}
                    <span>{type.name}</span>
                </button>
                ))}
            </div>

            {/* Filters & Actions */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="input-field max-w-[150px] !py-2.5"
                >
                    {periods.map((period) => (
                        <option key={period.value} value={period.value}>
                            {period.label}
                        </option>
                    ))}
                </select>
                
                <button className="btn-primary flex items-center justify-center gap-2 !py-2.5 whitespace-nowrap">
                    <Download className="w-4 h-4" />
                    <span>Xuất báo cáo</span>
                </button>
            </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="transition-all duration-300 ease-in-out">
         {renderSelectedReport()}
      </div>
    </div>
  );
};

export default Reports;