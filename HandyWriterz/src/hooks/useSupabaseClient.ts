import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useUser, useAuth } from '@clerk/clerk-react';
import type { Database } from '@/types/database';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export function useSupabaseClient() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [client, setClient] = useState<SupabaseClient<Database>>(supabase);

  useEffect(() => {
    const updateSupabaseToken = async () => {
      if (user) {
        try {
          // Get JWT token from Clerk
          const token = await getToken({ template: 'supabase' });
          
          if (token) {
            // Create new Supabase client with the token
            const authenticatedClient = createClient<Database>(
              supabaseUrl,
              supabaseAnonKey,
              {
                global: {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              }
            );
            
            setClient(authenticatedClient);
          }
        } catch (error) {
          console.error('Error getting token:', error);
          // Use anonymous client if token retrieval fails
          setClient(supabase);
        }
      } else {
        // Use anonymous client when not authenticated
        setClient(supabase);
      }
    };

    updateSupabaseToken();
  }, [user, getToken]);

  return client;
}

// Hook for checking admin status
export function useIsAdmin() {
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, supabase]);

  return { isAdmin, isLoading };
}

// Hook for managing services
export function useServices() {
  const supabase = useSupabaseClient();
  const [services, setServices] = useState<Database['public']['Tables']['services']['Row'][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('published', true)
          .order('title');

        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch services'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [supabase]);

  return { services, isLoading, error };
}

// Hook for managing service content
export function useServiceContent(serviceId: string) {
  const supabase = useSupabaseClient();
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('content')
          .eq('id', serviceId)
          .single();

        if (error) throw error;
        setContent(data?.content || null);
      } catch (err) {
        console.error('Error fetching service content:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch service content'));
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceId) {
      fetchContent();
    }
  }, [serviceId, supabase]);

  return { content, isLoading, error };
}

// Hook for managing likes and shares
export function useServiceInteractions(serviceId: string) {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const [likes, setLikes] = useState(0);
  const [shares, setShares] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        // Fetch service stats
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('likes_count, anonymous_likes_count, shares_count')
          .eq('id', serviceId)
          .single();

        if (serviceError) throw serviceError;

        setLikes((service?.likes_count || 0) + (service?.anonymous_likes_count || 0));
        setShares(service?.shares_count || 0);

        // Check if authenticated user has liked
        if (user) {
          const { data: userLike, error: likeError } = await supabase
            .from('content_likes')
            .select('id')
            .eq('service_id', serviceId)
            .eq('user_id', user.id)
            .single();

          if (!likeError) {
            setHasLiked(!!userLike);
          }
        }
      } catch (error) {
        console.error('Error fetching interactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInteractions();
  }, [serviceId, user, supabase]);

  const handleLike = async () => {
    if (user) {
      // Authenticated like
      const { error } = await supabase
        .from('content_likes')
        .insert({ service_id: serviceId, user_id: user.id });

      if (!error) {
        setLikes(prev => prev + 1);
        setHasLiked(true);
      }
    } else {
      // Anonymous like
      const { error } = await supabase.rpc('increment_anonymous_likes', {
        service_id: serviceId,
      });

      if (!error) {
        setLikes(prev => prev + 1);
      }
    }
  };

  const handleShare = async (platform: string) => {
    const { error } = await supabase
      .from('content_shares')
      .insert({
        service_id: serviceId,
        user_id: user?.id,
        platform,
      });

    if (!error) {
      setShares(prev => prev + 1);
    }
  };

  return {
    likes,
    shares,
    hasLiked,
    isLoading,
    handleLike,
    handleShare,
  };
}

export default useSupabaseClient;
