import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { forumAPI , adminAPI} from '../../services/api';
import type { ForumPost } from '../../types';

const Forum: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['admin', 'forum', 'allPosts', currentPage, selectedCategory],
    queryFn: () => adminAPI.getAllPostsForAdmin({ 
        category: selectedCategory || undefined,
        page: currentPage 
    }),
  });

  // --- MUTATION CHO VIỆC XÓA BÀI VIẾT ---
  const deletePostMutation = useMutation({
    mutationFn: (id: string) => forumAPI.deletePost(id), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'allPosts'] });
    },
  });

  // --- MUTATION MỚI CHO VIỆC DUYỆT BÀI VIẾT ---
  const approveMutation = useMutation({
    mutationFn: (id: string) => adminAPI.approvePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'allPosts'] });
    },
    onError: (error) => {
      console.error("Lỗi khi duyệt bài:", error);
      // Bạn có thể thêm thông báo lỗi cho người dùng ở đây
    }
  });

  // --- MUTATION MỚI CHO VIỆC TỪ CHỐI BÀI VIẾT ---
  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminAPI.rejectPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'allPosts'] });
    },
    onError: (error) => {
      console.error("Lỗi khi từ chối bài:", error);
    }
  });


  const posts = postsData?.data.data || [];

  const handleDeletePost = (id: string) => {
    // Sửa lại: Không dùng window.confirm vì nó có thể bị chặn
    // Bạn nên tạo một modal xác nhận riêng
    // Tạm thời, chúng ta sẽ gọi thẳng mutation
    console.log("Yêu cầu xóa bài viết " + id);
    deletePostMutation.mutate(id);
    // if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
    //   deletePostMutation.mutate(id);
    // }
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      question: { label: 'Hỏi đáp', color: 'bg-blue-100 text-blue-800' },
      experience: { label: 'Kinh nghiệm', color: 'bg-green-100 text-green-800' },
      general: { label: 'Thảo luận', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || { label: category, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // --- HÀM MỚI ĐỂ HIỂN THỊ TRẠNG THÁI BÀI VIẾT ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Đã duyệt</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Chờ duyệt</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Đã từ chối</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.author && post.author.name && post.author.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý diễn đàn</h1>
          <p className="text-gray-600 mt-2">
            Kiểm duyệt và quản lý bài viết trong diễn đàn
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề, nội dung hoặc tác giả..."
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="">Tất cả danh mục</option>
              <option value="question">Hỏi đáp</option>
              <option value="experience">Kinh nghiệm</option>
              <option value="general">Thảo luận chung</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setCurrentPage(1);
              }}
              className="btn-secondary w-full"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="card p-6 animate-pulse">
              <div className="space-y-3">
                <div className="bg-gray-300 h-6 rounded w-3/4"></div>
                <div className="bg-gray-300 h-4 rounded w-full"></div>
                <div className="bg-gray-300 h-4 rounded w-2/3"></div>
                <div className="flex justify-between items-center">
                  <div className="bg-gray-300 h-4 rounded w-1/4"></div>
                  <div className="bg-gray-300 h-4 rounded w-1/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post: ForumPost) => (
            <div key={post._id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    {getCategoryBadge(post.category)}
                    {getStatusBadge(post.status)} {/* <-- THÊM TRẠNG THÁI --> */}
                    <span className="text-sm text-gray-500">
                      bởi {post.author?.name || 'N/A'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-3 line-clamp-3">
                    {post.content}
                  </p>
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{post.replies?.length || 0} trả lời</span>
                      <span>•</span>
                      <span>{post.author?.email || 'N/A'}</span>
                    </div>
                    
                    {/* --- CẬP NHẬT CÁC NÚT HÀNH ĐỘNG --- */}
                    <div className="flex space-x-2">
                      {/* Chỉ hiển thị nút Duyệt/Từ chối nếu bài viết đang chờ */}
                      {post.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate(post._id)}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                          >
                            {approveMutation.isPending ? '...' : 'Duyệt'}
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(post._id)}
                            disabled={rejectMutation.isPending}
                            className="px-3 py-1 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50"
                          >
                            {rejectMutation.isPending ? '...' : 'Từ chối'}
                          </button>
                        </>
                      )}
                      {/* Vẫn giữ nút Xóa cho mọi trạng thái */}
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        disabled={deletePostMutation.isPending}
                        className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletePostMutation.isPending ? '...' : 'Xóa'}
                      </button>
                    </div>
                    {/* --- KẾT THÚC CẬP NHẬT --- */}
                    
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {posts.filter(post => post.category === 'question').length}
          </div>
          <div className="text-sm text-gray-600">Câu hỏi</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {posts.filter(post => post.category === 'experience').length}
          </div>
          <div className="text-sm text-gray-600">Kinh nghiệm</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-gray-600 mb-2">
            {posts.filter(post => post.category === 'general').length}
          </div>
          <div className="text-sm text-gray-600">Thảo luận</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {posts.reduce((total, post) => total + (post.replies?.length || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Tổng trả lời</div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
