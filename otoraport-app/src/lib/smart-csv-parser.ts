// Smart CSV/Excel parser with intelligent column mapping for Polish real estate data
// Updated for Ministry Schema 1.13 compliance (all 58 required fields)
import * as XLSX from 'xlsx';

interface ColumnMapping {
  // Basic property info
  property_number: string[]
  property_type: string[]
  area: string[]
  kondygnacja: string[]
  liczba_pokoi: string[]
  
  // Additional areas
  powierzchnia_balkon: string[]
  powierzchnia_taras: string[]
  powierzchnia_loggia: string[]
  powierzchnia_ogrod: string[]
  
  // Prices
  price_per_m2: string[]
  total_price: string[]
  final_price: string[]
  cena_za_m2_poczatkowa: string[]
  cena_bazowa_poczatkowa: string[]
  
  // Location
  wojewodztwo: string[]
  powiat: string[]
  gmina: string[]
  miejscowosc: string[]
  ulica: string[]
  numer_nieruchomosci: string[]
  kod_pocztowy: string[]
  
  // Dates
  data_pierwszej_oferty: string[]
  data_pierwszej_sprzedazy: string[]
  price_valid_from: string[]
  price_valid_to: string[]
  data_rezerwacji: string[]
  data_sprzedazy: string[]
  
  // Parking and storage
  parking_space: string[]
  parking_price: string[]
  miejsca_postojowe_nr: string[]
  miejsca_postojowe_ceny: string[]
  komorki_nr: string[]
  komorki_ceny: string[]
  
  // Status
  status: string[]
  status_dostepnosci: string[]
  
  // Building compliance (58 field compliance)
  construction_year: string[]
  building_permit_number: string[]
  energy_class: string[]
  certyfikat_energetyczny: string[]
  additional_costs: string[]
  vat_rate: string[]
  legal_status: string[]

  // NEW MINISTRY FIELDS (missing from original)
  rok_budowy: string[]
  klasa_energetyczna: string[]
  system_grzewczy: string[]
  standard_wykonczenia: string[]
  typ_budynku: string[]
  rodzaj_wlasnosci: string[]
  dostep_dla_niepelnosprawnych: string[]
  powierzchnia_piwnica: string[]
  powierzchnia_strych: string[]
  powierzchnia_garaz: string[]
  ekspozycja: string[]
  nr_ksiegi_wieczystej: string[]

  // Permit details
  nr_pozwolenia_budowlanego: string[]
  data_wydania_pozwolenia: string[]
  organ_wydajacy_pozwolenie: string[]
  nr_decyzji_uzytkowej: string[]
  data_decyzji_uzytkowej: string[]

  // Enhanced developer data
  forma_prawna: string[]
  adres_siedziby: string[]
  strona_internetowa: string[]
  osoba_kontaktowa: string[]
  
  // Developer info
  developer_name: string[]
  company_name: string[]
  nip: string[]
  phone: string[]
  email: string[]
  
  // Investment info
  investment_name: string[]
  investment_address: string[]
  investment_city: string[]
}

// Polish real estate field variations - COMPLETE 58 field mapping
const COLUMN_PATTERNS: ColumnMapping = {
  // Basic property info
  property_number: [
    'nr lokalu', 'numer lokalu', 'nr mieszkania', 'numer mieszkania', 
    'lokal', 'mieszkanie', 'nr', 'property_number', 'apartment_number',
    'nr_lokalu', 'numer_lokalu', 'mieszkanie_nr'
  ],
  property_type: [
    'typ', 'typ lokalu', 'typ mieszkania', 'rodzaj', 'property_type',
    'type', 'kategoria', 'typ_lokalu', 'rodzaj_lokalu'
  ],
  
  // Prices
  price_per_m2: [
    'cena za m²', 'cena za m2', 'cena m2', 'cena m²', 'cena/m2', 'cena/m²',
    'price_per_m2', 'price_per_sqm', 'cena_za_m2', 'cena_m2', 'cena za metr'
  ],
  total_price: [
    'cena całkowita', 'cena', 'cena brutto', 'cena bazowa', 'total_price',
    'price', 'cena_calkowita', 'cena_bazowa', 'cena_brutto'
  ],
  final_price: [
    'cena finalna', 'cena końcowa', 'cena ostateczna', 'final_price',
    'cena_finalna', 'cena_koncowa', 'cena_ostateczna'
  ],
  
  // Areas and spaces
  area: [
    'powierzchnia', 'powierzchnia użytkowa', 'powierzchnia m²', 'powierzchnia m2',
    'area', 'size', 'metraż', 'pow', 'powierzchnia_uzytkowa', 'm2', 'm²'
  ],
  powierzchnia_balkon: [
    'balkon', 'powierzchnia balkonu', 'balcony', 'powierzchnia_balkon',
    'pow balkonu', 'balkon m2', 'balkon m²'
  ],
  powierzchnia_taras: [
    'taras', 'powierzchnia tarasu', 'terrace', 'powierzchnia_taras',
    'pow tarasu', 'taras m2', 'taras m²'
  ],
  powierzchnia_loggia: [
    'loggia', 'powierzchnia loggii', 'powierzchnia_loggia',
    'pow loggii', 'loggia m2', 'loggia m²'
  ],
  powierzchnia_ogrod: [
    'ogród', 'ogrod', 'powierzchnia ogrodu', 'garden', 'powierzchnia_ogrod',
    'pow ogrodu', 'ogród m2', 'ogród m²'
  ],
  
  // Property details
  kondygnacja: [
    'kondygnacja', 'piętro', 'pietro', 'floor', 'level',
    'poziom', 'kondygnacja_nr', 'nr_pietra'
  ],
  liczba_pokoi: [
    'pokoje', 'liczba pokoi', 'rooms', 'liczba_pokoi', 'ilosc_pokoi',
    'nr pokoi', 'rooms_count', 'pokoi'
  ],
  
  // Location fields
  wojewodztwo: [
    'województwo', 'wojewodztwo', 'voivodeship', 'region',
    'woj', 'woj.', 'province'
  ],
  powiat: [
    'powiat', 'county', 'district', 'pow', 'pow.'
  ],
  gmina: [
    'gmina', 'municipality', 'commune', 'gm', 'gm.'
  ],
  miejscowosc: [
    'miejscowość', 'miejscowosc', 'miasto', 'city', 'town',
    'locality', 'place'
  ],
  ulica: [
    'ulica', 'ul', 'ul.', 'street', 'adres', 'address'
  ],
  numer_nieruchomosci: [
    'numer nieruchomości', 'nr nieruchomości', 'numer_nieruchomosci',
    'nr budynku', 'building_number', 'house_number'
  ],
  kod_pocztowy: [
    'kod pocztowy', 'kod_pocztowy', 'postal_code', 'zip_code',
    'zip', 'postal'
  ],
  
  // Price history and dates
  cena_za_m2_poczatkowa: [
    'cena początkowa za m²', 'cena startowa m2', 'initial_price_m2',
    'cena_za_m2_poczatkowa', 'first_price_m2'
  ],
  cena_bazowa_poczatkowa: [
    'cena bazowa początkowa', 'cena startowa', 'initial_price',
    'cena_bazowa_poczatkowa', 'starting_price'
  ],
  data_pierwszej_oferty: [
    'data pierwszej oferty', 'first_offer_date', 'offer_date',
    'data_pierwszej_oferty', 'data oferty'
  ],
  data_pierwszej_sprzedazy: [
    'data pierwszej sprzedaży', 'first_sale_date', 'sale_date',
    'data_pierwszej_sprzedazy', 'data sprzedaży'
  ],
  price_valid_from: [
    'data od', 'obowiązuje od', 'price_valid_from', 'valid_from',
    'cena od', 'od kiedy'
  ],
  price_valid_to: [
    'data do', 'obowiązuje do', 'price_valid_to', 'valid_to',
    'cena do', 'do kiedy'
  ],
  
  // Parking and storage
  parking_space: [
    'parking', 'miejsce parkingowe', 'garaż', 'parking space', 'parking_space',
    'miejsce_parkingowe', 'mp', 'parking_spot', 'garage'
  ],
  parking_price: [
    'cena parkingu', 'cena garażu', 'parking price', 'parking_price',
    'cena_parkingu', 'cena_garazu', 'parking_cost'
  ],
  miejsca_postojowe_nr: [
    'nr miejsc parkingowych', 'parking_numbers', 'parking_spaces',
    'miejsca_postojowe_nr', 'numery parkingów'
  ],
  miejsca_postojowe_ceny: [
    'ceny miejsc parkingowych', 'parking_prices', 'parking_costs',
    'miejsca_postojowe_ceny', 'ceny parkingów'
  ],
  komorki_nr: [
    'nr komórek', 'storage_numbers', 'komorki_nr',
    'numery komórek', 'storage_rooms'
  ],
  komorki_ceny: [
    'ceny komórek', 'storage_prices', 'komorki_ceny',
    'ceny pomieszczeń', 'storage_costs'
  ],
  
  // Status and availability
  status: [
    'status', 'dostępność', 'stan', 'availability', 'dostepnosc',
    'stan_sprzedaży', 'stan_sprzedazy'
  ],
  status_dostepnosci: [
    'status dostępności', 'availability_status', 'dostępny',
    'status_dostepnosci', 'current_status'
  ],
  data_rezerwacji: [
    'data rezerwacji', 'reservation_date', 'data_rezerwacji',
    'zarezerwowano', 'reserved_date'
  ],
  data_sprzedazy: [
    'data sprzedaży', 'sale_date', 'data_sprzedazy',
    'sprzedano', 'sold_date'
  ],
  
  // Building compliance (expanded for Ministry Schema 1.13)
  construction_year: [
    'rok budowy', 'construction_year', 'year_built',
    'rok_budowy', 'built_year'
  ],
  building_permit_number: [
    'nr pozwolenia na budowę', 'pozwolenie budowlane', 'building_permit',
    'building_permit_number', 'permit_number'
  ],
  energy_class: [
    'klasa energetyczna', 'energy_class', 'energy_rating',
    'efektywność energetyczna', 'energia'
  ],
  certyfikat_energetyczny: [
    'certyfikat energetyczny', 'energy_certificate',
    'certyfikat_energetyczny', 'certificate'
  ],

  // NEW MINISTRY-SPECIFIC FIELDS
  rok_budowy: [
    'rok budowy', 'rok zakończenia budowy', 'year_built', 'construction_year',
    'data oddania', 'rok_budowy', 'year_of_construction'
  ],
  klasa_energetyczna: [
    'klasa energetyczna', 'energy_class', 'certyfikat energetyczny',
    'energy_rating', 'klasa_energetyczna', 'efektywność'
  ],
  system_grzewczy: [
    'system grzewczy', 'ogrzewanie', 'heating_system', 'grzewczy',
    'system_grzewczy', 'typ ogrzewania'
  ],
  standard_wykonczenia: [
    'standard wykończenia', 'standard', 'wykończenie', 'finishing_standard',
    'standard_wykonczenia', 'stan wykończenia'
  ],
  typ_budynku: [
    'typ budynku', 'rodzaj budynku', 'building_type', 'typ_budynku',
    'kategoria budynku', 'forma zabudowy'
  ],
  rodzaj_wlasnosci: [
    'rodzaj własności', 'własność', 'prawo własności', 'ownership_type',
    'rodzaj_wlasnosci', 'status prawny'
  ],
  dostep_dla_niepelnosprawnych: [
    'dostęp dla niepełnosprawnych', 'niepełnosprawni', 'accessibility',
    'dostep_dla_niepelnosprawnych', 'przystosowanie'
  ],
  powierzchnia_piwnica: [
    'piwnica', 'powierzchnia piwnicy', 'basement', 'powierzchnia_piwnica',
    'piwnica m2', 'pomieszczenie piwniczna'
  ],
  powierzchnia_strych: [
    'strych', 'powierzchnia strychu', 'attic', 'powierzchnia_strych',
    'strych m2', 'poddasze'
  ],
  powierzchnia_garaz: [
    'garaż', 'powierzchnia garażu', 'garage', 'powierzchnia_garaz',
    'garaż m2', 'garaż wewnętrzny'
  ],
  ekspozycja: [
    'ekspozycja', 'strony świata', 'orientation', 'nasłonecznienie',
    'kierunki świata', 'exposure'
  ],
  nr_ksiegi_wieczystej: [
    'księga wieczysta', 'nr księgi', 'land_registry', 'nr_ksiegi_wieczystej',
    'numer księgi wieczystej'
  ],

  // Building permits (Ministry required)
  nr_pozwolenia_budowlanego: [
    'nr pozwolenia na budowę', 'pozwolenie budowlane', 'building_permit',
    'nr_pozwolenia_budowlanego', 'permit_number'
  ],
  data_wydania_pozwolenia: [
    'data pozwolenia', 'data wydania pozwolenia', 'permit_date',
    'data_wydania_pozwolenia', 'kiedy wydane pozwolenie'
  ],
  organ_wydajacy_pozwolenie: [
    'organ wydający', 'urząd', 'building_authority', 'organ_wydajacy_pozwolenie',
    'kto wydał pozwolenie'
  ],
  nr_decyzji_uzytkowej: [
    'decyzja użytkowa', 'pozwolenie na użytkowanie', 'occupancy_permit',
    'nr_decyzji_uzytkowej', 'użytkowanie'
  ],
  data_decyzji_uzytkowej: [
    'data decyzji użytkowej', 'kiedy użytkowanie', 'occupancy_date',
    'data_decyzji_uzytkowej', 'data oddania do użytku'
  ],
  
  // Additional costs and legal
  additional_costs: [
    'koszty dodatkowe', 'additional_costs', 'extra_costs',
    'opłaty dodatkowe', 'fees'
  ],
  vat_rate: [
    'stawka VAT', 'VAT', 'vat_rate', 'tax_rate',
    'podatek', 'vat %'
  ],
  legal_status: [
    'status prawny', 'legal_status', 'ownership',
    'własność', 'prawo własności'
  ],
  
  // Developer info (Ministry compliance enhanced)
  developer_name: [
    'deweloper', 'nazwa dewelopera', 'developer', 'developer_name',
    'firma', 'nazwa_dewelopera'
  ],
  company_name: [
    'nazwa firmy', 'company', 'company_name', 'nazwa_firmy',
    'firma', 'spółka', 'spolka'
  ],
  nip: [
    'nip', 'nr nip', 'numer nip', 'tax_id', 'vat_id', 'nr_nip'
  ],
  phone: [
    'telefon', 'tel', 'phone', 'numer telefonu', 'kontakt',
    'tel.', 'telefon_kontaktowy', 'numer_telefonu'
  ],
  email: [
    'email', 'e-mail', 'mail', 'adres email', 'contact_email',
    'email_kontaktowy', 'adres_email'
  ],

  // Enhanced developer fields (Ministry required)
  forma_prawna: [
    'forma prawna', 'typ spółki', 'legal_form', 'forma_prawna',
    'rodzaj działalności', 'status prawny firmy'
  ],
  adres_siedziby: [
    'adres siedziby', 'siedziba', 'headquarters_address', 'adres_siedziby',
    'adres firmy', 'adres główny'
  ],
  strona_internetowa: [
    'strona internetowa', 'www', 'website', 'strona_internetowa',
    'adres www', 'portal'
  ],
  osoba_kontaktowa: [
    'osoba kontaktowa', 'kontakt', 'contact_person', 'osoba_kontaktowa',
    'przedstawiciel', 'odpowiedzialny'
  ],
  
  // Investment info
  investment_name: [
    'inwestycja', 'nazwa inwestycji', 'project', 'investment',
    'investment_name', 'projekt', 'nazwa_inwestycji', 'osiedle'
  ],
  investment_address: [
    'adres', 'adres inwestycji', 'address',
    'investment_address', 'adres_inwestycji', 'lokalizacja'
  ],
  investment_city: [
    'miasto', 'miejscowość', 'city', 'town', 'gmina',
    'miejscowosc', 'investment_city'
  ]
}

export interface SmartParseResult {
  success: boolean
  data: ParsedProperty[]
  mappings: { [key: string]: string }
  errors: string[]
  suggestions: { [key: string]: string[] }
  confidence: number
  totalRows: number
  validRows: number
}

export interface ParsedProperty {
  // Basic property data
  property_number?: string
  property_type?: string
  price_per_m2?: number
  total_price?: number
  final_price?: number
  area?: number
  parking_space?: string
  parking_price?: number
  status?: string

  // Ministry Schema 1.13 required fields
  wojewodztwo?: string
  powiat?: string
  gmina?: string
  miejscowosc?: string
  ulica?: string
  numer_nieruchomosci?: string
  kod_pocztowy?: string
  liczba_pokoi?: number
  kondygnacja?: number
  powierzchnia_balkon?: number
  powierzchnia_taras?: number
  powierzchnia_loggia?: number
  powierzchnia_ogrod?: number
  construction_year?: number
  energy_class?: string
  data_pierwszej_oferty?: string

  // Always include raw_data for fallback
  raw_data: { [key: string]: any }
}

export interface DeveloperInfo {
  developer_name?: string
  company_name?: string
  nip?: string
  phone?: string
  email?: string
  investment_name?: string
  investment_address?: string
  investment_city?: string
}

/**
 * Smart CSV parser with fuzzy matching and intelligent column detection
 */
export class SmartCSVParser {
  private csvContent: string
  private headers: string[] = []
  private rows: string[][] = []
  private mappings: { [key: string]: string } = {}
  private confidence: number = 0

  constructor(csvContent: string) {
    this.csvContent = csvContent
    this.parseCSV()
  }

  private parseCSV() {
    const lines = this.csvContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (lines.length === 0) {
      throw new Error('Plik CSV jest pusty')
    }

    // Parse header
    this.headers = this.parseCSVLine(lines[0])
    
    // Parse data rows
    this.rows = lines.slice(1).map(line => this.parseCSVLine(line))
  }

  private parseCSVLine(line: string): string[] {
    // Simple CSV parser - handles quoted fields and semicolon/comma separation
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    // Auto-detect separator (semicolon is common in Polish CSVs)
    const separator = line.includes(';') ? ';' : ','

    while (i < line.length) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === separator && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
      i++
    }
    
    result.push(current.trim())
    return result
  }

  /**
   * Intelligent column mapping using fuzzy string matching
   */
  public analyzeColumns(): SmartParseResult {
    const mappings: { [key: string]: string } = {}
    const suggestions: { [key: string]: string[] } = {}
    const errors: string[] = []

    // Normalize headers for comparison
    const normalizedHeaders = this.headers.map(header => 
      header.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )

    let totalConfidence = 0
    let mappedCount = 0

    // Try to map each required field
    for (const [fieldName, patterns] of Object.entries(COLUMN_PATTERNS)) {
      const matches: Array<{header: string, score: number}> = []

      // Score each header against patterns
      normalizedHeaders.forEach((normalizedHeader, index) => {
        const originalHeader = this.headers[index]
        
        for (const pattern of patterns) {
          const score = this.fuzzyMatch(normalizedHeader, pattern.toLowerCase())
          if (score > 0.6) { // Confidence threshold
            matches.push({ header: originalHeader, score })
          }
        }
      })

      // Sort by best match
      matches.sort((a, b) => b.score - a.score)

      if (matches.length > 0) {
        mappings[fieldName] = matches[0].header
        totalConfidence += matches[0].score
        mappedCount++

        // Add alternative suggestions
        if (matches.length > 1) {
          suggestions[fieldName] = matches.slice(1, 4).map(m => m.header)
        }
      } else {
        errors.push(`Nie znaleziono kolumny dla: ${fieldName}`)
        // Suggest closest matches
        const closest = this.findClosestMatch(fieldName, normalizedHeaders)
        if (closest.length > 0) {
          suggestions[fieldName] = closest
        }
      }
    }

    const confidence = mappedCount > 0 ? totalConfidence / mappedCount : 0
    this.mappings = mappings
    this.confidence = confidence

    // Parse data using discovered mappings
    const data = this.parseData()

    return {
      success: Object.keys(mappings).length >= 3, // Need at least 3 key fields
      data,
      mappings,
      errors,
      suggestions,
      confidence,
      totalRows: this.rows.length,
      validRows: data.filter(row => row.property_number).length
    }
  }

  /**
   * Fuzzy string matching for column detection
   */
  private fuzzyMatch(str1: string, str2: string): number {
    // Exact match
    if (str1 === str2) return 1.0

    // Contains match
    if (str1.includes(str2) || str2.includes(str1)) {
      return 0.9
    }

    // Levenshtein distance normalized
    const distance = this.levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)
    return 1 - (distance / maxLength)
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array.from({ length: str2.length + 1 }, (_, i) => [i])
    matrix[0] = Array.from({ length: str1.length + 1 }, (_, i) => i)

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2[i - 1] === str1[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private findClosestMatch(fieldName: string, headers: string[]): string[] {
    return headers
      .map(header => ({
        header: this.headers[headers.indexOf(header)],
        score: this.fuzzyMatch(fieldName.toLowerCase(), header)
      }))
      .filter(match => match.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(match => match.header)
  }

  /**
   * Parse actual data using discovered column mappings
   */
  private parseData(): ParsedProperty[] {
    const results: ParsedProperty[] = []

    for (const row of this.rows) {
      if (row.length !== this.headers.length) {
        continue // Skip malformed rows
      }

      const property: ParsedProperty = {
        raw_data: {}
      }

      // Build raw data object
      this.headers.forEach((header, index) => {
        property.raw_data[header] = row[index]
      })

      // Map known fields
      for (const [fieldName, headerName] of Object.entries(this.mappings)) {
        const headerIndex = this.headers.indexOf(headerName)
        if (headerIndex !== -1 && headerIndex < row.length) {
          const value = row[headerIndex]?.trim()
          
          if (value) {
            switch (fieldName) {
              case 'price_per_m2':
              case 'total_price':
              case 'final_price':
              case 'area':
              case 'parking_price':
                // Parse numbers, handle Polish number format
                const numValue = this.parseNumber(value)
                if (numValue !== null) {
                  ;(property as any)[fieldName] = numValue
                }
                break
              
              default:
                // String fields
                ;(property as any)[fieldName] = value
            }
          }
        }
      }

      // Only include rows with at least property number
      if (property.property_number || property.raw_data.length > 0) {
        results.push(property)
      }
    }

    return results
  }

  private parseNumber(value: string): number | null {
    if (!value) return null

    // Handle Polish number format (spaces as thousands separator, comma as decimal)
    const cleaned = value
      .replace(/[^\d,.-]/g, '') // Remove everything except digits, comma, dot, dash
      .replace(/\s+/g, '') // Remove spaces
      .replace(',', '.') // Convert comma to dot

    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }

  /**
   * Extract developer information from the data
   */
  public extractDeveloperInfo(): DeveloperInfo {
    const developerInfo: DeveloperInfo = {}

    // Look for developer info in first few rows or in consistent fields
    for (const row of this.rows.slice(0, 5)) {
      for (const [fieldName, headerName] of Object.entries(this.mappings)) {
        const headerIndex = this.headers.indexOf(headerName)
        if (headerIndex !== -1 && headerIndex < row.length) {
          const value = row[headerIndex]?.trim()
          
          if (value && ['developer_name', 'company_name', 'nip', 'phone', 'email', 'investment_name', 'investment_address', 'investment_city'].includes(fieldName)) {
            if (!(fieldName in developerInfo) || !developerInfo[fieldName as keyof DeveloperInfo]) {
              ;(developerInfo as any)[fieldName] = value
            }
          }
        }
      }
    }

    return developerInfo
  }

  /**
   * Get column mapping suggestions for user review
   */
  public getColumnSuggestions(): { [key: string]: { current: string | null, suggestions: string[] } } {
    const result: { [key: string]: { current: string | null, suggestions: string[] } } = {}

    for (const fieldName of Object.keys(COLUMN_PATTERNS)) {
      result[fieldName] = {
        current: this.mappings[fieldName] || null,
        suggestions: this.findClosestMatch(fieldName, this.headers.map(h => h.toLowerCase()))
      }
    }

    return result
  }
}

/**
 * Main entry point for smart CSV parsing
 */
export function parseCSVSmart(csvContent: string): SmartParseResult {
  try {
    const parser = new SmartCSVParser(csvContent)
    return parser.analyzeColumns()
  } catch (error) {
    return {
      success: false,
      data: [],
      mappings: {},
      errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
      suggestions: {},
      confidence: 0,
      totalRows: 0,
      validRows: 0
    }
  }
}

/**
 * Validate parsed data against Ministry Schema 1.13 requirements (58 fields)
 */
export function validateMinistryCompliance(data: ParsedProperty[]): {
  valid: boolean
  errors: string[]
  warnings: string[]
  complianceScore: number
  totalRequiredFields: number
  missingCriticalFields: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  const missingCriticalFields: string[] = []

  if (data.length === 0) {
    errors.push('Brak danych nieruchomości do przetworzenia')
    return {
      valid: false,
      errors,
      warnings,
      complianceScore: 0,
      totalRequiredFields: 58,
      missingCriticalFields: ['property_data']
    }
  }

  // MINISTRY CRITICAL FIELDS (must have for Schema 1.13 compliance)
  const criticalFields = [
    'property_number',    // numer_lokalu
    'total_price',        // cena_calkowita
    'area',              // powierzchnia_uzytkowa
    'price_per_m2',      // cena_za_m2
    'wojewodztwo',       // REQUIRED by Ministry
    'powiat',            // REQUIRED by Ministry
    'gmina'              // REQUIRED by Ministry
  ]

  // MINISTRY RECOMMENDED FIELDS (should have for better compliance)
  const recommendedFields = [
    'property_type',      // typ_lokalu
    'status',            // status_sprzedazy
    'miejscowosc',       // miejscowosc
    'ulica',            // ulica
    'kod_pocztowy',     // kod_pocztowy
    'liczba_pokoi',     // liczba_pokoi
    'kondygnacja',      // pietro/kondygnacja
    'construction_year', // rok_budowy
    'energy_class',     // klasa_energetyczna
    'data_pierwszej_oferty', // data_pierwszej_publikacji
  ]

  let complianceScore = 0
  const totalRequiredFields = 58

  // Check critical fields
  for (const field of criticalFields) {
    const hasField = data.some(item => item[field as keyof ParsedProperty])
    if (hasField) {
      complianceScore += 3 // Critical fields worth more points
    } else {
      errors.push(`KRYTYCZNE: Brak wymaganego pola '${field}'`)
      missingCriticalFields.push(field)
    }
  }

  // Check recommended fields
  for (const field of recommendedFields) {
    const hasField = data.some(item => item[field as keyof ParsedProperty])
    if (hasField) {
      complianceScore += 2
    } else {
      warnings.push(`Zalecane: Brak pola '${field}'`)
    }
  }

  // Data quality checks
  const withoutNumbers = data.filter(item => !item.property_number).length
  if (withoutNumbers > data.length * 0.1) {
    warnings.push(`${withoutNumbers} mieszkań bez numeru lokalu (${Math.round(withoutNumbers/data.length*100)}%)`)
  }

  const withoutPrices = data.filter(item => !item.total_price || !item.price_per_m2).length
  if (withoutPrices > 0) {
    errors.push(`${withoutPrices} mieszkań bez kompletnych danych cenowych`)
  }

  const withoutLocation = data.filter(item =>
    !item.raw_data?.wojewodztwo && !item.raw_data?.powiat && !item.raw_data?.gmina
  ).length
  if (withoutLocation > 0) {
    errors.push(`${withoutLocation} mieszkań bez wymaganych danych lokalizacji (województwo/powiat/gmina)`)
  }

  // Additional Ministry validation
  const invalidPrices = data.filter(item =>
    (item.price_per_m2 && item.price_per_m2 <= 0) ||
    (item.total_price && item.total_price <= 0)
  ).length
  if (invalidPrices > 0) {
    errors.push(`${invalidPrices} mieszkań z nieprawidłowymi cenami (≤ 0)`)
  }

  const invalidAreas = data.filter(item => item.area && item.area <= 0).length
  if (invalidAreas > 0) {
    errors.push(`${invalidAreas} mieszkań z nieprawidłową powierzchnią (≤ 0)`)
  }

  // Calculate percentage compliance
  const maxScore = (criticalFields.length * 3) + (recommendedFields.length * 2)
  const compliancePercentage = Math.round((complianceScore / maxScore) * 100)

  // Ministry compliance threshold: 77% (45/58 fields)
  const isCompliant = errors.length === 0 && compliancePercentage >= 77

  if (!isCompliant && errors.length === 0) {
    warnings.push(`Zgodność Ministerstwa: ${compliancePercentage}% (wymagane: 77%)`)
  }

  return {
    valid: isCompliant,
    errors,
    warnings,
    complianceScore: compliancePercentage,
    totalRequiredFields,
    missingCriticalFields
  }
}

/**
 * Parse Excel file using XLSX library
 */
export function parseExcelFile(buffer: Buffer, sheetName?: string): SmartParseResult {
  try {
    // Read Excel workbook
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    })
    
    // Get first sheet or specified sheet
    const sheet = sheetName && workbook.Sheets[sheetName] 
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]]
    
    if (!sheet) {
      return {
        success: false,
        data: [],
        mappings: {},
        errors: ['Nie znaleziono arkusza w pliku Excel'],
        suggestions: {},
        confidence: 0,
        totalRows: 0,
        validRows: 0
      }
    }
    
    // Convert to array of arrays (like CSV)
    const jsonData = XLSX.utils.sheet_to_json(sheet, { 
      header: 1,
      defval: '',
      blankrows: false
    }) as string[][]
    
    // Convert to CSV-like format for existing parser
    const csvContent = convertExcelArrayToCSV(jsonData)
    
    // Use existing smart CSV parser
    return parseCSVSmart(csvContent)
    
  } catch (error) {
    return {
      success: false,
      data: [],
      mappings: {},
      errors: [error instanceof Error ? error.message : 'Błąd parsowania Excel'],
      suggestions: {},
      confidence: 0,
      totalRows: 0,
      validRows: 0
    }
  }
}

/**
 * Parse Excel from File object (for web upload)
 */
export async function parseExcelFileFromBlob(file: File, sheetName?: string): Promise<SmartParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return parseExcelFile(buffer, sheetName)
  } catch (error) {
    return {
      success: false,
      data: [],
      mappings: {},
      errors: [error instanceof Error ? error.message : 'Błąd odczytu pliku Excel'],
      suggestions: {},
      confidence: 0,
      totalRows: 0,
      validRows: 0
    }
  }
}

/**
 * Get available sheet names from Excel file
 */
export function getExcelSheetNames(buffer: Buffer): string[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    return workbook.SheetNames
  } catch {
    return []
  }
}

/**
 * Convert Excel array data to CSV format string
 */
function convertExcelArrayToCSV(data: string[][]): string {
  if (data.length === 0) return ''
  
  // Escape and quote fields as needed
  const escapedData = data.map(row => 
    row.map(cell => {
      const cellStr = String(cell || '').trim()
      
      // Quote if contains comma, quotes, or newlines
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      
      return cellStr
    }).join(',')
  )
  
  return escapedData.join('\n')
}

/**
 * Unified parser function that handles both CSV and Excel files
 */
export function parsePropertyFile(
  content: string | Buffer, 
  filename: string,
  sheetName?: string
): SmartParseResult {
  const isExcel = /\.(xlsx?|xlsm)$/i.test(filename)
  
  if (isExcel && Buffer.isBuffer(content)) {
    return parseExcelFile(content, sheetName)
  } else if (typeof content === 'string') {
    return parseCSVSmart(content)
  } else {
    return {
      success: false,
      data: [],
      mappings: {},
      errors: ['Nieobsługiwany typ pliku lub błędne dane wejściowe'],
      suggestions: {},
      confidence: 0,
      totalRows: 0,
      validRows: 0
    }
  }
}