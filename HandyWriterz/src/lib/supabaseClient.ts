import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { supabase } from './supabase';

/**
 * This file is only for backward compatibility. 
 * Use the main supabase client from '@/lib/supabase' for all new code.
 * 
 * Having multiple Supabase client instances can cause issues with authentication.
 */

// Re-export the supabase client from the main file
export { supabase };

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('user_profiles').select('count');
    if (error) throw error;
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
};

// Utility functions using the original supabase client
export const publicContent = {
  getContent: async (page: number, pageSize: number) => {
    try {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .range(start, end)
        .order('created_at', { ascending: false });
        
      return { data, error };
    } catch (error) {
      console.error('Error fetching public content:', error);
      return { data: null, error };
    }
  }
};

// Backward compatibility - use getter for existing code
export const supabaseProxy = new Proxy({} as any, {
  get: (target, prop) => {
    return (supabase as any)[prop];
  }
});

// Check if database is accessible
export const safeDbCheck = async () => {
  try {
    const { data, error } = await supabase.from('admin_users').select('count');
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Check if a user is an admin
export const checkAdminStatus = async (clerkUserId: string): Promise<boolean> => {
  if (!clerkUserId) return false;

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Cache management
const cache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_CACHE_TTL = 60000; // 1 minute

// Safe query wrapper to handle database errors
export const safeQuery = async <T>(
  query: () => Promise<{ data: T | null; error: any }>,
  options?: { cacheKey?: string; cacheTTL?: number }
): Promise<{ data: T | null; error: any }> => {
  const { cacheKey, cacheTTL = DEFAULT_CACHE_TTL } = options || {};

  // Check cache if cacheKey is provided
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return { data: cached.data, error: null };
    }
  }

  try {
    const result = await query();

    // Cache the result if cacheKey is provided
    if (cacheKey && result.data) {
      cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now(),
      });
    }

    return result;
  } catch (error) {
    console.error('Database query error:', error);
    return { data: null, error };
  }
};

export const clearQueryCache = (pattern?: RegExp) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

// Fast connection check function for dashboard
export const fastConnectionCheck = async () => {
  try {
    // Use cached result if available and recent
    const currentTime = Date.now();
    const cached = cache.get('connection-status');
    if (cached && currentTime - cached.timestamp < DEFAULT_CACHE_TTL) {
      return cached.data;
    }

    const client = supabase;
    
    // Try with multiple tables and better error handling
    try {
      // Try to get a count of any table that should definitely exist
      const { error } = await client.from('services').select('count', { count: 'exact' }).limit(1);
      
      if (!error) {
        cache.set('connection-status', {
          data: true,
          timestamp: currentTime,
        });
        return true;
      }
    } catch (e) {
      console.log('First connection check failed, trying fallback');
    }
    
    try {
      // Try another table as fallback
      const { error } = await client.from('admin_users').select('count', { count: 'exact' }).limit(1);
      
      if (!error) {
        cache.set('connection-status', {
          data: true,
          timestamp: currentTime,
        });
        return true;
      }
    } catch (e) {
      console.log('Second connection check failed, trying fallback');
    }
    
    try {
      // Final fallback - just try to ping Supabase
      const { error } = await client.from('profiles').select('count', { count: 'exact' }).limit(1);
      cache.set('connection-status', {
        data: !error,
        timestamp: currentTime,
      });
    } catch (e) {
      cache.set('connection-status', {
        data: false,
        timestamp: currentTime,
      });
    }
    
    return cache.get('connection-status')?.data;
  } catch (e) {
    console.error('Connection check failed:', e);
    cache.set('connection-status', {
      data: false,
      timestamp: Date.now(),
    });
    return false;
  }
};

// Hook for admin status check
export const useSupabaseAdmin = () => {
  return {
    checkAdminStatus,
    fastConnectionCheck,
    supabase: supabaseProxy
  };
};

export const authContent = {
  likeContent: async (contentId: string) => {
    try {
      // For authenticated users, track their like in a separate table
      const { error: likeError } = await supabase
        .from('user_likes')
        .upsert({ 
          content_id: contentId,
          liked_at: new Date().toISOString()
        });
      
      if (likeError) throw likeError;
      
      // Also increment the main likes counter
      const { error } = await supabase
        .from('services')
        .update({ likes: supabase.rpc('increment_counter', { row_id: contentId }) })
        .eq('id', contentId);
        
      return { error };
    } catch (error) {
      console.error('Error liking content:', error);
      return { error };
    }
  },
  
  addComment: async (contentId: string, comment: string) => {
    try {
      if (!comment.trim()) return { error: new Error('Comment cannot be empty') };
      
      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          content_id: contentId,
          comment_text: comment,
          created_at: new Date().toISOString()
        });
      
      if (commentError) throw commentError;
      
      // Update the comments count
      const { error } = await supabase
        .from('services')
        .update({ comments_count: supabase.rpc('increment_counter', { row_id: contentId }) })
        .eq('id', contentId);
        
      return { error };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { error };
    }
  }
};