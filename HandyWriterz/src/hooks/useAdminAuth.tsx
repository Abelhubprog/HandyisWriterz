import React, { useState, useEffect, useCallback, useContext, createContext, FC } from 'react';
import { Spinner, SpinnerProps } from '../components/ui/spinner';
import { AccessDenied, AccessDeniedProps } from '../components/ui/access-denied';
import { adminAuthService, type AdminUser } from '../services/adminAuthService';
import { toast } from 'react-hot-toast';

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AdminUser>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  checkRole: (requiredRole: AdminUser['role']) => boolean;
  isAdmin: boolean;
  canEdit: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({} as AdminAuthContextType);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await adminAuthService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load user'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    
    // Set up an interval to periodically check session status
    const sessionCheckInterval = setInterval(async () => {
      const isValid = await adminAuthService.checkSession();
      if (!isValid && user) {
        // Session expired, log out user
        setUser(null);
        toast.error('Your session has expired. Please login again.');
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(sessionCheckInterval);
  }, [loadUser, user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await adminAuthService.login({ email, password });
      setUser(loggedInUser);
      toast.success('Logged in successfully!');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed');
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await adminAuthService.logout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Logout failed');
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<AdminUser>) => {
    setError(null);
    try {
      const updatedUser = await adminAuthService.updateProfile(data);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Profile update failed');
      setError(error);
      toast.error(error.message);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setError(null);
    try {
      await adminAuthService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Password change failed');
      setError(error);
      toast.error(error.message);
      throw error;
    }
  };

  const checkRole = useCallback(
    (requiredRole: AdminUser['role']): boolean => {
      return user ? adminAuthService.hasRole(requiredRole) : false;
    },
    [user]
  );

  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    updateProfile,
    changePassword,
    checkRole,
    isAdmin: user ? adminAuthService.hasRole('admin') : false,
    canEdit: user ? adminAuthService.hasRole('editor') : false,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// HOC for protecting admin routes
export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole: AdminUser['role'] = 'viewer'
): FC<P> {
  const WithAdminAuthWrapper: React.FC<P> = (props: P): JSX.Element => {
    const { user, isLoading, checkRole } = useAdminAuth();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (!user || !checkRole(requiredRole)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You do not have the required permissions to access this page.
            </p>
            <a 
              href="/auth/admin-login" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </a>
          </div>
        </div>
      );
    }
    
    return React.createElement(WrappedComponent, props);
  };
  
  return WithAdminAuthWrapper;
}

// Custom hook for route protection
export function useAdminRouteProtection(requiredRole: AdminUser['role'] = 'viewer') {
  const { user, isLoading, checkRole } = useAdminAuth();
  
  if (isLoading) {
    return { isLoading: true, hasAccess: false };
  }
  
  return {
    isLoading: false,
    hasAccess: user ? checkRole(requiredRole) : false
  };
}
