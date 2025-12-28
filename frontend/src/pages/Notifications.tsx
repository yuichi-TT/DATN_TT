import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../services/api'; 
import type { Notification } from '../types'; 
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icons (Heroicons v2) ---
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ChatBubbleLeftRightIcon, 
  BellIcon, 
  ClockIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

// --- STYLES CONSTANTS ---
// Nền trang đồng bộ với Profile
const PAGE_WRAPPER = "w-full min-h-[calc(100vh-64px)] bg-primary-50 p-4 md:p-8";
const CONTAINER_CARD = "max-w-3xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-brand-main/5 border border-brand-light/20 overflow-hidden flex flex-col min-h-[600px]";
const HEADER_SECTION = "p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40";

// --- COMPONENT CON ---
const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  
  // Helper chọn icon và màu sắc dựa trên loại thông báo
  const getIconAndColor = (type: string | undefined) => {
    switch (type) {
      case 'room_approved':
        return { icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-green-600 bg-green-50 border-green-100" };
      case 'room_rejected':
        return { icon: <ExclamationCircleIcon className="w-6 h-6" />, color: "text-red-600 bg-red-50 border-red-100" };
      case 'new_reply':
        return { icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, color: "text-brand-main bg-brand-light/20 border-brand-light/30" };
      default:
        // Mặc định dùng Brand Soft
        return { icon: <BellIcon className="w-6 h-6" />, color: "text-brand-dark bg-brand-soft/30 border-brand-soft/50" };
    }
  };

  const { icon, color } = getIconAndColor(notification.type);
  const isRead = notification.isRead;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255, 1)" }}
      className={`group relative rounded-2xl border transition-all duration-300 mb-3 ${
        isRead 
          ? 'bg-white/40 border-transparent hover:border-brand-light/30' 
          : 'bg-white border-brand-main/10 shadow-lg shadow-brand-main/5'
      }`}
    >
      <Link to={notification.link || '#'} className="flex items-start p-4 gap-4">
        {/* Icon Box */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border ${color}`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-1">
          <p className={`text-base leading-snug mb-1.5 ${isRead ? 'text-gray-600 font-medium' : 'text-brand-dark font-bold'}`}>
            {notification.message}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>
              {new Date(notification.createdAt).toLocaleString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Read Status Indicator */}
        <div className="flex-shrink-0 pt-2 pr-1">
          {!isRead && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-accent"></span>
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

const Notifications: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notificationsResponse, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getNotifications(),
    staleTime: 5 * 60 * 1000, 
  });

  const notifications: Notification[] = notificationsResponse?.data.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] }); 
      toast.success("Đã đánh dấu tất cả là đã đọc");
    },
    onError: (error: any) => {
        toast.error("Lỗi: " + (error.message || 'Không thể cập nhật trạng thái.'));
    }
  });

  return (
    <div className={PAGE_WRAPPER}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={CONTAINER_CARD}
      >
        {/* Header */}
        <div className={HEADER_SECTION}>
          <div>
            <h1 className="text-3xl font-black text-brand-main mb-1 flex items-center gap-3">
              Thông báo
              <span className="text-sm font-bold bg-brand-main/10 text-brand-main px-3 py-1 rounded-full border border-brand-main/20">
                {unreadCount} mới
              </span>
            </h1>
            <p className="text-gray-500 font-medium">Cập nhật mới nhất về hoạt động của bạn</p>
          </div>

          {unreadCount > 0 && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-brand-main hover:text-white hover:border-brand-main transition-all shadow-sm"
            >
              {markAllAsReadMutation.isPending ? (
                 <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                 <CheckCircleIconSolid className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              )}
              <span>Đánh dấu đã đọc</span>
            </motion.button>
          )}
        </div>

        {/* Content List */}
        <div className="flex-grow p-4 md:p-8 overflow-y-auto custom-scrollbar bg-brand-light/5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
               <div className="w-10 h-10 border-4 border-brand-main/30 border-t-brand-main rounded-full animate-spin mb-4"></div>
               <p>Đang tải thông báo...</p>
            </div>
          ) : notifications.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
               <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-white">
                  <BellIcon className="w-10 h-10 text-brand-main/40" />
               </div>
               <h3 className="text-xl font-bold text-gray-800 mb-2">Không có thông báo nào</h3>
               <p className="text-gray-500 max-w-xs mx-auto">Bạn đã cập nhật hết các thông tin mới nhất.</p>
            </div>
          ) : (
            // List
            <AnimatePresence mode='popLayout'>
              <div className="space-y-2 max-w-3xl mx-auto">
                {notifications.map((notification) => (
                  <NotificationItem key={notification._id} notification={notification} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Notifications;