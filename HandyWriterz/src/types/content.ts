export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  service_type: string;
  service: string;
  category: string;
  tags: string[];
  status: 'published' | 'draft' | 'scheduled' | 'archived';
  publishedAt: string | null;
  scheduledFor: string | null;
  created_at: string;
  updated_at: string;
  featured: boolean;
  readTime: number;
  featuredImage: string;
  mediaType?: 'image' | 'video' | 'audio';
  mediaUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  service: string;
  count: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface Comment {
  id: string;
  content: string;
  post_id: string;
  author_id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  approved: boolean;
  created_at: string;
  updated_at: string;
}

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
