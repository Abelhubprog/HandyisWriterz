/**
 * Post Controller
 * 
 * This controller handles API requests for post management.
 * 
 * @file src/api/controllers/PostController.ts
 */

import { Request, Response } from 'express';
import { Post, PostRepository, PostStatus } from '@/models/Post';
import { UserRole } from '@/models/User';

/**
 * Post Controller Class
 */
export class PostController {
  /**
   * List all posts with pagination and filtering
   */
  static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as PostStatus | undefined;
      const authorId = req.query.authorId as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;
      const tagId = req.query.tagId as string | undefined;
      
      // Check if the user has permission to see drafts and archived posts
      const userRole = (req.user as any)?.role || UserRole.USER;
      
      // Regular users can only see published posts
      if (userRole === UserRole.USER && status !== PostStatus.PUBLISHED) {
        const result = await PostRepository.listPublished(page, limit);
        return res.json({
          success: true,
          data: result.posts,
          total: result.total,
          page,
          limit
        });
      }
      
      // Editors and above can see all posts
      const result = await PostRepository.list(page, limit, status, authorId, categoryId, tagId);
      
      return res.json({
        success: true,
        data: result.posts,
        total: result.total,
        page,
        limit
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve posts',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Get a single post by ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const postId = req.params.id;
      const post = await PostRepository.getById(postId);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // Check if the user has permission to see this post
      const userRole = (req.user as any)?.role || UserRole.USER;
      
      // Regular users can only see published posts
      if (userRole === UserRole.USER && post.status !== PostStatus.PUBLISHED) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this post'
        });
      }
      
      return res.json({
        success: true,
        data: post
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve post',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Get a single post by slug
   */
  static async getBySlug(req: Request, res: Response) {
    try {
      const slug = req.params.slug;
      const post = await PostRepository.getBySlug(slug);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // Check if the user has permission to see this post
      const userRole = (req.user as any)?.role || UserRole.USER;
      
      // Regular users can only see published posts
      if (userRole === UserRole.USER && post.status !== PostStatus.PUBLISHED) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this post'
        });
      }
      
      return res.json({
        success: true,
        data: post
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve post',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Create a new post
   */
  static async create(req: Request, res: Response) {
    try {
      // Validate that user has permission to create posts
      const userRole = (req.user as any)?.role;
      
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.EDITOR) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create posts'
        });
      }
      
      const { title, content, excerpt, featuredImage, status, categoryIds, tagIds } = req.body;
      
      // Validate required fields
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required'
        });
      }
      
      // Generate a slug from the title
      const slug = await PostRepository.generateSlug(title);
      
      // Create post with current user as author
      const post = await PostRepository.create({
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        authorId: (req.user as any).id,
        status: status || PostStatus.DRAFT,
        categoryIds,
        tagIds,
        publishedAt: status === PostStatus.PUBLISHED ? new Date().toISOString() : undefined
      });
      
      return res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: post
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create post',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Update an existing post
   */
  static async update(req: Request, res: Response) {
    try {
      const postId = req.params.id;
      
      // Check if post exists
      const existingPost = await PostRepository.getById(postId);
      
      if (!existingPost) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // Validate that user has permission to update this post
      const userRole = (req.user as any)?.role;
      const userId = (req.user as any)?.id;
      
      // Only post author, editors, or admins can update posts
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.EDITOR && existingPost.authorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this post'
        });
      }
      
      const { title, content, excerpt, featuredImage, status, categoryIds, tagIds } = req.body;
      
      // If title is being updated, generate a new slug only if title changed
      let slug = existingPost.slug;
      if (title && title !== existingPost.title) {
        slug = await PostRepository.generateSlug(title);
      }
      
      // Prepare update data
      const updateData: any = {
        ...(title && { title }),
        ...(slug !== existingPost.slug && { slug }),
        ...(content && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(status && { status }),
        ...(categoryIds !== undefined && { categoryIds }),
        ...(tagIds !== undefined && { tagIds })
      };
      
      // If status is being changed to published, set publishedAt
      if (status === PostStatus.PUBLISHED && existingPost.status !== PostStatus.PUBLISHED) {
        updateData.publishedAt = new Date().toISOString();
      }
      
      // Update post
      const updatedPost = await PostRepository.update(postId, updateData);
      
      return res.json({
        success: true,
        message: 'Post updated successfully',
        data: updatedPost
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update post',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Delete a post
   */
  static async delete(req: Request, res: Response) {
    try {
      const postId = req.params.id;
      
      // Check if post exists
      const existingPost = await PostRepository.getById(postId);
      
      if (!existingPost) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // Validate that user has permission to delete this post
      const userRole = (req.user as any)?.role;
      const userId = (req.user as any)?.id;
      
      // Only post author, editors, or admins can delete posts
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.EDITOR && existingPost.authorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this post'
        });
      }
      
      // Delete post
      await PostRepository.delete(postId);
      
      return res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete post',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Publish a post
   */
  static async publish(req: Request, res: Response) {
    try {
      const postId = req.params.id;
      
      // Check if post exists
      const existingPost = await PostRepository.getById(postId);
      
      if (!existingPost) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // Validate that user has permission to publish this post
      const userRole = (req.user as any)?.role;
      
      // Only editors or admins can publish posts
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.EDITOR) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to publish posts'
        });
      }
      
      // Publish post
      const updatedPost = await PostRepository.publish(postId);
      
      return res.json({
        success: true,
        message: 'Post published successfully',
        data: updatedPost
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to publish post',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Unpublish a post (set to draft)
   */
  static async unpublish(req: Request, res: Response) {
    try {
      const postId = req.params.id;
      
      // Check if post exists
      const existingPost = await PostRepository.getById(postId);
      
      if (!existingPost) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // Validate that user has permission to unpublish this post
      const userRole = (req.user as any)?.role;
      const userId = (req.user as any)?.id;
      
      // Only post author, editors, or admins can unpublish posts
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.EDITOR && existingPost.authorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to unpublish this post'
        });
      }
      
      // Unpublish post
      const updatedPost = await PostRepository.unpublish(postId);
      
      return res.json({
        success: true,
        message: 'Post unpublished successfully',
        data: updatedPost
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to unpublish post',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Search posts
   */
  static async search(req: Request, res: Response) {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      
      const result = await PostRepository.search(query, limit);
      
      // Filter out non-published posts for regular users
      const userRole = (req.user as any)?.role || UserRole.USER;
      
      let posts = result.posts;
      if (userRole === UserRole.USER) {
        posts = posts.filter(post => post.status === PostStatus.PUBLISHED);
      }
      
      return res.json({
        success: true,
        data: posts,
        total: posts.length
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to search posts',
        error: (error as Error).message
      });
    }
  }
} 