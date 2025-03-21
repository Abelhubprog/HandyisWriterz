import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AuthMiddlewareProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authentication is required and user is not signed in
  if (requireAuth && !isAuthenticated) {
    // Store current location for redirect after login
    if (location.pathname !== '/sign-in') {
      sessionStorage.setItem('redirect_after_login', location.pathname);
    }
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // If user is signed in but tries to access auth pages
  if (isAuthenticated && (location.pathname === '/sign-in' || location.pathname === '/sign-up')) {
    return <Navigate to="/dashboard" replace />;
  }

  // If admin access is required but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthMiddleware;
