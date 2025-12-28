import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, forumAPI } from '../../services/api';
import type { ForumPost } from '../../types';
import { 
  MagnifyingGlassIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon, 
  ChatBubbleLeftRightIcon, 
  TagIcon,
  FunnelIcon,
  UserCircleIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const Forum: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // === 1. THÊM STATE CHO TAB TRẠNG THÁI ===
  // Mặc định chọn 'pending' để Admin thấy việc cần làm trước
  const [selectedStatus, setSelectedStatus] = useState<string>('pending'); 

  const queryClient = useQueryClient();

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['admin', 'forum', 'allPosts', currentPage, selectedCategory], 
    // Lưu ý: Nếu API backend chưa hỗ trợ lọc status, ta sẽ lọc ở client (bên dưới)
    queryFn: () => adminAPI.getAllPostsForAdmin({ 
        category: selectedCategory || undefined,
        page: currentPage 
    }),
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => forumAPI.deletePost(id), 
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'allPosts'] }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminAPI.approvePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'allPosts'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminAPI.rejectPost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'allPosts'] }),
  });

  const posts = postsData?.data.data || [];

  const handleDeletePost = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bài viết này vĩnh viễn?')) {
        deletePostMutation.mutate(id);
    }
  };

  // Helper: Badge danh mục
  const getCategoryBadge = (category: string) => {
    const configs: Record<string, string> = {
      question: 'bg-blue-50 text-blue-700 border-blue-100',
      experience: 'bg-purple-50 text-purple-700 border-purple-100',
      general: 'bg-gray-50 text-gray-700 border-gray-100'
    };
    const labels: Record<string, string> = {
      question: 'Hỏi đáp',
      experience: 'Kinh nghiệm',
      general: 'Thảo luận'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${configs[category] || configs.general} flex items-center gap-1`}>
        <TagIcon className="w-3 h-3" />
        {labels[category] || category}
      </span>
    );
  };

  // Helper: Badge trạng thái
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100">Đã duyệt</span>;
      case 'pending': return <span className="px-2 py-1 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-100">Chờ duyệt</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs font-bold text-red-700 bg-red-50 rounded-lg border border-red-100">Đã từ chối</span>;
      default: return <span className="px-2 py-1 text-xs font-bold text-gray-700 bg-gray-50 rounded-lg border border-gray-100">{status}</span>;
    }
  };

  // === 2. CẤU HÌNH TABS ===
  const tabs = [
    { id: 'pending', label: 'Chờ duyệt' },
    { id: 'approved', label: 'Đã duyệt' },
    { id: 'rejected', label: 'Đã từ chối' },
    { id: '', label: 'Tất cả' },
  ];

  // === 3. LOGIC LỌC DỮ LIỆU (Bao gồm cả Status) ===
  const filteredPosts = posts.filter(post => {
    // 1. Lọc theo Tab Status (Nếu id='' thì lấy hết)
    const matchStatus = selectedStatus === '' ? true : post.status === selectedStatus;
    
    // 2. Lọc theo Search Term
    const matchSearch = 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.author && post.author.name && post.author.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý diễn đàn</h1>
          <p className="text-gray-500 text-sm">Kiểm duyệt nội dung cộng đồng</p>
        </div>

        {/* === TOOLBAR (TABS + FILTER + SEARCH) === */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            
            {/* A. TABS KHU VỰC TRÁI */}
            <div className="flex p-1 bg-gray-100/80 rounded-xl gap-1 w-full xl:w-auto overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { 
                            setSelectedStatus(tab.id); 
                            setCurrentPage(1); // Reset trang khi đổi tab
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 md:flex-none ${
                            selectedStatus === tab.id 
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* B. FILTER & SEARCH KHU VỰC PHẢI */}
            <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto">
                {/* Category Dropdown */}
                <div className="relative flex items-center bg-gray-50 rounded-xl px-3 border border-transparent focus-within:bg-white focus-within:border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-100/50 transition-all">
                    <FunnelIcon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-gray-700 py-2.5 w-full md:w-40 cursor-pointer"
                    >
                        <option value="">Tất cả danh mục</option>
                        <option value="question">Hỏi đáp</option>
                        <option value="experience">Kinh nghiệm</option>
                        <option value="general">Thảo luận chung</option>
                    </select>
                </div>

                {/* Search Input */}
                <div className="relative group w-full md:w-64">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>
            </div>
        </div>
      </div>

      {/* === POSTS LIST === */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-2xl" />)}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArchiveBoxIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">Không tìm thấy bài viết nào</p>
            <p className="text-gray-500 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredPosts.map((post: ForumPost) => (
            <div key={post._id} className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                         {post.author?.name ? post.author.name.charAt(0).toUpperCase() : <UserCircleIcon className="w-6 h-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{post.author?.name || 'Ẩn danh'}</span>
                            {/* Hiển thị badge trạng thái nếu đang ở tab 'Tất cả' */}
                            {selectedStatus === '' && getStatusBadge(post.status)}
                        </div>
                        <span className="text-xs text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {post.author?.email}
                        </span>
                    </div>
                 </div>
                 {getCategoryBadge(post.category)}
              </div>

              {/* Content */}
              <div className="mb-6 pl-13 md:pl-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {post.content}
                  </p>
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">#{tag}</span>
                      ))}
                    </div>
                  )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                 <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    <span className="font-medium">{post.replies?.length || 0}</span>
                    <span className="hidden sm:inline">bình luận</span>
                 </div>

                 <div className="flex items-center gap-2">
                    {/* Các nút chỉ hiện khi bài viết ở trạng thái Chờ Duyệt */}
                    {post.status === 'pending' && (
                        <>
                            <button
                                onClick={() => approveMutation.mutate(post._id)}
                                disabled={approveMutation.isPending}
                                className="flex items-center gap-1 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors"
                            >
                                <CheckIcon className="w-4 h-4" /> Duyệt
                            </button>
                            
                            <button
                                onClick={() => rejectMutation.mutate(post._id)}
                                disabled={rejectMutation.isPending}
                                className="flex items-center gap-1 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors"
                            >
                                <XMarkIcon className="w-4 h-4" /> Từ chối
                            </button>
                        </>
                    )}

                    {/* Nút Xóa luôn hiện */}
                    <button
                        onClick={() => handleDeletePost(post._id)}
                        disabled={deletePostMutation.isPending}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all ml-2"
                        title="Xóa vĩnh viễn"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STATS FOOTER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
         {/* Giữ nguyên phần thống kê của bạn */}
      </div>
    </div>
  );
};

export default Forum;