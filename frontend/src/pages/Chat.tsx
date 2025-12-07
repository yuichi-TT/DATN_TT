import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../hooks/useSocket';
import { conversationAPI, type User, type Message, type Conversation } from '../services/api'; 

// Sử dụng Heroicons cho đồng bộ với các trang khác
import { MagnifyingGlassIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { PaperAirplaneIcon as PaperAirplaneIconSolid } from '@heroicons/react/24/solid';

// --- STYLES CONSTANTS ---
const PAGE_WRAPPER = "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 bg-brand-light min-h-[calc(100vh-64px)] flex flex-col";
const CHAT_CONTAINER = "flex-grow bg-white rounded-2xl shadow-xl overflow-hidden border border-brand-accent/30 flex"; // Khung chat chính

// Sidebar Styles
const SIDEBAR_HEADER = "p-5 border-b border-brand-accent/20 bg-white";
const SEARCH_INPUT_WRAPPER = "relative";
const SEARCH_INPUT = "w-full pl-10 pr-4 py-2 border border-brand-accent/40 rounded-full bg-brand-light/10 text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:bg-white transition-all";
const CONV_ITEM_BASE = "w-full text-left p-4 flex items-center space-x-3 transition-all border-l-4 border-transparent hover:bg-brand-light/30";
const CONV_ITEM_ACTIVE = "bg-brand-main/5 border-brand-main"; // Mục đang chọn

// Chat Area Styles
const CHAT_HEADER = "p-4 border-b border-brand-accent/20 bg-white flex items-center justify-between shadow-sm z-10";
const MESSAGE_BUBBLE_ME = "bg-brand-main text-white rounded-2xl rounded-tr-sm px-4 py-2 shadow-md max-w-[80%]";
const MESSAGE_BUBBLE_OTHER = "bg-brand-light text-brand-dark rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm border border-brand-accent/10 max-w-[80%]";
const INPUT_AREA = "p-4 bg-white border-t border-brand-accent/20 flex items-center gap-3";
const MESSAGE_INPUT = "flex-grow p-3 border border-brand-accent/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent bg-gray-50";
const SEND_BUTTON = "p-3 bg-brand-main text-white rounded-xl hover:bg-brand-dark transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed";

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const currentUserId = user?._id;

  // === 1. TẢI DANH SÁCH HỘI THOẠI (SỬA LẠI) ===
  const { data: conversations, isLoading: isLoadingConvs } = useQuery({ // Bỏ <Conversation[]> ở đây để TS tự suy luận
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await conversationAPI.getConversations();
      
      console.log("Conversations Data:", response.data);
      
      // Ép kiểu 'as any' để đánh lừa TypeScript, lấy dữ liệu thực tế
      return (response.data as any); 
    },
    enabled: !!user,
  });

  
  const { data: messages, isLoading: isLoadingMessages } = useQuery({ // Bỏ <Message[]>
    queryKey: ['messages', selectedConv?._id],
    queryFn: async () => {
      if (!selectedConv?._id) return [];
      const response = await conversationAPI.getMessages(selectedConv._id);
      
      
      console.log("Messages Data:", response.data);
      
      return (response.data as any); 
    },
    enabled: !!selectedConv?._id,
  });

  // Tự động mở hội thoại từ trang khác
  useEffect(() => {
    const convToOpen = location.state?.conversationToOpen as Conversation | undefined;
    if (convToOpen) {
      setSelectedConv(convToOpen);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      window.history.replaceState({}, document.title); 
    }
  }, [location.state, queryClient]);

  // Socket: Nhận tin nhắn
  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (newMessage: Message) => {
      console.log('[Socket.io] Nhận tin nhắn:', newMessage);
      
      // Cập nhật danh sách tin nhắn hiện tại
      queryClient.setQueryData(['messages', newMessage.conversationId], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [newMessage];
        // Tránh trùng lặp tin nhắn
        if (oldMessages.some(msg => msg._id === newMessage._id)) return oldMessages;
        return [...oldMessages, newMessage];
      });

      // Cập nhật danh sách hội thoại (để hiện tin nhắn mới nhất bên sidebar)
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('receiveMessage', handleReceiveMessage);
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket, queryClient]);

  // Scroll xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
  };

  // Gửi tin nhắn
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !socket || !user) return;

    const receiver = selectedConv.participants.find((p: User) => p._id !== user._id);
    if (!receiver) return;

    // Gửi qua socket
    socket.emit('sendMessage', {
      receiverId: receiver._id,
      conversationId: selectedConv._id,
      text: newMessage,
    });
    
    setNewMessage('');
  };

  const getPartner = (conv: Conversation): User | null => {
    if (!user) return null;
    return conv.participants.find((p: User) => p._id !== user._id) || null;
  };

  return (
    <div className={PAGE_WRAPPER}>
      
      {/* Khung Chat Chính */}
      <div className={CHAT_CONTAINER}>
        
        {/* === CỘT TRÁI: DANH SÁCH HỘI THOẠI === */}
        <div className={`w-full md:w-1/3 border-r border-brand-accent/20 flex flex-col ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header Sidebar */}
          <div className={SIDEBAR_HEADER}>
            <h2 className="text-2xl font-bold text-brand-dark mb-4">Tin nhắn</h2>
            <div className={SEARCH_INPUT_WRAPPER}>
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                className={SEARCH_INPUT}
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-brand-accent absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          {/* List Conversations */}
          <div className="overflow-y-auto flex-grow bg-white custom-scrollbar">
            {isLoadingConvs && (
                <div className="p-6 text-center text-gray-400 flex flex-col items-center">
                    <div className="w-6 h-6 border-2 border-brand-main border-t-transparent rounded-full animate-spin mb-2"></div>
                    Đang tải...
                </div>
            )}
            
            {conversations && conversations.length === 0 && !isLoadingConvs && (
              <div className="p-8 text-center">
                 <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-3">
                    <PaperAirplaneIcon className="w-8 h-8 text-brand-accent opacity-50" />
                 </div>
                 <p className="text-gray-500">Chưa có tin nhắn nào.</p>
              </div>
            )}

            {conversations && conversations.map((conv: Conversation) => {
              const partner = getPartner(conv);
              if (!partner) return null;

              const isActive = selectedConv?._id === conv._id;

              return (
                <button
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`${CONV_ITEM_BASE} ${isActive ? CONV_ITEM_ACTIVE : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                        src={partner.avatar || `https://ui-avatars.com/api/?name=${partner.name}&background=random`} 
                        alt={partner.name}
                        className={`w-12 h-12 rounded-full object-cover border-2 ${isActive ? 'border-brand-main' : 'border-gray-100'}`}
                    />
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`font-bold truncate ${isActive ? 'text-brand-main' : 'text-brand-dark'}`}>
                          {partner.name}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${isActive ? 'text-brand-dark/80 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessage?.text || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* === CỘT PHẢI: KHUNG CHAT === */}
        <div className={`w-full md:w-2/3 flex flex-col bg-white ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
          {selectedConv ? (
            <>
              {/* Header Chat */}
              <div className={CHAT_HEADER}>
                <div className="flex items-center space-x-3">
                    {/* Nút Back cho Mobile */}
                    <button onClick={() => setSelectedConv(null)} className="md:hidden p-1 text-gray-500 hover:text-brand-main">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                  <img 
                    src={getPartner(selectedConv)?.avatar || `https://ui-avatars.com/api/?name=${getPartner(selectedConv)?.name}&background=random`} 
                    alt={getPartner(selectedConv)?.name}
                    className="w-10 h-10 rounded-full object-cover border border-brand-accent/30 shadow-sm"
                  />
                  <div>
                    <p className="font-bold text-brand-dark text-lg">{getPartner(selectedConv)?.name}</p>
                  </div>
                </div>
              </div>

              {/* Nội dung tin nhắn */}
              <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-[#fafafa] custom-scrollbar">
                {isLoadingMessages && <p className="text-center text-gray-400 py-10">Đang tải tin nhắn...</p>}
                
                {messages && messages.map((msg: Message) => {
                    const isMe = msg.sender?._id === currentUserId;
                    return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                                <img 
                                    src={msg.sender.avatar || `https://ui-avatars.com/api/?name=${msg.sender.name}`} 
                                    className="w-8 h-8 rounded-full mr-2 self-end mb-1 border border-gray-200" 
                                    alt="Ava"
                                />
                            )}
                            <div className={isMe ? MESSAGE_BUBBLE_ME : MESSAGE_BUBBLE_OTHER}>
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-brand-light/80' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Thanh nhập liệu */}
              <div className={INPUT_AREA}>
                <form onSubmit={handleSendMessage} className="flex w-full gap-2 items-center">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className={MESSAGE_INPUT}
                  />
                  <button
                    type="submit"
                    className={SEND_BUTTON}
                    disabled={!socket || !newMessage.trim()}
                  >
                    <PaperAirplaneIconSolid className="w-5 h-5 transform -rotate-45 translate-x-0.5 -translate-y-0.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Màn hình chờ (Chưa chọn hội thoại)
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
               <div className="w-24 h-24 bg-brand-light rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <PaperAirplaneIcon className="w-12 h-12 text-brand-main" />
               </div>
               <p className="text-lg font-medium text-brand-dark">Chào mừng đến với hộp thư!</p>
               <p className="text-sm mt-1">Chọn một người bạn để bắt đầu trò chuyện.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;