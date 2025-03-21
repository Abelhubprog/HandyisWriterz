import { supabase } from '@/lib/supabaseClient';
import type { Post, ServiceCategory, Tag, Media, User, Analytics, GeneralSettings, SeoSettings, ApiSettings, ContentBlock } from '@/types/admin';

/**
 * Admin Service
 * Handles all admin operations with Supabase
 */
export const adminService = {
  // Posts
  async getPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, full_name, avatar_url),
        service:services(name),
        category:categories(name),
        content_blocks(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match our types
    return data.map(post => ({
      id: post.id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      contentBlocks: (post.content_blocks || []).map((block: any) => ({
        id: block.id,
        type: block.type,
        content: block.content,
        metadata: block.metadata,
        order: block.order
      })),
      author: {
        id: post.author.id,
        name: post.author.full_name,
        avatar: post.author.avatar_url
      },
      service: post.service?.name || post.service_type,
      category: post.category?.name || post.category_slug,
      tags: post.tags || [],
      status: post.status,
      publishedAt: post.published_at,
      scheduledFor: post.scheduled_for,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      featured: post.featured,
      readTime: post.read_time,
      featuredImage: post.featured_image,
      mediaType: post.media_type,
      mediaUrl: post.media_url,
      seoTitle: post.seo_title,
      seoDescription: post.seo_description,
      seoKeywords: post.seo_keywords,
      stats: {
        views: post.views_count || 0,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: post.shares_count || 0
      }
    }));
  },

  async getPostById(id: string) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, full_name, avatar_url),
        service:services(name),
        category:categories(name),
        content_blocks(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id.toString(),
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || '',
      content: data.content,
      contentBlocks: (data.content_blocks || []).map((block: any) => ({
        id: block.id,
        type: block.type,
        content: block.content,
        metadata: block.metadata,
        order: block.order
      })),
      author: {
        id: data.author.id,
        name: data.author.full_name,
        avatar: data.author.avatar_url
      },
      service: data.service?.name || data.service_type,
      category: data.category?.name || data.category_slug,
      tags: data.tags || [],
      status: data.status,
      publishedAt: data.published_at,
      scheduledFor: data.scheduled_for,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      featured: data.featured,
      readTime: data.read_time,
      featuredImage: data.featured_image,
      mediaType: data.media_type,
      mediaUrl: data.media_url,
      seoTitle: data.seo_title,
      seoDescription: data.seo_description,
      seoKeywords: data.seo_keywords,
      stats: {
        views: data.views_count || 0,
        likes: data.likes_count || 0,
        comments: data.comments_count || 0,
        shares: data.shares_count || 0
      }
    };
  },

  async createPost(post: Partial<Post>) {
    // First, create the post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        author_id: post.author?.id,
        service_type: post.service,
        category_slug: post.category,
        tags: post.tags,
        status: post.status,
        published_at: post.status === 'published' ? new Date().toISOString() : null,
        scheduled_for: post.scheduledFor,
        featured: post.featured,
        read_time: post.readTime,
        featured_image: post.featuredImage,
        media_type: post.mediaType,
        media_url: post.mediaUrl,
        seo_title: post.seoTitle,
        seo_description: post.seoDescription,
        seo_keywords: post.seoKeywords
      })
      .select('id')
      .single();

    if (postError) throw postError;
    
    if (post.contentBlocks && post.contentBlocks.length > 0) {
      // Then, create content blocks if they exist
      const contentBlocks = post.contentBlocks.map(block => ({
        post_id: postData.id,
        type: block.type,
        content: block.content,
        metadata: block.metadata,
        order: block.order
      }));
      
      const { error: blocksError } = await supabase
        .from('content_blocks')
        .insert(contentBlocks);
        
      if (blocksError) throw blocksError;
    }
    
    return postData.id;
  },

  async updatePost(id: string, post: Partial<Post>) {
    // First, update the post
    const { error: postError } = await supabase
      .from('posts')
      .update({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        service_type: post.service,
        category_slug: post.category,
        tags: post.tags,
        status: post.status,
        published_at: post.status === 'published' && !post.publishedAt ? new Date().toISOString() : post.publishedAt,
        scheduled_for: post.scheduledFor,
        featured: post.featured,
        read_time: post.readTime,
        featured_image: post.featuredImage,
        media_type: post.mediaType,
        media_url: post.mediaUrl,
        seo_title: post.seoTitle,
        seo_description: post.seoDescription,
        seo_keywords: post.seoKeywords,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (postError) throw postError;
    
    if (post.contentBlocks) {
      // Delete existing content blocks
      const { error: deleteError } = await supabase
        .from('content_blocks')
        .delete()
        .eq('post_id', id);
        
      if (deleteError) throw deleteError;
      
      // Insert new content blocks
      if (post.contentBlocks.length > 0) {
        const contentBlocks = post.contentBlocks.map(block => ({
          post_id: id,
          type: block.type,
          content: block.content,
          metadata: block.metadata,
          order: block.order
        }));
        
        const { error: blocksError } = await supabase
          .from('content_blocks')
          .insert(contentBlocks);
          
        if (blocksError) throw blocksError;
      }
    }
    
    return id;
  },

  async deletePost(id: string) {
    // Delete content blocks first (cascade should handle this, but just to be safe)
    await supabase
      .from('content_blocks')
      .delete()
      .eq('post_id', id);
      
    // Then delete the post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  },

  // Categories
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
      
    if (error) throw error;
    
    return data.map(category => ({
      id: category.id.toString(),
      name: category.name,
      slug: category.slug,
      count: category.post_count || 0,
      service: category.service_type
    }));
  },

  async createCategory(category: Partial<ServiceCategory>) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        slug: category.slug,
        service_type: category.service
      })
      .select('id')
      .single();
      
    if (error) throw error;
    
    return data.id;
  },

  async updateCategory(id: string, category: Partial<ServiceCategory>) {
    const { error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        slug: category.slug,
        service_type: category.service
      })
      .eq('id', id);
      
    if (error) throw error;
    
    return id;
  },

  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  },

  // Tags
  async getTags() {
    const { data, error } = await supabase
      .from('tags')
      .select('*');
      
    if (error) throw error;
    
    return data.map(tag => ({
      id: tag.id.toString(),
      name: tag.name,
      slug: tag.slug,
      count: tag.post_count || 0
    }));
  },

  async createTag(tag: Partial<Tag>) {
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: tag.name,
        slug: tag.slug
      })
      .select('id')
      .single();
      
    if (error) throw error;
    
    return data.id;
  },

  async updateTag(id: string, tag: Partial<Tag>) {
    const { error } = await supabase
      .from('tags')
      .update({
        name: tag.name,
        slug: tag.slug
      })
      .eq('id', id);
      
    if (error) throw error;
    
    return id;
  },

  async deleteTag(id: string) {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  },

  // Media
  async getMedia() {
    const { data, error } = await supabase
      .from('media')
      .select(`
        *,
        uploaded_by:profiles(id, full_name)
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(media => ({
      id: media.id.toString(),
      title: media.title,
      type: media.type,
      url: media.url,
      thumbnailUrl: media.thumbnail_url,
      fileSize: media.file_size,
      dimensions: media.dimensions,
      duration: media.duration,
      uploadedAt: media.created_at,
      uploadedBy: {
        id: media.uploaded_by.id,
        name: media.uploaded_by.full_name
      },
      usedIn: {
        posts: media.used_in?.posts || 0,
        pages: media.used_in?.pages || 0
      }
    }));
  },

  async uploadMedia(file: File, userId: string) {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    // Determine file type
    const fileType = file.type.split('/')[0]; // 'image', 'video', 'audio', etc.
    const folderPath = fileType === 'image' ? 'images' : 
                       fileType === 'video' ? 'videos' : 
                       fileType === 'audio' ? 'audio' : 'documents';
    
    const filePath = `${folderPath}/${fileName}`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);
      
    // Create metadata
    let dimensions = null;
    let duration = null;
    
    if (fileType === 'image') {
      // Create an image to get dimensions
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise(resolve => {
        img.onload = resolve;
      });
      
      dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
    } else if (fileType === 'video' || fileType === 'audio') {
      // For video/audio, we'll add duration once it's available
      const media = fileType === 'video' ? document.createElement('video') : document.createElement('audio');
      media.src = URL.createObjectURL(file);
      await new Promise(resolve => {
        media.onloadedmetadata = resolve;
      });
      
      duration = media.duration;
    }
    
    // Add entry to media table
    const { data, error } = await supabase
      .from('media')
      .insert({
        title: file.name,
        type: fileType,
        url: publicUrl,
        file_size: file.size,
        dimensions,
        duration,
        uploaded_by: userId
      })
      .select('id')
      .single();
      
    if (error) throw error;
    
    return publicUrl;
  },

  async deleteMedia(id: string) {
    // Get the media item to find its URL
    const { data, error: fetchError } = await supabase
      .from('media')
      .select('url')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Extract the path from the URL
    const url = new URL(data.url);
    const pathParts = url.pathname.split('/');
    const storagePath = pathParts.slice(pathParts.indexOf('media') + 1).join('/');
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('media')
      .remove([storagePath]);
      
    if (storageError) throw storageError;
    
    // Delete from database
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  },

  // Users
  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
      
    if (error) throw error;
    
    return data.map(user => ({
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      avatar: user.avatar_url,
      status: user.status,
      lastLogin: user.last_login
    }));
  },

  async updateUser(id: string, user: Partial<User>) {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar,
        status: user.status
      })
      .eq('id', id);
      
    if (error) throw error;
    
    return id;
  },

  // Analytics
  async getAnalytics(timeRange: Analytics['timeRange']) {
    // In a real implementation, this would query analytics data from Supabase
    // For now, we'll return mock data
    const mockAnalytics: Analytics = {
      timeRange,
      overview: {
        totalViews: 24538,
        totalLikes: 1234,
        totalComments: 432,
        totalShares: 123,
        averageReadTime: 4.2,
        viewsChange: 8.5,
        likesChange: 12.3,
        commentsChange: 5.7,
        sharesChange: 3.2
      },
      topPosts: [
        { id: '1', title: 'The Impact of Evidence-Based Practice in Adult Nursing', views: 1234, service: 'Adult Health Nursing' },
        { id: '2', title: 'Cognitive Behavioral Therapy: A Comprehensive Guide', views: 987, service: 'Mental Health Nursing' },
        { id: '3', title: 'Pediatric Nursing Essentials: Current Research Overview', views: 876, service: 'Child Nursing' },
        { id: '4', title: 'Blockchain Fundamentals for Beginners', views: 765, service: 'Crypto' },
        { id: '5', title: 'Machine Learning Applications in Healthcare', views: 654, service: 'AI Services' }
      ],
      topServices: [
        { service: 'Adult Health Nursing', views: 10234, percentage: 35 },
        { service: 'Mental Health Nursing', views: 7654, percentage: 25 },
        { service: 'Child Nursing', views: 5432, percentage: 20 },
        { service: 'AI Services', views: 3210, percentage: 10 },
        { service: 'Crypto', views: 2345, percentage: 10 }
      ],
      viewsByDay: Array(30).fill(0).map((_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: 500 + Math.floor(Math.random() * 500)
      })),
      engagementByService: [
        { service: 'Adult Health Nursing', likes: 567, comments: 234, shares: 123 },
        { service: 'Mental Health Nursing', likes: 456, comments: 187, shares: 98 },
        { service: 'Child Nursing', likes: 345, comments: 156, shares: 87 },
        { service: 'AI Services', likes: 234, comments: 123, shares: 65 },
        { service: 'Crypto', likes: 123, comments: 89, shares: 43 }
      ]
    };
    
    return mockAnalytics;
  },

  // Settings
  async getSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();
      
    if (error) {
      // If no settings found, return defaults
      if (error.code === 'PGRST116') {
        return {
          general: {
            siteName: 'HandyWriterz',
            siteDescription: 'Professional writing services for all your needs',
            contactEmail: 'contact@handywriterz.com',
            phoneNumber: '',
            address: '',
            socialLinks: {}
          },
          seo: {
            metaTitle: 'HandyWriterz - Professional Writing Services',
            metaDescription: 'Professional writing services for students, researchers, and professionals',
            metaKeywords: ['writing', 'academic', 'research', 'essays'],
            ogImage: '',
            googleAnalyticsId: '',
            googleSiteVerification: ''
          },
          api: {
            turnitinApiKey: '',
            turnitinApiUrl: '',
            googleApiKey: '',
            openaiApiKey: ''
          }
        };
      }
      
      throw error;
    }
    
    return {
      general: data.general_settings,
      seo: data.seo_settings,
      api: data.api_settings
    };
  },

  async updateSettings(
    generalSettings: Partial<GeneralSettings>,
    seoSettings: Partial<SeoSettings>,
    apiSettings: Partial<ApiSettings>
  ) {
    // Get current settings to ensure we're not overwriting anything
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();
      
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    const existingSettings = data || {
      general_settings: {},
      seo_settings: {},
      api_settings: {}
    };
    
    // Merge with new settings
    const updatedSettings = {
      general_settings: { ...existingSettings.general_settings, ...generalSettings },
      seo_settings: { ...existingSettings.seo_settings, ...seoSettings },
      api_settings: { ...existingSettings.api_settings, ...apiSettings }
    };
    
    if (data) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('settings')
        .update(updatedSettings)
        .eq('id', data.id);
        
      if (updateError) throw updateError;
    } else {
      // Insert new settings
      const { error: insertError } = await supabase
        .from('settings')
        .insert(updatedSettings);
        
      if (insertError) throw insertError;
    }
    
    return true;
  }
}; 