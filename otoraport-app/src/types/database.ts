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
          
          // Ministry compliance fields
          krs: string | null
          ceidg: string | null
          regon: string | null
          legal_form: string | null
          headquarters_address: string | null
          website_url: string | null
          license_number: string | null
          tax_office_code: string | null
          subscription_plan: string | null
          
          subscription_status: 'trial' | 'active' | 'cancelled' | 'expired'
          subscription_end_date: string | null
          ministry_approved: boolean
          ministry_email_sent: boolean
          presentation_url: string | null
          presentation_generated_at: string | null
          presentation_deployed_at: string | null
          custom_domain: string | null
          custom_domain_verified: boolean
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
          
          // Ministry compliance fields
          krs?: string | null
          ceidg?: string | null
          regon?: string | null
          legal_form?: string | null
          headquarters_address?: string | null
          website_url?: string | null
          license_number?: string | null
          tax_office_code?: string | null
          subscription_plan?: string | null
          
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired'
          subscription_end_date?: string | null
          ministry_approved?: boolean
          ministry_email_sent?: boolean
          presentation_url?: string | null
          presentation_generated_at?: string | null
          presentation_deployed_at?: string | null
          custom_domain?: string | null
          custom_domain_verified?: boolean
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
          
          // Ministry compliance fields
          krs?: string | null
          ceidg?: string | null
          regon?: string | null
          legal_form?: string | null
          headquarters_address?: string | null
          website_url?: string | null
          license_number?: string | null
          tax_office_code?: string | null
          subscription_plan?: string | null
          
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired'
          subscription_end_date?: string | null
          ministry_approved?: boolean
          ministry_email_sent?: boolean
          presentation_url?: string | null
          presentation_generated_at?: string | null
          presentation_deployed_at?: string | null
          custom_domain?: string | null
          custom_domain_verified?: boolean
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
          description: string | null
          status: 'active' | 'inactive' | 'completed'
          start_date: string | null
          expected_completion_date: string | null
          actual_completion_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          name: string
          location?: string | null
          address?: string | null
          description?: string | null
          status?: 'active' | 'inactive' | 'completed'
          start_date?: string | null
          expected_completion_date?: string | null
          actual_completion_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          name?: string
          location?: string | null
          address?: string | null
          description?: string | null
          status?: 'active' | 'inactive' | 'completed'
          start_date?: string | null
          expected_completion_date?: string | null
          actual_completion_date?: string | null
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
          floor: number | null
          rooms: number | null
          building_number: string | null
          parking_space: string | null
          parking_price: number | null
          status: 'available' | 'sold' | 'reserved'
          raw_data: Record<string, unknown> | null
          
          // Ministry compliance fields (30 new fields)
          wojewodztwo: string | null
          powiat: string | null
          gmina: string | null
          miejscowosc: string | null
          ulica: string | null
          numer_nieruchomosci: string | null
          kod_pocztowy: string | null
          kondygnacja: number | null
          liczba_pokoi: number | null
          powierzchnia_balkon: number | null
          powierzchnia_taras: number | null
          powierzchnia_loggia: number | null
          powierzchnia_ogrod: number | null
          price_valid_from: string | null
          price_valid_to: string | null
          cena_za_m2_poczatkowa: number | null
          cena_bazowa_poczatkowa: number | null
          data_pierwszej_oferty: string | null
          data_pierwszej_sprzedazy: string | null
          miejsca_postojowe_nr: string[] | null
          miejsca_postojowe_ceny: number[] | null
          komorki_nr: string[] | null
          komorki_ceny: number[] | null
          pomieszczenia_przynalezne: Record<string, unknown> | null
          inne_swiadczenia: string | null
          status_dostepnosci: string | null
          data_rezerwacji: string | null
          data_sprzedazy: string | null
          data_aktualizacji: string | null
          powod_zmiany: string | null
          numer_akt_notarialny: string | null
          data_akt_notarialny: string | null
          uwagi: string | null
          construction_year: number | null
          building_permit_number: string | null
          energy_class: string | null
          certyfikat_energetyczny: string | null
          additional_costs: number | null
          vat_rate: number | null
          legal_status: string | null
          
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
          floor?: number | null
          rooms?: number | null
          building_number?: string | null
          parking_space?: string | null
          parking_price?: number | null
          status?: 'available' | 'sold' | 'reserved'
          raw_data?: Record<string, unknown> | null
          
          // Ministry compliance fields (all optional for insert)
          wojewodztwo?: string | null
          powiat?: string | null
          gmina?: string | null
          miejscowosc?: string | null
          ulica?: string | null
          numer_nieruchomosci?: string | null
          kod_pocztowy?: string | null
          kondygnacja?: number | null
          liczba_pokoi?: number | null
          powierzchnia_balkon?: number | null
          powierzchnia_taras?: number | null
          powierzchnia_loggia?: number | null
          powierzchnia_ogrod?: number | null
          price_valid_from?: string | null
          price_valid_to?: string | null
          cena_za_m2_poczatkowa?: number | null
          cena_bazowa_poczatkowa?: number | null
          data_pierwszej_oferty?: string | null
          data_pierwszej_sprzedazy?: string | null
          miejsca_postojowe_nr?: string[] | null
          miejsca_postojowe_ceny?: number[] | null
          komorki_nr?: string[] | null
          komorki_ceny?: number[] | null
          pomieszczenia_przynalezne?: Record<string, unknown> | null
          inne_swiadczenia?: string | null
          status_dostepnosci?: string | null
          data_rezerwacji?: string | null
          data_sprzedazy?: string | null
          data_aktualizacji?: string | null
          powod_zmiany?: string | null
          numer_akt_notarialny?: string | null
          data_akt_notarialny?: string | null
          uwagi?: string | null
          construction_year?: number | null
          building_permit_number?: string | null
          energy_class?: string | null
          certyfikat_energetyczny?: string | null
          additional_costs?: number | null
          vat_rate?: number | null
          legal_status?: string | null
          
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
          floor?: number | null
          rooms?: number | null
          building_number?: string | null
          parking_space?: string | null
          parking_price?: number | null
          status?: 'available' | 'sold' | 'reserved'
          raw_data?: Record<string, unknown> | null
          
          // Ministry compliance fields (all optional for update)
          wojewodztwo?: string | null
          powiat?: string | null
          gmina?: string | null
          miejscowosc?: string | null
          ulica?: string | null
          numer_nieruchomosci?: string | null
          kod_pocztowy?: string | null
          kondygnacja?: number | null
          liczba_pokoi?: number | null
          powierzchnia_balkon?: number | null
          powierzchnia_taras?: number | null
          powierzchnia_loggia?: number | null
          powierzchnia_ogrod?: number | null
          price_valid_from?: string | null
          price_valid_to?: string | null
          cena_za_m2_poczatkowa?: number | null
          cena_bazowa_poczatkowa?: number | null
          data_pierwszej_oferty?: string | null
          data_pierwszej_sprzedazy?: string | null
          miejsca_postojowe_nr?: string[] | null
          miejsca_postojowe_ceny?: number[] | null
          komorki_nr?: string[] | null
          komorki_ceny?: number[] | null
          pomieszczenia_przynalezne?: Record<string, unknown> | null
          inne_swiadczenia?: string | null
          status_dostepnosci?: string | null
          data_rezerwacji?: string | null
          data_sprzedazy?: string | null
          data_aktualizacji?: string | null
          powod_zmiany?: string | null
          numer_akt_notarialny?: string | null
          data_akt_notarialny?: string | null
          uwagi?: string | null
          construction_year?: number | null
          building_permit_number?: string | null
          energy_class?: string | null
          certyfikat_energetyczny?: string | null
          additional_costs?: number | null
          vat_rate?: number | null
          legal_status?: string | null
          
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
      deployment_logs: {
        Row: {
          id: string
          developer_id: string
          deployment_type: 'subdomain' | 'custom_domain'
          deployment_url: string | null
          properties_count: number | null
          projects_count: number | null
          file_size_html: number | null
          deployment_status: 'success' | 'failed' | 'pending'
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          deployment_type: 'subdomain' | 'custom_domain'
          deployment_url?: string | null
          properties_count?: number | null
          projects_count?: number | null
          file_size_html?: number | null
          deployment_status?: 'success' | 'failed' | 'pending'
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          developer_id?: string
          deployment_type?: 'subdomain' | 'custom_domain'
          deployment_url?: string | null
          properties_count?: number | null
          projects_count?: number | null
          file_size_html?: number | null
          deployment_status?: 'success' | 'failed' | 'pending'
          error_message?: string | null
          created_at?: string
        }
      }
    }
  }
}