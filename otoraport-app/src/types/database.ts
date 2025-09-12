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
          subscription_status: 'trial' | 'active' | 'cancelled' | 'expired'
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
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired'
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
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired'
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
          status: 'active' | 'inactive' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          name: string
          location?: string | null
          address?: string | null
          status?: 'active' | 'inactive' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          name?: string
          location?: string | null
          address?: string | null
          status?: 'active' | 'inactive' | 'completed'
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
          status: 'available' | 'sold' | 'reserved'
          raw_data: Record<string, unknown> | null
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
          status?: 'available' | 'sold' | 'reserved'
          raw_data?: Record<string, unknown> | null
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
          status?: 'available' | 'sold' | 'reserved'
          raw_data?: Record<string, unknown> | null
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
          file_type: 'xml' | 'md'
          file_path: string
          last_generated: string
          properties_count: number | null
        }
        Insert: {
          id?: string
          developer_id: string
          file_type: 'xml' | 'md'
          file_path: string
          last_generated?: string
          properties_count?: number | null
        }
        Update: {
          id?: string
          developer_id?: string
          file_type?: 'xml' | 'md'
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
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          amount: number
          currency?: string
          status: string
          przelewy24_session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          amount?: number
          currency?: string
          status?: string
          przelewy24_session_id?: string | null
          created_at?: string
        }
      }
    }
  }
}