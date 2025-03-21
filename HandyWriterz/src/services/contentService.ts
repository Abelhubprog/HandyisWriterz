import { supabase } from '@/lib/supabase';
import type { Post, ContentBlock } from '@/types/admin';
import { Database } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';
import { calculateReadTime } from '@/utils/formatters';

// Query parameters type
interface ContentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  service?: string;
  status?: 'published' | 'draft' | 'scheduled' | 'archived';
  category?: string;
  sortBy?: keyof Post;
  sortDirection?: 'asc' | 'desc';
}

export interface ContentFilters {
  status?: string;
  category?: string;
  service?: string;
  search?: string;
}

// Service page types for type checking
const SERVICE_TYPES = [
  'adult-health-nursing',
  'mental-health-nursing',
  'child-nursing',
  'crypto',
  'ai',
] as const;

type ServiceType = typeof SERVICE_TYPES[number];

/**
 * Content Service
 * Handles content operations with Supabase
 */
export const contentService = {
  /**
   * Fetch all posts with pagination
   */
  async getPosts(options: {
    page?: number;
    limit?: number;
    service?: string;
    category?: string;
    status?: string;
    search?: string;
  } = {}) {
    const {
      page = 1,
      limit = 10,
      service,
      category,
      status,
      search
    } = options;

    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        content_blocks,
        service_type,
        category,
        tags,
        status,
        author_id,
        created_at,
        updated_at,
        published_at,
        scheduled_for,
        featured_image,
        seo_title,
        seo_description,
        seo_keywords,
        media_type,
        media_url,
        featured,
        authors:profiles(
          id,
          name,
          avatar_url
        )
      `);
    
    // Apply filters
    if (service) {
      query = query.eq('service_type', service);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%, excerpt.ilike.%${search}%, content.ilike.%${search}%`);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .order('created_at', { ascending: false });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
    }

    // Transform data to match our Post interface
    const posts = (data || []).map(item => {
      // Get the first author from authors array if it exists
      const author = item.authors && item.authors[0] 
        ? {
            id: item.authors[0].id || 'unknown',
            name: item.authors[0].name || 'Unknown Author',
            avatar: item.authors[0].avatar_url
          }
        : {
            id: 'unknown',
            name: 'Unknown Author',
            avatar: null
          };
            
      return {
        id: item.id,
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        content: item.content,
        contentBlocks: item.content_blocks,
        author,
        service: item.service_type,
        category: item.category,
        status: item.status,
        publishedAt: item.published_at,
        scheduledFor: item.scheduled_for,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        featuredImage: item.featured_image,
        tags: item.tags,
        seoTitle: item.seo_title,
        seoDescription: item.seo_description,
        seoKeywords: item.seo_keywords,
        mediaType: item.media_type,
        mediaUrl: item.media_url,
        featured: item.featured,
        readTime: this.calculateReadTime(item.content || ''),
        stats: { views: 0, likes: 0, comments: 0, shares: 0 }
      };
    });
    
    return {
      posts,
      total: count || 0
    };
  },
  
  /**
   * Fetch a single post by ID
   */
  async getPost(id: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        content_blocks,
        service_type,
        category,
        tags,
        status,
        author_id,
        created_at,
        updated_at,
        published_at,
        scheduled_for,
        featured_image,
        seo_title,
        seo_description,
        seo_keywords,
        media_type,
        media_url,
        featured,
        authors:profiles(
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching post:', error);
      throw new Error('Failed to fetch post');
    }

    // Get the first author from authors array if it exists
    const author = data.authors && data.authors[0] 
      ? {
          id: data.authors[0].id || 'unknown',
          name: data.authors[0].name || 'Unknown Author',
          avatar: data.authors[0].avatar_url
        }
      : {
          id: 'unknown',
          name: 'Unknown Author',
          avatar: null
        };

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      contentBlocks: data.content_blocks,
      author,
      service: data.service_type,
      category: data.category,
      status: data.status,
      publishedAt: data.published_at,
      scheduledFor: data.scheduled_for,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      featuredImage: data.featured_image,
      tags: data.tags,
      seoTitle: data.seo_title,
      seoDescription: data.seo_description,
      seoKeywords: data.seo_keywords,
      mediaType: data.media_type,
      mediaUrl: data.media_url,
      featured: data.featured,
      readTime: this.calculateReadTime(data.content || ''),
      stats: { views: 0, likes: 0, comments: 0, shares: 0 }
    };
  },
  
  /**
   * Create a new post
   */
  async createPost(post: Partial<Post>): Promise<{ id: string }> {
    const now = new Date().toISOString();
    const { status, scheduledFor } = post;
    const publishedAt = status === 'published' ? now : null;
    
    const postData = {
      id: uuidv4(),
      title: post.title || 'Untitled',
      slug: post.slug || this.createSlug(post.title || 'untitled'),
      excerpt: post.excerpt || '',
      content: post.content || '',
      content_blocks: post.contentBlocks || [],
      service_type: post.service,
      category: post.category,
      tags: post.tags || [],
      status: post.status || 'draft',
      author_id: post.author?.id,
      created_at: now,
      updated_at: now,
      published_at: publishedAt,
      scheduled_for: scheduledFor,
      featured_image: post.featuredImage,
      seo_title: post.seoTitle,
      seo_description: post.seoDescription,
      seo_keywords: post.seoKeywords,
      media_type: post.mediaType,
      media_url: post.mediaUrl,
      featured: post.featured || false
    };
    
    const { data, error } = await supabase
      .from('posts')
      .insert(postData)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    }
    
    return { id: data.id };
  },
  
  /**
   * Update an existing post
   */
  async updatePost(id: string, post: Partial<Post>): Promise<void> {
    const now = new Date().toISOString();
    const { status, scheduledFor, publishedAt } = post;
    
    // Only update publishedAt if status is changing to published and it's not already set
    const newPublishedAt = status === 'published' && !publishedAt ? now : publishedAt;
    
    const postData = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      content_blocks: post.contentBlocks,
      service_type: post.service,
      category: post.category,
      tags: post.tags,
      status: post.status,
      updated_at: now,
      published_at: newPublishedAt,
      scheduled_for: scheduledFor,
      featured_image: post.featuredImage,
      seo_title: post.seoTitle,
      seo_description: post.seoDescription,
      seo_keywords: post.seoKeywords,
      media_type: post.mediaType,
      media_url: post.mediaUrl,
      featured: post.featured
    };
    
    // Filter out undefined values to avoid overwriting with null
    const filteredPostData = Object.entries(postData)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    const { error } = await supabase
      .from('posts')
      .update(filteredPostData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating post:', error);
      throw new Error('Failed to update post');
    }
  },
  
  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting post:', error);
      throw new Error('Failed to delete post');
    }
  },
  
  /**
   * Get all content categories
   */
  async getCategories(service?: string) {
    let query = supabase
      .from('categories')
      .select('id, name, slug, description, service');
    
    if (service) {
      query = query.eq('service', service);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
    
    return data || [];
  },
  
  /**
   * Create a new category
   */
  async createCategory(categoryData: { name: string; slug: string; service: string; description?: string }): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        id: uuidv4(),
        name: categoryData.name,
        slug: categoryData.slug || this.createSlug(categoryData.name),
        description: categoryData.description || '',
        service: categoryData.service
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating category:', error);
      throw new Error('Failed to create category');
    }
    
    return { id: data.id };
  },
  
  /**
   * Update an existing category
   */
  async updateCategory(id: string, categoryData: { name?: string; slug?: string; service?: string; description?: string }): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating category:', error);
      throw new Error('Failed to update category');
    }
  },
  
  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting category:', error);
      throw new Error('Failed to delete category');
    }
  },
  
  /**
   * Calculate read time in minutes based on content length
   */
  calculateReadTime(content: string): number {
    if (!content) return 1;
    
    // Average reading speed (words per minute)
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    
    // Minimum read time is 1 minute
    return Math.max(1, minutes);
  },
  
  /**
   * Create a URL-friendly slug from text
   */
  createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
      .trim();
  },
  
  /**
   * Upload an image to Supabase storage
   */
  async uploadImage(file: File, service: string = 'general'): Promise<{ url: string }> {
    if (!file) throw new Error('No file provided');
    
    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${service}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('content-images')
      .upload(filePath, file);
    
    if (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('content-images')
      .getPublicUrl(filePath);
    
    return { url: publicUrl };
  },
  
  /**
   * Get categories for a specific service
   */
  async getCategoriesForService(service?: string) {
    let query = supabase
      .from('categories')
      .select('id, name, slug, description, service, count');
    
    if (service) {
      query = query.eq('service', service);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Error fetching categories for service:', error);
      throw new Error('Failed to fetch categories');
    }
    
    return data || [];
  },
  
  /**
   * Check if a slug is unique within a service
   */
  async isSlugUnique(slug: string, service: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .eq('service_type', service);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking slug uniqueness:', error);
      throw new Error('Failed to check slug uniqueness');
    }
    
    return (data || []).length === 0;
  },
  
  /**
   * Get settings for a specific service
   */
  async getServiceSettings(service: string) {
    const { data, error } = await supabase
      .from('service_settings')
      .select('*')
      .eq('service_type', service)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "row not found" error
      console.error('Error fetching service settings:', error);
      throw new Error('Failed to fetch service settings');
    }
    
    return data || null;
  },
  
  /**
   * Save settings for a specific service
   */
  async saveServiceSettings(service: string, settings: any): Promise<void> {
    const { error } = await supabase
      .from('service_settings')
      .upsert({
        service_type: service,
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'service_type'
      });
    
    if (error) {
      console.error('Error saving service settings:', error);
      throw new Error('Failed to save service settings');
    }
  },
  
  /**
   * Get service-specific content statistics
   */
  async getServiceStats(service: string) {
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('service_type', service);
    
    if (postsError) {
      console.error('Error fetching service stats:', postsError);
      throw new Error('Failed to fetch service stats');
    }
    
    const totalPosts = postsData?.length || 0;
    const publishedPosts = postsData?.filter(post => post.status === 'published').length || 0;
    const draftPosts = postsData?.filter(post => post.status === 'draft').length || 0;
    
    // Get views data from analytics if available
    // This is placeholder code - you'll need to implement the actual analytics
    const views = 0;
    const likes = 0;
    
    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      views,
      likes
    };
  }
};

export default contentService;
