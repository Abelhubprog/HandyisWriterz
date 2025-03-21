import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';

export function useSupabase() {
  const { user, isSignedIn } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  // Only check admin status if user is signed in
  const { data: adminStatus } = useQuery({
    queryKey: ['adminStatus', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!isSignedIn && !!user?.id,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  useEffect(() => {
    setIsAdmin(!!adminStatus);
  }, [adminStatus]);

  return {
    isAdmin,
    supabase,
    user,
    isSignedIn
  };
}
