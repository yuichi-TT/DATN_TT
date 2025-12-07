import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../services/api'; 
import type { Notification } from '../types'; 
// === THAY ĐỔI 1: IMPORT TOAST ===
import toast from 'react-hot-toast';

// Icon (Bạn có thể dùng 'lucide-react' nếu đã cài)
const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
const IconAlertCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
      <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);
const IconMessageSquare = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  
  const getIcon = (type: string | undefined) => {
    switch (type) {
      case 'room_approved':
        return <IconCheckCircle />;
      case 'room_rejected':
        return <IconAlertCircle />;
      case 'new_reply':
        return <IconMessageSquare />;
      default:
        return <IconAlertCircle />;
    }
  };

  return (
    <Link 
      to={notification.link || '#'} 
      className={`block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 ${
        notification.isRead ? 'bg-white' : 'bg-blue-50'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 mt-1">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(notification.createdAt).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        {!notification.isRead && (
          <div className="flex-shrink-0">
            <span className="w-3 h-3 bg-blue-500 rounded-full block" title="Chưa đọc"></span>
          </div>
        )}
      </div>
    </Link>
  );
};

const Notifications: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Nạp (fetch) tất cả thông báo
  const { data: notificationsResponse, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getNotifications(),
    staleTime: 5 * 60 * 1000, // 5 phút
  });

  const notifications: Notification[] = notificationsResponse?.data.data || [];
  
  // 2. Mutation để đánh dấu đã đọc
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      // Cập nhật lại cache của 'notifications'
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Cập nhật lại cache của 'unreadCount' (sẽ tạo ở Layout.tsx)
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] }); 
      // === THAY ĐỔI 2: Dùng toast.success ===
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc!");
    },
    onError: (error: any) => {
        console.error("Lỗi khi đánh dấu đã đọc:", error);
        // === THAY ĐỔI 3: Dùng toast.error ===
        const errorMessage = "Đã xảy ra lỗi, vui lòng thử lại: " + (error.message || 'Lỗi không xác định.');
        toast.error(errorMessage);
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
        {unreadCount > 0 && (
            <button 
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
                {markAllAsReadMutation.isPending ? 'Đang xử lý...' : 'Đánh dấu tất cả là đã đọc'}
            </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center p-12">Đang tải thông báo...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-lg shadow">
          <p className="text-lg text-gray-500">Bạn không có thông báo nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationItem key={notification._id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;