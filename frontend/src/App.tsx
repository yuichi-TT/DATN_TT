import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';

// Components & Layouts
import Layout from './components/Layout';
//import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import LandlordRoute from './components/LandlordRoute'; 
import ProtectedRoute from './components/ProtectedRoute'; 

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Room from './pages/Room'; 
import Forum from './pages/Forum';
import NewPost from './pages/NewPost';
import Profile from './pages/Profile'; 
import ChatPage from './pages/Chat';

import CreateRoom from './pages/CreateRoom';
import EditRoom from './pages/EditRoom'; 
import RoomList from './pages/RoomList';

// === BƯỚC 1: THÊM IMPORT CHO TRANG CHI TIẾT BÀI VIẾT ===
import ForumPostPage from './pages/ForumPost'; 

import Notifications from './pages/Notifications';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Rooms from './pages/admin/Rooms'; 
import AdminForum from './pages/admin/Forum'; 
import Reports from './pages/admin/Reports';
import Verifications from './pages/admin/Verifications';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* 1. Public & Protected routes with main Layout */}
            <Route element={<Layout><Outlet /></Layout>}>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/room" element={<RoomList />} />
              <Route path="/room/:id" element={<Room />} />
              
              <Route path="/forum" element={<Forum />} />

              {/* Protected (Cần đăng nhập) */}
              <Route element={<ProtectedRoute />}> 
                  <Route path="/profile" element={<Profile />} /> 
                  <Route path="/forum/new" element={<NewPost />} />
                  
                  {/* === BƯỚC 2: THÊM ROUTE CHO TRANG CHI TIẾT BÀI VIẾT === */}
                  <Route path="/forum/:id" element={<ForumPostPage />} />

                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/chat" element={<ChatPage />} />

                  {/* Landlord Only Routes */}
                  <Route element={<LandlordRoute />}> 
                      <Route path="/landlord/dang-tin" element={<CreateRoom />} />
                    
                      <Route path="/landlord/edit-room/:roomId" element={<EditRoom />} />

                      
                  </Route>
              </Route>
            </Route>

            {/* 2. Admin Login Route (no layout) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* 3. Protected Admin Routes */}
            <Route path="/admin" element={<AdminRoute />}>
                 <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="rooms" element={<Rooms />} /> {/* Trang duyệt phòng */}
                <Route path="forum" element={<AdminForum />} />
                <Route path="reports" element={<Reports />} />
                <Route path="verifications" element={<Verifications />} />
            </Route>

             {/* 4. Not Found Route (Optional) */}
             {/* <Route path="*" element={<NotFoundPage />} /> */}

         </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;