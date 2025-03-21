import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { checkAdminStatus } from '../lib/supabaseClient';

/**
 * A hook to check if the current user is an admin
 * Uses Clerk for authentication and Supabase for role management
 */
export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const checkAdmin = async () => {
      setIsLoading(true);
      try {
        if (isLoaded && user?.id) {
          const adminStatus = await checkAdminStatus(user.id);
          setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded) {
      checkAdmin();
    }
  }, [user, isLoaded]);

  return { isAdmin, isLoading };
};

export default useIsAdmin;
