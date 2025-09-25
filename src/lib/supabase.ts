import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

// Public client for browser usage
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey, // MUST use anon key for security
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
)

// For server-side operations that require elevated privileges
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
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
          user_id: string | null
          email: string
          name: string
          company_name: string | null
          nip: string | null
          regon: string | null
          krs: string | null
          ceidg: string | null
          legal_form: string | null
          headquarters_address: string | null
          phone: string | null
          client_id: string
          xml_url: string | null
          md5_url: string | null
          status: string
          subscription_status: string
          subscription_plan: string | null
          subscription_ends_at: string | null
          registration_completed: boolean
          properties_limit: number | null
          projects_limit: number | null
          additional_projects_count: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          custom_domain: string | null
          presentation_url: string | null
          presentation_generated_at: string | null
          ministry_approved: boolean
          ministry_email_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          name: string
          company_name?: string | null
          nip?: string | null
          regon?: string | null
          krs?: string | null
          ceidg?: string | null
          legal_form?: string | null
          headquarters_address?: string | null
          phone?: string | null
          client_id: string
          xml_url?: string | null
          md5_url?: string | null
          status?: string
          subscription_status?: string
          subscription_plan?: string | null
          subscription_ends_at?: string | null
          registration_completed?: boolean
          properties_limit?: number | null
          projects_limit?: number | null
          additional_projects_count?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          custom_domain?: string | null
          presentation_url?: string | null
          presentation_generated_at?: string | null
          ministry_approved?: boolean
          ministry_email_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          name?: string
          company_name?: string | null
          nip?: string | null
          regon?: string | null
          krs?: string | null
          ceidg?: string | null
          legal_form?: string | null
          headquarters_address?: string | null
          phone?: string | null
          client_id?: string
          xml_url?: string | null
          md5_url?: string | null
          status?: string
          subscription_status?: string
          subscription_plan?: string | null
          subscription_ends_at?: string | null
          registration_completed?: boolean
          properties_limit?: number | null
          projects_limit?: number | null
          additional_projects_count?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          custom_domain?: string | null
          presentation_url?: string | null
          presentation_generated_at?: string | null
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
          apartment_number: string
          property_type: string
          price_per_m2: number | null
          base_price: number | null
          final_price: number | null
          surface_area: number | null
          parking_space: string | null
          parking_price: number | null
          status: string
          raw_data: any | null
          created_at: string
          updated_at: string

          // Location details (Ministry required)
          wojewodztwo: string | null
          powiat: string | null
          gmina: string | null
          miejscowosc: string | null
          ulica: string | null
          numer_nieruchomosci: string | null
          kod_pocztowy: string | null

          // Building and apartment details
          budynek: string | null
          klatka: string | null
          kondygnacja: number | null
          liczba_kondygnacji: number | null
          liczba_pokoi: number | null
          uklad_mieszkania: string | null
          stan_wykonczenia: string | null
          rok_budowy: number | null
          technologia_budowy: string | null

          // Surface areas (detailed breakdown)
          powierzchnia_uzytkowa: number | null
          powierzchnia_calkowita: number | null
          powierzchnia_balkon: number | null
          powierzchnia_taras: number | null
          powierzchnia_loggia: number | null
          powierzchnia_ogrod: number | null
          powierzchnia_piwnicy: number | null
          powierzchnia_strychu: number | null

          // Price details (historical and current)
          cena_za_m2_poczatkowa: number | null
          cena_bazowa_poczatkowa: number | null
          cena_finalna_poczatkowa: number | null
          data_pierwszej_oferty: string | null
          cena_za_m2_aktualna: number | null
          cena_bazowa_aktualna: number | null
          cena_finalna_aktualna: number | null
          data_obowiazywania_ceny_od: string | null
          data_obowiazywania_ceny_do: string | null
          waluta: string | null

          // Additional elements (parking, storage)
          miejsca_postojowe_liczba: number | null
          miejsca_postojowe_nr: string[] | null
          miejsca_postojowe_ceny: number[] | null
          miejsca_postojowe_rodzaj: string | null
          komorki_lokatorskie_liczba: number | null
          komorki_lokatorskie_nr: string[] | null
          komorki_lokatorskie_ceny: number[] | null
          komorki_lokatorskie_powierzchnie: number[] | null

          // Amenities and features
          pomieszczenia_przynalezne: any | null
          winda: boolean | null
          klimatyzacja: boolean | null
          ogrzewanie: string | null
          dostep_dla_niepelnosprawnych: boolean | null
          ekspozycja: string | null
          widok_z_okien: string | null

          // Legal and status information
          status_sprzedazy: string | null
          data_rezerwacji: string | null
          data_sprzedazy: string | null
          data_przekazania: string | null
          forma_wlasnosci: string | null
          ksiega_wieczysta: string | null
          udzial_w_gruncie: number | null

          // Ministry reporting metadata
          data_pierwszego_raportu: string | null
          data_ostatniej_aktualizacji: string | null
          liczba_zmian_ceny: number | null
          uwagi_ministerstwo: string | null
          uuid_ministerstwo: string | null
        }
        Insert: {
          id?: string
          project_id: string
          apartment_number: string
          property_type: string
          price_per_m2?: number | null
          base_price?: number | null
          final_price?: number | null
          surface_area?: number | null
          parking_space?: string | null
          parking_price?: number | null
          status?: string
          raw_data?: any | null
          created_at?: string
          updated_at?: string

          // Location details (Ministry required)
          wojewodztwo?: string | null
          powiat?: string | null
          gmina?: string | null
          miejscowosc?: string | null
          ulica?: string | null
          numer_nieruchomosci?: string | null
          kod_pocztowy?: string | null

          // Building and apartment details
          budynek?: string | null
          klatka?: string | null
          kondygnacja?: number | null
          liczba_kondygnacji?: number | null
          liczba_pokoi?: number | null
          uklad_mieszkania?: string | null
          stan_wykonczenia?: string | null
          rok_budowy?: number | null
          technologia_budowy?: string | null

          // Surface areas (detailed breakdown)
          powierzchnia_uzytkowa?: number | null
          powierzchnia_calkowita?: number | null
          powierzchnia_balkon?: number | null
          powierzchnia_taras?: number | null
          powierzchnia_loggia?: number | null
          powierzchnia_ogrod?: number | null
          powierzchnia_piwnicy?: number | null
          powierzchnia_strychu?: number | null

          // Price details (historical and current)
          cena_za_m2_poczatkowa?: number | null
          cena_bazowa_poczatkowa?: number | null
          cena_finalna_poczatkowa?: number | null
          data_pierwszej_oferty?: string | null
          cena_za_m2_aktualna?: number | null
          cena_bazowa_aktualna?: number | null
          cena_finalna_aktualna?: number | null
          data_obowiazywania_ceny_od?: string | null
          data_obowiazywania_ceny_do?: string | null
          waluta?: string | null

          // Additional elements (parking, storage)
          miejsca_postojowe_liczba?: number | null
          miejsca_postojowe_nr?: string[] | null
          miejsca_postojowe_ceny?: number[] | null
          miejsca_postojowe_rodzaj?: string | null
          komorki_lokatorskie_liczba?: number | null
          komorki_lokatorskie_nr?: string[] | null
          komorki_lokatorskie_ceny?: number[] | null
          komorki_lokatorskie_powierzchnie?: number[] | null

          // Amenities and features
          pomieszczenia_przynalezne?: any | null
          winda?: boolean | null
          klimatyzacja?: boolean | null
          ogrzewanie?: string | null
          dostep_dla_niepelnosprawnych?: boolean | null
          ekspozycja?: string | null
          widok_z_okien?: string | null

          // Legal and status information
          status_sprzedazy?: string | null
          data_rezerwacji?: string | null
          data_sprzedazy?: string | null
          data_przekazania?: string | null
          forma_wlasnosci?: string | null
          ksiega_wieczysta?: string | null
          udzial_w_gruncie?: number | null

          // Ministry reporting metadata
          data_pierwszego_raportu?: string | null
          data_ostatniej_aktualizacji?: string | null
          liczba_zmian_ceny?: number | null
          uwagi_ministerstwo?: string | null
          uuid_ministerstwo?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          apartment_number?: string
          property_type?: string
          price_per_m2?: number | null
          base_price?: number | null
          final_price?: number | null
          surface_area?: number | null
          parking_space?: string | null
          parking_price?: number | null
          status?: string
          raw_data?: any | null
          created_at?: string
          updated_at?: string

          // Location details (Ministry required)
          wojewodztwo?: string | null
          powiat?: string | null
          gmina?: string | null
          miejscowosc?: string | null
          ulica?: string | null
          numer_nieruchomosci?: string | null
          kod_pocztowy?: string | null

          // Building and apartment details
          budynek?: string | null
          klatka?: string | null
          kondygnacja?: number | null
          liczba_kondygnacji?: number | null
          liczba_pokoi?: number | null
          uklad_mieszkania?: string | null
          stan_wykonczenia?: string | null
          rok_budowy?: number | null
          technologia_budowy?: string | null

          // Surface areas (detailed breakdown)
          powierzchnia_uzytkowa?: number | null
          powierzchnia_calkowita?: number | null
          powierzchnia_balkon?: number | null
          powierzchnia_taras?: number | null
          powierzchnia_loggia?: number | null
          powierzchnia_ogrod?: number | null
          powierzchnia_piwnicy?: number | null
          powierzchnia_strychu?: number | null

          // Price details (historical and current)
          cena_za_m2_poczatkowa?: number | null
          cena_bazowa_poczatkowa?: number | null
          cena_finalna_poczatkowa?: number | null
          data_pierwszej_oferty?: string | null
          cena_za_m2_aktualna?: number | null
          cena_bazowa_aktualna?: number | null
          cena_finalna_aktualna?: number | null
          data_obowiazywania_ceny_od?: string | null
          data_obowiazywania_ceny_do?: string | null
          waluta?: string | null

          // Additional elements (parking, storage)
          miejsca_postojowe_liczba?: number | null
          miejsca_postojowe_nr?: string[] | null
          miejsca_postojowe_ceny?: number[] | null
          miejsca_postojowe_rodzaj?: string | null
          komorki_lokatorskie_liczba?: number | null
          komorki_lokatorskie_nr?: string[] | null
          komorki_lokatorskie_ceny?: number[] | null
          komorki_lokatorskie_powierzchnie?: number[] | null

          // Amenities and features
          pomieszczenia_przynalezne?: any | null
          winda?: boolean | null
          klimatyzacja?: boolean | null
          ogrzewanie?: string | null
          dostep_dla_niepelnosprawnych?: boolean | null
          ekspozycja?: string | null
          widok_z_okien?: string | null

          // Legal and status information
          status_sprzedazy?: string | null
          data_rezerwacji?: string | null
          data_sprzedazy?: string | null
          data_przekazania?: string | null
          forma_wlasnosci?: string | null
          ksiega_wieczysta?: string | null
          udzial_w_gruncie?: number | null

          // Ministry reporting metadata
          data_pierwszego_raportu?: string | null
          data_ostatniej_aktualizacji?: string | null
          liczba_zmian_ceny?: number | null
          uwagi_ministerstwo?: string | null
          uuid_ministerstwo?: string | null
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
          key_preview: string
          permissions: any
          rate_limit: number
          is_active: boolean
          last_used_at: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          developer_id: string
          name: string
          key_hash: string
          key_preview: string
          permissions?: any
          rate_limit?: number
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          developer_id?: string
          name?: string
          key_hash?: string
          key_preview?: string
          permissions?: any
          rate_limit?: number
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
          expires_at?: string | null
        }
      }
      api_requests: {
        Row: {
          id: string
          api_key_id: string
          developer_id: string
          method: string
          endpoint: string
          ip_address: string | null
          user_agent: string | null
          request_size: number
          response_status: number
          response_size: number
          response_time_ms: number
          created_at: string
        }
        Insert: {
          id?: string
          api_key_id: string
          developer_id: string
          method: string
          endpoint: string
          ip_address?: string | null
          user_agent?: string | null
          request_size?: number
          response_status: number
          response_size?: number
          response_time_ms?: number
          created_at?: string
        }
        Update: {
          id?: string
          api_key_id?: string
          developer_id?: string
          method?: string
          endpoint?: string
          ip_address?: string | null
          user_agent?: string | null
          request_size?: number
          response_status?: number
          response_size?: number
          response_time_ms?: number
          created_at?: string
        }
      }
      webhook_endpoints: {
        Row: {
          id: string
          developer_id: string
          url: string
          secret: string
          events: any
          is_active: boolean
          retry_policy: any
          last_success_at: string | null
          last_failure_at: string | null
          failure_count: number
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          url: string
          secret: string
          events?: any
          is_active?: boolean
          retry_policy?: any
          last_success_at?: string | null
          last_failure_at?: string | null
          failure_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          url?: string
          secret?: string
          events?: any
          is_active?: boolean
          retry_policy?: any
          last_success_at?: string | null
          last_failure_at?: string | null
          failure_count?: number
          created_at?: string
        }
      }
      webhook_deliveries: {
        Row: {
          id: string
          webhook_endpoint_id: string
          event_type: string
          payload: any
          status: string
          attempt_count: number
          last_attempt_at: string
          next_attempt_at: string | null
          response_status: number | null
          response_body: string | null
          created_at: string
        }
        Insert: {
          id?: string
          webhook_endpoint_id: string
          event_type: string
          payload: any
          status?: string
          attempt_count?: number
          last_attempt_at?: string
          next_attempt_at?: string | null
          response_status?: number | null
          response_body?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          webhook_endpoint_id?: string
          event_type?: string
          payload?: any
          status?: string
          attempt_count?: number
          last_attempt_at?: string
          next_attempt_at?: string | null
          response_status?: number | null
          response_body?: string | null
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          developer_id: string
          type: string
          status: string
          file_url: string | null
          md5_hash: string | null
          properties_count: number
          generated_at: string | null
          expires_at: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          type: string
          status?: string
          file_url?: string | null
          md5_hash?: string | null
          properties_count?: number
          generated_at?: string | null
          expires_at?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          type?: string
          status?: string
          file_url?: string | null
          md5_hash?: string | null
          properties_count?: number
          generated_at?: string | null
          expires_at?: string | null
          metadata?: any
          created_at?: string
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
      subscription_billing: {
        Row: {
          id: string
          developer_id: string
          base_plan_price: number
          additional_projects_fee: number
          total_monthly_cost: number
          billing_date: string
          billing_period: string
          next_billing_date: string | null
          stripe_subscription_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          base_plan_price: number
          additional_projects_fee?: number
          total_monthly_cost: number
          billing_date: string
          billing_period?: string
          next_billing_date?: string | null
          stripe_subscription_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          base_plan_price?: number
          additional_projects_fee?: number
          total_monthly_cost?: number
          billing_date?: string
          billing_period?: string
          next_billing_date?: string | null
          stripe_subscription_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      custom_domains: {
        Row: {
          id: string
          developer_id: string
          subdomain: string
          domain: string
          full_domain: string
          html_content: string | null
          last_generated: string | null
          properties_count: number
          dns_configured: boolean
          ssl_configured: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          subdomain: string
          domain: string
          html_content?: string | null
          last_generated?: string | null
          properties_count?: number
          dns_configured?: boolean
          ssl_configured?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          subdomain?: string
          domain?: string
          html_content?: string | null
          last_generated?: string | null
          properties_count?: number
          dns_configured?: boolean
          ssl_configured?: boolean
          status?: string
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
export type SubscriptionBilling = Database['public']['Tables']['subscription_billing']['Row']
export type CustomDomain = Database['public']['Tables']['custom_domains']['Row']