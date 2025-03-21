import { supabase } from '@/lib/supabase';
import { analyticsService } from './analytics.service';

class ContentService {
  async likeContent(contentId: string, contentType: 'service' | 'post') {
    try {
      const { data: existingLike } = await supabase
        .from('content_likes')
        .select('id')
        .match({ 
          content_id: contentId, 
          content_type: contentType 
        })
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('content_likes')
          .delete()
          .match({ 
            content_id: contentId,
            content_type: contentType 
          });

        // Track unlike in analytics
        await analyticsService.trackEvent('content_unlike', {
          content_id: contentId,
          content_type: contentType
        });

        return false;
      } else {
        // Like
        await supabase
          .from('content_likes')
          .insert([{ 
            content_id: contentId,
            content_type: contentType,
            anonymous: true
          }]);

        // Track like in analytics
        await analyticsService.trackEvent('content_like', {
          content_id: contentId,
          content_type: contentType,
          anonymous: true
        });

        return true;
      }
    } catch (error) {
      console.error('Error in likeContent:', error);
      throw error;
    }
  }

  async shareContent(contentId: string, contentType: 'service' | 'post', shareMethod: 'native' | 'copy') {
    try {
      // Record the share
      await supabase
        .from('content_shares')
        .insert([{ 
          content_id: contentId,
          content_type: contentType,
          share_method: shareMethod,
          anonymous: true
        }]);

      // Track share in analytics
      await analyticsService.trackEvent('content_share', {
        content_id: contentId,
        content_type: contentType,
        share_method: shareMethod,
        anonymous: true
      });
    } catch (error) {
      console.error('Error in shareContent:', error);
      throw error;
    }
  }

  async getContentStats(contentId: string, contentType: 'service' | 'post') {
    try {
      const { data, error } = await supabase
        .rpc('get_content_interactions', {
          p_content_id: contentId,
          p_content_type: contentType
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getContentStats:', error);
      throw error;
    }
  }
}

export const contentService = new ContentService();
