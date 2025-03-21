import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export interface PageView {
  page: string;
  user_id: string | null;
  timestamp: string;
}

export interface UserInteraction {
  event_type: string;
  user_id: string | null;
  metadata: any;
  timestamp: string;
}

export interface ContentMetrics {
  content_id: string;
  views: number;
  likes: number;
  anonymous_likes: number;
  shares: number;
  comments: number;
}

export function useAnalytics() {
  const { user } = useUser();
  const location = useLocation();

  // Automatically track page views
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  const trackPageView = async (page: string) => {
    try {
      const { error } = await supabase
        .from('analytics')
        .insert([{
          page,
          user_id: user?.id || null,
          timestamp: new Date().toISOString(),
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  const trackEvent = async (eventType: string, metadata: any = {}) => {
    try {
      const { error } = await supabase
        .from('user_interactions')
        .insert([{
          event_type: eventType,
          user_id: user?.id || null,
          metadata,
          timestamp: new Date().toISOString(),
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const getContentMetrics = async (contentId: string): Promise<ContentMetrics | null> => {
    try {
      const { data, error } = await supabase
        .from('content_metrics')
        .select('*')
        .eq('content_id', contentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching content metrics:', error);
      return null;
    }
  };

  const getDashboardMetrics = async () => {
    try {
      const [
        { data: pageViews },
        { data: interactions },
        { data: contentPerformance }
      ] = await Promise.all([
        // Get page view statistics
        supabase.rpc('get_page_view_stats'),
        // Get user interaction statistics
        supabase.rpc('get_interaction_stats'),
        // Get content performance metrics
        supabase.rpc('get_content_performance')
      ]);

      return {
        pageViews,
        interactions,
        contentPerformance
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return null;
    }
  };

  const getTopContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content_metrics')
        .select(`
          content_id,
          views,
          likes,
          anonymous_likes,
          shares,
          comments,
          content:services(title, category)
        `)
        .order('views', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching top content:', error);
      return null;
    }
  };

  const getUserEngagement = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_engagement')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user engagement:', error);
      return null;
    }
  };

  const getPublicInteractionStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_public_interaction_stats');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching public interaction stats:', error);
      return null;
    }
  };

  // Track specific events
  const trackContentView = (contentId: string) => {
    trackEvent('content_view', { content_id: contentId });
  };

  const trackLike = (contentId: string, isAuthenticated: boolean) => {
    trackEvent('like', { 
      content_id: contentId,
      authenticated: isAuthenticated 
    });
  };

  const trackShare = (contentId: string, platform: string) => {
    trackEvent('share', { 
      content_id: contentId,
      platform 
    });
  };

  const trackComment = (contentId: string) => {
    trackEvent('comment', { content_id: contentId });
  };

  const trackSearch = (query: string, resultsCount: number) => {
    trackEvent('search', { 
      query,
      results_count: resultsCount 
    });
  };

  const trackError = (error: Error, context: string) => {
    trackEvent('error', {
      message: error.message,
      context,
      stack: error.stack
    });
  };

  return {
    // Basic tracking
    trackPageView,
    trackEvent,
    
    // Content tracking
    trackContentView,
    trackLike,
    trackShare,
    trackComment,
    
    // User action tracking
    trackSearch,
    trackError,
    
    // Analytics retrieval
    getContentMetrics,
    getDashboardMetrics,
    getTopContent,
    getUserEngagement,
    getPublicInteractionStats
  };
}
