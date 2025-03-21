import { useState, useEffect, useCallback } from 'react';
import { withDatabaseFallback, FallbackData } from '@/lib/databaseFallbacks';
import { useDatabaseConnection } from '@/contexts/DatabaseConnectionContext';

interface UseDatabaseQueryOptions<T, P = any> {
  queryFn: (params?: P) => Promise<T>;
  fallbackData?: T;
  cacheKey?: string;
  cacheTTL?: number;
  enabled?: boolean;
  params?: P;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseDatabaseQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  dataSource: 'database' | 'cache' | 'local' | 'default' | null;
  lastUpdated: Date | null;
}

/**
 * Hook for performing database queries with fallback support
 */
export function useDatabaseQuery<T, P = any>({
  queryFn,
  fallbackData,
  cacheKey,
  cacheTTL,
  enabled = true,
  params,
  onSuccess,
  onError
}: UseDatabaseQueryOptions<T, P>): UseDatabaseQueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [dataSource, setDataSource] = useState<'database' | 'cache' | 'local' | 'default' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { isConnected } = useDatabaseConnection();
  
  // Generate a dynamic cache key if provided
  const effectiveCacheKey = cacheKey ? 
    (typeof params === 'object' && params !== null ? 
      `${cacheKey}_${JSON.stringify(params)}` : 
      cacheKey) : 
    undefined;
  
  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setIsError(false);
    setError(null);
    
    try {
      const result = await withDatabaseFallback<T>({
        operation: () => queryFn(params),
        fallbackData,
        cacheKey: effectiveCacheKey,
        cacheTTL,
        onError: (err) => {
          setIsError(true);
          setError(err);
          if (onError) onError(err);
        }
      });
      
      setData(result.data);
      setDataSource(result.source as any);
      setLastUpdated(result.timestamp || new Date());
      
      if (onSuccess) onSuccess(result.data);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
      if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, params, fallbackData, effectiveCacheKey, cacheTTL, enabled, onSuccess, onError]);
  
  // Fetch data when the hook is first used or when dependencies change
  useEffect(() => {
    if (enabled) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [fetchData, enabled]);
  
  // Refetch when connection is restored
  useEffect(() => {
    if (isConnected && dataSource && dataSource !== 'database') {
      fetchData();
    }
  }, [isConnected, dataSource, fetchData]);
  
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);
  
  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    dataSource,
    lastUpdated
  };
} 