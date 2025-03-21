import React, { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

// Lazy load admin components
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const ManageUsers = lazy(() => import('@/pages/admin/ManageUsers'));
const ManageContent = lazy(() => import('@/pages/admin/ManageContent'));
const ManageServices = lazy(() => import('@/pages/admin/ManageServices'));
const ManageComments = lazy(() => import('@/pages/admin/ManageComments'));
const Analytics = lazy(() => import('@/pages/admin/Analytics'));
const Settings = lazy(() => import('@/pages/admin/Settings'));
const ServiceEditor = lazy(() => import('@/pages/admin/services/ServiceEditor'));
const ServicesList = lazy(() => import('@/pages/admin/services/ServicesList'));
const CreateService = lazy(() => import('@/pages/admin/services/CreateService'));
const ContentEditor = lazy(() => import('@/pages/admin/content/ContentEditor'));
const ContentList = lazy(() => import('@/pages/admin/content/ContentList'));
const CreateContent = lazy(() => import('@/pages/admin/content/CreateContent'));
const MediaLibrary = lazy(() => import('@/pages/admin/content/MediaLibrary'));
const UsersList = lazy(() => import('@/pages/admin/users/UsersList'));
const UserRoles = lazy(() => import('@/pages/admin/users/UserRoles'));
const UserProfile = lazy(() => import('@/pages/admin/users/UserProfile'));

// Error boundary component
const AdminErrorBoundary = ({ error }: { error: Error }) => {
  const { user } = useAuth();

  // Log admin errors to Supabase
  React.useEffect(() => {
    if (error) {
      supabase
        .from('admin_error_logs')
        .insert([
          {
            error_message: error.message,
            error_stack: error.stack,
            user_id: user?.id,
            path: window.location.pathname,
          },
        ])
        .then(() => {
          console.error('Admin error logged:', error);
        });
    }
  }, [error, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600">Something went wrong. Please try again.</p>
        <p className="text-sm text-gray-500 mt-2">Error has been logged for review.</p>
      </div>
    </div>
  );
};

const withSuspense = (Component: React.ComponentType) => (
  <Suspense 
    fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }
  >
    <Component />
  </Suspense>
);

const AdminLayout = () => (
  <AdminRoute>
    <ErrorBoundary FallbackComponent={AdminErrorBoundary}>
      <Outlet />
    </ErrorBoundary>
  </AdminRoute>
);

const AdminRoutes = () => (
  <Routes>
    <Route path="/*" element={<AdminLayout />}>
      <Route index element={<Navigate to="/admin" replace />} />
      <Route path="admin" element={<Outlet />}>
        <Route index element={withSuspense(AdminDashboard)} />
        {/* User Management */}
        <Route path="users" element={<Outlet />}>
          <Route index element={withSuspense(UsersList)} />
          <Route path="roles" element={withSuspense(UserRoles)} />
          <Route path=":userId" element={withSuspense(UserProfile)} />
        </Route>
        {/* Content Management */}
        <Route path="content" element={<Outlet />}>
          <Route index element={withSuspense(ContentList)} />
          <Route path="create" element={withSuspense(CreateContent)} />
          <Route path="edit/:contentId" element={withSuspense(ContentEditor)} />
          <Route path="media" element={withSuspense(MediaLibrary)} />
        </Route>
        {/* Service Management */}
        <Route path="services" element={<Outlet />}>
          <Route index element={withSuspense(ServicesList)} />
          <Route path="create" element={withSuspense(CreateService)} />
          <Route path="edit/:serviceId" element={withSuspense(ServiceEditor)} />
        </Route>
        {/* Comments Management */}
        <Route path="comments" element={withSuspense(ManageComments)} />
        {/* Analytics */}
        <Route path="analytics" element={withSuspense(Analytics)} />
        {/* Settings */}
        <Route path="settings" element={withSuspense(Settings)} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Route>
  </Routes>
);

export default AdminRoutes;