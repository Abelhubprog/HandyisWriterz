import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

// Lazy load components with preloading for better performance
const DashboardHome = React.lazy(() => {
  const preload = import('@/pages/admin/dashboard/DashboardHome');
  return preload;
});

const ServicePagesManager = React.lazy(() => {
  const preload = import('@/components/admin/ServicePagesManager');
  return preload;
});

// Lazy load other admin components
const PostsList = React.lazy(() => import('@/pages/admin/content/PostsList'));
const PostEditor = React.lazy(() => import('@/pages/admin/content/PostEditor'));
const CategoriesList = React.lazy(() => import('@/pages/admin/content/CategoriesList'));
const TagsList = React.lazy(() => import('@/pages/admin/content/TagsList'));
const MediaLibrary = React.lazy(() => import('@/pages/admin/media/MediaLibrary'));
const MediaUpload = React.lazy(() => import('@/pages/admin/media/MediaUpload'));
const UsersList = React.lazy(() => import('@/pages/admin/users/UsersList'));
const ServicePageEditor = React.lazy(() => import('@/components/admin/ServicePageEditor'));

// Shared loading component
const LoadingFallback = () => <LoadingSpinner size="lg" className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />;

/**
 * AdminRoutes Component
 * Handles admin dashboard routing with Clerk auth and Supabase content management
 */
const AdminRoutes: React.FC = () => {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();

  // Show minimal loading state
  if (isLoading) {
    return <LoadingSpinner size="lg" className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />;
  }

  // Redirect non-authenticated or non-admin users
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* Dashboard home */}
        <Route index element={
          <React.Suspense fallback={<LoadingFallback />}>
            <DashboardHome />
          </React.Suspense>
        } />
        
        {/* Content Management */}
        <Route path="content">
          <Route path="posts" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <PostsList />
            </React.Suspense>
          } />
          <Route path="posts/new" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <PostEditor />
            </React.Suspense>
          } />
          <Route path="posts/edit/:id" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <PostEditor />
            </React.Suspense>
          } />
          <Route path="categories" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <CategoriesList />
            </React.Suspense>
          } />
          <Route path="tags" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <TagsList />
            </React.Suspense>
          } />
        </Route>
        
        {/* Service Pages */}
        <Route path="service-pages">
          <Route index element={
            <React.Suspense fallback={<LoadingFallback />}>
              <ServicePagesManager />
            </React.Suspense>
          } />
          <Route path="new" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <ServicePageEditor />
            </React.Suspense>
          } />
          <Route path="edit/:id" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <ServicePageEditor />
            </React.Suspense>
          } />
        </Route>
        
        {/* Media Management */}
        <Route path="media">
          <Route index element={
            <React.Suspense fallback={<LoadingFallback />}>
              <MediaLibrary />
            </React.Suspense>
          } />
          <Route path="upload" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <MediaUpload />
            </React.Suspense>
          } />
        </Route>
        
        {/* User Management */}
        <Route path="users" element={
          <React.Suspense fallback={<LoadingFallback />}>
            <UsersList />
          </React.Suspense>
        } />
        
        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
