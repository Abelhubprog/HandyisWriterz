/**
 * Post Model Definitions
 * 
 * This file defines the Post model interfaces and repository for the HandyWriterz application.
 * 
 * @file src/models/Post.ts
 */

import { supabase } from '@/lib/supabase';

/**
 * Post Status Enum
 */
export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

/**
 * Post Model Interface
 */
export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  author_id: string;
  status: PostStatus;
  category_ids?: string[];
  tag_ids?: string[];
  published_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Post Creation Input Interface
 * Omits system-generated fields like ID and timestamps
 */
export interface PostInput extends Omit<Post, 'id' | 'created_at' | 'updated_at'> {
  status?: PostStatus; // Optional in creation, defaults to DRAFT
}

/**
 * Post Update Input Interface
 * Partial update with only the fields that need to change
 */
export interface PostUpdateInput extends Partial<Omit<Post, 'id' | 'created_at' | 'updated_at'>> {}

/**
 * Post Repository Class
 * 
 * Handles all database operations for the Post model
 */
export class PostRepository {
  private static table = 'posts';

  /**
   * Create a new post
   * 
   * @param data Post input data
   * @returns The created post
   */
  static async create(data: PostInput): Promise<Post> {
    // Set defaults if not provided
    const postData = {
      ...data,
      status: data.status || PostStatus.DRAFT,
    };
    
    const { data: post, error } = await supabase
      .from(this.table)
      .insert(postData)
      .select()
      .single();

    if (error) throw error;
    return post;
  }
  
  /**
   * Get a post by ID
   * 
   * @param id Post ID
   * @returns The post or null if not found
   */
  static async getById(id: string): Promise<Post | null> {
    const { data: post, error } = await supabase
      .from(this.table)
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return post;
  }
  
  /**
   * Get a post by slug
   * 
   * @param slug Post slug
   * @returns The post or null if not found
   */
  static async getBySlug(slug: string): Promise<Post | null> {
    const { data: post, error } = await supabase
      .from(this.table)
      .select()
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return post;
  }
  
  /**
   * List all posts with pagination and optional filters
   * 
   * @param page Page number (starts at 1)
   * @param limit Items per page
   * @param status Optional status filter
   * @param authorId Optional author ID filter
   * @param categoryId Optional category ID filter
   * @param tagId Optional tag ID filter
   * @returns Object with posts array and total count
   */
  static async list(
    page: number = 1,
    limit: number = 10,
    status?: PostStatus,
    authorId?: string,
    categoryId?: string,
    tagId?: string
  ): Promise<{ posts: Post[], total: number }> {
    let query = supabase
      .from(this.table)
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    if (categoryId) {
      query = query.contains('category_ids', [categoryId]);
    }

    if (tagId) {
      query = query.contains('tag_ids', [tagId]);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: posts, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      posts: posts || [],
      total: count || 0
    };
  }
  
  /**
   * List published posts with pagination
   * 
   * @param page Page number (starts at 1)
   * @param limit Items per page
   * @returns Object with posts array and total count
   */
  static async listPublished(
    page: number = 1,
    limit: number = 10
  ): Promise<{ posts: Post[], total: number }> {
    return this.list(page, limit, PostStatus.PUBLISHED);
  }
  
  /**
   * Update a post
   * 
   * @param id Post ID
   * @param data Post update data
   * @returns The updated post
   */
  static async update(id: string, data: PostUpdateInput): Promise<Post> {
    const { data: post, error } = await supabase
      .from(this.table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return post;
  }
  
  /**
   * Delete a post
   * 
   * @param id Post ID
   * @returns Boolean indicating success
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
  
  /**
   * Search posts by title or content
   * 
   * @param query Search query string
   * @param limit Maximum number of results to return
   * @returns Object with posts array and total count
   */
  static async search(
    query: string,
    limit: number = 10
  ): Promise<{ posts: Post[], total: number }> {
    const { data: posts, error, count } = await supabase
      .from(this.table)
      .select('*', { count: 'exact' })
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      posts: posts || [],
      total: count || 0
    };
  }
  
  /**
   * Generate a unique slug from a title
   * 
   * @param title Post title
   * @returns A unique slug
   */
  static async generateSlug(title: string): Promise<string> {
    // Convert title to slug format
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug already exists
    const existingPost = await this.getBySlug(slug);
    
    if (!existingPost) {
      return slug;
    }
    
    // Slug exists, append a unique ID
    return `${slug}-${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * Publish a post (sets status to PUBLISHED and sets publishedAt)
   * 
   * @param id Post ID
   * @returns The updated post
   */
  static async publish(id: string): Promise<Post> {
    return this.update(id, {
      status: PostStatus.PUBLISHED,
      published_at: new Date().toISOString()
    });
  }
  
  /**
   * Unpublish a post (sets status to DRAFT)
   * 
   * @param id Post ID
   * @returns The updated post
   */
  static async unpublish(id: string): Promise<Post> {
    return this.update(id, {
      status: PostStatus.DRAFT,
      published_at: null
    });
  }
  
  /**
   * Archive a post
   * 
   * @param id Post ID
   * @returns The updated post
   */
  static async archive(id: string): Promise<Post> {
    return this.update(id, {
      status: PostStatus.ARCHIVED
    });
  }
} 