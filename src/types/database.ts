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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
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
          additional_sales_locations: string | null
          ceidg_number: string | null
          client_id: string
          company_name: string
          contact_method: string | null
          created_at: string | null
          csv_url: string | null
          email: string
          headquarters_apartment_number: string | null
          headquarters_building_number: string | null
          headquarters_city: string | null
          headquarters_county: string | null
          headquarters_municipality: string | null
          headquarters_postal_code: string | null
          headquarters_street: string | null
          headquarters_voivodeship: string | null
          id: string
          krs_number: string | null
          last_login_at: string | null
          legal_form: string | null
          md5_url: string | null
          nip: string
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
          subscription_ends_at: string | null
          subscription_plan: string | null
          subscription_starts_at: string | null
          subscription_status: 'trialing' | 'active' | 'inactive' | 'cancelled' | 'expired' | 'past_due' | null
          trial_ends_at: string | null
          trial_status: 'active' | 'expired' | 'converted' | 'cancelled'
          trial_stage: 'day_0' | 'day_7' | 'day_11' | 'day_14_success' | 'day_14_failed' | 'completed' | null
          last_trial_email_sent: string | null
          current_period_end: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
          xml_url: string | null
          email_notifications_enabled: boolean
          notification_frequency: 'daily' | 'weekly' | 'never'
          is_admin: boolean
          additional_projects_count: number
        }
        Insert: {
          additional_contact_info?: string | null
          additional_sales_locations?: string | null
          ceidg_number?: string | null
          client_id: string
          company_name: string
          contact_method?: string | null
          created_at?: string | null
          csv_url?: string | null
          email: string
          headquarters_apartment_number?: string | null
          headquarters_building_number?: string | null
          headquarters_city?: string | null
          headquarters_county?: string | null
          headquarters_municipality?: string | null
          headquarters_postal_code?: string | null
          headquarters_street?: string | null
          headquarters_voivodeship?: string | null
          id?: string
          krs_number?: string | null
          last_login_at?: string | null
          legal_form?: string | null
          md5_url?: string | null
          nip: string
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
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_starts_at?: string | null
          subscription_status?: 'trialing' | 'active' | 'inactive' | 'cancelled' | 'expired' | 'past_due' | null
          trial_ends_at?: string | null
          trial_status?: 'active' | 'expired' | 'converted' | 'cancelled'
          trial_stage?: 'day_0' | 'day_7' | 'day_11' | 'day_14_success' | 'day_14_failed' | 'completed' | null
          last_trial_email_sent?: string | null
          current_period_end?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
          xml_url?: string | null
          email_notifications_enabled?: boolean
          notification_frequency?: 'daily' | 'weekly' | 'never'
          is_admin?: boolean
          additional_projects_count?: number
        }
        Update: {
          additional_contact_info?: string | null
          additional_sales_locations?: string | null
          ceidg_number?: string | null
          client_id?: string
          company_name?: string
          contact_method?: string | null
          created_at?: string | null
          csv_url?: string | null
          email?: string
          headquarters_apartment_number?: string | null
          headquarters_building_number?: string | null
          headquarters_city?: string | null
          headquarters_county?: string | null
          headquarters_municipality?: string | null
          headquarters_postal_code?: string | null
          headquarters_street?: string | null
          headquarters_voivodeship?: string | null
          id?: string
          krs_number?: string | null
          last_login_at?: string | null
          legal_form?: string | null
          md5_url?: string | null
          nip?: string
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
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_starts_at?: string | null
          subscription_status?: 'trialing' | 'active' | 'inactive' | 'cancelled' | 'expired' | 'past_due' | null
          trial_ends_at?: string | null
          trial_status?: 'active' | 'expired' | 'converted' | 'cancelled'
          trial_stage?: 'day_0' | 'day_7' | 'day_11' | 'day_14_success' | 'day_14_failed' | 'completed' | null
          last_trial_email_sent?: string | null
          current_period_end?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
          xml_url?: string | null
          email_notifications_enabled?: boolean
          notification_frequency?: 'daily' | 'weekly' | 'never'
          is_admin?: boolean
          additional_projects_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          developer_id: string
          type: 'upload_complete' | 'upload_error' | 'ministry_sync' | 'system_announcement'
          title: string
          message: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          type: 'upload_complete' | 'upload_error' | 'ministry_sync' | 'system_announcement'
          title: string
          message: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          type?: 'upload_complete' | 'upload_error' | 'ministry_sync' | 'system_announcement'
          title?: string
          message?: string
          read?: boolean
          created_at?: string
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
      admin_roles: {
        Row: {
          id: string
          user_id: string
          role: 'super_admin' | 'admin' | 'support'
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: 'super_admin' | 'admin' | 'support'
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'super_admin' | 'admin' | 'support'
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_user_id: string
          action: string
          target_user_id: string | null
          details: any | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          action: string
          target_user_id?: string | null
          details?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          action?: string
          target_user_id?: string | null
          details?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
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
          id: string
          property_id: string
          developer_id: string
          old_base_price: number | null
          new_base_price: number | null
          old_final_price: number | null
          new_final_price: number | null
          old_price_per_m2: number | null
          new_price_per_m2: number | null
          change_reason: string | null
          changed_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          property_id: string
          developer_id: string
          old_base_price?: number | null
          new_base_price?: number | null
          old_final_price?: number | null
          new_final_price?: number | null
          old_price_per_m2?: number | null
          new_price_per_m2?: number | null
          change_reason?: string | null
          changed_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          developer_id?: string
          old_base_price?: number | null
          new_base_price?: number | null
          old_final_price?: number | null
          new_final_price?: number | null
          old_price_per_m2?: number | null
          new_price_per_m2?: number | null
          change_reason?: string | null
          changed_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_client_id: {
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
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
