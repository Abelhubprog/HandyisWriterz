import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Define post types
export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image?: string;
  service_type: string;
  created_at: string;
  updated_at: string;
  category_id?: number;
  author_id?: string;
  published: boolean;
  likes_count: number;
  anonymous_likes: number;
  views_count: number;
  comments_count: number;
  category?: {
    id: number;
    name: string;
  };
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface PostQueryParams {
  limit?: number;
  offset?: number;
  serviceType?: string;
  searchQuery?: string;
  categoryId?: number;
  sortBy?: 'created_at' | 'likes_count' | 'views_count' | 'comments_count';
  sortOrder?: 'asc' | 'desc';
}

// Helper function to build the query
const buildPostQuery = ({
  limit = 10,
  offset = 0,
  serviceType,
  searchQuery,
  categoryId,
  sortBy = 'created_at',
  sortOrder = 'desc'
}: PostQueryParams) => {
  let query = supabase
    .from('posts')
    .select(`
      *,
      category:category_id (id, name),
      author:author_id (id, full_name, avatar_url)
    `)
    .eq('published', true);

  // Apply filters
  if (serviceType) {
    query = query.eq('service_type', serviceType);
  }

  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  // Apply sorting and pagination
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  return query;
};

// React Query hook for fetching posts
export const usePosts = (params: PostQueryParams) => {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: async () => {
      const { data, error } = await buildPostQuery(params);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Post[];
    },
    keepPreviousData: true,
  });
};

// Hook for fetching a single post
export const usePost = (postId: number | string | undefined) => {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required');
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          category:category_id (id, name),
          author:author_id (id, full_name, avatar_url)
        `)
        .eq('id', postId)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Post;
    },
    enabled: !!postId,
  });
};

// Hook for fetching post by slug
export const usePostBySlug = (slug: string | undefined, serviceType: string | undefined) => {
  return useQuery({
    queryKey: ['post', slug, serviceType],
    queryFn: async () => {
      if (!slug || !serviceType) throw new Error('Slug and service type are required');
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          category:category_id (id, name),
          author:author_id (id, full_name, avatar_url)
        `)
        .eq('slug', slug)
        .eq('service_type', serviceType)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Post;
    },
    enabled: !!slug && !!serviceType,
  });
};

// Hook for incrementing post views
export const useIncrementPostView = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: number) => {
      const { error } = await supabase.rpc('record_post_view', { post_id: postId });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return true;
    },
    onSuccess: (_, postId) => {
      // Invalidate the post query to refetch with updated view count
      queryClient.invalidateQueries(['post', postId]);
    },
  });
};

// Hook for handling post likes/unlikes
export const usePostLike = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, isAnonymous }: { postId: number; isAnonymous: boolean }) => {
      if (isAnonymous) {
        const { error } = await supabase.rpc('increment_anonymous_likes', { post_id: postId });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.rpc('like_post', { post_id: postId });
        if (error) throw new Error(error.message);
      }
      return true;
    },
    onSuccess: (_, variables) => {
      // Invalidate the post query to refetch with updated like count
      queryClient.invalidateQueries(['post', variables.postId]);
      queryClient.invalidateQueries(['posts']);
    },
  });
};

// React Query hook for fetching categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // Categories don't change often, cache for 5 minutes
  });
}; 