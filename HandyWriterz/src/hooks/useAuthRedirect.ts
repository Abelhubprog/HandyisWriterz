import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export const useAuthRedirect = () => {
  const { user } = useDynamicContext();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const authSuccess = localStorage.getItem('auth_success');
      console.log('Auth check - User:', !!user, 'Auth Success:', !!authSuccess, 'Path:', window.location.pathname);

      if (user && authSuccess) {
        console.log('User authenticated, checking path...');
        if (window.location.pathname === '/') {
          console.log('Redirecting to dashboard...');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('Not redirecting, already on a different path.');
        }
      } else if (!user && window.location.pathname.startsWith('/dashboard')) {
        console.log('Unauthenticated user accessing dashboard, redirecting to home...');
        navigate('/', { replace: true });
      }
    };

    // Check immediately
    checkAuthAndRedirect();

    // Set up interval to periodically check auth state
    const interval = setInterval(checkAuthAndRedirect, 2000);

    return () => clearInterval(interval);
  }, [user, navigate]);
};
