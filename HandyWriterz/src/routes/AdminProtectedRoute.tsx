import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { adminAuth } from '@/services/adminAuth';
import { toast } from 'react-hot-toast';

/**
 * AdminProtectedRoute
 * A component that restricts access to admin-only routes
 * Redirects to admin login if not authenticated
 */
const AdminProtectedRoute: React.FC = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is admin
        const isAdmin = adminAuth.isAdmin();
        
        if (isAdmin) {
          // Refresh the session to extend expiration
          adminAuth.refreshSession();
          setIsAuthenticated(true);
        } else {
          // Not authenticated as admin
          setIsAuthenticated(false);
          
          // Show message only if coming from a different page (not on initial load)
          if (location.state?.from) {
            toast.error('Admin access required. Please log in.');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [location]);

  if (isChecking) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Verifying access...</span>
      </div>
    );
  }

  // If authenticated, render the child routes
  // Otherwise, redirect to admin login
  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate 
      to="/auth/admin-login" 
      state={{ from: location.pathname }} 
      replace 
    />
  );
};

export default AdminProtectedRoute; 