import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ServicePagesManager from '@/components/Admin/ServicePagesManager';
import ServicePageEditor from '@/components/Admin/ServicePageEditor';

/**
 * Admin Service Pages Routes Component
 * 
 * This component defines all routes related to service page management in the admin dashboard.
 * It's designed to be easily integrated into the main admin routing system.
 */
const AdminServicePagesRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ServicePagesManager />} />
      <Route path="/new" element={<ServicePageEditor />} />
      <Route path="/edit/:id" element={<ServicePageEditor />} />
    </Routes>
  );
};

export default AdminServicePagesRoutes;
