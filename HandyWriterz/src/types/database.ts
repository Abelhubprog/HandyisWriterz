export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  published: boolean;
  likes_count: number;
  anonymous_likes_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  author_id: string;
  category: string;
  tags: string[];
}

export interface Comment {
  id: string;
  service_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    avatar_url: string;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface ContentLike {
  id: string;
  service_id: string;
  user_id?: string; // Optional for anonymous likes
  created_at: string;
}

export interface ContentShare {
  id: string;
  service_id: string;
  user_id?: string; // Optional for anonymous shares
  platform: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  role: 'admin';
  created_at: string;
  updated_at: string;
}

// Database schema for Supabase
export interface Database {
  public: {
    Tables: {
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'anonymous_likes_count' | 'shares_count'>;
        Update: Partial<Omit<Service, 'id'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Comment, 'id'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      content_likes: {
        Row: ContentLike;
        Insert: Omit<ContentLike, 'id' | 'created_at'>;
        Update: Partial<Omit<ContentLike, 'id'>>;
      };
      content_shares: {
        Row: ContentShare;
        Insert: Omit<ContentShare, 'id' | 'created_at'>;
        Update: Partial<Omit<ContentShare, 'id'>>;
      };
      admin_users: {
        Row: AdminUser;
        Insert: Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AdminUser, 'id'>>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      increment_anonymous_likes: {
        Args: { service_id: string };
        Returns: { success: boolean };
      };
      increment_likes: {
        Args: { table: string; column: string; row_id: string };
        Returns: number;
      };
      increment_shares: {
        Args: { page_id: string };
        Returns: { success: boolean };
      };
    };
    Enums: {
      user_role: 'user' | 'admin';
    };
  };
}
