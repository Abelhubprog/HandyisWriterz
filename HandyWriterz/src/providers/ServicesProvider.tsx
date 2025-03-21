import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useMutation, type UseQueryOptions } from '@tanstack/react-query';
import { supabase, safeQuery } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import DatabaseService from '@/services/databaseService';

interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ServiceLink {
  path: string;
  label: string;
  slug: string;
  description: string;
  likes: number;
  comments: number;
}

interface ServicesContextType {
  services: ServiceLink[];
  isLoading: boolean;
  error: Error | null;
  refetchServices: () => Promise<void>;
  likeService: (serviceId: string) => Promise<void>;
  unlikeService: (serviceId: string) => Promise<void>;
  isLiked: (serviceId: string) => Promise<boolean>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const queryOptions: UseQueryOptions<ServiceLink[], Error> = {
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select(`
            id,
            title,
            slug,
            description,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false });

        if (servicesError) throw new Error(servicesError.message);
        if (!servicesData) return [];

        // Get comment counts in a separate query
        const commentsPromises = servicesData.map(async (service: Service) => {
          try {
            const { count, error: commentsError } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('service_id', service.id);

            return {
              serviceId: service.id,
              count: commentsError ? 0 : (count || 0)
            };
          } catch (e) {
            console.error('Error fetching comments for service', service.id, e);
            return { serviceId: service.id, count: 0 };
          }
        });

        const commentCounts = await Promise.all(commentsPromises);
        const commentCountMap = commentCounts.reduce((acc, { serviceId, count }) => {
          acc[serviceId] = count;
          return acc;
        }, {} as Record<string, number>);

        // Get likes counts in a separate query
        const likesPromises = servicesData.map(async (service: Service) => {
          try {
            const { count, error: likesError } = await supabase
              .from('service_likes')
              .select('*', { count: 'exact', head: true })
              .eq('service_id', service.id);

            return {
              serviceId: service.id,
              count: likesError ? 0 : (count || 0)
            };
          } catch (e) {
            console.error('Error fetching likes for service', service.id, e);
            return { serviceId: service.id, count: 0 };
          }
        });

        const likesCounts = await Promise.all(likesPromises);
        const likesCountMap = likesCounts.reduce((acc, { serviceId, count }) => {
          acc[serviceId] = count;
          return acc;
        }, {} as Record<string, number>);

        // Transform the data into the format expected by the UI
        return servicesData.map((service: Service) => ({
          path: `/services/${service.slug}`,
          label: service.title,
          slug: service.slug,
          description: service.description,
          likes: likesCountMap[service.id] || 0,
          comments: commentCountMap[service.id] || 0,
        }));
      } catch (error) {
        console.error('Error fetching services:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  };

  const {
    data: services = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ServiceLink[], Error>(queryOptions);

  const likeMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { data, error } = await supabase
        .from('service_likes')
        .insert([{ service_id: serviceId }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error liking service:', error);
      toast.error('Failed to like service. Please try again.');
    }
  });

  const unlikeMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { data, error } = await supabase
        .from('service_likes')
        .delete()
        .match({ service_id: serviceId });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error unliking service:', error);
      toast.error('Failed to unlike service. Please try again.');
    }
  });

  const likeService = async (serviceId: string) => {
    await likeMutation.mutateAsync(serviceId);
  };

  const unlikeService = async (serviceId: string) => {
    await unlikeMutation.mutateAsync(serviceId);
  };

  const isLiked = async (serviceId: string) => {
    const { data, error } = await supabase
      .from('service_likes')
      .select('id')
      .match({ service_id: serviceId })
      .single();

    if (error) return false;
    return !!data;
  };

  const refetchServices = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <ServicesContext.Provider
      value={{
        services,
        isLoading,
        error,
        refetchServices,
        likeService,
        unlikeService,
        isLiked,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}
