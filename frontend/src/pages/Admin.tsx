import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Dashboard from './admin/Dashboard';
import Users from './admin/Users';
import Rooms from './admin/Rooms';
import Forum from './admin/Forum';
import Reports from './admin/Reports';
import Verifications from './admin/Verifications';

const Admin: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/verifications" element={<Verifications />} />
      </Routes>
    </AdminLayout>
  );
};

export default Admin;
