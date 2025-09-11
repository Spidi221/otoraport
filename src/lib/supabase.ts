import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// For server-side operations that require elevated privileges
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database Types
export interface Database {
  public: {
    Tables: {
      developers: {
        Row: {
          id: string
          email: string
          name: string
          company_name: string | null
          nip: string | null
          phone: string | null
          subscription_status: string
          subscription_plan: string | null
          subscription_billing_period: string | null
          subscription_end_date: string | null
          ministry_approved: boolean
          ministry_email_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          company_name?: string | null
          nip?: string | null
          phone?: string | null
          subscription_status?: string
          subscription_plan?: string | null
          subscription_billing_period?: string | null
          subscription_end_date?: string | null
          ministry_approved?: boolean
          ministry_email_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          company_name?: string | null
          nip?: string | null
          phone?: string | null
          subscription_status?: string
          subscription_plan?: string | null
          subscription_billing_period?: string | null
          subscription_end_date?: string | null
          ministry_approved?: boolean
          ministry_email_sent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          developer_id: string
          name: string
          location: string | null
          address: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          name: string
          location?: string | null
          address?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          name?: string
          location?: string | null
          address?: string | null
          status?: string
          created_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          project_id: string
          property_number: string
          property_type: string
          price_per_m2: number | null
          total_price: number | null
          final_price: number | null
          area: number | null
          parking_space: string | null
          parking_price: number | null
          status: string
          raw_data: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          property_number: string
          property_type: string
          price_per_m2?: number | null
          total_price?: number | null
          final_price?: number | null
          area?: number | null
          parking_space?: string | null
          parking_price?: number | null
          status?: string
          raw_data?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          property_number?: string
          property_type?: string
          price_per_m2?: number | null
          total_price?: number | null
          final_price?: number | null
          area?: number | null
          parking_space?: string | null
          parking_price?: number | null
          status?: string
          raw_data?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      uploaded_files: {
        Row: {
          id: string
          developer_id: string
          filename: string
          file_type: string
          file_size: number | null
          processed: boolean
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          filename: string
          file_type: string
          file_size?: number | null
          processed?: boolean
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          filename?: string
          file_type?: string
          file_size?: number | null
          processed?: boolean
          processed_at?: string | null
          created_at?: string
        }
      }
      generated_files: {
        Row: {
          id: string
          developer_id: string
          file_type: string
          file_path: string
          last_generated: string
          properties_count: number | null
        }
        Insert: {
          id?: string
          developer_id: string
          file_type: string
          file_path: string
          last_generated?: string
          properties_count?: number | null
        }
        Update: {
          id?: string
          developer_id?: string
          file_type?: string
          file_path?: string
          last_generated?: string
          properties_count?: number | null
        }
      }
      payments: {
        Row: {
          id: string
          developer_id: string
          amount: number
          currency: string
          status: string
          przelewy24_session_id: string | null
          plan_type: string | null
          billing_period: string | null
          przelewy24_token: string | null
          przelewy24_order_id: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          amount: number
          currency?: string
          status: string
          przelewy24_session_id?: string | null
          plan_type?: string | null
          billing_period?: string | null
          przelewy24_token?: string | null
          przelewy24_order_id?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          amount?: number
          currency?: string
          status?: string
          przelewy24_session_id?: string | null
          plan_type?: string | null
          billing_period?: string | null
          przelewy24_token?: string | null
          przelewy24_order_id?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          developer_id: string | null
          action: string
          details: any | null
          created_at: string
        }
        Insert: {
          id?: string
          developer_id?: string | null
          action: string
          details?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          developer_id?: string | null
          action?: string
          details?: any | null
          created_at?: string
        }
      }
      system_logs: {
        Row: {
          id: string
          level: 'info' | 'warning' | 'error'
          message: string
          details: any | null
          user_id: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          level: 'info' | 'warning' | 'error'
          message: string
          details?: any | null
          user_id?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          level?: 'info' | 'warning' | 'error'
          message?: string
          details?: any | null
          user_id?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          developer_id: string
          name: string
          key_hash: string
          permissions: string[]
          rate_limit: number
          usage_count: number
          last_used: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          name: string
          key_hash: string
          permissions: string[]
          rate_limit?: number
          usage_count?: number
          last_used?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          name?: string
          key_hash?: string
          permissions?: string[]
          rate_limit?: number
          usage_count?: number
          last_used?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      webhooks: {
        Row: {
          id: string
          developer_id: string
          url: string
          events: string[]
          secret: string | null
          verification_token: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          url: string
          events: string[]
          secret?: string | null
          verification_token?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          url?: string
          events?: string[]
          secret?: string | null
          verification_token?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          developer_id: string
          partner_id: string
          partner_name: string
          configuration: any
          status: 'active' | 'inactive' | 'error'
          last_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          partner_id: string
          partner_name: string
          configuration: any
          status?: 'active' | 'inactive' | 'error'
          last_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          partner_id?: string
          partner_name?: string
          configuration?: any
          status?: 'active' | 'inactive' | 'error'
          last_sync?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Export individual table types for easier use
export type Developer = Database['public']['Tables']['developers']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type UploadedFile = Database['public']['Tables']['uploaded_files']['Row']
export type GeneratedFile = Database['public']['Tables']['generated_files']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type SystemLog = Database['public']['Tables']['system_logs']['Row']
export type APIKey = Database['public']['Tables']['api_keys']['Row']
export type Webhook = Database['public']['Tables']['webhooks']['Row']
export type Integration = Database['public']['Tables']['integrations']['Row']