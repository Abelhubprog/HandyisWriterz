import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface Comment {
  id: number;
  post_id: number;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

// Hook for fetching comments for a post
export const useComments = (postId: number | undefined) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required');
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:author_id (id, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Comment[];
    },
    enabled: !!postId,
    // Comments might change frequently, so use a shorter stale time
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook for adding a comment
export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      if (!user) throw new Error('You must be logged in to comment');
      
      const { data, error } = await supabase.rpc('add_comment', {
        post_id: postId,
        content
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Comment;
    },
    onMutate: async ({ postId, content }) => {
      if (!user) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['comments', postId]);
      
      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<Comment[]>(['comments', postId]);
      
      // Optimistically update to the new value
      if (previousComments) {
        queryClient.setQueryData(['comments', postId], [
          {
            id: Date.now(), // temporary ID
            post_id: postId,
            author_id: user.id,
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            author: {
              id: user.id,
              full_name: user.user_metadata?.full_name || 'User',
              avatar_url: user.user_metadata?.avatar_url
            }
          },
          ...previousComments
        ]);
      }
      
      // Return a context with the previous comments
      return { previousComments };
    },
    onError: (err, { postId }, context) => {
      // If the mutation fails, use the context we saved to roll back
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
    },
    onSettled: (_, __, { postId }) => {
      // Always refetch after error or success to make sure our optimistic update is correct
      queryClient.invalidateQueries(['comments', postId]);
      // Also invalidate the post to update comments count
      queryClient.invalidateQueries(['post', postId]);
    },
  });
};

// Hook for deleting a comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: number; postId: number }) => {
      if (!user) throw new Error('You must be logged in to delete a comment');
      
      const { error } = await supabase.rpc('delete_comment', {
        comment_id: commentId
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return true;
    },
    onMutate: async ({ commentId, postId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['comments', postId]);
      
      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<Comment[]>(['comments', postId]);
      
      // Optimistically update to the new value
      if (previousComments) {
        queryClient.setQueryData(['comments', postId], 
          previousComments.filter(comment => comment.id !== commentId)
        );
      }
      
      // Return a context with the previous comments
      return { previousComments };
    },
    onError: (err, { postId }, context) => {
      // If the mutation fails, use the context we saved to roll back
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
    },
    onSettled: (_, __, { postId }) => {
      // Always refetch after error or success to make sure our optimistic update is correct
      queryClient.invalidateQueries(['comments', postId]);
      // Also invalidate the post to update comments count
      queryClient.invalidateQueries(['post', postId]);
    },
  });
}; 