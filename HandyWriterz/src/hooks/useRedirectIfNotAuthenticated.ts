import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

/**
 * A custom hook that redirects to the login page if the user is not authenticated
 * @param redirectTo The path to redirect to if not authenticated (defaults to '/sign-in')
 * @param requireAdmin Whether to require admin role (defaults to false)
 * @returns An object containing the user, loading state and role
 */
export function useRedirectIfNotAuthenticated(
  redirectTo: string = '/sign-in',
  requireAdmin: boolean = false
) {
  const { user, isLoading, isAdmin, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect after we've checked authentication status
    if (!isLoading) {
      if (!user) {
        // User is not authenticated, redirect to login
        toast.error('Please sign in to access this page');
        navigate(redirectTo, { 
          replace: true,
          state: { from: location.pathname }
        });
      } else if (requireAdmin && !isAdmin) {
        // User is authenticated but not an admin, redirect to dashboard
        toast.error('You do not have access to this area');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isLoading, isAdmin, navigate, redirectTo, location.pathname, requireAdmin]);

  return { user, isLoading, role };
}