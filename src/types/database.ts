export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          developer_id: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          developer_id?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          developer_id?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      csv_generation_logs: {
        Row: {
          csv_url: string | null
          developer_id: string
          error_message: string | null
          file_type: string
          generated_at: string | null
          generation_type: string
          id: string
          md5_hash: string | null
          properties_count: number | null
          status: string | null
          xml_url: string | null
        }
        Insert: {
          csv_url?: string | null
          developer_id: string
          error_message?: string | null
          file_type: string
          generated_at?: string | null
          generation_type: string
          id?: string
          md5_hash?: string | null
          properties_count?: number | null
          status?: string | null
          xml_url?: string | null
        }
        Update: {
          csv_url?: string | null
          developer_id?: string
          error_message?: string | null
          file_type?: string
          generated_at?: string | null
          generation_type?: string
          id?: string
          md5_hash?: string | null
          properties_count?: number | null
          status?: string | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "csv_generation_logs_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          additional_contact_info: string | null
          additional_projects_count: number
          additional_sales_locations: string | null
          address: string | null
          branding_logo_url: string | null
          branding_primary_color: string | null
          branding_secondary_color: string | null
          ceidg_number: string | null
          client_id: string
          company_name: string
          contact_method: string | null
          created_at: string | null
          csv_url: string | null
          custom_domain: string | null
          custom_domain_added_to_vercel: boolean
          custom_domain_dns_configured: boolean
          custom_domain_registered_at: string | null
          custom_domain_verification_token: string | null
          custom_domain_verified: boolean
          custom_domain_verified_at: string | null
          email: string
          email_notifications_enabled: boolean
          headquarters_apartment_number: string | null
          headquarters_building_number: string | null
          headquarters_city: string | null
          headquarters_county: string | null
          headquarters_municipality: string | null
          headquarters_postal_code: string | null
          headquarters_street: string | null
          headquarters_voivodeship: string | null
          id: string
          is_admin: boolean
          krs_number: string | null
          last_login_at: string | null
          last_trial_email_sent: string | null
          legal_form: string | null
          md5_url: string | null
          nip: string
          notification_frequency: string
          onboarding_completed: boolean
          payment_method_attached: boolean
          phone: string | null
          regon: string | null
          sales_office_apartment_number: string | null
          sales_office_building_number: string | null
          sales_office_city: string | null
          sales_office_county: string | null
          sales_office_municipality: string | null
          sales_office_postal_code: string | null
          sales_office_street: string | null
          sales_office_voivodeship: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subdomain: string | null
          subscription_current_period_end: string | null
          subscription_ends_at: string | null
          subscription_plan: string | null
          subscription_starts_at: string | null
          subscription_status: string | null
          tax_id: string | null
          trial_ends_at: string | null
          trial_stage: Database["public"]["Enums"]["trial_stage_enum"] | null
          trial_status: Database["public"]["Enums"]["trial_status_enum"]
          updated_at: string | null
          user_id: string | null
          website: string | null
          xml_url: string | null
        }
        Insert: {
          additional_contact_info?: string | null
          additional_projects_count?: number
          additional_sales_locations?: string | null
          address?: string | null
          branding_logo_url?: string | null
          branding_primary_color?: string | null
          branding_secondary_color?: string | null
          ceidg_number?: string | null
          client_id: string
          company_name: string
          contact_method?: string | null
          created_at?: string | null
          csv_url?: string | null
          custom_domain?: string | null
          custom_domain_added_to_vercel?: boolean
          custom_domain_dns_configured?: boolean
          custom_domain_registered_at?: string | null
          custom_domain_verification_token?: string | null
          custom_domain_verified?: boolean
          custom_domain_verified_at?: string | null
          email: string
          email_notifications_enabled?: boolean
          headquarters_apartment_number?: string | null
          headquarters_building_number?: string | null
          headquarters_city?: string | null
          headquarters_county?: string | null
          headquarters_municipality?: string | null
          headquarters_postal_code?: string | null
          headquarters_street?: string | null
          headquarters_voivodeship?: string | null
          id?: string
          is_admin?: boolean
          krs_number?: string | null
          last_login_at?: string | null
          last_trial_email_sent?: string | null
          legal_form?: string | null
          md5_url?: string | null
          nip: string
          notification_frequency?: string
          onboarding_completed?: boolean
          payment_method_attached?: boolean
          phone?: string | null
          regon?: string | null
          sales_office_apartment_number?: string | null
          sales_office_building_number?: string | null
          sales_office_city?: string | null
          sales_office_county?: string | null
          sales_office_municipality?: string | null
          sales_office_postal_code?: string | null
          sales_office_street?: string | null
          sales_office_voivodeship?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subdomain?: string | null
          subscription_current_period_end?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string | null
          tax_id?: string | null
          trial_ends_at?: string | null
          trial_stage?: Database["public"]["Enums"]["trial_stage_enum"] | null
          trial_status?: Database["public"]["Enums"]["trial_status_enum"]
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
          xml_url?: string | null
        }
        Update: {
          additional_contact_info?: string | null
          additional_projects_count?: number
          additional_sales_locations?: string | null
          address?: string | null
          branding_logo_url?: string | null
          branding_primary_color?: string | null
          branding_secondary_color?: string | null
          ceidg_number?: string | null
          client_id?: string
          company_name?: string
          contact_method?: string | null
          created_at?: string | null
          csv_url?: string | null
          custom_domain?: string | null
          custom_domain_added_to_vercel?: boolean
          custom_domain_dns_configured?: boolean
          custom_domain_registered_at?: string | null
          custom_domain_verification_token?: string | null
          custom_domain_verified?: boolean
          custom_domain_verified_at?: string | null
          email?: string
          email_notifications_enabled?: boolean
          headquarters_apartment_number?: string | null
          headquarters_building_number?: string | null
          headquarters_city?: string | null
          headquarters_county?: string | null
          headquarters_municipality?: string | null
          headquarters_postal_code?: string | null
          headquarters_street?: string | null
          headquarters_voivodeship?: string | null
          id?: string
          is_admin?: boolean
          krs_number?: string | null
          last_login_at?: string | null
          last_trial_email_sent?: string | null
          legal_form?: string | null
          md5_url?: string | null
          nip?: string
          notification_frequency?: string
          onboarding_completed?: boolean
          payment_method_attached?: boolean
          phone?: string | null
          regon?: string | null
          sales_office_apartment_number?: string | null
          sales_office_building_number?: string | null
          sales_office_city?: string | null
          sales_office_county?: string | null
          sales_office_municipality?: string | null
          sales_office_postal_code?: string | null
          sales_office_street?: string | null
          sales_office_voivodeship?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subdomain?: string | null
          subscription_current_period_end?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string | null
          tax_id?: string | null
          trial_ends_at?: string | null
          trial_stage?: Database["public"]["Enums"]["trial_stage_enum"] | null
          trial_status?: Database["public"]["Enums"]["trial_status_enum"]
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
          xml_url?: string | null
        }
        Relationships: []
      }
      health_checks: {
        Row: {
          checked_at: string
          component: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          response_time_ms: number | null
          status: string
        }
        Insert: {
          checked_at?: string
          component: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status: string
        }
        Update: {
          checked_at?: string
          component?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          affected_components: string[]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          resolved_at: string | null
          severity: string
          started_at: string
          status: string
          title: string
          updated_at: string
          updates: Json | null
        }
        Insert: {
          affected_components?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          resolved_at?: string | null
          severity: string
          started_at: string
          status: string
          title: string
          updated_at?: string
          updates?: Json | null
        }
        Update: {
          affected_components?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          resolved_at?: string | null
          severity?: string
          started_at?: string
          status?: string
          title?: string
          updated_at?: string
          updates?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          developer_id: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          developer_id: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          developer_id?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed_steps: number[]
          created_at: string
          current_step: number
          has_csv: boolean
          has_logo: boolean
          skipped_steps: number[]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_steps?: number[]
          created_at?: string
          current_step?: number
          has_csv?: boolean
          has_logo?: boolean
          skipped_steps?: number[]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_steps?: number[]
          created_at?: string
          current_step?: number
          has_csv?: boolean
          has_logo?: boolean
          skipped_steps?: number[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          developer_id: string
          id: string
          metadata: Json | null
          status: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          developer_id: string
          id?: string
          metadata?: Json | null
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          developer_id?: string
          id?: string
          metadata?: Json | null
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          created_by: string | null
          developer_id: string
          id: string
          new_base_price: number | null
          new_final_price: number | null
          new_price_per_m2: number | null
          old_base_price: number | null
          old_final_price: number | null
          old_price_per_m2: number | null
          property_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          created_by?: string | null
          developer_id: string
          id?: string
          new_base_price?: number | null
          new_final_price?: number | null
          new_price_per_m2?: number | null
          old_base_price?: number | null
          old_final_price?: number | null
          old_price_per_m2?: number | null
          property_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          created_by?: string | null
          developer_id?: string
          id?: string
          new_base_price?: number | null
          new_final_price?: number | null
          new_price_per_m2?: number | null
          old_base_price?: number | null
          old_final_price?: number | null
          old_price_per_m2?: number | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          banner_url: string | null
          building_number: string | null
          city: string | null
          county: string | null
          created_at: string | null
          custom_domain: string | null
          description: string | null
          developer_id: string
          id: string
          logo_url: string | null
          municipality: string | null
          name: string
          postal_code: string | null
          presentation_enabled: boolean | null
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          street: string | null
          updated_at: string | null
          voivodeship: string | null
        }
        Insert: {
          banner_url?: string | null
          building_number?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          developer_id: string
          id?: string
          logo_url?: string | null
          municipality?: string | null
          name: string
          postal_code?: string | null
          presentation_enabled?: boolean | null
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          street?: string | null
          updated_at?: string | null
          voivodeship?: string | null
        }
        Update: {
          banner_url?: string | null
          building_number?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          developer_id?: string
          id?: string
          logo_url?: string | null
          municipality?: string | null
          name?: string
          postal_code?: string | null
          presentation_enabled?: boolean | null
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          street?: string | null
          updated_at?: string | null
          voivodeship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          apartment_number: string
          area: number | null
          base_price: number
          base_price_valid_from: string
          created_at: string | null
          developer_id: string
          final_price: number
          final_price_valid_from: string
          floor: number | null
          gmina: string
          id: string
          kod_pocztowy: string | null
          manual_overrides: Json | null
          miejscowosc: string | null
          necessary_rights_date: string | null
          necessary_rights_description: string | null
          necessary_rights_price: number | null
          necessary_rights_type: string | null
          nr_budynku: string | null
          other_services_price: number | null
          other_services_type: string | null
          parking_date: string | null
          parking_designation: string | null
          parking_price: number | null
          parking_type: string | null
          powiat: string
          price_per_m2: number
          price_valid_from: string
          project_id: string | null
          property_type: string | null
          prospectus_url: string | null
          rooms: number | null
          status: Database["public"]["Enums"]["property_status"]
          storage_date: string | null
          storage_designation: string | null
          storage_price: number | null
          storage_type: string | null
          ulica: string | null
          updated_at: string | null
          wojewodztwo: string
        }
        Insert: {
          apartment_number: string
          area?: number | null
          base_price: number
          base_price_valid_from?: string
          created_at?: string | null
          developer_id: string
          final_price: number
          final_price_valid_from?: string
          floor?: number | null
          gmina: string
          id?: string
          kod_pocztowy?: string | null
          manual_overrides?: Json | null
          miejscowosc?: string | null
          necessary_rights_date?: string | null
          necessary_rights_description?: string | null
          necessary_rights_price?: number | null
          necessary_rights_type?: string | null
          nr_budynku?: string | null
          other_services_price?: number | null
          other_services_type?: string | null
          parking_date?: string | null
          parking_designation?: string | null
          parking_price?: number | null
          parking_type?: string | null
          powiat: string
          price_per_m2: number
          price_valid_from?: string
          project_id?: string | null
          property_type?: string | null
          prospectus_url?: string | null
          rooms?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          storage_date?: string | null
          storage_designation?: string | null
          storage_price?: number | null
          storage_type?: string | null
          ulica?: string | null
          updated_at?: string | null
          wojewodztwo: string
        }
        Update: {
          apartment_number?: string
          area?: number | null
          base_price?: number
          base_price_valid_from?: string
          created_at?: string | null
          developer_id?: string
          final_price?: number
          final_price_valid_from?: string
          floor?: number | null
          gmina?: string
          id?: string
          kod_pocztowy?: string | null
          manual_overrides?: Json | null
          miejscowosc?: string | null
          necessary_rights_date?: string | null
          necessary_rights_description?: string | null
          necessary_rights_price?: number | null
          necessary_rights_type?: string | null
          nr_budynku?: string | null
          other_services_price?: number | null
          other_services_type?: string | null
          parking_date?: string | null
          parking_designation?: string | null
          parking_price?: number | null
          parking_type?: string | null
          powiat?: string
          price_per_m2?: number
          price_valid_from?: string
          project_id?: string | null
          property_type?: string | null
          prospectus_url?: string | null
          rooms?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          storage_date?: string | null
          storage_designation?: string | null
          storage_price?: number | null
          storage_type?: string | null
          ulica?: string | null
          updated_at?: string | null
          wojewodztwo?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_csv_data: {
        Row: {
          created_at: string | null
          developer_id: string | null
          file_name: string
          id: string
          is_latest: boolean
          project_id: string | null
          property_id: string | null
          raw_data: Json
          row_number: number | null
          updated_at: string | null
          uploaded_at: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          developer_id?: string | null
          file_name: string
          id?: string
          is_latest?: boolean
          project_id?: string | null
          property_id?: string | null
          raw_data: Json
          row_number?: number | null
          updated_at?: string | null
          uploaded_at?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          developer_id?: string | null
          file_name?: string
          id?: string
          is_latest?: boolean
          project_id?: string | null
          property_id?: string | null
          raw_data?: Json
          row_number?: number | null
          updated_at?: string | null
          uploaded_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "raw_csv_data_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_csv_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_csv_data_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reserved_custom_domains: {
        Row: {
          created_at: string
          domain: string
          reason: string
        }
        Insert: {
          created_at?: string
          domain: string
          reason: string
        }
        Update: {
          created_at?: string
          domain?: string
          reason?: string
        }
        Relationships: []
      }
      reserved_subdomains: {
        Row: {
          created_at: string
          reason: string | null
          subdomain: string
        }
        Insert: {
          created_at?: string
          reason?: string | null
          subdomain: string
        }
        Update: {
          created_at?: string
          reason?: string | null
          subdomain?: string
        }
        Relationships: []
      }
      uptime_summaries: {
        Row: {
          avg_response_time_ms: number | null
          component: string
          created_at: string
          date: string
          id: string
          successful_checks: number
          total_checks: number
          uptime_percentage: number
        }
        Insert: {
          avg_response_time_ms?: number | null
          component: string
          created_at?: string
          date: string
          id?: string
          successful_checks?: number
          total_checks?: number
          uptime_percentage?: number
        }
        Update: {
          avg_response_time_ms?: number | null
          component?: string
          created_at?: string
          date?: string
          id?: string
          successful_checks?: number
          total_checks?: number
          uptime_percentage?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_daily_uptime_summary: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_trial_expiration: {
        Args: { developer_id_param: string }
        Returns: {
          days_remaining: number
          is_active: boolean
          trial_ends_at: string
          trial_status: Database["public"]["Enums"]["trial_status_enum"]
        }[]
      }
      claim_subdomain: {
        Args: { developer_id_param: string; subdomain_param: string }
        Returns: Json
      }
      generate_domain_verification_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_developer_by_nextauth_user: {
        Args: { user_id: string }
        Returns: {
          developer_id: string
          registration_completed: boolean
          subscription_plan: string
          subscription_status: string
        }[]
      }
      get_subscription_status: {
        Args: { developer_id_param: string }
        Returns: {
          has_active_subscription: boolean
          has_payment_method: boolean
          has_stripe_customer: boolean
          needs_onboarding: boolean
          subscription_ends_at: string
          subscription_plan: string
          subscription_status: string
          trial_days_remaining: number
          trial_status: string
        }[]
      }
      get_trial_stage_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          trial_stage: Database["public"]["Enums"]["trial_stage_enum"]
        }[]
      }
      get_user_admin_roles: {
        Args: { check_user_id: string }
        Returns: {
          role: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_custom_domain_available: {
        Args: { check_domain: string }
        Returns: boolean
      }
      is_subdomain_available: {
        Args: { check_subdomain: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      register_custom_domain: {
        Args: { developer_id_param: string; domain_param: string }
        Returns: Json
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      update_property_price: {
        Args: {
          change_reason?: string
          new_base_price: number
          new_final_price: number
          new_price_per_m2: number
          property_id: string
        }
        Returns: boolean
      }
      verify_custom_domain: {
        Args: { developer_id_param: string }
        Returns: Json
      }
    }
    Enums: {
      project_status: "active" | "inactive" | "archived"
      property_status: "available" | "sold" | "reserved"
      trial_stage_enum:
        | "day_0"
        | "day_7"
        | "day_11"
        | "day_14_success"
        | "day_14_failed"
        | "completed"
      trial_status_enum: "active" | "expired" | "converted" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      project_status: ["active", "inactive", "archived"],
      property_status: ["available", "sold", "reserved"],
      trial_stage_enum: [
        "day_0",
        "day_7",
        "day_11",
        "day_14_success",
        "day_14_failed",
        "completed",
      ],
      trial_status_enum: ["active", "expired", "converted", "cancelled"],
    },
  },
} as const
