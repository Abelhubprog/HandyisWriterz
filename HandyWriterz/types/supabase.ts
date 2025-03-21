export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string
          created_at: string
          title: string
          is_complete: boolean
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          is_complete?: boolean
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          is_complete?: boolean
          user_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 