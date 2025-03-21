import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

// List of routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/tools/turnitin',
  '/payment',
  '/profile',
  '/settings'
];

export const useAuthGuard = () => {
  const { user, primaryWallet } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      // Check if the current route needs authentication
      const needsAuth = PROTECTED_ROUTES.some(route => 
        location.pathname.startsWith(route)
      );

      if (needsAuth) {
        // Check both Dynamic authentication and local storage
        const isAuthed = !!user && !!primaryWallet;
        setIsAuthenticated(isAuthed);

        if (!isAuthed) {
          console.log(`Unauthorized access attempt to ${location.pathname}, redirecting to home...`);
          // Store the attempted path to redirect back after login
          sessionStorage.setItem('redirect_after_login', location.pathname);
          navigate('/', { replace: true });
        }
      } else {
        // For non-protected routes, consider the user authenticated if they have both
        // user and wallet info
        setIsAuthenticated(!!user && !!primaryWallet);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [user, primaryWallet, navigate, location.pathname]);

  return {
    isLoading,
    isAuthenticated,
    user,
    primaryWallet
  };
};

// Helper to check if a route needs authentication
export const isProtectedRoute = (pathname: string): boolean => {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
};
