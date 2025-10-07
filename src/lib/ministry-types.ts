/**
 * Full Ministry-compliant property type with all 58 required fields
 * According to Polish law: ustawa z dnia 21 maja 2025 r. o jawności cen
 */

export interface MinistryCompliantProperty {
  // Basic identification
  id: string
  project_id: string
  property_number: string
  property_type: string

  // Location details (required by ministry)
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
  uklad_mieszkania?: string | null // (rozkładowe, nierozkładowe)
  stan_wykonczenia?: string | null // (deweloperski, pod klucz, do remontu)
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
  area?: number | null // Legacy field

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

  // Legacy price fields (for backward compatibility)
  price_per_m2?: number | null
  total_price?: number | null
  final_price?: number | null

  // Additional elements (parking, storage)
  miejsca_postojowe_liczba?: number | null
  miejsca_postojowe_nr?: string[] | null
  miejsca_postojowe_ceny?: number[] | null
  miejsca_postojowe_rodzaj?: string | null // (garaż, miejsce zewnętrzne, hala)
  komorki_lokatorskie_liczba?: number | null
  komorki_lokatorskie_nr?: string[] | null
  komorki_lokatorskie_ceny?: number[] | null
  komorki_lokatorskie_powierzchnie?: number[] | null

  // Legacy parking fields
  parking_space?: string | null
  parking_price?: number | null

  // Amenities and features
  pomieszczenia_przynalezne?: Record<string, unknown> | null // JSONB
  winda?: boolean | null
  klimatyzacja?: boolean | null
  ogrzewanie?: string | null // (miejskie, gazowe, elektryczne, etc.)
  dostep_dla_niepelnosprawnych?: boolean | null
  ekspozycja?: string | null // (północ, południe, wschód, zachód)
  widok_z_okien?: string | null

  // Legal and status information
  status_sprzedazy?: string | null // (dostępne, zarezerwowane, sprzedane)
  data_rezerwacji?: string | null
  data_sprzedazy?: string | null
  data_przekazania?: string | null
  forma_wlasnosci?: string | null // (pełna własność, spółdzielcze, TBS)
  ksiega_wieczysta?: string | null
  udzial_w_gruncie?: number | null
  status?: string // Legacy status field

  // Ministry reporting metadata
  data_pierwszego_raportu?: string | null
  data_ostatniej_aktualizacji?: string | null
  liczba_zmian_ceny?: number | null
  uwagi_ministerstwo?: string | null
  uuid_ministerstwo?: string | null

  // System fields
  raw_data?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export interface MinistryCompliantDeveloper {
  id: string
  user_id?: string | null
  email: string
  name?: string
  company_name?: string | null
  nip?: string | null
  regon?: string | null
  krs?: string | null
  ceidg?: string | null
  forma_prawna?: string | null
  legal_form?: string | null // alias
  headquarters_address?: string | null

  // Detailed address fields
  wojewodztwo?: string | null
  powiat?: string | null
  gmina?: string | null
  miejscowosc?: string | null
  ulica?: string | null
  numer_budynku?: string | null
  numer_lokalu?: string | null
  kod_pocztowy?: string | null

  // Contact
  phone?: string | null
  strona_www?: string | null

  // Registration dates
  data_wpisu_krs?: string | null
  data_wpisu_ceidg?: string | null

  // System fields
  client_id?: string
  xml_url?: string | null
  md5_url?: string | null
  custom_domain?: string | null
  presentation_url?: string | null
  ministry_approved?: boolean
  ministry_email_sent?: boolean
  subscription_status?: string
  subscription_plan?: string | null
  created_at?: string
  updated_at?: string
}

export interface MinistryCompliantProject {
  id: string
  developer_id: string
  name: string
  location?: string | null
  address?: string | null

  // Permit details
  numer_pozwolenia?: string | null
  data_pozwolenia?: string | null

  // Location details
  wojewodztwo?: string | null
  powiat?: string | null
  gmina?: string | null
  miejscowosc?: string | null
  ulica?: string | null
  numer_nieruchomosci?: string | null
  kod_pocztowy?: string | null

  // Cadastral data
  dzialka_ewidencyjna?: string | null
  obreb_ewidencyjny?: string | null

  // Project timeline
  data_rozpoczecia_sprzedazy?: string | null
  data_zakonczenia_budowy?: string | null

  // Scale
  liczba_budynkow?: number | null
  liczba_lokali?: number | null

  status: string
  created_at: string
}

/**
 * Helper function to map legacy property fields to ministry-compliant fields
 */
export function mapToMinistryCompliant(property: Partial<MinistryCompliantProperty>): MinistryCompliantProperty {
  return {
    ...property,
    // Map legacy price fields to ministry fields
    cena_za_m2_aktualna: property.cena_za_m2_aktualna ?? property.price_per_m2,
    cena_bazowa_aktualna: property.cena_bazowa_aktualna ?? property.total_price,
    cena_finalna_aktualna: property.cena_finalna_aktualna ?? property.final_price,
    powierzchnia_uzytkowa: property.powierzchnia_uzytkowa ?? property.area,

    // Default values for required ministry fields
    waluta: property.waluta ?? 'PLN',
    status_sprzedazy: property.status_sprzedazy ?? property.status ?? 'dostępne',

    // Generate ministry UUID if not exists
    uuid_ministerstwo: property.uuid_ministerstwo ?? property.id
  }
}

/**
 * Validate if property has all required ministry fields
 */
export function validateMinistryCompliance(property: MinistryCompliantProperty): {
  isValid: boolean
  missingFields: string[]
  warnings: string[]
} {
  const requiredFields = [
    'property_number',
    'property_type',
    'wojewodztwo',
    'powiat',
    'gmina',
    'cena_za_m2_aktualna',
    'cena_finalna_aktualna',
    'powierzchnia_uzytkowa'
  ]

  const missingFields = requiredFields.filter(field => !property[field as keyof MinistryCompliantProperty])

  const warnings = []

  // Check for recommended fields
  if (!property.data_pierwszej_oferty) {
    warnings.push('Brak daty pierwszej oferty')
  }
  if (!property.liczba_pokoi) {
    warnings.push('Brak liczby pokoi')
  }
  if (!property.kondygnacja) {
    warnings.push('Brak informacji o kondygnacji')
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  }
}