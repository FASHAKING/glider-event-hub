/**
 * Hand-written Supabase Database type. Mirrors the SQL in
 * supabase/migrations/0001_init.sql. If you regenerate types via the
 * Supabase CLI, replace this file with the generated output.
 */
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
          username: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          host: string
          hosts: string[]
          category: string
          starts_at: string
          duration_minutes: number
          link: string
          location: string | null
          tags: string[]
          accent: string | null
          image_url: string | null
          recurrence_freq: string | null
          recurrence_count: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          host: string
          hosts?: string[]
          category: string
          starts_at: string
          duration_minutes?: number
          link: string
          location?: string | null
          tags?: string[]
          accent?: string | null
          image_url?: string | null
          recurrence_freq?: string | null
          recurrence_count?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
        Relationships: []
      }
      reminders: {
        Row: {
          user_id: string
          event_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          event_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>
        Relationships: []
      }
      social_connections: {
        Row: {
          user_id: string
          platform: 'x' | 'telegram' | 'discord' | 'email'
          handle: string
          external_id: string | null
          notifications: boolean
          connected_at: string
        }
        Insert: {
          user_id: string
          platform: 'x' | 'telegram' | 'discord' | 'email'
          handle: string
          external_id?: string | null
          notifications?: boolean
          connected_at?: string
        }
        Update: Partial<
          Database['public']['Tables']['social_connections']['Insert']
        >
        Relationships: []
      }
      notification_log: {
        Row: {
          id: string
          user_id: string
          event_id: string | null
          kind: string
          title: string
          body: string
          platforms: string[]
          sent_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id?: string | null
          kind: string
          title: string
          body: string
          platforms?: string[]
          sent_at?: string
        }
        Update: Partial<
          Database['public']['Tables']['notification_log']['Insert']
        >
        Relationships: []
      }
      telegram_link_codes: {
        Row: {
          code: string
          user_id: string
          expires_at: string
          created_at: string
        }
        Insert: {
          code: string
          user_id: string
          expires_at?: string
          created_at?: string
        }
        Update: Partial<
          Database['public']['Tables']['telegram_link_codes']['Insert']
        >
        Relationships: []
      }
      attendance: {
        Row: {
          user_id: string
          event_id: string
          category: string
          created_at: string
        }
        Insert: {
          user_id: string
          event_id: string
          category: string
          created_at?: string
        }
        Update: Partial<
          Database['public']['Tables']['attendance']['Insert']
        >
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
