import { LucideIcon } from 'lucide-react';

export interface ServiceConfig {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  color: {
    bg: string;
    text: string;
    gradient: {
      from: string;
      to: string;
    };
  };
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  resourceLinks: string[];
  status: 'draft' | 'published' | 'archived';
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'template' | 'guide';
  url: string;
  downloadCount: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  enrollmentCount: number;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ServicePageData {
  serviceTitle: string;
  serviceDescription: string;
  keyFeatures: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
  resources: Resource[];
  courses: Course[];
  posts: Post[];
  faqs: FAQ[];
  isAdmin?: boolean;
}