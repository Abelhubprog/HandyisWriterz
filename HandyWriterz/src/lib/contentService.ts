import { databases, storage, ID, Query } from './appwriteClient';
import { 
  DATABASE_ID, 
  POSTS_COLLECTION_ID,
  CATEGORIES_COLLECTION_ID,
  COMMENTS_COLLECTION_ID,
  LIKES_COLLECTION_ID,
  VIEWS_COLLECTION_ID,
  TAGS_COLLECTION_ID,
  MEDIA_COLLECTION_ID,
  MEDIA_BUCKET_ID
} from './appwriteSetup';
import { Post, Category, Comment, Media, TagCount } from '@/types/posts';

/**
 * Content Service
 * Handles all operations related to content in service pages
 */
export class ContentService {
  /**
   * Fetch posts for a specific service
   * @param serviceType The service type to fetch posts for
   * @param options Optional parameters for filtering and pagination
   */
  static async getPosts(
    serviceType: string,
    options: {
      category?: string;
      tag?: string;
      search?: string;
      page?: number;
      limit?: number;
      featured?: boolean;
      orderBy?: 'createdAt' | 'publishedAt' | 'viewsCount' | 'likesCount';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<{ posts: Post[], total: number }> {
    try {
      const { 
        category,
        tag,
        search,
        page = 1,
        limit = 10,
        featured,
        orderBy = 'publishedAt',
        orderDirection = 'desc'
      } = options;
      
      // Build query filters
      const filters = [
        Query.equal('serviceType', serviceType),
        Query.equal('status', 'published'),
      ];
      
      if (category) {
        filters.push(Query.equal('category', category));
      }
      
      if (tag) {
        filters.push(Query.search('tags', tag));
      }
      
      if (search) {
        filters.push(Query.search('title', search));
      }
      
      if (featured !== undefined) {
        filters.push(Query.equal('featured', featured));
      }
      
      // Get total count for pagination
      const countResponse = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        filters
      );
      
      const total = countResponse.total;
      
      // Add pagination and ordering
      filters.push(Query.limit(limit));
      filters.push(Query.offset((page - 1) * limit));
      
      if (orderDirection === 'asc') {
        filters.push(Query.orderAsc(orderBy));
      } else {
        filters.push(Query.orderDesc(orderBy));
      }
      
      // Execute query
      const response = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        filters
      );
      
      // Format posts with additional metadata
      const posts = await Promise.all(
        response.documents.map(async (doc) => {
          // Get author details
          const author = await this.getAuthorInfo(doc.authorId);
          
          return {
            id: doc.$id,
            title: doc.title,
            slug: doc.slug,
            excerpt: doc.excerpt,
            content: doc.content,
            author,
            category: doc.category,
            tags: doc.tags ? doc.tags.split(',') : [],
            publishedAt: doc.publishedAt,
            readTime: doc.readTime,
            featuredImage: doc.featuredImage,
            mediaType: doc.mediaType,
            mediaUrl: doc.mediaUrl,
            likes: doc.likesCount,
            comments: doc.commentsCount,
            views: doc.viewsCount,
            userHasLiked: false // Will be set by the component if user is logged in
          };
        })
      );
      
      return { posts, total };
    } catch (error) {
      console.error(`Error fetching posts for ${serviceType}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetch a single post by slug
   * @param serviceType The service type
   * @param slug The post slug
   * @param userId Optional user ID to check if user has liked the post
   */
  static async getPostBySlug(serviceType: string, slug: string, userId?: string): Promise<Post | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [
          Query.equal('serviceType', serviceType),
          Query.equal('slug', slug),
          Query.equal('status', 'published')
        ]
      );
      
      if (response.documents.length === 0) {
        return null;
      }
      
      const doc = response.documents[0];
      const author = await this.getAuthorInfo(doc.authorId);
      
      // Check if user has liked this post
      let userHasLiked = false;
      if (userId) {
        const likesResponse = await databases.listDocuments(
          DATABASE_ID,
          LIKES_COLLECTION_ID,
          [
            Query.equal('userId', userId),
            Query.equal('postId', doc.$id)
          ]
        );
        
        userHasLiked = likesResponse.documents.length > 0;
      }
      
      return {
        id: doc.$id,
        title: doc.title,
        slug: doc.slug,
        excerpt: doc.excerpt,
        content: doc.content,
        author,
        category: doc.category,
        tags: doc.tags ? doc.tags.split(',') : [],
        publishedAt: doc.publishedAt,
        readTime: doc.readTime,
        featuredImage: doc.featuredImage,
        mediaType: doc.mediaType,
        mediaUrl: doc.mediaUrl,
        likes: doc.likesCount,
        comments: doc.commentsCount,
        views: doc.viewsCount,
        userHasLiked
      };
    } catch (error) {
      console.error(`Error fetching post by slug ${slug}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetch all categories for a service
   * @param serviceType The service type
   */
  static async getCategories(serviceType: string): Promise<Category[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        [
          Query.equal('serviceType', serviceType),
          Query.orderAsc('name')
        ]
      );
      
      return response.documents.map(doc => ({
        id: doc.$id,
        name: doc.name,
        slug: doc.slug,
        count: doc.count
      }));
    } catch (error) {
      console.error(`Error fetching categories for ${serviceType}:`, error);
      throw error;
    }
  }
  
  /**
   * Get popular tags for a service
   * @param serviceType The service type
   * @param limit Number of tags to return
   */
  static async getPopularTags(serviceType: string, limit = 10): Promise<string[]> {
    try {
      // Fetch all posts for this service
      const response = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [
          Query.equal('serviceType', serviceType),
          Query.equal('status', 'published')
        ]
      );
      
      // Count tag occurrences
      const tagCounts: Record<string, number> = {};
      
      response.documents.forEach(doc => {
        if (doc.tags) {
          const tags = doc.tags.split(',');
          tags.forEach(tag => {
            const trimmedTag = tag.trim();
            if (trimmedTag) {
              tagCounts[trimmedTag] = (tagCounts[trimmedTag] || 0) + 1;
            }
          });
        }
      });
      
      // Sort tags by count and take the top ones
      const popularTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag]) => tag);
      
      return popularTags;
    } catch (error) {
      console.error(`Error fetching popular tags for ${serviceType}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetch all comments for a post
   * @param postId The post ID
   * @param userId Optional user ID to check if user has liked comments
   */
  static async getComments(postId: string, userId?: string): Promise<Comment[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        [
          Query.equal('postId', postId),
          Query.equal('approved', true),
          Query.isNull('parentId'),
          Query.orderDesc('createdAt')
        ]
      );
      
      const comments = await Promise.all(
        response.documents.map(async (doc) => {
          // Get author info
          const author = await this.getAuthorInfo(doc.authorId);
          
          // Check if user has liked this comment
          let userHasLiked = false;
          if (userId) {
            const likesResponse = await databases.listDocuments(
              DATABASE_ID,
              LIKES_COLLECTION_ID,
              [
                Query.equal('userId', userId),
                Query.equal('commentId', doc.$id)
              ]
            );
            
            userHasLiked = likesResponse.documents.length > 0;
          }
          
          // Fetch replies
          let replies: Comment[] = [];
          const repliesResponse = await databases.listDocuments(
            DATABASE_ID,
            COMMENTS_COLLECTION_ID,
            [
              Query.equal('parentId', doc.$id),
              Query.equal('approved', true),
              Query.orderAsc('createdAt')
            ]
          );
          
          if (repliesResponse.documents.length > 0) {
            replies = await Promise.all(
              repliesResponse.documents.map(async (reply) => {
                const replyAuthor = await this.getAuthorInfo(reply.authorId);
                
                // Check if user has liked this reply
                let replyUserHasLiked = false;
                if (userId) {
                  const replyLikesResponse = await databases.listDocuments(
                    DATABASE_ID,
                    LIKES_COLLECTION_ID,
                    [
                      Query.equal('userId', userId),
                      Query.equal('commentId', reply.$id)
                    ]
                  );
                  
                  replyUserHasLiked = replyLikesResponse.documents.length > 0;
                }
                
                return {
                  id: reply.$id,
                  postId,
                  author: replyAuthor,
                  content: reply.content,
                  createdAt: reply.createdAt,
                  likes: reply.likesCount,
                  userHasLiked: replyUserHasLiked
                };
              })
            );
          }
          
          return {
            id: doc.$id,
            postId,
            author,
            content: doc.content,
            createdAt: doc.createdAt,
            likes: doc.likesCount,
            userHasLiked,
            replies
          };
        })
      );
      
      return comments;
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      throw error;
    }
  }
  
  /**
   * Like a post
   * @param userId User ID
   * @param postId Post ID
   */
  static async likePost(userId: string, postId: string): Promise<{ success: boolean, liked: boolean }> {
    try {
      // Check if user already liked this post
      const likesResponse = await databases.listDocuments(
        DATABASE_ID,
        LIKES_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('postId', postId)
        ]
      );
      
      const alreadyLiked = likesResponse.documents.length > 0;
      
      if (alreadyLiked) {
        // Unlike the post
        await databases.deleteDocument(
          DATABASE_ID,
          LIKES_COLLECTION_ID,
          likesResponse.documents[0].$id
        );
        
        // Decrement post like count
        const post = await databases.getDocument(
          DATABASE_ID,
          POSTS_COLLECTION_ID,
          postId
        );
        
        await databases.updateDocument(
          DATABASE_ID,
          POSTS_COLLECTION_ID,
          postId,
          {
            likesCount: Math.max(0, post.likesCount - 1)
          }
        );
        
        return { success: true, liked: false };
      } else {
        // Like the post
        await databases.createDocument(
          DATABASE_ID,
          LIKES_COLLECTION_ID,
          ID.unique(),
          {
            userId,
            postId,
            createdAt: new Date().toISOString()
          }
        );
        
        // Increment post like count
        const post = await databases.getDocument(
          DATABASE_ID,
          POSTS_COLLECTION_ID,
          postId
        );
        
        await databases.updateDocument(
          DATABASE_ID,
          POSTS_COLLECTION_ID,
          postId,
          {
            likesCount: (post.likesCount || 0) + 1
          }
        );
        
        return { success: true, liked: true };
      }
    } catch (error) {
      console.error(`Error liking post ${postId}:`, error);
      return { success: false, liked: false };
    }
  }
  
  /**
   * Like a comment
   * @param userId User ID
   * @param commentId Comment ID
   */
  static async likeComment(userId: string, commentId: string): Promise<{ success: boolean, liked: boolean }> {
    try {
      // Check if user already liked this comment
      const likesResponse = await databases.listDocuments(
        DATABASE_ID,
        LIKES_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('commentId', commentId)
        ]
      );
      
      const alreadyLiked = likesResponse.documents.length > 0;
      
      if (alreadyLiked) {
        // Unlike the comment
        await databases.deleteDocument(
          DATABASE_ID,
          LIKES_COLLECTION_ID,
          likesResponse.documents[0].$id
        );
        
        // Decrement comment like count
        const comment = await databases.getDocument(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          commentId
        );
        
        await databases.updateDocument(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          commentId,
          {
            likesCount: Math.max(0, comment.likesCount - 1)
          }
        );
        
        return { success: true, liked: false };
      } else {
        // Like the comment
        await databases.createDocument(
          DATABASE_ID,
          LIKES_COLLECTION_ID,
          ID.unique(),
          {
            userId,
            commentId,
            createdAt: new Date().toISOString()
          }
        );
        
        // Increment comment like count
        const comment = await databases.getDocument(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          commentId
        );
        
        await databases.updateDocument(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          commentId,
          {
            likesCount: (comment.likesCount || 0) + 1
          }
        );
        
        return { success: true, liked: true };
      }
    } catch (error) {
      console.error(`Error liking comment ${commentId}:`, error);
      return { success: false, liked: false };
    }
  }
  
  /**
   * Add a comment to a post
   * @param postId Post ID
   * @param userId User ID
   * @param content Comment content
   * @param parentId Optional parent comment ID for replies
   */
  static async addComment(
    postId: string,
    userId: string,
    content: string,
    parentId?: string
  ): Promise<Comment | null> {
    try {
      // Create comment
      const result = await databases.createDocument(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        ID.unique(),
        {
          postId,
          authorId: userId,
          content,
          parentId: parentId || null,
          likesCount: 0,
          approved: true, // Auto-approve for now, in production might need moderation
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      
      // Increment comment count on post
      if (!parentId) {
        const post = await databases.getDocument(
          DATABASE_ID,
          POSTS_COLLECTION_ID,
          postId
        );
        
        await databases.updateDocument(
          DATABASE_ID,
          POSTS_COLLECTION_ID,
          postId,
          {
            commentsCount: (post.commentsCount || 0) + 1
          }
        );
      }
      
      // Return formatted comment
      const author = await this.getAuthorInfo(userId);
      
      return {
        id: result.$id,
        postId,
        author,
        content,
        createdAt: result.createdAt,
        likes: 0,
        userHasLiked: false
      };
    } catch (error) {
      console.error(`Error adding comment to post ${postId}:`, error);
      return null;
    }
  }
  
  /**
   * Record a view for a post
   * @param postId Post ID
   * @param userId Optional User ID
   */
  static async recordView(postId: string, userId?: string): Promise<void> {
    try {
      // Create view record
      await databases.createDocument(
        DATABASE_ID,
        VIEWS_COLLECTION_ID,
        ID.unique(),
        {
          postId,
          userId: userId || null,
          viewedAt: new Date().toISOString()
        }
      );
      
      // Increment view count on post
      const post = await databases.getDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId
      );
      
      await databases.updateDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId,
        {
          viewsCount: (post.viewsCount || 0) + 1
        }
      );
    } catch (error) {
      console.error(`Error recording view for post ${postId}:`, error);
    }
  }
  
  /**
   * Get related posts
   * @param postId Current post ID
   * @param serviceType Service type
   * @param limit Number of related posts to fetch
   */
  static async getRelatedPosts(postId: string, serviceType: string, limit = 3): Promise<Post[]> {
    try {
      // Get the current post to match by category and tags
      const post = await databases.getDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId
      );
      
      // Get posts with the same category
      const response = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [
          Query.equal('serviceType', serviceType),
          Query.equal('category', post.category),
          Query.notEqual('$id', postId),
          Query.equal('status', 'published'),
          Query.limit(limit),
          Query.orderDesc('publishedAt')
        ]
      );
      
      const relatedPosts = await Promise.all(
        response.documents.map(async (doc) => {
          const author = await this.getAuthorInfo(doc.authorId);
          
          return {
            id: doc.$id,
            title: doc.title,
            slug: doc.slug,
            excerpt: doc.excerpt,
            content: doc.content,
            author,
            category: doc.category,
            tags: doc.tags ? doc.tags.split(',') : [],
            publishedAt: doc.publishedAt,
            readTime: doc.readTime,
            featuredImage: doc.featuredImage,
            mediaType: doc.mediaType,
            mediaUrl: doc.mediaUrl,
            likes: doc.likesCount,
            comments: doc.commentsCount,
            views: doc.viewsCount,
            userHasLiked: false
          };
        })
      );
      
      return relatedPosts;
    } catch (error) {
      console.error(`Error fetching related posts for ${postId}:`, error);
      return [];
    }
  }
  
  /**
   * Search posts by query
   * @param serviceType Service type
   * @param query Search query
   * @param limit Number of results to return
   */
  static async searchPosts(serviceType: string, query: string, limit = 10): Promise<Post[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [
          Query.equal('serviceType', serviceType),
          Query.equal('status', 'published'),
          Query.search('title', query),
          Query.limit(limit)
        ]
      );
      
      const posts = await Promise.all(
        response.documents.map(async (doc) => {
          const author = await this.getAuthorInfo(doc.authorId);
          
          return {
            id: doc.$id,
            title: doc.title,
            slug: doc.slug,
            excerpt: doc.excerpt,
            content: doc.content,
            author,
            category: doc.category,
            tags: doc.tags ? doc.tags.split(',') : [],
            publishedAt: doc.publishedAt,
            readTime: doc.readTime,
            featuredImage: doc.featuredImage,
            mediaType: doc.mediaType,
            mediaUrl: doc.mediaUrl,
            likes: doc.likesCount,
            comments: doc.commentsCount,
            views: doc.viewsCount,
            userHasLiked: false
          };
        })
      );
      
      return posts;
    } catch (error) {
      console.error(`Error searching posts for ${serviceType} with query ${query}:`, error);
      return [];
    }
  }
  
  /**
   * Get author information by user ID
   * @param authorId Author user ID
   */
  private static async getAuthorInfo(authorId: string) {
    try {
      // Import dynamically to avoid circular dependencies
      const { AuthService } = await import('./authService');
      
      const profile = await AuthService.getUserProfile(authorId);
      
      if (profile) {
        return {
          id: authorId,
          name: profile.fullName || 'Anonymous',
          avatar: profile.avatarUrl || '/placeholder-avatar.png',
          role: profile.role || 'user'
        };
      } else {
        return {
          id: authorId,
          name: 'Unknown Author',
          avatar: '/placeholder-avatar.png',
          role: 'user'
        };
      }
    } catch (error) {
      console.error(`Error fetching author info for ${authorId}:`, error);
      return {
        id: authorId,
        name: 'Unknown Author',
        avatar: '/placeholder-avatar.png',
        role: 'user'
      };
    }
  }
  
  /**
   * Upload a media file
   * @param file File to upload
   * @param userId User ID of uploader
   */
  static async uploadMedia(file: File, userId: string): Promise<Media | null> {
    try {
      // Upload to storage
      const fileResponse = await storage.createFile(
        MEDIA_BUCKET_ID,
        ID.unique(),
        file
      );
      
      // Get file preview URL
      const fileUrl = storage.getFileView(
        MEDIA_BUCKET_ID,
        fileResponse.$id
      );
      
      // Determine media type based on MIME type
      let type = 'document';
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      }
      
      // Create media record
      const mediaResponse = await databases.createDocument(
        DATABASE_ID,
        MEDIA_COLLECTION_ID,
        ID.unique(),
        {
          title: file.name,
          fileId: fileResponse.$id,
          type,
          url: fileUrl,
          thumbnailUrl: type === 'image' ? fileUrl : null,
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      
      return {
        id: mediaResponse.$id,
        title: file.name,
        type: type as any,
        url: fileUrl,
        thumbnailUrl: type === 'image' ? fileUrl : undefined,
        fileSize: file.size,
        dimensions: undefined,
        duration: undefined,
        uploadedAt: mediaResponse.createdAt,
        uploadedBy: {
          id: userId,
          name: 'Current User' // This will be replaced in the UI
        },
        usedIn: {
          posts: 0,
          pages: 0
        }
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  }
  
  /**
   * Create a new post (for admin)
   * @param postData Post data
   * @param authorId Author ID
   */
  static async createPost(postData: any, authorId: string): Promise<string | null> {
    try {
      const { title, content, excerpt, category, tags, serviceType, featuredImage, mediaType, mediaUrl } = postData;
      
      // Create slug from title
      const slug = this.generateSlug(title);
      
      // Create post
      const post = await databases.createDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        ID.unique(),
        {
          title,
          slug,
          excerpt: excerpt || this.generateExcerpt(content),
          content,
          authorId,
          serviceType,
          category,
          tags: tags.join(','),
          status: postData.status || 'draft',
          publishedAt: postData.status === 'published' ? new Date().toISOString() : null,
          scheduledFor: postData.scheduledFor || null,
          featuredImage,
          mediaType: mediaType || 'image',
          mediaUrl: mediaUrl || null,
          readTime: this.estimateReadTime(content),
          viewsCount: 0,
          likesCount: 0,
          commentsCount: 0,
          featured: postData.featured || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      
      // Increment category count
      this.incrementCategoryCount(category, serviceType);
      
      return post.$id;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  }
  
  /**
   * Update an existing post (for admin)
   * @param postId Post ID to update
   * @param postData Post data
   * @param authorId Author ID
   */
  static async updatePost(postId: string, postData: any): Promise<boolean> {
    try {
      const { title, content, excerpt, category, tags, serviceType, featuredImage, mediaType, mediaUrl } = postData;
      
      // Get current post to check if category has changed
      const currentPost = await databases.getDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId
      );
      
      // Check if category changed, update counts if necessary
      if (currentPost.category !== category) {
        await this.decrementCategoryCount(currentPost.category, serviceType);
        await this.incrementCategoryCount(category, serviceType);
      }
      
      // Update post
      await databases.updateDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId,
        {
          title,
          excerpt: excerpt || this.generateExcerpt(content),
          content,
          category,
          tags: tags.join(','),
          status: postData.status || currentPost.status,
          publishedAt: postData.status === 'published' && !currentPost.publishedAt ? 
            new Date().toISOString() : currentPost.publishedAt,
          scheduledFor: postData.scheduledFor || null,
          featuredImage,
          mediaType: mediaType || 'image',
          mediaUrl: mediaUrl || null,
          readTime: this.estimateReadTime(content),
          featured: postData.featured || false,
          updatedAt: new Date().toISOString()
        }
      );
      
      return true;
    } catch (error) {
      console.error(`Error updating post ${postId}:`, error);
      return false;
    }
  }
  
  /**
   * Delete a post (for admin)
   * @param postId Post ID to delete
   */
  static async deletePost(postId: string): Promise<boolean> {
    try {
      // Get post details to update category count
      const post = await databases.getDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId
      );
      
      // Delete the post
      await databases.deleteDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId
      );
      
      // Decrement category count
      await this.decrementCategoryCount(post.category, post.serviceType);
      
      return true;
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      return false;
    }
  }
  
  /**
   * Generate a slug from a title
   * @param title Post title
   */
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  }
  
  /**
   * Generate an excerpt from content
   * @param content Post content
   */
  private static generateExcerpt(content: string): string {
    const plainText = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    return plainText.length > 160 ? 
      plainText.substring(0, 157) + '...' : 
      plainText;
  }
  
  /**
   * Estimate read time for content
   * @param content Post content
   */
  private static estimateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    
    return Math.max(1, readTime); // Minimum 1 minute
  }
  
  /**
   * Increment category count
   * @param categoryName Category name
   * @param serviceType Service type
   */
  private static async incrementCategoryCount(categoryName: string, serviceType: string): Promise<void> {
    try {
      // Find category document
      const categoriesResponse = await databases.listDocuments(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        [
          Query.equal('name', categoryName),
          Query.equal('serviceType', serviceType)
        ]
      );
      
      if (categoriesResponse.documents.length > 0) {
        const category = categoriesResponse.documents[0];
        
        // Increment count
        await databases.updateDocument(
          DATABASE_ID,
          CATEGORIES_COLLECTION_ID,
          category.$id,
          {
            count: (category.count || 0) + 1,
            updatedAt: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error(`Error incrementing count for category ${categoryName}:`, error);
    }
  }
  
  /**
   * Decrement category count
   * @param categoryName Category name
   * @param serviceType Service type
   */
  private static async decrementCategoryCount(categoryName: string, serviceType: string): Promise<void> {
    try {
      // Find category document
      const categoriesResponse = await databases.listDocuments(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        [
          Query.equal('name', categoryName),
          Query.equal('serviceType', serviceType)
        ]
      );
      
      if (categoriesResponse.documents.length > 0) {
        const category = categoriesResponse.documents[0];
        
        // Decrement count, ensure it doesn't go below 0
        await databases.updateDocument(
          DATABASE_ID,
          CATEGORIES_COLLECTION_ID,
          category.$id,
          {
            count: Math.max(0, (category.count || 1) - 1),
            updatedAt: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error(`Error decrementing count for category ${categoryName}:`, error);
    }
  }
}

export default ContentService; 