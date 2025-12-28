import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import type { User } from '../../types';
import { MagnifyingGlassIcon, FunnelIcon, TrashIcon, PencilSquareIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const Users: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const queryClient = useQueryClient();

  // (Giữ nguyên logic API hook của bạn...)
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', currentPage, selectedRole],
    queryFn: () => adminAPI.getUsers({ page: currentPage, limit: 10, role: selectedRole || undefined }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: Partial<User> }) => adminAPI.updateUser(id, userData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); setShowEditModal(false); setSelectedUser(null); },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminAPI.deleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });

  const users = usersData?.data.data || [];
  const pagination = usersData?.data.pagination;

  // Helper render Badge đẹp hơn
  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      student: 'bg-blue-50 text-blue-700 border-blue-100',
      landlord: 'bg-purple-50 text-purple-700 border-purple-100',
      admin: 'bg-red-50 text-red-700 border-red-100'
    };
    const label = role === 'student' ? 'Sinh viên' : role === 'landlord' ? 'Chủ trọ' : 'Admin';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[role] || 'bg-gray-50 text-gray-600'}`}>
        {label}
      </span>
    );
  };

  const filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleEditUser = (user: User) => { setSelectedUser(user); setShowEditModal(true); };
  const handleUpdateUser = (userData: Partial<User>) => { if (selectedUser) updateUserMutation.mutate({ id: selectedUser._id, userData }); };
  const handleDeleteUser = (id: string) => { if (window.confirm('Xóa người dùng này?')) deleteUserMutation.mutate(id); };

  return (
    <div className="space-y-8">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Người dùng</h1>
          <p className="text-gray-500 text-sm">Quản lý và phân quyền tài khoản</p>
        </div>
        
        <div className="flex gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
           <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600" />
              <input 
                 type="text" 
                 placeholder="Tìm kiếm..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 pr-4 py-2 bg-transparent border-none outline-none text-sm w-48 focus:w-64 transition-all"
              />
           </div>
           <div className="h-full w-px bg-gray-200 mx-1" />
           <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-600 cursor-pointer hover:text-indigo-600"
           >
              <option value="">Tất cả vai trò</option>
              <option value="student">Sinh viên</option>
              <option value="landlord">Chủ trọ</option>
           </select>
        </div>
      </div>

      {/* Modern Table Card */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
             <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thông tin</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Liên hệ</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ngày tham gia</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditUser(user)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors">
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteUser(user._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        
        {/* Pagination (Simplified) */}
        {pagination && pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
                <span className="text-xs text-gray-500">Trang {currentPage} / {pagination.pages}</span>
                <div className="flex gap-2">
                    <button disabled={currentPage===1} onClick={()=>setCurrentPage(c=>c-1)} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50">Trước</button>
                    <button disabled={currentPage===pagination.pages} onClick={()=>setCurrentPage(c=>c+1)} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50">Sau</button>
                </div>
            </div>
        )}
      </div>

       {/* Edit Modal (Giữ nguyên logic, chỉ update style sơ) */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                 <h3 className="text-xl font-bold mb-4">Cập nhật thông tin</h3>
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleUpdateUser({
                        name: formData.get('name') as string,
                        phone: formData.get('phone') as string,
                        role: formData.get('role') as any
                    });
                 }} className="space-y-4">
                     {/* Input fields giống Login nhưng style đơn giản hơn */}
                     <input name="name" defaultValue={selectedUser.name} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100" />
                     <input name="phone" defaultValue={selectedUser.phone} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100" />
                     <select name="role" defaultValue={selectedUser.role} className="w-full p-3 bg-gray-50 rounded-xl outline-none">
                        <option value="student">Sinh viên</option>
                        <option value="landlord">Chủ trọ</option>
                     </select>
                     <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-500 font-medium">Hủy</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Lưu</button>
                     </div>
                 </form>
            </div>
        </div>
      )}
    </div>
  );
};
export default Users;