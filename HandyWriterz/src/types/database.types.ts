export interface Database {
  public: {
    Tables: {
      services: {
        Row: {
          id: string;
          title: string;
          content: string;
          excerpt: string | null;
          slug: string;
          featured_image: string | null;
          category: string;
          tags: string[];
          created_by: string;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          excerpt?: string;
          slug: string;
          featured_image?: string;
          category: string;
          tags?: string[];
          created_by: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          excerpt?: string;
          slug?: string;
          featured_image?: string;
          category?: string;
          tags?: string[];
          created_by?: string;
          is_published?: boolean;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          service_id: string;
          user_id: string;
          content: string;
          user_display_name: string;
          user_avatar_url: string | null;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          user_id: string;
          content: string;
          user_display_name: string;
          user_avatar_url?: string;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          user_id?: string;
          content?: string;
          user_display_name?: string;
          user_avatar_url?: string;
          is_approved?: boolean;
          updated_at?: string;
        };
      };
      content_likes: {
        Row: {
          id: string;
          service_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'editor' | 'user';
          status: 'active' | 'inactive' | 'pending';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_url?: string;
          role?: 'admin' | 'editor' | 'user';
          status?: 'active' | 'inactive' | 'pending';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string;
          role?: 'admin' | 'editor' | 'user';
          status?: 'active' | 'inactive' | 'pending';
          updated_at?: string;
        };
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
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: string[];
    };
  };
}
