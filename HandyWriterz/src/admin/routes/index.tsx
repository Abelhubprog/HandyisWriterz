import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import SimpleDashboard from '../pages/SimpleDashboard';
import ContentList from '../pages/content/ContentList';
import ContentEditor from '../pages/content/ContentEditor';
import CategoryList from '../pages/content/Categories';
import ServiceEditor from '../pages/content/ServiceEditor';
import Analytics from '../pages/Analytics';
import UsersList from '../pages/users/UsersList';
import UserEditor from '../pages/users/UserEditor';
import Settings from '../settings';
import NotFound from '@/pages/not-found';
import ErrorBoundary from '../components/ErrorBoundary';
import DebugRedirect from '../pages/DebugRedirect';

// Import the existing admin login component
import AdminLogin from '@/pages/auth/admin-login';

// Add a wrapper component that provides children to AdminLayout
const AdminLayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <AdminLayout>{children}</AdminLayout>
);

// Simple debug component to show the current authentication state
const DebugDashboard = () => {
  // Basic debugging information - will work even if main components fail
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Dashboard</h1>
      <p className="text-gray-700 mb-4">This is a simplified dashboard for debugging.</p>
      
      <div className="mt-4 bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold">Session Information:</h2>
        <pre className="mt-2 bg-gray-50 p-3 rounded border border-gray-200 overflow-auto text-sm">
          {JSON.stringify({
            location: window.location.pathname,
            sessionStorage: Object.keys(sessionStorage),
            localStorage: Object.keys(localStorage),
            cookies: document.cookie,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
    <p className="text-lg text-gray-700 mb-6">You don't have permission to access this page.</p>
    <button 
      onClick={() => window.history.back()}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    >
      Go Back
    </button>
  </div>
);

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/debug" element={<DebugDashboard />} />
      
      {/* No auth check on this route for direct debugging */}
      <Route path="/simple-debug" element={<SimpleDashboard />} />
      
      {/* Debug routes - using Navigate component for safer redirects */}
      <Route path="/to-admin" element={<Navigate to="/admin" replace />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={
          <ErrorBoundary>
            <Dashboard />
          </ErrorBoundary>
        } />

        {/* Content Management */}
        <Route path="content" element={
          <ErrorBoundary>
            <ContentList />
          </ErrorBoundary>
        } />
        <Route path="content/new" element={
          <ErrorBoundary>
            <ContentEditor />
          </ErrorBoundary>
        } />
        <Route path="content/:id" element={
          <ErrorBoundary>
            <ContentEditor />
          </ErrorBoundary>
        } />

        {/* Service-specific Content Management */}
        <Route path="services/:service" element={
          <ErrorBoundary>
            <ContentList />
          </ErrorBoundary>
        } />
        <Route path="services/:service/new" element={
          <ErrorBoundary>
            <ContentEditor />
          </ErrorBoundary>
        } />
        <Route path="services/:service/:id" element={
          <ErrorBoundary>
            <ContentEditor />
          </ErrorBoundary>
        } />
        <Route path="services/edit/:service" element={
          <ErrorBoundary>
            <ServiceEditor />
          </ErrorBoundary>
        } />

        {/* Categories Management */}
        <Route path="categories" element={
          <ErrorBoundary>
            <CategoryList />
          </ErrorBoundary>
        } />

        {/* Analytics */}
        <Route path="analytics" element={
          <ErrorBoundary>
            <Analytics />
          </ErrorBoundary>
        } />
        
        {/* User management routes - require admin permissions */}
        <Route 
          path="users" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <ErrorBoundary>
                <UsersList />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="users/new" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <ErrorBoundary>
                <UserEditor />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route 
          path="users/:id" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <ErrorBoundary>
                <UserEditor />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        
        <Route path="settings" element={
          <ErrorBoundary>
            <Settings />
          </ErrorBoundary>
        } />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes; 