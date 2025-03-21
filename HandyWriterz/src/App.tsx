import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SupabaseProvider } from '@/providers/SupabaseProvider';
import AdminLogin from './pages/auth/admin-login';
import AdminRoutes from './admin/Routes';
import { AuthProvider as AdminAuthProvider } from './admin/components/hooks/useAuth';

// Add error handlers
if (typeof window !== 'undefined') {
  // Runtime error handler
  window.addEventListener('error', (event) => {
    console.error('Runtime error:', event.error);
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

const App: React.FC = () => {
  return (
    <SupabaseProvider>
      {/* Wrap admin routes in AdminAuthProvider to avoid conflict with main app's AuthProvider */}
      <AdminAuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }} 
        />
        
        <Routes>
          {/* Admin routes with their own layout */}
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/auth/admin-login" element={<AdminLogin />} />
          
          {/* Redirect any other paths to the main router */}
          <Route path="/*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminAuthProvider>
    </SupabaseProvider>
  );
};

export default App;
