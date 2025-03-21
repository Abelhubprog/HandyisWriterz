export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'user' | 'admin' | 'editor'
          full_name: string | null
          avatar_url: string | null
          website: string | null
          bio: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'user' | 'admin' | 'editor'
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'user' | 'admin' | 'editor'
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          title: string
          content: string
          service_type: string
          author_id: string
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          service_type: string
          author_id: string
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          service_type?: string
          author_id?: string
          published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          content_id: string
          author_id: string
          comment: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          author_id: string
          comment: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          author_id?: string
          comment?: string
          created_at?: string
          updated_at?: string
        }
      }
      content_likes: {
        Row: {
          id: string
          user_id: string
          content_id: string
          content_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          content_type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          content_type?: string
          created_at?: string
        }
      }
      content_shares: {
        Row: {
          id: string
          user_id: string | null
          content_id: string
          content_type: string
          share_type: 'facebook' | 'twitter' | 'linkedin' | 'email'
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          content_id: string
          content_type: string
          share_type: 'facebook' | 'twitter' | 'linkedin' | 'email'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          content_id?: string
          content_type?: string
          share_type?: 'facebook' | 'twitter' | 'linkedin' | 'email'
          created_at?: string
        }
      }
      content_anonymous_likes: {
        Row: {
          content_id: string
          content_type: string
          likes_count: number
        }
        Insert: {
          content_id: string
          content_type: string
          likes_count?: number
        }
        Update: {
          content_id?: string
          content_type?: string
          likes_count?: number
        }
      }
      analytics_events: {
        Row: {
          id: string
          event_type: string
          user_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          user_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_anonymous_likes: {
        Args: {
          content_id: string
          content_type: string
        }
        Returns: void
      }
      get_content_interactions: {
        Args: {
          content_id: string
        }
        Returns: {
          authenticated_likes: number
          anonymous_likes: number
          total_shares: number
          share_by_platform: Record<string, number>
        }
      }
      get_public_interaction_stats: {
        Args: {
          start_date: string
        }
        Returns: {
          total_anonymous_likes: number
          total_authenticated_likes: number
          total_shares: number
          shares_by_platform: Record<string, number>
          top_shared_content: Array<{
            id: string
            title: string
            share_count: number
          }>
          top_liked_content: Array<{
            id: string
            title: string
            total_likes: number
          }>
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
