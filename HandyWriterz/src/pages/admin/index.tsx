import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import Dashboard from './dashboard/Dashboard';
import ContentList from './content/ContentList';
import ContentEditor from './content/ContentEditor';
import UsersList from './users/UsersList';
import UserEditor from './users/UserEditor';
import MediaLibrary from './media/MediaLibrary';
import MediaUpload from './media/MediaUpload';
import Settings from './settings/Settings';
import { Loader2 } from 'lucide-react';

/**
 * Admin root component that handles admin routes and authentication
 */
const AdminRoot: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg font-medium">Loading...</span>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/content" element={<ContentList />} />
        <Route path="/content/new" element={<ContentEditor />} />
        <Route path="/content/edit/:id" element={<ContentEditor />} />
        <Route path="/users" element={<UsersList />} />
        <Route path="/users/:id" element={<UserEditor />} />
        <Route path="/media" element={<MediaLibrary />} />
        <Route path="/media/upload" element={<MediaUpload />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoot;
