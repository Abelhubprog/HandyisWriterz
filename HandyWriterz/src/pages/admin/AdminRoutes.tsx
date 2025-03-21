// src/pages/admin/AdminRoutes.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Loader2 } from 'lucide-react';

// Lazy-loaded components for better performance
const Dashboard = lazy(() => import('./Dashboard'));
const NewAdminDashboard = lazy(() => import('./newAdminDashboard'));
const Posts = lazy(() => import('./Posts'));
const PostEditor = lazy(() => import('./content/PostEditor'));
const Categories = lazy(() => import('./Categories'));
const Tags = lazy(() => import('./Tags'));
const MediaLibrary = lazy(() => import('./MediaLibrary'));
const Users = lazy(() => import('./users'));
const Analytics = lazy(() => import('./Analytics'));
const Comments = lazy(() => import('./Comments'));
const Settings = lazy(() => import('./Settings'));
const AdminLogin = lazy(() => import('../auth/admin-login'));
const UploadDemo = lazy(() => import('./upload-demo'));
const AppwriteIntegration = lazy(() => import('./appwrite-integration'));
const DatabaseDemo = lazy(() => import('./database-demo'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex flex-col items-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

/**
 * AdminRoutes Component
 * 
 * Defines all routes for the admin dashboard with proper authentication and role requirements
 */
const AdminRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
    <Routes>
      {/* Admin Login */}
      <Route path="login" element={<AdminLogin />} />
      <Route path="auth/admin-login" element={<AdminLogin />} />

      {/* Dashboard */}
      <Route 
        path="dashboard" 
        element={
          <AdminLayout requiredRole="viewer">
            <Dashboard />
          </AdminLayout>
        } 
      />

      {/* New Admin Dashboard */}
      <Route 
        path="newdashboard" 
        element={
          <AdminLayout requiredRole="viewer">
            <NewAdminDashboard />
          </AdminLayout>
        } 
      />

      {/* Content Management */}
      <Route path="content">
          <Route 
            index
            element={
              <AdminLayout requiredRole="editor">
                <Posts />
              </AdminLayout>
            } 
          />
        <Route 
          path="posts" 
          element={
            <AdminLayout requiredRole="editor">
                <Posts />
            </AdminLayout>
          } 
        />
        <Route 
          path="posts/new" 
          element={
            <AdminLayout requiredRole="editor">
              <PostEditor />
            </AdminLayout>
          } 
        />
        <Route 
          path="posts/edit/:id" 
          element={
            <AdminLayout requiredRole="editor">
              <PostEditor />
            </AdminLayout>
          } 
        />
        <Route 
          path="categories" 
          element={
            <AdminLayout requiredRole="editor">
                <Categories />
            </AdminLayout>
          } 
        />
        <Route 
          path="tags" 
          element={
            <AdminLayout requiredRole="editor">
                <Tags />
              </AdminLayout>
            } 
          />
          <Route 
            path="new" 
            element={
              <AdminLayout requiredRole="editor">
                <PostEditor />
            </AdminLayout>
          } 
        />
      </Route>

      {/* Media Management */}
      <Route path="media">
        <Route 
            index
          element={
            <AdminLayout requiredRole="editor">
              <MediaLibrary />
            </AdminLayout>
          } 
        />
        <Route 
          path="upload" 
          element={
            <AdminLayout requiredRole="editor">
                <MediaLibrary initialTab="upload" />
            </AdminLayout>
          } 
        />
      </Route>

      {/* User Management */}
      <Route 
        path="users" 
        element={
          <AdminLayout requiredRole="admin">
              <Users />
          </AdminLayout>
        } 
      />

      {/* Analytics */}
      <Route 
        path="analytics" 
        element={
          <AdminLayout requiredRole="viewer">
              <Analytics />
          </AdminLayout>
        } 
      />

      {/* Comments */}
      <Route 
        path="comments" 
        element={
          <AdminLayout requiredRole="editor">
            <Comments />
          </AdminLayout>
        } 
      />

      {/* Settings */}
      <Route 
        path="settings" 
        element={
          <AdminLayout requiredRole="admin">
            <Settings />
          </AdminLayout>
        } 
      />

      {/* Upload Demo - For testing Appwrite Storage integration */}
      <Route 
        path="upload-demo" 
        element={
          <AdminLayout requiredRole="editor">
            <UploadDemo />
          </AdminLayout>
        } 
      />

      {/* Database Demo - For testing Appwrite Database integration */}
      <Route 
        path="database-demo" 
        element={
          <AdminLayout requiredRole="editor">
            <DatabaseDemo />
          </AdminLayout>
        } 
      />

      {/* Appwrite Integration Documentation */}
      <Route 
        path="appwrite-docs" 
        element={
          <AdminLayout requiredRole="viewer">
            <AppwriteIntegration />
          </AdminLayout>
        } 
      />

      {/* Redirect to dashboard by default */}
      <Route index element={<Navigate to="newdashboard" replace />} />
        
      {/* Catch-all route for any undefined admin routes */}
      <Route path="*" element={<Navigate to="newdashboard" replace />} />
    </Routes>
    </Suspense>
  );
};

export default AdminRoutes; 