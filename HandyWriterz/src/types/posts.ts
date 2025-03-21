// src/types/posts.ts
// Type definitions for posts, categories, and comments

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
  publishedAt: string | null;
  readTime: number;
  featuredImage: string;
  mediaType?: 'image' | 'video' | 'audio';
  mediaUrl?: string;
  likes: number;
  comments: number;
  userHasLiked?: boolean;
  status?: 'published' | 'draft' | 'archived';
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  metadata?: Record<string, any>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  description?: string;
  serviceType?: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  userHasLiked?: boolean;
  replies?: Comment[];
}

export interface PostStatistics {
  statusCounts: {
    published: number;
    draft: number;
    archived: number;
  };
  categoryCounts: Record<string, number>;
  recentActivity: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      avatar: string;
    } | null;
  }>;
}

export interface PostsResponse {
  posts: Post[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServicePageConfig {
  serviceName: string;
  serviceType: string;
  serviceColor: string;
  serviceColorClass: string;
  serviceBgColor: string;
  serviceDescription: string;
  heroImage?: string;
}

export const serviceConfigs: Record<string, ServicePageConfig> = {
  'adult-health-nursing': {
    serviceName: 'Adult Health Nursing',
    serviceType: 'adult-health-nursing',
    serviceColor: 'from-red-500 to-red-600',
    serviceColorClass: 'text-red-600',
    serviceBgColor: 'bg-red-50',
    serviceDescription: 'Explore our comprehensive resources for adult health nursing, featuring expert insights, evidence-based practices, and the latest research to enhance your nursing knowledge and patient care skills.',
    heroImage: '/images/services/adult-health-nursing-hero.jpg'
  },
  'mental-health-nursing': {
    serviceName: 'Mental Health Nursing',
    serviceType: 'mental-health-nursing',
    serviceColor: 'from-indigo-500 to-indigo-600',
    serviceColorClass: 'text-indigo-600',
    serviceBgColor: 'bg-indigo-50',
    serviceDescription: 'Discover essential resources for mental health nursing, including therapeutic approaches, psychiatric disorders, and best practices for patient care and assessment.',
    heroImage: '/images/services/mental-health-nursing-hero.jpg'
  },
  'child-nursing': {
    serviceName: 'Child Nursing',
    serviceType: 'child-nursing',
    serviceColor: 'from-blue-500 to-blue-600',
    serviceColorClass: 'text-blue-600',
    serviceBgColor: 'bg-blue-50',
    serviceDescription: 'Access comprehensive materials on pediatric nursing, including developmental care, family-centered approaches, common childhood illnesses, and specialized interventions for children.',
    heroImage: '/images/services/child-nursing-hero.jpg'
  },
  'crypto': {
    serviceName: 'Cryptocurrency Analysis',
    serviceType: 'crypto',
    serviceColor: 'from-purple-500 to-purple-600',
    serviceColorClass: 'text-purple-600',
    serviceBgColor: 'bg-purple-50',
    serviceDescription: 'Stay updated with the latest cryptocurrency trends, blockchain technology insights, investment strategies, and regulatory developments in the dynamic world of digital assets.',
    heroImage: '/images/services/crypto-hero.jpg'
  }
}; 