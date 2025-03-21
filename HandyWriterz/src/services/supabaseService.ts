import { supabase, adminSupabase } from '@/lib/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

// Cache management
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache: Record<string, { data: any; timestamp: number }> = {};

// Error handling
export const handleSupabaseError = (error: PostgrestError | Error | null, fallbackMessage: string = 'An error occurred'): string => {
  if (!error) return fallbackMessage;
  
  console.error('Supabase error:', error);
  
  // Check if it's a PostgrestError
  if ('code' in error && 'message' in error) {
    // Handle specific error codes
    switch (error.code) {
      case '23505': // Unique violation
        return 'This record already exists';
      case '23503': // Foreign key violation
        return 'This operation references a record that does not exist';
      case '42P01': // Undefined table
        return 'Database table not found';
      case 'PGRST116': // No rows returned
        return 'No data found';
      case '42501': // Insufficient privilege
        return 'You do not have permission to perform this action';
      case '22P02': // Invalid text representation
        return 'Invalid input format';
      default:
        return error.message || fallbackMessage;
    }
  }
  
  // Generic Error object
  return error.message || fallbackMessage;
};

// Generic fetch with caching
export const fetchWithCache = async <T>(
  key: string,
  fetcher: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  forceFresh: boolean = false,
  cacheDuration: number = CACHE_DURATION
): Promise<{ data: T | null; error: string | null }> => {
  try {
    // Check cache first unless forceFresh is true
    if (!forceFresh && cache[key] && (Date.now() - cache[key].timestamp) < cacheDuration) {
      return { data: cache[key].data, error: null };
    }
    
    // Fetch fresh data
    const { data, error } = await fetcher();
    
    if (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
    
    // Update cache
    cache[key] = { data, timestamp: Date.now() };
    return { data, error: null };
  } catch (err) {
    console.error(`Error fetching ${key}:`, err);
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    };
  }
};

// Clear specific cache entries
export const clearCache = (keyPattern: string) => {
  Object.keys(cache).forEach(key => {
    if (key.includes(keyPattern)) {
      delete cache[key];
    }
  });
};

// Service Pages API
export const getServicePages = async (forceFresh: boolean = false) => {
  return fetchWithCache(
    'service_pages',
    () => supabase
      .from('service_pages')
      .select('*')
      .eq('is_published', true)
      .order('updated_at', { ascending: false }),
    forceFresh
  );
};

export const getServicePageBySlug = async (slug: string, forceFresh: boolean = false) => {
  return fetchWithCache(
    `service_page:${slug}`,
    () => supabase
      .from('service_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle(),
    forceFresh
  );
};

// Blog Posts API
export const getBlogPosts = async (
  page: number = 1,
  pageSize: number = 10,
  serviceType?: string,
  forceFresh: boolean = false
) => {
  const cacheKey = `blog_posts:${serviceType || 'all'}:${page}:${pageSize}`;
  
  return fetchWithCache(
    cacheKey,
    async () => {
      let query = supabase
        .from('blog_posts')
        .select('*, author:author_id(*)', { count: 'exact' })
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }
      
      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return { 
        data: {
          posts: data || [],
          count,
          hasMore: count ? count > (page * pageSize) : false,
          currentPage: page,
          totalPages: count ? Math.ceil(count / pageSize) : 0
        }, 
        error 
      };
    },
    forceFresh
  );
};

export const getFeaturedBlogPosts = async (
  serviceType?: string,
  limit: number = 3,
  forceFresh: boolean = false
) => {
  const cacheKey = `featured_posts:${serviceType || 'all'}:${limit}`;
  
  return fetchWithCache(
    cacheKey,
    () => supabase
      .from('blog_posts')
      .select('*, author:author_id(*)')
      .eq('is_published', true)
      .eq('is_featured', true)
      .eq(serviceType ? 'service_type' : 'is_published', serviceType || true)
      .order('published_at', { ascending: false })
      .limit(limit),
    forceFresh
  );
};

export const getBlogPostBySlug = async (slug: string, forceFresh: boolean = false) => {
  const cacheKey = `blog_post:${slug}`;
  
  const result = await fetchWithCache(
    cacheKey,
    () => supabase
      .from('blog_posts')
      .select('*, author:author_id(*), categories(*), tags(*)')
      .eq('slug', slug)
      .eq('is_published', true)
      .single(),
    forceFresh
  );
  
  // Increment view count if post was found
  if (result.data && !result.error) {
    try {
      await supabase
        .from('blog_posts')
        .update({ 
          views: (result.data.views || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', result.data.id);
    } catch (err) {
      console.error('Error incrementing view count:', err);
      // Don't fail the whole operation if view count update fails
    }
  }
  
  return result;
};

export const getRelatedPosts = async (
  postId: string,
  serviceType: string,
  limit: number = 3,
  forceFresh: boolean = false
) => {
  const cacheKey = `related_posts:${postId}:${serviceType}:${limit}`;
  
  return fetchWithCache(
    cacheKey,
    () => supabase
      .from('blog_posts')
      .select('*, author:author_id(*)')
      .eq('is_published', true)
      .eq('service_type', serviceType)
      .neq('id', postId)
      .order('published_at', { ascending: false })
      .limit(limit),
    forceFresh
  );
};

// Categories and Tags
export const getCategories = async (serviceType?: string, forceFresh: boolean = false) => {
  const cacheKey = `categories:${serviceType || 'all'}`;
  
  return fetchWithCache(
    cacheKey,
    async () => {
      let query = supabase
        .from('categories')
        .select('*');
      
      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }
      
      return query.order('name', { ascending: true });
    },
    forceFresh
  );
};

export const getTags = async (forceFresh: boolean = false) => {
  return fetchWithCache(
    'tags',
    () => supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true }),
    forceFresh
  );
};

// User Reactions (Likes, Comments)
export const likePost = async (postId: string, userId?: string) => {
  try {
    // For anonymous likes, we use IP-based tracking with a session ID
    const sessionId = userId || generateSessionId();
    
    // Check if this session already liked the post
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('session_id', sessionId)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    // If already liked, remove the like
    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);
      
      if (deleteError) throw deleteError;
      
      // Update post like count
      await updatePostLikeCount(postId);
      
      return { success: true, action: 'unliked' };
    }
    
    // Otherwise, add a new like
    const { error: insertError } = await supabase
      .from('post_likes')
      .insert([{ 
        post_id: postId, 
        user_id: userId || null,
        session_id: sessionId,
        created_at: new Date().toISOString()
      }]);
    
    if (insertError) throw insertError;
    
    // Update post like count
    await updatePostLikeCount(postId);
    
    return { success: true, action: 'liked' };
  } catch (error) {
    console.error('Error liking post:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to like post' 
    };
  }
};

// Helper to update post like count
const updatePostLikeCount = async (postId: string) => {
  try {
    // Count likes for this post
    const { data, error: countError } = await supabase
      .from('post_likes')
      .select('id', { count: 'exact' })
      .eq('post_id', postId);
    
    if (countError) throw countError;
    
    // Update the post with the new count
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ likes: data?.length || 0 })
      .eq('id', postId);
    
    if (updateError) throw updateError;
    
    // Clear cache for this post
    clearCache(`blog_post:${postId}`);
    
    return true;
  } catch (error) {
    console.error('Error updating like count:', error);
    return false;
  }
};

// Helper to generate a session ID for anonymous users
const generateSessionId = (): string => {
  // Check if we already have a session ID in localStorage
  const existingId = localStorage.getItem('anonymous_session_id');
  if (existingId) return existingId;
  
  // Generate a new ID
  const newId = `anon_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
  localStorage.setItem('anonymous_session_id', newId);
  return newId;
};

// Comments (requires authentication)
export const getComments = async (postId: string, forceFresh: boolean = true) => {
  const cacheKey = `comments:${postId}`;
  
  return fetchWithCache(
    cacheKey,
    () => supabase
      .from('comments')
      .select('*, author:user_id(*)')
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false }),
    forceFresh
  );
};

export const addComment = async (postId: string, userId: string, content: string) => {
  try {
    if (!userId) {
      return { success: false, error: 'You must be logged in to comment' };
    }
    
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        post_id: postId,
        user_id: userId,
        content,
        is_approved: true, // Auto-approve for now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update comment count on the post
    await updateCommentCount(postId);
    
    // Clear cache
    clearCache(`comments:${postId}`);
    
    return { success: true, data };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add comment' 
    };
  }
};

// Helper to update comment count
const updateCommentCount = async (postId: string) => {
  try {
    // Count comments for this post
    const { data, error: countError } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('post_id', postId)
      .eq('is_approved', true);
    
    if (countError) throw countError;
    
    // Update the post with the new count
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ comments_count: data?.length || 0 })
      .eq('id', postId);
    
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error('Error updating comment count:', error);
    return false;
  }
};

// Admin functions (using adminSupabase client)
export const createBlogPost = async (post: any) => {
  try {
    const { data, error } = await adminSupabase
      .from('blog_posts')
      .insert([{
        ...post,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        views: 0,
        likes: 0,
        comments_count: 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Clear relevant caches
    clearCache('blog_posts');
    clearCache('featured_posts');
    
    return { success: true, data };
  } catch (error) {
    console.error('Error creating blog post:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create blog post' 
    };
  }
};

export const updateBlogPost = async (id: string, post: any) => {
  try {
    const { data, error } = await adminSupabase
      .from('blog_posts')
      .update({
        ...post,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Clear relevant caches
    clearCache('blog_posts');
    clearCache('featured_posts');
    clearCache(`blog_post:${id}`);
    clearCache(`blog_post:${post.slug}`);
    
    return { success: true, data };
  } catch (error) {
    console.error('Error updating blog post:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update blog post' 
    };
  }
};

export const deleteBlogPost = async (id: string) => {
  try {
    // Get the post first to know its slug for cache clearing
    const { data: post, error: fetchError } = await adminSupabase
      .from('blog_posts')
      .select('slug')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Delete the post
    const { error } = await adminSupabase
      .from('blog_posts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Clear relevant caches
    clearCache('blog_posts');
    clearCache('featured_posts');
    clearCache(`blog_post:${id}`);
    if (post?.slug) clearCache(`blog_post:${post.slug}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete blog post' 
    };
  }
};

export const updateServicePage = async (id: string, page: any) => {
  try {
    const { data, error } = await adminSupabase
      .from('service_pages')
      .update({
        ...page,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Clear relevant caches
    clearCache('service_pages');
    clearCache(`service_page:${page.slug}`);
    
    return { success: true, data };
  } catch (error) {
    console.error('Error updating service page:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update service page' 
    };
  }
};

// Database health check
export const checkDatabaseConnection = async () => {
  try {
    const start = Date.now();
    
    // Try to query a small table
    const { data, error } = await supabase
      .from('service_pages')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    const end = Date.now();
    
    if (error) {
      return { 
        connected: false, 
        latency: null, 
        error: handleSupabaseError(error) 
      };
    }
    
    return { 
      connected: true, 
      latency: end - start, 
      error: null 
    };
  } catch (error) {
    console.error('Database connection check failed:', error);
    return { 
      connected: false, 
      latency: null, 
      error: error instanceof Error ? error.message : 'Failed to connect to database' 
    };
  }
}; 