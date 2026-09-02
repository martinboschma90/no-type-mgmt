/**
 * Generated-style Database types for Phase 1.
 * Regenerate with `supabase gen types` after schema changes in later phases.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          slug: string
          name: string
          genre: string | null
          bio: string | null
          image_url: string | null
          image_alt: string | null
          image_focus: string | null
          image_focus_x: number | null
          image_focus_y: number | null
          image_scale: number | null
          art_direction_version: number | null
          video_url: string | null
          videos: Json
          socials: Json
          tracks: Json
          sections: Json
          presskit_url: string | null
          visible: boolean
          status: 'draft' | 'published'
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          genre?: string | null
          bio?: string | null
          image_url?: string | null
          image_alt?: string | null
          image_focus?: string | null
          image_focus_x?: number | null
          image_focus_y?: number | null
          image_scale?: number | null
          art_direction_version?: number | null
          video_url?: string | null
          videos?: Json
          socials?: Json
          tracks?: Json
          sections?: Json
          presskit_url?: string | null
          visible?: boolean
          status?: 'draft' | 'published'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          genre?: string | null
          bio?: string | null
          image_url?: string | null
          image_alt?: string | null
          image_focus?: string | null
          image_focus_x?: number | null
          image_focus_y?: number | null
          image_scale?: number | null
          art_direction_version?: number | null
          video_url?: string | null
          videos?: Json
          socials?: Json
          tracks?: Json
          sections?: Json
          presskit_url?: string | null
          visible?: boolean
          status?: 'draft' | 'published'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          name: string
          role: string
          image_url: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          image_url?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          image_url?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          content: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          id: string
          name: string
          kind: string
          mime_type: string
          storage_path: string
          size: number
          width: number | null
          height: number | null
          duration: number | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          kind: string
          mime_type: string
          storage_path: string
          size: number
          width?: number | null
          height?: number | null
          duration?: number | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          kind?: string
          mime_type?: string
          storage_path?: string
          size?: number
          width?: number | null
          height?: number | null
          duration?: number | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      cms_content: {
        Row: {
          id: string
          key: string
          data: Json
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          data?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      cms_artists: {
        Row: {
          id: string
          slug: string
          data: Json
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          data?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          id: string
          submitted_at: string
          country: string
          artists: Json
        }
        Insert: {
          id?: string
          submitted_at?: string
          country?: string
          artists?: Json
        }
        Update: {
          id?: string
          submitted_at?: string
          country?: string
          artists?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          user_id: string
          email: string
          display_name: string
          role: 'admin' | 'editor' | 'viewer'
          status: 'active' | 'invited'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email?: string
          display_name?: string
          role: 'admin' | 'editor' | 'viewer'
          status?: 'active' | 'invited'
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email?: string
          display_name?: string
          role?: 'admin' | 'editor' | 'viewer'
          status?: 'active' | 'invited'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      cms_ensure_role: { Args: Record<PropertyKey, never>; Returns: string }
      cms_role: { Args: Record<PropertyKey, never>; Returns: string }
      cms_is_editor: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type ArtistRow = Database['public']['Tables']['artists']['Row']
export type TeamMemberRow = Database['public']['Tables']['team_members']['Row']
export type SiteSettingsRow = Database['public']['Tables']['site_settings']['Row']
export type MediaAssetRow = Database['public']['Tables']['media_assets']['Row']
