import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import NewDashboard from './pages/SimpleDashboard';
import ContentList from './pages/content/ContentList';
import ContentEditor from './pages/content/ContentEditor';
import Categories from './pages/content/Categories';
import UsersList from './pages/users/UsersList';
import UserEditor from './pages/users/UserEditor';
import Analytics from './pages/Analytics';
import Settings from "./settings";
import NotFound from "@/pages/not-found";

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const isAuthenticated = Boolean(token);

  if (!isAuthenticated) {
    return <Navigate to="/auth/admin-login" replace />;
  }

  return <>{children}</>;
};

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <AuthGuard>
          <AdminLayout />
        </AuthGuard>
      }>
        <Route index element={<NewDashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="content">
          <Route index element={<ContentList />} />
          <Route path="new" element={<ContentEditor />} />
          <Route path=":id" element={<ContentEditor />} />
          <Route path="categories" element={<Categories />} />
        </Route>
        <Route path="users">
          <Route index element={<UsersList />} />
          <Route path="new" element={<UserEditor />} />
          <Route path=":id" element={<UserEditor />} />
        </Route>
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes; 