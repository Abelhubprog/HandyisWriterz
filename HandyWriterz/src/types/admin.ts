/**
 * Admin dashboard shared types
 */

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string | null;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string | null;
}

// Post type
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  contentBlocks?: ContentBlock[];
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  service: string;
  category: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  featuredImage: string | null;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  mediaType?: 'image' | 'video' | 'audio';
  mediaUrl?: string;
  featured?: boolean;
  readTime?: number;
  stats?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

// ContentBlock type
export interface ContentBlock {
  type: 'text' | 'image' | 'video' | 'code' | 'heading' | 'list' | 'quote' | 'divider';
  content: string;
  language?: string;
  level?: number;
  caption?: string;
  url?: string;
}

// ServiceCategory type
export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
  service: string;
}

// Tag type
export interface Tag {
  id: string;
  name: string;
  slug: string;
  count: number;
}

// Media type
export interface Media {
  id: string;
  title: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnailUrl?: string;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
  usedIn: {
    posts: number;
    pages: number;
  };
}

// Analytics type
export interface Analytics {
  timeRange: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
  overview: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    averageReadTime: number;
    viewsChange: number;
    likesChange: number;
    commentsChange: number;
    sharesChange: number;
  };
  topPosts: {
    id: string;
    title: string;
    views: number;
    service: string;
  }[];
  topServices: {
    service: string;
    views: number;
    percentage: number;
  }[];
  viewsByDay: {
    date: string;
    views: number;
  }[];
  engagementByService: {
    service: string;
    likes: number;
    comments: number;
    shares: number;
  }[];
}

// GeneralSettings type
export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

// SeoSettings type
export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImage: string;
  googleAnalyticsId: string;
  googleSiteVerification: string;
}

// ApiSettings type
export interface ApiSettings {
  turnitinApiKey: string;
  turnitinApiUrl: string;
  googleApiKey: string;
  openaiApiKey: string;
}

// Notification type
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

// Admin Types
export interface Author {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  email?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  service: string;
  description?: string;
  count?: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface AdminStats {
  posts: number;
  users: number;
  views: number;
  engagement: number;
  recentPosts: Post[];
  popularPosts: Post[];
}

export interface DashboardCard {
  title: string;
  value: number | string;
  change?: number;
  icon?: string;
  color?: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface UserPermission {
  resource: string;
  actions: Array<'create' | 'read' | 'update' | 'delete' | 'publish' | 'manage'>;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: UserPermission[];
}

export interface AdminUser extends Author {
  role: UserRole;
  lastLogin?: string;
  status: 'active' | 'inactive' | 'pending';
}

/**
 * Admin types for content management
 */

export interface ServicePageSettings {
  service: string;
  title: string;
  description: string;
  bannerImage: string;
  icon: string;
  featuredContent: string[];
  displayOptions: {
    showBanner: boolean;
    showFeaturedPosts: boolean;
    showCategories: boolean;
    showTags: boolean;
    codeBlockStyle: 'default' | 'github' | 'vscode' | 'atom';
    postsPerPage: number;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    structuredData: string;
  };
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  replies?: Comment[];
}

// Dashboard stats interfaces
export interface StatsData {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalCategories: number;
  totalUsers: number;
  totalViews: number;
}

export interface ServiceStats {
  id: string;
  name: string;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  views: number;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnailUrl?: string;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
  usedIn?: {
    posts: number;
    pages: number;
  };
}
