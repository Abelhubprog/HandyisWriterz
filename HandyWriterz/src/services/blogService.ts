import { supabase, adminSupabase } from '@/lib/supabaseClient';
import { BlogPost, BlogPostsResponse, ServicePage } from '@/types/blog';

const POSTS_PER_PAGE = 10;

// Service pages API
export const getServicePages = async (): Promise<ServicePage[]> => {
  const { data, error } = await supabase
    .from('service_pages')
    .select('*')
    .eq('published', true)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getServicePageBySlug = async (slug: string): Promise<ServicePage | null> => {
  const { data, error } = await supabase
    .from('service_pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Blog posts API
export const getBlogPosts = async (
  page = 1, 
  serviceType?: string
): Promise<BlogPostsResponse> => {
  let query = supabase
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .eq('published', true)
    .order('published_at', { ascending: false })
    .range((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE - 1);
  
  if (serviceType) {
    query = query.eq('service_type', serviceType);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  
  return {
    data: data || [],
    count,
    hasMore: count ? count > page * POSTS_PER_PAGE : false
  };
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) throw error;
  
  // Increment view count
  if (data) {
    await supabase
      .from('blog_posts')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', data.id);
  }
  
  return data;
};

export const getRelatedPosts = async (
  postId: string,
  serviceType: string,
  limit = 3
): Promise<BlogPost[]> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .eq('service_type', serviceType)
    .neq('id', postId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

// Admin functions
export const createBlogPost = async (post: Partial<BlogPost>): Promise<BlogPost> => {
  const { data, error } = await adminSupabase
    .from('blog_posts')
    .insert([{
      ...post,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      views: 0
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBlogPost = async (id: string, post: Partial<BlogPost>): Promise<BlogPost> => {
  const { data, error } = await adminSupabase
    .from('blog_posts')
    .update({
      ...post,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBlogPost = async (id: string): Promise<void> => {
  const { error } = await adminSupabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const updateServicePage = async (id: string, page: Partial<ServicePage>): Promise<ServicePage> => {
  const { data, error } = await adminSupabase
    .from('service_pages')
    .update({
      ...page,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}; 