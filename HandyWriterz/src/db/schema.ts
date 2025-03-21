export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  category: string;
  tags: string[];
  service: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string;
  updatedAt: string;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  viewCount: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  featuredImage?: string;
  isActive: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  isApproved: boolean;
}