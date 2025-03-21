// src/types/blog.ts
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  excerpt?: string;
  featured_image?: string;
  service_type: string;
  category_id?: string;
  author_id: string;
  author?: Author;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  views: number;
  likes?: number;
  dislikes?: number;
  comments_count?: number;
  bookmarks?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
}

export interface Author {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
  bio?: string;
}

export interface ServicePage {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  featured_image?: string;
  banner_image?: string;
  icon?: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPostsResponse {
  data: BlogPost[];
  count: number | null;
  hasMore: boolean;
}

export interface UserReaction {
  id: string;
  user_id: string;
  post_id: string;
  type: 'like' | 'dislike' | 'bookmark';
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Author;
  parent_id?: string;
  is_approved: boolean;
  replies?: Comment[];
  replies_count?: number;
}

export interface ServicePageWithPosts extends ServicePage {
  posts: BlogPost[];
} 