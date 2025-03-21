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
      posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          content_blocks: Json | null
          service_type: string | null
          category: string | null
          tags: string[] | null
          status: string
          author_id: string | null
          created_at: string
          updated_at: string
          published_at: string | null
          scheduled_for: string | null
          featured_image: string | null
          seo_title: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          media_type: string | null
          media_url: string | null
          featured: boolean | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          content_blocks?: Json | null
          service_type?: string | null
          category?: string | null
          tags?: string[] | null
          status?: string
          author_id?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
          scheduled_for?: string | null
          featured_image?: string | null
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          media_type?: string | null
          media_url?: string | null
          featured?: boolean | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          content_blocks?: Json | null
          service_type?: string | null
          category?: string | null
          tags?: string[] | null
          status?: string
          author_id?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
          scheduled_for?: string | null
          featured_image?: string | null
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          media_type?: string | null
          media_url?: string | null
          featured?: boolean | null
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          role: string
          email: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string
          avatar_url?: string | null
          role?: string
          email?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          role?: string
          email?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          service_type: string | null
          post_count: number | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          service_type?: string | null
          post_count?: number | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          service_type?: string | null
          post_count?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}

// Helper type to access all tables
type Tables = Database['public']['Tables'];