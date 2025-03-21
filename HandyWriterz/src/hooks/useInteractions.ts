import { useState, useEffect, useCallback } from 'react';
import { interactionsService, Comment, ContentLike } from '@/services/interactionsService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface InteractionsState {
  comments: Comment[];
  likeCount: number;
  isLiked: boolean;
  isLoading: boolean;
}

export function useInteractions(serviceId: string) {
  const { user } = useAuth();
  const [state, setState] = useState<InteractionsState>({
    comments: [],
    likeCount: 0,
    isLiked: false,
    isLoading: true,
  });

  // Load initial data
  useEffect(() => {
    let isMounted = true;

    async function loadInteractions() {
      try {
        const [comments, likeCount, hasLiked] = await Promise.all([
          interactionsService.getComments(serviceId),
          interactionsService.getLikeCount(serviceId),
          user ? interactionsService.hasUserLiked(serviceId) : Promise.resolve(false),
        ]);

        if (isMounted) {
          setState(prev => ({
            ...prev,
            comments,
            likeCount,
            isLiked: hasLiked,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error loading interactions:', error);
        if (isMounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    }

    loadInteractions();

    // Subscribe to real-time updates
    const unsubscribeComments = interactionsService.subscribeToComments(
      serviceId,
      (comment) => {
        setState(prev => ({
          ...prev,
          comments: [comment, ...prev.comments.filter(c => c.id !== comment.id)]
        }));
      }
    );

    const unsubscribeLikes = interactionsService.subscribeToLikes(
      serviceId,
      () => {
        // Refresh like count on any like change
        interactionsService.getLikeCount(serviceId).then(count => {
          if (isMounted) {
            setState(prev => ({ ...prev, likeCount: count }));
          }
        });
      }
    );

    return () => {
      isMounted = false;
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [serviceId, user]);

  // Add comment
  const addComment = useCallback(async (content: string) => {
    if (!user) {
      toast.error('Please log in to comment');
      return false;
    }

    try {
      const comment = await interactionsService.addComment(serviceId, content);
      if (comment) {
        toast.success('Comment added successfully');
        return true;
      }
      throw new Error('Failed to add comment');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      return false;
    }
  }, [serviceId, user]);

  // Toggle like
  const toggleLike = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to like');
      return;
    }

    try {
      const isLiked = await interactionsService.toggleLike(serviceId);
      setState(prev => ({
        ...prev,
        isLiked,
        likeCount: prev.likeCount + (isLiked ? 1 : -1)
      }));
      toast.success(isLiked ? 'Added to likes' : 'Removed from likes');
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  }, [serviceId, user]);

  return {
    ...state,
    addComment,
    toggleLike,
  };
}
