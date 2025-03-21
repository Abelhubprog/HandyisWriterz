import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Import all admin components
import DashboardHome from '@/components/Admin/DashboardHome';
import PostsList from '@/components/Admin/PostsList';
import PostEditor from '@/components/Admin/PostEditor';
import CategoriesList from '@/components/Admin/CategoriesList';
import TagsList from '@/components/Admin/TagsList';
import MediaLibrary from '@/components/Admin/MediaLibrary';
import MediaUpload from '@/components/Admin/MediaUpload';
import UsersList from '@/components/Admin/UsersList';
import AnalyticsDashboard from '@/components/Admin/AnalyticsDashboard';
import SettingsPage from '@/components/Admin/SettingsPage';
import ServicePagesManager from '@/components/Admin/ServicePagesManager';
import ServicePageEditor from '@/components/Admin/ServicePageEditor';

/**
 * Admin Dashboard Routes
 * 
 * Centralized configuration for all admin dashboard routes.
 * Makes it easier to manage and extend routes without editing the main dashboard component.
 */
const AdminDashboardRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      
      {/* Content routes */}
      <Route path="/content/posts" element={<PostsList />} />
      <Route path="/content/posts/new" element={<PostEditor />} />
      <Route path="/content/posts/edit/:id" element={<PostEditor />} />
      <Route path="/content/categories" element={<CategoriesList />} />
      <Route path="/content/tags" element={<TagsList />} />
      
      {/* Media routes */}
      <Route path="/media" element={<MediaLibrary />} />
      <Route path="/media/upload" element={<MediaUpload />} />
      
      {/* User management */}
      <Route path="/users" element={<UsersList />} />
      
      {/* Analytics */}
      <Route path="/analytics" element={<AnalyticsDashboard />} />
      
      {/* Settings */}
      <Route path="/settings" element={<SettingsPage />} />
      
      {/* Service Pages Routes */}
      <Route path="/service-pages" element={<ServicePagesManager />} />
      <Route path="/service-pages/new" element={<ServicePageEditor />} />
      <Route path="/service-pages/edit/:id" element={<ServicePageEditor />} />
    </Routes>
  );
};

export default AdminDashboardRoutes;
