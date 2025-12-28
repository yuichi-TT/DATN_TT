import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../hooks/useSocket';
import { conversationAPI, type User, type Message, type Conversation } from '../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';

// --- Icons ---
import { 
  MagnifyingGlassIcon, PaperAirplaneIcon, 
  FaceSmileIcon, PhotoIcon, PaperClipIcon, 
  PhoneIcon, VideoCameraIcon, InformationCircleIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { PaperAirplaneIcon as PaperAirplaneIconSolid } from '@heroicons/react/24/solid';

// --- STYLES CONSTANTS ---
const PAGE_WRAPPER = "w-full h-[calc(100vh-64px)] flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8";

// Khung chat
const CHAT_CONTAINER = "flex-grow bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-[24px] shadow-2xl overflow-hidden border border-white/50 flex ring-1 ring-white/60 relative"; 

// Sidebar
const SIDEBAR_WIDTH = "w-full md:w-[320px] lg:w-[360px]"; 
const SEARCH_INPUT = "w-full pl-10 pr-4 py-3 border-none rounded-xl bg-gray-100/50 focus:bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-brand-main/20 transition-all font-medium shadow-inner";
const CONV_ITEM_BASE = "w-full text-left p-3 flex items-center gap-3 transition-all rounded-xl mx-auto w-[95%] mb-1 hover:bg-white hover:shadow-sm";
const CONV_ITEM_ACTIVE = "bg-white shadow-md ring-1 ring-black/5 scale-[1.01]"; 

// Chat Area
const MESSAGE_BUBBLE_ME = "bg-gradient-to-br from-brand-main to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-lg shadow-brand-main/20 max-w-[80%] md:max-w-[70%] text-[15px] leading-relaxed";
const MESSAGE_BUBBLE_OTHER = "bg-white text-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-gray-100 max-w-[80%] md:max-w-[70%] text-[15px] leading-relaxed";

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const currentUserId = user?._id;

  // --- DATA FETCHING ---
  const { data: conversations, isLoading: isLoadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await conversationAPI.getConversations();
      return (response.data as any) || [];
    },
    enabled: !!user,
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedConv?._id],
    queryFn: async () => {
      if (!selectedConv?._id) return [];
      const response = await conversationAPI.getMessages(selectedConv._id);
      return (response.data as any) || [];
    },
    enabled: !!selectedConv?._id,
    refetchInterval: 5000, 
  });

  // --- EFFECTS ---
  useEffect(() => {
    const convToOpen = location.state?.conversationToOpen as Conversation | undefined;
    if (convToOpen) {
      setSelectedConv(convToOpen);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      window.history.replaceState({}, document.title); 
    }
  }, [location.state, queryClient]);

  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (newMessage: Message) => {
      queryClient.setQueryData(['messages', newMessage.conversationId], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [newMessage];
        if (oldMessages.some(msg => msg._id === newMessage._id)) return oldMessages;
        return [...oldMessages, newMessage];
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    socket.on('receiveMessage', handleReceiveMessage);
    return () => { socket.off('receiveMessage', handleReceiveMessage); };
  }, [socket, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- HANDLERS ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !socket || !user) return;
    const receiver = selectedConv.participants.find((p: User) => p._id !== user._id);
    if (!receiver) return;

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

  const partner = selectedConv ? getPartner(selectedConv) : null;

  return (
    <div className={PAGE_WRAPPER}>
      <div className={CHAT_CONTAINER}>
        
        {/* === LEFT SIDEBAR === */}
        <div className={`${SIDEBAR_WIDTH} flex flex-col border-r border-gray-100/50 bg-white/50 backdrop-blur-md ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header & Search */}
          <div className="p-4 border-b border-gray-100/50">
            <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-main to-purple-600 mb-4">Tin nhắn</h2>
            <div className="relative group">
              <input type="text" placeholder="Tìm kiếm..." className={SEARCH_INPUT} />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-brand-main transition-colors" />
            </div>
          </div>
          
          {/* Conversations List */}
          <div className="flex-grow overflow-y-auto custom-scrollbar py-2 space-y-1">
            {isLoadingConvs && (
                <div className="flex justify-center p-8">
                    <div className="w-6 h-6 border-2 border-brand-main/30 border-t-brand-main rounded-full animate-spin"></div>
                </div>
            )}
            
            {conversations && conversations.length === 0 && !isLoadingConvs && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-60">
                    <p>Hộp thư trống</p>
                </div>
            )}

            {conversations && conversations.map((conv: Conversation) => {
              const p = getPartner(conv);
              if (!p) return null;
              const isActive = selectedConv?._id === conv._id;

              return (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  key={conv._id}
                  onClick={() => setSelectedConv(conv)}
                  className={`${CONV_ITEM_BASE} ${isActive ? CONV_ITEM_ACTIVE : 'hover:bg-white/60'}`}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                        src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=random`} 
                        alt={p.name}
                        className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover shadow-sm transition-all ${isActive ? 'ring-2 ring-brand-main ring-offset-2' : ''}`}
                    />
                    {conversations.indexOf(conv) === 0 && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`font-bold text-[14px] lg:text-[15px] truncate ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                          {p.name}
                      </span>
                      <span className="text-[10px] lg:text-[11px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'New'}
                      </span>
                    </div>
                    <p className={`text-xs lg:text-sm truncate font-medium ${isActive ? 'text-brand-main' : 'text-gray-400'}`}>
                        {conv.lastMessage?.text || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* === RIGHT CHAT AREA === */}
        <div className={`flex-grow flex flex-col bg-white/40 backdrop-blur-sm relative ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
          {selectedConv && partner ? (
            <>
              {/* Chat Header */}
              <div className="px-4 lg:px-6 py-3 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedConv(null)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </button>
                    
                    <div className="relative cursor-pointer">
                        <img 
                            src={partner.avatar || `https://ui-avatars.com/api/?name=${partner.name}&background=random`} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                            alt="Partner"
                        />
                        <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base lg:text-lg leading-tight">{partner.name}</h3>
                        <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-gray-500">
                    <button className="p-2 hover:bg-white hover:shadow-md hover:text-brand-main rounded-xl transition-all duration-300"><PhoneIcon className="w-5 h-5" /></button>
                    <button className="p-2 hover:bg-white hover:shadow-md hover:text-brand-main rounded-xl transition-all duration-300"><VideoCameraIcon className="w-5 h-5" /></button>
                    <button className="p-2 hover:bg-white hover:shadow-md hover:text-brand-main rounded-xl transition-all duration-300"><EllipsisHorizontalIcon className="w-6 h-6" /></button>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-grow p-4 lg:p-6 overflow-y-auto space-y-4 lg:space-y-6 custom-scrollbar">
                {isLoadingMessages && <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-main"></div></div>}
                
                {messages && messages.map((msg: Message, idx: number) => {
                    const isMe = msg.sender?._id === currentUserId;
                    const isLast = idx === messages.length - 1 || messages[idx + 1]?.sender?._id !== msg.sender?._id;

                    return (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            key={msg._id} 
                            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group`}
                        >
                            {!isMe && (
                                <div className="flex flex-col justify-end mr-2">
                                     {isLast ? (
                                        <img src={msg.sender.avatar || `https://ui-avatars.com/api/?name=${msg.sender.name}`} className="w-8 h-8 rounded-full shadow-sm ring-2 ring-white" alt="Avt" />
                                     ) : <div className="w-8" />}
                                </div>
                            )}
                            
                            <div className="flex flex-col max-w-[85%] md:max-w-[75%]">
                                <div className={`${isMe ? MESSAGE_BUBBLE_ME : MESSAGE_BUBBLE_OTHER} ${isLast ? '' : isMe ? 'rounded-br-2xl' : 'rounded-bl-2xl'} transform transition-transform hover:scale-[1.01]`}>
                                    {msg.text}
                                </div>
                                {isLast && (
                                    <p className={`text-[10px] mt-1.5 font-medium ${isMe ? 'text-right text-gray-400' : 'text-left text-gray-400'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • Đã gửi
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* FLOATING INPUT AREA */}
              <div className="p-4 lg:p-5 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent z-10">
                 <div className="bg-white rounded-[24px] shadow-xl shadow-brand-main/10 border border-gray-100 p-2 flex items-end gap-2 ring-1 ring-gray-50">
                    
                    <div className="flex items-center gap-1 pb-2 pl-2 hidden sm:flex">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-brand-main bg-brand-light/30 rounded-full transition-colors" title="Gửi ảnh">
                            <PhotoIcon className="w-6 h-6" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-gray-400 hover:text-brand-main hover:bg-gray-50 rounded-full transition-colors" title="Đính kèm">
                            <PaperClipIcon className="w-6 h-6" />
                        </motion.button>
                    </div>

                    <form onSubmit={handleSendMessage} className="flex-grow flex items-end gap-2 bg-gray-50/50 rounded-[20px] p-1 pr-1.5 border border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-main/10 transition-all">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-grow bg-transparent border-none focus:ring-0 p-3 max-h-32 text-gray-800 placeholder-gray-400 font-medium"
                      />
                      
                      <div className="flex items-center pb-1.5">
                         <button type="button" className="p-2 text-gray-400 hover:text-yellow-500 transition-colors mr-1 hover:bg-yellow-50 rounded-full hidden sm:block">
                            <FaceSmileIcon className="w-6 h-6" />
                         </button>
                         <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-2.5 bg-gradient-to-r from-brand-main to-indigo-600 text-white rounded-xl shadow-lg shadow-brand-main/30 disabled:opacity-50 disabled:shadow-none"
                          >
                            <PaperAirplaneIconSolid className="w-5 h-5 transform -rotate-45 translate-x-0.5 -translate-y-0.5" />
                          </motion.button>
                      </div>
                    </form>
                 </div>
              </div>
              
              <div className="h-[88px]"></div> 
            </>
          ) : (
            // === MÀN HÌNH CHỜ (ĐÃ SỬA) ===
            <div className="flex-grow flex flex-col items-center justify-center relative overflow-hidden">
               {/* Background Elements */}
               <div className="absolute inset-0 z-0 pointer-events-none">
                   <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                   <motion.div 
                     animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
                     transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                     className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-[100px]"
                   />
               </div>

               {/* Content */}
               <div className="relative z-10 text-center p-8 max-w-lg">
                   <motion.div 
                     initial={{ scale: 0.8, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     transition={{ duration: 0.8, ease: "easeOut" }}
                     className="relative mb-10 group cursor-default mx-auto w-fit"
                   >
                       <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                       <div className="relative w-36 h-36 bg-white/80 backdrop-blur-xl rounded-[40px] flex items-center justify-center shadow-2xl shadow-indigo-200/50 ring-1 ring-white/80 rotate-3 group-hover:rotate-6 transition-transform duration-500">
                            <motion.div 
                              animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }} 
                              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            >
                               {/* === ICON ĐÃ SỬA: Dùng màu solid rõ ràng === */}
                               <PaperAirplaneIconSolid className="w-20 h-20 text-brand-main" />
                            </motion.div>
                       </div>
                   </motion.div>
                   
                   <motion.h2 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-4xl font-black text-gray-800 mb-4 tracking-tight"
                   >
                      Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-main to-purple-600">{user?.name}!</span>
                   </motion.h2>
                   
                   <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-500 text-lg leading-relaxed font-medium"
                   >
                     Chọn một cuộc trò chuyện để kết nối ngay.<br/>
                     <span className="text-sm text-gray-400 mt-2 block font-normal">Hệ thống chat realtime được hỗ trợ bởi RelistayDN</span>
                   </motion.p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;