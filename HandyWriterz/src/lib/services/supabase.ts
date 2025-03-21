import { supabase } from '../supabaseClient';

export interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  service_type: string;
  created_at: string;
}

class SupabaseService {
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('count')
        .single();

      if (error) {
        console.error('Connection test failed:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Connection test threw error:', err);
      return { success: false, error: err };
    }
  }

  async getPosts(serviceType: string) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('service_type', serviceType)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return { success: false, error };
      }

      return { success: true, data: data as Post[] };
    } catch (err) {
      console.error('Error in getPosts:', err);
      return { success: false, error: err };
    }
  }
}

export const supabaseService = new SupabaseService(); 