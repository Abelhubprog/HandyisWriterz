import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy load admin components for better performance
const Dashboard = lazy(() => import('./Dashboard'));
const ServiceManager = lazy(() => import('./services/ServiceManager'));
const ServicePageEditor = lazy(() => import('./services/ServicePageEditor'));
const UserManagement = lazy(() => import('./users/UserManagement'));
const ContentManager = lazy(() => import('./content/PostsList'));
const PostEditor = lazy(() => import('./content/PostEditor'));
const AnalyticsDashboard = lazy(() => import('./analytics/AnalyticsDashboard'));

export default function DashboardRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="services">
          <Route index element={<ServiceManager />} />
          <Route path="edit/:id" element={<ServicePageEditor />} />
          <Route path="new" element={<ServicePageEditor />} />
        </Route>
        <Route path="users" element={<UserManagement />} />
        <Route path="content">
          <Route index element={<ContentManager />} />
          <Route path="edit/:id" element={<PostEditor />} />
          <Route path="new" element={<PostEditor />} />
        </Route>
        <Route path="analytics" element={<AnalyticsDashboard />} />
      </Routes>
    </Suspense>
  );
}