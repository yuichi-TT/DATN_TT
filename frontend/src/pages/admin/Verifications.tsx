import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon, 
  UserCircleIcon, 
  IdentificationIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Định nghĩa trạng thái
type VerificationStatus = 'pending' | 'verified' | 'rejected';

// Modal xem ảnh lớn
const ImageModal = ({ src, onClose }: { src: string, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
    <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300">
      <XCircleIcon className="w-10 h-10" />
    </button>
    <img src={src} alt="Proof" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
  </div>
);

// Modal nhập lý do từ chối
const RejectModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (reason: string) => void }) => {
    const [reason, setReason] = useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl transform transition-all scale-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Từ chối xác minh?</h3>
                <p className="text-sm text-gray-500 mb-4">Vui lòng nhập lý do để gửi thông báo cho người dùng.</p>
                <textarea 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none text-sm resize-none"
                    rows={3}
                    placeholder="Ví dụ: Ảnh mờ, thông tin không khớp..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    autoFocus
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
                    <button 
                        onClick={() => { if(reason.trim()) onConfirm(reason); }}
                        disabled={!reason.trim()}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        Xác nhận từ chối
                    </button>
                </div>
            </div>
        </div>
    );
};

const Verifications: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending');
  
  // State cho modal từ chối
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['admin_verifications', verificationStatus], 
    queryFn: async () => {
      const res = await adminAPI.getVerifications(verificationStatus); 
      return res.data.data;
    }
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, status, message }: { id: string, status: string, message?: string }) => {
      if (status === 'verified') await adminAPI.verifyUser(id);
      else if (status === 'rejected' && message) await adminAPI.rejectUser(id, message);
      return status; 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_verifications'] });
      setRejectModalOpen(false);
      setSelectedRejectId(null);
    },
  });

  const handleRejectClick = (id: string) => {
      setSelectedRejectId(id);
      setRejectModalOpen(true);
  };

  const confirmReject = (reason: string) => {
      if (selectedRejectId) {
          processMutation.mutate({ id: selectedRejectId, status: 'rejected', message: reason });
      }
  };
  
  // Xử lý dữ liệu
  const allUsers = (usersResponse as any[]) || [];
  const users = allUsers.filter(user => user.verification?.status === verificationStatus);

  const tabs: { key: VerificationStatus, label: string }[] = [
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'verified', label: 'Đã duyệt' },
    { key: 'rejected', label: 'Đã từ chối' },
  ];

  return (
    <div className="space-y-8">
      {/* === HEADER === */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý xác minh</h1>
          <p className="text-gray-500 text-sm">Kiểm tra hồ sơ định danh người dùng</p>
        </div>

        {/* === TABS TOOLBAR === */}
        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit">
            <div className="flex p-1 bg-gray-100/80 rounded-xl gap-1 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const count = allUsers.filter(u => u.verification?.status === tab.key).length;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setVerificationStatus(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                                verificationStatus === tab.key 
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                        >
                            {tab.label}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                verificationStatus === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
      </div>

      {/* === GRID CONTENT === */}
      {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-80 bg-gray-200 rounded-2xl" />)}
         </div>
      ) : users.length === 0 ? (
         <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold">Không có yêu cầu nào</p>
            <p className="text-gray-500 text-sm">Danh sách "{tabs.find(t => t.key === verificationStatus)?.label}" đang trống</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.map((user: any) => (
            <div key={user._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
                
                {/* 1. Header Card: User Info */}
                <div className="p-5 border-b border-gray-50 flex items-start justify-between bg-gray-50/30">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{user.name}</h3>
                            <p className="text-xs text-gray-500 mb-1">{user.email}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                user.role === 'landlord' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                                {user.role === 'landlord' ? 'Chủ trọ' : 'Sinh viên'}
                            </span>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 flex flex-col items-end">
                        <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Gửi ngày</span>
                        <span className="font-medium text-gray-600">
                            {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>

                {/* 2. Body: ID Images (Front/Back) */}
                <div className="p-5 flex-grow">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <IdentificationIcon className="w-4 h-4" /> Giấy tờ tùy thân
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Mặt trước */}
                        <div 
                            className="relative aspect-[3/2] bg-gray-100 rounded-xl overflow-hidden cursor-pointer group border border-gray-200"
                            onClick={() => user.verification?.frontImage && setSelectedImage(user.verification.frontImage)}
                        >
                            {user.verification?.frontImage ? (
                                <>
                                    <img src={user.verification.frontImage} alt="Mặt trước" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <EyeIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all" />
                                    </div>
                                    <span className="absolute bottom-1 left-1 text-[10px] font-bold text-white bg-black/50 px-1.5 rounded backdrop-blur-sm">Mặt trước</span>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 text-xs">Chưa có ảnh</div>
                            )}
                        </div>

                        {/* Mặt sau */}
                        <div 
                            className="relative aspect-[3/2] bg-gray-100 rounded-xl overflow-hidden cursor-pointer group border border-gray-200"
                            onClick={() => user.verification?.backImage && setSelectedImage(user.verification.backImage)}
                        >
                            {user.verification?.backImage ? (
                                <>
                                    <img src={user.verification.backImage} alt="Mặt sau" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <EyeIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all" />
                                    </div>
                                    <span className="absolute bottom-1 left-1 text-[10px] font-bold text-white bg-black/50 px-1.5 rounded backdrop-blur-sm">Mặt sau</span>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 text-xs">Chưa có ảnh</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Footer: Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    {verificationStatus === 'pending' ? (
                        <div className="flex gap-3">
                            <button 
                                onClick={() => processMutation.mutate({ id: user._id, status: 'verified' })}
                                disabled={processMutation.isPending}
                                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircleIcon className="w-5 h-5" /> Duyệt
                            </button>
                            <button 
                                onClick={() => handleRejectClick(user._id)}
                                disabled={processMutation.isPending}
                                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <XCircleIcon className="w-5 h-5" /> Từ chối
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 text-xs">Cập nhật: {new Date(user.verification?.updatedAt).toLocaleDateString('vi-VN')}</span>
                            {verificationStatus === 'verified' ? (
                                <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg">
                                    <CheckCircleIcon className="w-4 h-4" /> Đã duyệt
                                </span>
                            ) : (
                                <div className="text-right">
                                    <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-3 py-1 rounded-lg ml-auto w-fit mb-1">
                                        <XCircleIcon className="w-4 h-4" /> Đã từ chối
                                    </span>
                                    {user.verification?.message && (
                                        <p className="text-xs text-red-500 italic max-w-[150px] truncate" title={user.verification.message}>
                                            "{user.verification.message}"
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedImage && <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />}
      <RejectModal 
        isOpen={rejectModalOpen} 
        onClose={() => setRejectModalOpen(false)} 
        onConfirm={confirmReject} 
      />
    </div>
  );
};

export default Verifications;