import { supabase } from '@/lib/supabaseClient';

export async function getPublishedServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('slug, title')
      .eq('published', true)
      .order('title');

    if (error) throw error;

    return {
      services: data?.map(service => ({
        path: `/services/${service.slug}`,
        label: service.title,
        slug: service.slug
      })) || [],
      error: null
    };
  } catch (error) {
    console.error('Error fetching services:', error);
    return {
      services: [],
      error: 'Failed to load services'
    };
  }
}
