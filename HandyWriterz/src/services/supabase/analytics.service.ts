import { supabase } from '@/lib/supabase';

class AnalyticsService {
  async trackEvent(eventName: string, eventData: Record<string, any>) {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert([{
          event_name: eventName,
          event_data: eventData,
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      // Don't throw the error to prevent disrupting the user experience
    }
  }

  async getContentAnalytics(contentId: string, contentType: 'service' | 'post') {
    try {
      const { data, error } = await supabase
        .rpc('get_content_analytics', {
          p_content_id: contentId,
          p_content_type: contentType
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting content analytics:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
