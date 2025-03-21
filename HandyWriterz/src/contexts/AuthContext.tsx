import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authService, AuthUser } from '@/services/authService';

// Define the context shape
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkPermission: (role: 'admin' | 'editor' | 'user') => boolean;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  adminLogin: async () => false,
  logout: async () => {},
  checkPermission: () => false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Regular user login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const user = await authService.login(email, password);
      
      if (user) {
        setUser(user);
        toast.success('Logged in successfully');
        return true;
      }
      
      toast.error('Invalid credentials');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to log in');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Admin login
  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const user = await authService.adminLogin(email, password);
      
      if (user) {
        setUser(user);
        toast.success('Admin logged in successfully');
        return true;
      }
      
      toast.error('Invalid admin credentials');
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Failed to log in as admin');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const success = await authService.logout();
      
      if (success) {
        setUser(null);
        toast.success('Logged out successfully');
        navigate('/');
      } else {
        toast.error('Failed to log out');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has permission
  const checkPermission = (requiredRole: 'admin' | 'editor' | 'user'): boolean => {
    if (!user) return false;

    switch (requiredRole) {
      case 'admin':
        return user.role === 'admin';
      case 'editor':
        return user.role === 'admin' || user.role === 'editor';
      case 'user':
        return true; // All authenticated users have user permissions
      default:
        return false;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    adminLogin,
    logout,
    checkPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
