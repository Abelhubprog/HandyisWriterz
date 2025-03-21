import { useSupabase } from '@/context/SupabaseContext';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';

export interface ContentData {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  status: 'draft' | 'published';
  is_premium?: boolean;
}

export interface CommentData {
  content_id: string;
  comment: string;
}

export function useDatabase() {
  const { user } = useUser();
  const supabase = useSupabase();

  // Content Management
  const getServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          likes: content_likes(count),
          anonymous_likes: content_anonymous_likes(count),
          shares: content_shares(count),
          comments: comments(count)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching services:', error);
      return { success: false, error: error.message };
    }
  };

  const getServiceById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          likes: content_likes(count),
          anonymous_likes: content_anonymous_likes(count),
          shares: content_shares(count),
          comments: comments(
            id,
            comment,
            created_at,
            profiles(id, full_name, avatar_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching service:', error);
      return { success: false, error: error.message };
    }
  };

  // Admin Operations
  const getAdminDashboardData = async () => {
    if (!user) return null;

    try {
      const [
        { data: services },
        { data: users },
        { data: interactions },
        { data: analytics }
      ] = await Promise.all([
        supabase
          .from('services')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_interactions')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(10),
        supabase.rpc('get_analytics_summary')
      ]);

      return {
        recentServices: services,
        recentUsers: users,
        recentInteractions: interactions,
        analytics
      };
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      return null;
    }
  };

  const getAllUsers = async () => {
    if (!user) return { success: false, error: 'Not authorized' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return { success: false, error: error.message };
    }
  };

  // Public Interactions
  const likeContent = async (contentId: string) => {
    try {
      if (user) {
        // Authenticated like
        const { error } = await supabase
          .from('content_likes')
          .upsert({
            content_id: contentId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // Anonymous like
        const { error } = await supabase
          .rpc('increment_anonymous_likes', { content_id: contentId });

        if (error) throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error liking content:', error);
      return { success: false, error: error.message };
    }
  };

  const shareContent = async (contentId: string, platform: string) => {
    try {
      const { error } = await supabase
        .from('content_shares')
        .insert([{
          content_id: contentId,
          platform,
          user_id: user?.id || null,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error sharing content:', error);
      return { success: false, error: error.message };
    }
  };

  const addComment = async ({ content_id, comment }: CommentData) => {
    if (!user) {
      toast.error('You must be logged in to comment');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          content_id,
          user_id: user.id,
          comment,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }
  };

  // Analytics
  const trackPageView = async (page: string) => {
    try {
      const { error } = await supabase
        .from('analytics')
        .insert([{
          page,
          user_id: user?.id || null,
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  const trackInteraction = async (eventType: string, metadata: any) => {
    try {
      const { error } = await supabase
        .from('user_interactions')
        .insert([{
          event_type: eventType,
          user_id: user?.id || null,
          metadata,
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  return {
    // Content Management
    getServices,
    getServiceById,
    
    // Admin Operations
    getAdminDashboardData,
    getAllUsers,
    
    // Public Interactions
    likeContent,
    shareContent,
    addComment,
    
    // Analytics
    trackPageView,
    trackInteraction
  };
}
