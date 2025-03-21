import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SupabaseProvider } from '@/providers/SupabaseProvider';
import { AuthProvider } from './components/hooks/useAuth';
import AdminRoutes from './Routes';
import { Toaster } from '@/components/ui/toast/toaster';

/**
 * Admin application wrapper for the HandyWriterz platform
 * The component wraps all admin pages with necessary providers and routing
 */
const Admin: React.FC = () => {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <Routes>
          <Route path="*" element={<AdminRoutes />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </SupabaseProvider>
  );
};

export default Admin; 