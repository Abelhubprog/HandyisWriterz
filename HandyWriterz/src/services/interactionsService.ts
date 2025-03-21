import { supabase } from '@/utils/supabase';
import { Database } from '@/types/database.types';
import { RealtimeChannel } from '@supabase/supabase-js';

type CommentRecord = Database['public']['Tables']['comments']['Row'];
type LikeRecord = Database['public']['Tables']['content_likes']['Row'];

export interface Comment {
  id: string;
  content: string;
  serviceId: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentLike {
  id: string;
  serviceId: string;
  userId: string;
  createdAt: string;
}

export type CommentListener = (comment: Comment) => void;
export type LikeListener = (like: ContentLike) => void;

export const interactionsService = {
  subscriptions: new Map<string, RealtimeChannel>(),

  /**
   * Subscribe to comments for a service
   */
  subscribeToComments(serviceId: string, onComment: CommentListener): () => void {
    const channel = supabase
      .channel(`comments:${serviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `service_id=eq.${serviceId}`
        },
        (payload) => {
          const record = payload.new as CommentRecord;
          onComment(this.transformCommentRecord(record));
        }
      )
      .subscribe();

    this.subscriptions.set(`comments:${serviceId}`, channel);
    return () => {
      channel.unsubscribe();
      this.subscriptions.delete(`comments:${serviceId}`);
    };
  },

  /**
   * Subscribe to likes for a service
   */
  subscribeToLikes(serviceId: string, onLike: LikeListener): () => void {
    const channel = supabase
      .channel(`likes:${serviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_likes',
          filter: `service_id=eq.${serviceId}`
        },
        (payload) => {
          const record = payload.new as LikeRecord;
          onLike(this.transformLikeRecord(record));
        }
      )
      .subscribe();

    this.subscriptions.set(`likes:${serviceId}`, channel);
    return () => {
      channel.unsubscribe();
      this.subscriptions.delete(`likes:${serviceId}`);
    };
  },

  /**
   * Add a comment
   */
  async addComment(serviceId: string, content: string): Promise<Comment | null> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            service_id: serviceId,
            user_id: user.id,
            content,
            user_display_name: profile?.display_name || user.email?.split('@')[0],
            user_avatar_url: profile?.avatar_url,
            is_approved: true // Auto-approve for now, can be changed based on moderation needs
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return this.transformCommentRecord(data);
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  },

  /**
   * Get comments for a service
   */
  async getComments(serviceId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.transformCommentRecord);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  /**
   * Toggle like for a service
   */
  async toggleLike(serviceId: string): Promise<boolean> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data: existingLike } = await supabase
        .from('content_likes')
        .select()
        .eq('service_id', serviceId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('content_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
        return false;
      } else {
        // Like
        const { error } = await supabase
          .from('content_likes')
          .insert([
            {
              service_id: serviceId,
              user_id: user.id
            }
          ]);

        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      return false;
    }
  },

  /**
   * Check if user has liked a service
   */
  async hasUserLiked(serviceId: string): Promise<boolean> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return false;

      const { data, error } = await supabase
        .from('content_likes')
        .select()
        .eq('service_id', serviceId)
        .eq('user_id', user.id)
        .single();

      if (error) return false;
      return !!data;
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  },

  /**
   * Get like count for a service
   */
  async getLikeCount(serviceId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('content_likes')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', serviceId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting like count:', error);
      return 0;
    }
  },

  // Helper functions to transform database records
  transformCommentRecord(record: CommentRecord): Comment {
    return {
      id: record.id,
      content: record.content,
      serviceId: record.service_id,
      userId: record.user_id,
      userDisplayName: record.user_display_name || 'Anonymous',
      userAvatarUrl: record.user_avatar_url,
      isApproved: record.is_approved,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  },

  transformLikeRecord(record: LikeRecord): ContentLike {
    return {
      id: record.id,
      serviceId: record.service_id,
      userId: record.user_id,
      createdAt: record.created_at
    };
  },

  // Cleanup function to unsubscribe all channels
  cleanup() {
    this.subscriptions.forEach(channel => channel.unsubscribe());
    this.subscriptions.clear();
  }
};
