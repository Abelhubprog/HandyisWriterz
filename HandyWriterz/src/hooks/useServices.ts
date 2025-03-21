import { useState, useEffect } from 'react';
import { publicApi } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

// Import the ServiceData type from supabaseClient
import type { ServiceData } from '@/lib/supabaseClient';

export function useServices() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await publicApi.getPublishedServices();

      if (result.error) {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to load services';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      if (result.data) {
        setServices(result.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load services';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return {
    services,
    isLoading,
    error,
    refetch: fetchServices
  };
}
