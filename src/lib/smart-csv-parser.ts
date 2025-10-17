// Smart CSV/Excel parser with intelligent column mapping for Polish real estate data
// Updated for Ministry Schema 1.13 compliance (all 58 required fields)
import * as XLSX from 'xlsx';
import { distance as levenshteinDistance } from 'fastest-levenshtein';
import { COMPLETE_COLUMN_PATTERNS, type MinistryFieldKey } from './column-synonyms-complete';

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
  base_price: string[]  // TASK #85.3: Ministry base price (cena bazowa)
  base_price_valid_from: string[]  // TASK #85.3
  final_price: string[]
  final_price_valid_from: string[]  // TASK #85.3
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
  parking_type: string[]
  parking_designation: string[]
  parking_price: string[]
  parking_date: string[]
  miejsca_postojowe_nr: string[]
  miejsca_postojowe_ceny: string[]
  storage_type: string[]
  storage_designation: string[]
  storage_price: string[]
  storage_date: string[]
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

  // Additional ministry fields
  budynek: string[]
  klatka: string[]
  stan_wykonczenia: string[]
  rok_budowy: string[]
  technologia_budowy: string[]
  powierzchnia_calkowita: string[]
  powierzchnia_piwnicy: string[]
  powierzchnia_strychu: string[]
  miejsca_postojowe_liczba: string[]
  miejsca_postojowe_rodzaj: string[]
  komorki_lokatorskie_liczba: string[]
  komorki_lokatorskie_powierzchnie: string[]
  winda: string[]
  klimatyzacja: string[]
  ogrzewanie: string[]
  dostep_dla_niepelnosprawnych: string[]
  ekspozycja: string[]
  widok_z_okien: string[]
  data_rezerwacji: string[]
  data_sprzedazy: string[]
  data_przekazania: string[]
  forma_wlasnosci: string[]
  ksiega_wieczysta: string[]
  udzial_w_gruncie: string[]
  waluta: string[]

  // TASK #85.4 & #85.5: Ministry fields for necessary rights and prospectus
  necessary_rights: string[]  // prawa_niezbedne_wyszczegolnienie
  necessary_rights_price: string[]
  necessary_rights_date: string[]
  prospectus_url: string[]  // adres_prospektu
}

/**
 * Column pattern mapping using comprehensive synonym database from column-synonyms-complete.ts
 * 
 * This provides 520+ synonyms covering all 58 ministry fields plus INPRO extras.
 * Priority order: INPRO exact → ATAL exact → Ministry official → Generic Polish → English
 * 
 * @see column-synonyms-complete.ts for full documentation and synonym mappings
 */
export const COLUMN_PATTERNS: ColumnMapping = COMPLETE_COLUMN_PATTERNS as unknown as ColumnMapping

export interface RowValidationStats {
  tooFewColumns: number
  emptyRows: number
  soldProperties: number
  invalidCriticalData: number
  successfullyParsed: number
  details: {
    rowNumber: number
    reason: string
    columnCount?: number
  }[]
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
  validationStats?: RowValidationStats
  detectedFormat?: 'ministerial' | 'inpro' | 'custom'
  formatConfidence?: number
  formatDetails?: string
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
  raw_data: Record<string, unknown>
}

export interface DeveloperInfo {
  // Basic company info (columns 1-10)
  company_name?: string
  legal_form?: string
  krs_number?: string
  ceidg_number?: string
  nip?: string
  regon?: string
  phone?: string
  email?: string
  fax?: string
  website?: string

  // Headquarters address (columns 9-16)
  headquarters_voivodeship?: string
  headquarters_county?: string
  headquarters_municipality?: string
  headquarters_city?: string
  headquarters_street?: string
  headquarters_building_number?: string
  headquarters_apartment_number?: string
  headquarters_postal_code?: string

  // Sales office address (columns 17-24)
  sales_office_voivodeship?: string
  sales_office_county?: string
  sales_office_municipality?: string
  sales_office_city?: string
  sales_office_street?: string
  sales_office_building_number?: string
  sales_office_apartment_number?: string
  sales_office_postal_code?: string

  // Additional info (columns 25-28)
  additional_sales_locations?: string
  contact_method?: string
  additional_contact_info?: string

  // Legacy fields (for backward compatibility)
  developer_name?: string
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
  private validationStats: RowValidationStats = {
    tooFewColumns: 0,
    emptyRows: 0,
    soldProperties: 0,
    invalidCriticalData: 0,
    successfullyParsed: 0,
    details: []
  }

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

    // Detect separator by analyzing the entire file
    const separator = this.detectSeparator(lines)
    console.log(`🔍 PARSER: Detected separator: "${separator}" (${separator === ';' ? 'semicolon' : 'comma'})`)

    // Parse header
    this.headers = this.parseCSVLine(lines[0], separator)
    console.log(`📊 PARSER: Header has ${this.headers.length} columns`)
    console.log(`📊 PARSER: First 5 headers:`, this.headers.slice(0, 5))

    // Parse data rows
    this.rows = lines.slice(1).map((line, idx) => {
      const parsed = this.parseCSVLine(line, separator)
      if (idx < 3) { // Log first 3 data rows
        console.log(`📊 PARSER: Row ${idx + 2} has ${parsed.length} columns. First 3 values:`, parsed.slice(0, 3))
      }
      return parsed
    })
  }

  /**
   * Detect CSV separator by analyzing the entire file
   * Returns the most common separator (comma or semicolon) found outside quoted fields
   */
  private detectSeparator(lines: string[]): ',' | ';' {
    const separatorCounts = { ',': 0, ';': 0 }

    // Analyze first 10 lines (or all if fewer) to detect separator
    const sampleSize = Math.min(10, lines.length)

    for (let lineIdx = 0; lineIdx < sampleSize; lineIdx++) {
      const line = lines[lineIdx]
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            i++ // Skip escaped quote
          } else {
            inQuotes = !inQuotes
          }
        } else if (!inQuotes) {
          if (char === ',') separatorCounts[',']++
          if (char === ';') separatorCounts[';']++
        }
      }
    }

    // Return the separator with higher count (default to semicolon for Polish CSVs)
    return separatorCounts[';'] >= separatorCounts[','] ? ';' : ','
  }

  private parseCSVLine(line: string, separator: string): string[] {
    // RFC 4180 compliant CSV parser - handles quoted fields, escaped quotes, and commas
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote ("") inside quoted field
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state (don't add quote to output)
          inQuotes = !inQuotes
        }
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
   * Detect CSV format type (ministerial/INPRO/custom) based on column signatures
   */
  private detectFormat(): { format: 'ministerial' | 'inpro' | 'custom', confidence: number, details: string } {
    // MINISTERIAL FORMAT SIGNATURE: Official government schema columns (58 fields)
    // UNIQUE fields that differentiate from INPRO
    const ministerialSignatures = [
      'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera',
      'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
      'Cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]',
      'Nazwa dewelopera', // First column in ministerial schema
      'Forma prawna dewelopera', // Second column in ministerial schema
      'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny' // Exact ministerial wording
    ]

    // INPRO FORMAT SIGNATURE: Developer software export (40+ columns with ministerial compliance)
    // UNIQUE fields that differentiate from ministerial
    const inproSignatures = [
      'Id nieruchomości', // UNIQUE to INPRO (ministerial doesn't have this)
      'Adres strony internetowej dewelopera',
      'Adres strony internetowej inwestycji',
      'Nr nieruchomości nadany przez dewelopera', // INPRO-specific wording
      'Inne świadczenia pieniężne',
      'Data od której obowiązuje cena za m2 nieruchomości', // INPRO-specific date format
      'Data od której obowiązuje cena nieruchomości'
    ]

    // CUSTOM FORMAT: Simple Polish/English column names
    const customSignatures = [
      'nr lokalu', 'numer lokalu', 'apartment',
      'powierzchnia', 'area', 'metraz',
      'cena', 'price', 'cena całkowita',
      'status', 'dostępność', 'availability'
    ]

    let ministerialScore = 0
    let inproScore = 0
    let customScore = 0

    // FIX: Use normalizeString for consistent comparison (removes Polish special chars)
    const normalizedHeaders = this.headers.map(h => this.normalizeString(h))

    // Score MINISTERIAL format
    ministerialSignatures.forEach(sig => {
      const normalized = this.normalizeString(sig)
      if (normalizedHeaders.some(h => h.includes(normalized) || normalized.includes(h))) {
        ministerialScore++
      }
    })

    // Score INPRO format
    inproSignatures.forEach(sig => {
      const normalized = this.normalizeString(sig)
      if (normalizedHeaders.some(h => h.includes(normalized) || normalized.includes(h))) {
        inproScore++
      }
    })

    // Score CUSTOM format (simpler columns)
    customSignatures.forEach(sig => {
      if (normalizedHeaders.some(h => h === sig || h.includes(sig))) {
        customScore++
      }
    })

    // Determine format based on highest score
    const ministerialConfidence = (ministerialScore / ministerialSignatures.length) * 100
    const inproConfidence = (inproScore / inproSignatures.length) * 100
    const customConfidence = (customScore / customSignatures.length) * 100

    // Priority detection:
    // 1. Check for unique MINISTERIAL markers first (official government schema)
    // 2. Then check for unique INPRO markers
    // 3. Fallback to custom format

    if (ministerialScore >= 4) {
      // Strong ministerial signature (4+ unique fields including "Nazwa dewelopera", "Forma prawna")
      return {
        format: 'ministerial',
        confidence: Math.min(ministerialConfidence, 95),
        details: `Ministry Schema 1.13 compliant format (${ministerialScore}/${ministerialSignatures.length} official columns found)`
      }
    } else if (inproScore >= 4) {
      // Strong INPRO signature (4+ unique fields including "Id nieruchomości")
      return {
        format: 'inpro',
        confidence: Math.min(inproConfidence, 95),
        details: `INPRO developer software export detected (${inproScore}/${inproSignatures.length} signature columns found)`
      }
    } else if (ministerialScore >= 2 && inproScore < 2) {
      // Weak ministerial signature but clearly not INPRO
      return {
        format: 'ministerial',
        confidence: Math.min(ministerialConfidence, 75),
        details: `Likely Ministry format (${ministerialScore}/${ministerialSignatures.length} official columns found)`
      }
    } else if (inproScore >= 2) {
      // Weak INPRO signature
      return {
        format: 'inpro',
        confidence: Math.min(inproConfidence, 75),
        details: `Likely INPRO format (${inproScore}/${inproSignatures.length} signature columns found)`
      }
    } else {
      // Custom format
      return {
        format: 'custom',
        confidence: Math.max(customConfidence, 50), // At least 50% for any valid CSV
        details: `Custom developer export (${customScore}/${customSignatures.length} common field patterns found)`
      }
    }
  }

  /**
   * Normalizes a string for fuzzy column matching by:
   * 1. Converting to Unicode NFC (Normalized Form Composed) to handle composed vs decomposed characters
   * 2. Converting to lowercase for case-insensitive matching
   * 3. Removing punctuation while preserving all letters (including Polish ą, ć, ę, ł, ń, ó, ś, ź, ż) and numbers
   * 4. Normalizing whitespace (multiple spaces → single space, trim)
   *
   * This ensures reliable matching of CSV column headers that may use:
   * - Different Unicode representations (NFC vs NFD)
   * - Mixed case (WOJEWÓDZTWO vs województwo)
   * - Extra whitespace or punctuation (Pow. użytkowa vs Powierzchnia użytkowa)
   * - Polish diacritical marks (Piętro vs piętro)
   *
   * @param str - The string to normalize
   * @returns Normalized string suitable for fuzzy matching
   *
   * @example
   * normalizeString('Piętro nieruchomości')  // 'piętro nieruchomości'
   * normalizeString('WOJEWÓDZTWO ŁÓDZKIE')   // 'województwo łódzkie'
   * normalizeString('Pow. użytkowa [m²]')    // 'pow użytkowa m²'
   * normalizeString('Nr.   mieszkania')      // 'nr mieszkania'
   * normalizeString('CENA M² POWIERZCHNI')   // 'cena m² powierzchni'
   */
  private normalizeString(str: string): string {
    return str
      // Step 1: Unicode NFC normalization - converts decomposed characters (o + ´) to composed (ó)
      // This ensures "ó" (U+00F3) and "o´" (U+006F + U+0301) are treated identically
      .normalize('NFC')

      // Step 2: Case normalization - enables case-insensitive matching
      .toLowerCase()

      // Step 3: Remove punctuation while preserving letters and numbers
      // \p{L} - matches ALL Unicode letters (including ą, ć, ę, ł, ń, ó, ś, ź, ż)
      // \p{N} - matches ALL Unicode numbers (including ², ³, etc.)
      // \s - matches whitespace
      // 'u' flag - enables Unicode mode for \p{} patterns
      // 'g' flag - global replacement
      .replace(/[^\p{L}\p{N}\s]/gu, '')

      // Step 4: Normalize whitespace - collapse multiple spaces/tabs/newlines to single space
      .replace(/\s+/g, ' ')

      // Step 5: Remove leading/trailing whitespace
      .trim()
  }

  /**
   * Intelligent column mapping using fuzzy string matching
   */
  public analyzeColumns(): SmartParseResult {
    const mappings: { [key: string]: string } = {}
    const suggestions: { [key: string]: string[] } = {}
    const errors: string[] = []

    // Detect format type
    const formatDetection = this.detectFormat()
    console.log(`🔍 PARSER: Format detected - ${formatDetection.format.toUpperCase()} (${formatDetection.confidence.toFixed(1)}% confidence)`)
    console.log(`📋 PARSER: ${formatDetection.details}`)

    // Normalize headers for comparison
    const normalizedHeaders = this.headers.map(header => this.normalizeString(header))

    let totalConfidence = 0
    let mappedCount = 0

    // Try to map each required field
    for (const [fieldName, patterns] of Object.entries(COLUMN_PATTERNS)) {
      const matches: Array<{header: string, score: number}> = []

      // Score each header against patterns
      normalizedHeaders.forEach((normalizedHeader, index) => {
        const originalHeader = this.headers[index]

        for (const pattern of patterns) {
          // FIX: Normalize pattern the SAME way as header before comparing!
          const normalizedPattern = this.normalizeString(pattern)
          const score = this.fuzzyMatch(normalizedHeader, normalizedPattern)
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

    // Count valid rows - any row with meaningful data
    const validRowsCount = data.filter(row => {
      const hasPropertyNumber = !!row.property_number
      const hasPricePerM2 = !!row.price_per_m2
      const hasTotalPrice = !!row.total_price
      const hasRawPropertyNumber = !!row.raw_data?.["Nr lokalu lub domu jednorodzinnego nadany przez dewelopera"]
      const hasAnyData = Object.keys(row.raw_data || {}).length > 0

      return hasPropertyNumber || hasPricePerM2 || hasTotalPrice || hasRawPropertyNumber || hasAnyData
    }).length

    console.log(`📊 PARSER: validRows calculation: ${validRowsCount}/${data.length} rows have data`)

    return {
      success: Object.keys(mappings).length >= 3, // Need at least 3 key fields
      data,
      mappings,
      errors,
      suggestions,
      confidence,
      totalRows: this.rows.length,
      validRows: validRowsCount,
      validationStats: this.validationStats,
      detectedFormat: formatDetection.format,
      formatConfidence: formatDetection.confidence,
      formatDetails: formatDetection.details
    }
  }

  /**
   * Fuzzy string matching for column detection using optimized Levenshtein distance
   *
   * Priority-based matching strategy:
   * 1. Exact match: 1.0 (100% confidence)
   * 2. Contains match: 0.9 (90% confidence)
   * 3. Levenshtein similarity: Normalized distance score (0.0 - 1.0)
   *
   * Uses fastest-levenshtein library for O(min(n,m)) performance instead of O(n*m) native implementation.
   * This provides significant speedup for large CSV files with many columns.
   *
   * @param str1 - First normalized string to compare
   * @param str2 - Second normalized string to compare
   * @returns Similarity score from 0.0 (completely different) to 1.0 (identical)
   *
   * @example
   * fuzzyMatch('piętro', 'piętro')          // 1.0 (exact)
   * fuzzyMatch('powierzchnia', 'pow')        // 0.9 (contains)
   * fuzzyMatch('piętro', 'pietro')           // ~0.83 (1 char difference)
   */
  private fuzzyMatch(str1: string, str2: string): number {
    // Priority 1: Exact match
    if (str1 === str2) return 1.0

    // Edge case: Empty string handling (before contains check)
    // JavaScript `.includes('')` returns true, but semantically empty string matches nothing
    if (str1.length === 0 || str2.length === 0) {
      return 0 // Empty string has no similarity to non-empty string
    }

    // Priority 2: Contains match (one string is substring of the other)
    if (str1.includes(str2) || str2.includes(str1)) {
      return 0.9
    }

    // Priority 3: Levenshtein distance similarity (optimized with fastest-levenshtein)
    const distance = levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)

    // Normalize to 0-1 range (1 = identical, 0 = completely different)
    return 1 - (distance / maxLength)
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
   * Detect property status for INPRO format
   * INPRO convention: "X" in price field means sold
   */
  private detectINPROStatus(row: unknown, rawData: Record<string, unknown>): 'available' | 'sold' | 'reserved' | undefined {
    // Check explicit status field first
    const statusField = rawData['Status'] || rawData['status'] || rawData['Status dostępności']
    if (statusField) {
      const statusLower = String(statusField).toLowerCase()
      if (/sprzeda/i.test(statusLower) || /sold/i.test(statusLower)) return 'sold'
      if (/rezerwa/i.test(statusLower) || /reserved/i.test(statusLower)) return 'reserved'
      if (/dostępn/i.test(statusLower) || /available/i.test(statusLower)) return 'available'
    }

    // INPRO CONVENTION: "X" marker in price fields means sold
    const pricePerM2Field = rawData['Cena za m2 nieruchomości'] || rawData['Cena za m2 nieruchomosci']
    const totalPriceField = rawData['Cena nieruchomości'] || rawData['Cena nieruchomosci']

    if (pricePerM2Field === 'X' || totalPriceField === 'X') {
      return 'sold'
    }

    // If prices are valid numbers, property is available
    if (pricePerM2Field && !isNaN(Number(pricePerM2Field))) {
      return 'available'
    }

    return undefined
  }

  /**
   * Parse actual data using discovered column mappings
   */
  private parseData(): ParsedProperty[] {
    const results: ParsedProperty[] = []

    // Initialize validation statistics
    this.validationStats = {
      tooFewColumns: 0,
      emptyRows: 0,
      soldProperties: 0,
      invalidCriticalData: 0,
      successfullyParsed: 0,
      details: []
    }

    console.log(`🔍 PARSER: parseData() - Processing ${this.rows.length} rows, headers: ${this.headers.length} columns`)

    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i]
      const rowNumber = i + 2 // +2 because: +1 for header, +1 for 1-based indexing

      // VALIDATION 1: Check for completely empty rows
      const hasAnyContent = row.some(cell => cell && cell.trim().length > 0)
      if (!hasAnyContent) {
        this.validationStats.emptyRows++
        this.validationStats.details.push({
          rowNumber,
          reason: 'Empty row (all cells are empty or whitespace)'
        })
        console.log(`⚠️ PARSER: Skipping row ${rowNumber} - completely empty`)
        continue
      }

      // VALIDATION 2: Check column count (must have at least 50% of expected columns)
      if (row.length < this.headers.length * 0.5) {
        this.validationStats.tooFewColumns++
        this.validationStats.details.push({
          rowNumber,
          reason: 'Insufficient columns',
          columnCount: row.length
        })
        console.log(`⚠️ PARSER: Skipping row ${rowNumber} - has ${row.length} columns, expected ${this.headers.length} (less than 50%)`)
        continue
      }

      console.log(`✅ PARSER: Processing row ${rowNumber} - ${row.length} columns (${this.headers.length} expected)`)

      const property: ParsedProperty = {
        raw_data: {}
      }

      // Build raw data object - only map columns that exist in this row
      this.headers.forEach((header, index) => {
        if (index < row.length) {
          property.raw_data[header] = row[index] || ''
        }
      })

      // 🚫 FILTER ON UPLOAD: Skip sold properties (ministry compliance)
      // Check columns 39, 41, 43 (price fields) for "X", "x", or "#VALUE!" markers
      const pricePerM2Header = this.mappings['price_per_m2']
      const totalPriceHeader = this.mappings['total_price']
      const finalPriceHeader = this.mappings['final_price']

      let isSold = false

      // Check price_per_m2 (column 39)
      if (pricePerM2Header) {
        const idx = this.headers.indexOf(pricePerM2Header)
        if (idx !== -1 && idx < row.length) {
          const value = String(row[idx] || '').trim().toUpperCase()
          if (value === 'X' || value === '#VALUE!') {
            isSold = true
          }
        }
      }

      // Check total_price/base_price (column 41)
      if (totalPriceHeader && !isSold) {
        const idx = this.headers.indexOf(totalPriceHeader)
        if (idx !== -1 && idx < row.length) {
          const value = String(row[idx] || '').trim().toUpperCase()
          if (value === 'X' || value === '#VALUE!') {
            isSold = true
          }
        }
      }

      // Check final_price (column 43)
      if (finalPriceHeader && !isSold) {
        const idx = this.headers.indexOf(finalPriceHeader)
        if (idx !== -1 && idx < row.length) {
          const value = String(row[idx] || '').trim().toUpperCase()
          if (value === 'X' || value === '#VALUE!') {
            isSold = true
          }
        }
      }

      // VALIDATION 3: Skip sold properties entirely
      if (isSold) {
        this.validationStats.soldProperties++
        this.validationStats.details.push({
          rowNumber,
          reason: `Sold property (detected "X" or "#VALUE!" marker in price fields)`
        })
        console.log(`🚫 PARSER: Skipping sold property at row ${rowNumber} (apartment: ${property.raw_data[this.mappings['property_number'] || ''] || 'unknown'})`)
        continue
      }

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
                // INPRO FIX: Skip parsing if value is "X" (sold marker)
                if (value === 'X') {
                  console.log(`🔍 PARSER: Detected "X" marker in ${fieldName} - property likely sold`)
                  break
                }
                // Parse numbers, handle Polish number format
                const numValue = this.parseNumber(value)
                if (numValue !== null) {
                  (property as Record<string, unknown>)[fieldName] = numValue
                }
                break

              default:
                // String fields
                (property as Record<string, unknown>)[fieldName] = value
            }
          }
        }
      }

      // INPRO FIX: Detect status using INPRO conventions (must be after raw_data is built)
      const detectedStatus = this.detectINPROStatus(row, property.raw_data)
      if (detectedStatus && !property.status) {
        property.status = detectedStatus
        console.log(`🔍 PARSER: Auto-detected status for property ${property.property_number || 'unknown'}: ${detectedStatus}`)
      }

      // MINISTRY CSV FIX: Calculate area if missing OR if mapped to wrong column (e.g. row_number)
      // Ministry CSV NEVER has "powierzchnia" column - must calculate from total_price / price_per_m2
      const shouldCalculateArea = (
        !property.area || // No area at all
        (property.area && property.area < 10 && property.total_price && property.total_price > 100000) // Area suspiciously small for expensive property (probably mapped to row_number)
      )

      if (shouldCalculateArea && property.total_price && property.price_per_m2 && property.price_per_m2 > 0) {
        const calculatedArea = Math.round((property.total_price / property.price_per_m2) * 100) / 100
        console.log(`🔢 PARSER: Calculated area for ${property.property_number || 'unknown'}: ${property.total_price} / ${property.price_per_m2} = ${calculatedArea} m² (replacing old value: ${property.area})`)
        property.area = calculatedArea
      } else if (!property.area) {
        console.log(`⚠️ PARSER: Cannot calculate area for ${property.property_number || 'unknown'}: area=${property.area}, total_price=${property.total_price}, price_per_m2=${property.price_per_m2}`)
      }

      // MINISTRY CSV FIX: Calculate price_per_m2 if missing
      if (!property.price_per_m2 && property.total_price && property.area && property.area > 0) {
        property.price_per_m2 = Math.round((property.total_price / property.area) * 100) / 100
      }

      // MINISTRY CSV FIX: Calculate total_price if missing
      if (!property.total_price && property.price_per_m2 && property.area && property.area > 0) {
        property.total_price = Math.round(property.price_per_m2 * property.area * 100) / 100
      }

      // VALIDATION 4: Check critical fields before including
      // At least ONE of: property_number, area, or price must be valid
      const hasPropertyNumber = property.property_number && property.property_number.trim().length > 0
      const hasValidArea = property.area && property.area > 0
      const hasValidPrice = (property.price_per_m2 && property.price_per_m2 > 0) ||
                           (property.total_price && property.total_price > 0) ||
                           (property.final_price && property.final_price > 0)

      if (!hasPropertyNumber && !hasValidArea && !hasValidPrice) {
        this.validationStats.invalidCriticalData++
        this.validationStats.details.push({
          rowNumber,
          reason: 'Missing all critical data (no property number, area, or price)'
        })
        console.log(`⚠️ PARSER: Skipping row ${rowNumber} - missing all critical data (property_number, area, price)`)
        continue
      }

      // Row is valid - include it in results
      if (Object.keys(property.raw_data).length > 0) {
        this.validationStats.successfullyParsed++
        results.push(property)
      }
    }

    console.log(`📊 PARSER: Validation summary - Total: ${this.rows.length}, Parsed: ${this.validationStats.successfullyParsed}, Skipped: ${this.validationStats.tooFewColumns + this.validationStats.emptyRows + this.validationStats.soldProperties + this.validationStats.invalidCriticalData}`)
    console.log(`📊 PARSER: Skip reasons - Empty: ${this.validationStats.emptyRows}, Too few columns: ${this.validationStats.tooFewColumns}, Sold: ${this.validationStats.soldProperties}, Invalid data: ${this.validationStats.invalidCriticalData}`)

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
   * Extract developer information from CSV (columns 1-28 in ministerial format)
   * Maps ministerial column names to database developer profile fields
   */
  public extractDeveloperInfo(): DeveloperInfo {
    const developerInfo: DeveloperInfo = {}

    // Define mapping from CSV column names (ministerial format) to DeveloperInfo fields
    // Uses exact column names and normalized variations for fuzzy matching
    const developerFieldMappings: Record<string, string[]> = {
      company_name: [
        'Nazwa dewelopera',
        'nazwa_dewelopera', 'nazwa dewelopera', 'company name', 'nazwa firmy'
      ],
      legal_form: [
        'Forma prawna dewelopera',
        'forma_prawna', 'forma prawna', 'legal form', 'typ spółki'
      ],
      krs_number: [
        'Nr KRS',
        'nr_krs', 'nr krs', 'krs', 'numer krs'
      ],
      ceidg_number: [
        'Nr wpisu do CEiDG',
        'nr_ceidg', 'nr ceidg', 'ceidg', 'numer ceidg'
      ],
      nip: [
        'Nr NIP',
        'nip', 'nr nip', 'numer nip'
      ],
      regon: [
        'Nr REGON',
        'regon', 'nr regon', 'numer regon'
      ],
      phone: [
        'Nr telefonu',
        'telefon', 'tel', 'phone', 'numer telefonu'
      ],
      email: [
        'Adres poczty elektronicznej',
        'email', 'e-mail', 'mail', 'adres email'
      ],
      fax: [
        'Nr faxu',
        'nr_faxu', 'nr faxu', 'fax', 'numer faxu'
      ],
      website: [
        'Adres strony internetowej dewelopera',
        'adres_strony_www', 'adres strony www', 'strona internetowa', 'www'
      ],

      // Headquarters address (columns 9-16)
      headquarters_voivodeship: [
        'Województwo adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
        'wojewodztwo_siedziby', 'województwo siedziby', 'wojewodztwo siedziby'
      ],
      headquarters_county: [
        'Powiat adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
        'Powiat adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera ', // z spacją!
        'powiat_siedziby', 'powiat siedziby'
      ],
      headquarters_municipality: [
        'Gmina adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
        'gmina_siedziby', 'gmina siedziby'
      ],
      headquarters_city: [
        'Miejscowość adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
        'miejscowosc_siedziby', 'miejscowość siedziby', 'miejscowosc siedziby'
      ],
      headquarters_street: [
        'Ulica adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
        'ulica_siedziby', 'ulica siedziby'
      ],
      headquarters_building_number: [
        'Nr nieruchomości adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
        'nr_budynku_siedziby', 'nr budynku siedziby', 'numer budynku siedziby'
      ],
      headquarters_apartment_number: [
        'Nr lokalu adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
        'nr_lokalu_siedziby', 'nr lokalu siedziby', 'numer lokalu siedziby'
      ],
      headquarters_postal_code: [
        'Kod pocztowy adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
        'kod_pocztowy_siedziby', 'kod pocztowy siedziby'
      ],

      // Sales office address (columns 17-24)
      sales_office_voivodeship: [
        'Województwo adresu lokalu, w którym prowadzona jest sprzedaż',
        'wojewodztwo_lokalu_sprzedazy', 'województwo lokalu sprzedaży', 'wojewodztwo lokalu sprzedazy'
      ],
      sales_office_county: [
        'Powiat adresu lokalu, w którym prowadzona jest sprzedaż',
        'powiat_lokalu_sprzedazy', 'powiat lokalu sprzedaży', 'powiat lokalu sprzedazy'
      ],
      sales_office_municipality: [
        'Gmina adresu lokalu, w którym prowadzona jest sprzedaż',
        'gmina_lokalu_sprzedazy', 'gmina lokalu sprzedaży', 'gmina lokalu sprzedazy'
      ],
      sales_office_city: [
        'Miejscowość adresu lokalu, w którym prowadzona jest sprzedaż',
        'miejscowosc_lokalu_sprzedazy', 'miejscowość lokalu sprzedaży', 'miejscowosc lokalu sprzedazy'
      ],
      sales_office_street: [
        'Ulica adresu lokalu, w którym prowadzona jest sprzedaż',
        'ulica_lokalu_sprzedazy', 'ulica lokalu sprzedaży', 'ulica lokalu sprzedazy'
      ],
      sales_office_building_number: [
        'Nr nieruchomości adresu lokalu, w którym prowadzona jest sprzedaż',
        'nr_budynku_lokalu_sprzedazy', 'nr budynku lokalu sprzedaży', 'nr budynku lokalu sprzedazy'
      ],
      sales_office_apartment_number: [
        'Nr lokalu adresu lokalu, w którym prowadzona jest sprzedaż',
        'nr_lokalu_sprzedazy', 'nr lokalu sprzedaży', 'nr lokalu sprzedazy'
      ],
      sales_office_postal_code: [
        'Kod pocztowy adresu lokalu, w którym prowadzona jest sprzedaż',
        'kod_pocztowy_lokalu_sprzedazy', 'kod pocztowy lokalu sprzedaży', 'kod pocztowy lokalu sprzedazy'
      ],

      // Additional info (columns 25-28)
      additional_sales_locations: [
        'Dodatkowe lokalizacje, w których prowadzona jest sprzedaż',
        'dodatkowe_lokalizacje_sprzedazy', 'dodatkowe lokalizacje sprzedaży', 'dodatkowe lokalizacje sprzedazy'
      ],
      contact_method: [
        'Sposób kontaktu nabywcy z deweloperem',
        'sposob_kontaktu', 'sposób kontaktu', 'sposob kontaktu'
      ],
      additional_contact_info: ['dodatkowe_informacje_kontaktowe', 'dodatkowe informacje kontaktowe']
    }

    // If CSV has no rows, return empty
    if (this.rows.length === 0) {
      return developerInfo
    }

    // Extract from FIRST DATA ROW ONLY (since all rows have same company data)
    const firstRow = this.rows[0]

    // Normalize headers for matching
    const normalizedHeaders = this.headers.map(h => this.normalizeString(h))

    // For each developer field, find matching column and extract value
    for (const [devField, csvColumnPatterns] of Object.entries(developerFieldMappings)) {
      for (const pattern of csvColumnPatterns) {
        const normalizedPattern = this.normalizeString(pattern)

        // Find column index by fuzzy matching
        let matchedIndex = -1
        let bestScore = 0

        normalizedHeaders.forEach((header, idx) => {
          const score = this.fuzzyMatch(header, normalizedPattern)
          if (score > 0.6 && score > bestScore) {
            bestScore = score
            matchedIndex = idx
          }
        })

        // If column found, extract value from first row
        if (matchedIndex !== -1 && matchedIndex < firstRow.length) {
          const value = firstRow[matchedIndex]?.trim()

          // Only set if value is non-empty and not already set
          if (value && value.length > 0 && !developerInfo[devField as keyof DeveloperInfo]) {
            (developerInfo as Record<string, string>)[devField] = value
            console.log(`✅ PARSER: Extracted ${devField} = "${value}" (from column ${matchedIndex}: "${this.headers[matchedIndex]}")`)
            break // Stop searching for this field once found
          }
        }
      }
    }

    // BACKWARD COMPATIBILITY: Set legacy fields if not already set
    if (developerInfo.company_name && !developerInfo.developer_name) {
      developerInfo.developer_name = developerInfo.company_name
    }

    console.log(`📋 PARSER: Extracted ${Object.keys(developerInfo).length} developer fields from first row`)

    return developerInfo
  }

  /**
   * Extract project name from filename
   */
  public static extractProjectName(filename: string): string {
    // Remove file extension
    let name = filename
      .replace(/\.csv$/i, '')
      .replace(/\.xlsx$/i, '')
      .replace(/\.xls$/i, '')

    // Remove common prefixes
    name = name
      .replace(/^Ceny-ofertowe-mieszkan-dewelopera-/i, '')
      .replace(/^Wzorcowy_zakres_danych_dotyczących_cen_mieszkań/i, 'Ministerstwo')
      .replace(/^dane-/i, '')
      .replace(/^data-/i, '')
      .replace(/^export-/i, '')
      .replace(/^raport-/i, '')

    // Replace separators with spaces
    name = name
      .replace(/[-_]/g, ' ')
      .trim()

    // If name is empty or too generic (just date or numbers), use date-based default
    if (!name || name.length < 3 || /^\d{4}[-\s]\d{2}[-\s]\d{2}$/.test(name)) {
      const date = new Date().toISOString().split('T')[0]
      name = `Import z ${date}`
    } else {
      // Capitalize first letter of each word
      name = name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }

    return name
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
 * Enhanced validation result with detailed row-level reporting
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  complianceScore: number
  totalRequiredFields: number
  missingCriticalFields: string[]
  rowErrors: RowValidationError[]
  fieldValidation: FieldValidationSummary
}

export interface RowValidationError {
  rowNumber: number
  propertyNumber?: string
  errors: string[]
  warnings: string[]
}

export interface FieldValidationSummary {
  totalFields: number
  validFields: number
  missingRequired: string[]
  missingRecommended: string[]
  invalidFormats: { field: string, count: number, examples: string[] }[]
}

/**
 * Validate parsed data against Ministry Schema 1.13 requirements (58 fields)
 * Enhanced with detailed field-level and row-level validation (Task #81.2)
 */
export function validateMinistryCompliance(data: ParsedProperty[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const missingCriticalFields: string[] = []
  const rowErrors: RowValidationError[] = []

  // TASK #84.2: Fix edge case - empty data array should return totalRows: 0
  if (data.length === 0) {
    errors.push('Brak danych nieruchomości do przetworzenia')
    return {
      valid: false,
      errors,
      warnings,
      complianceScore: 0,
      totalRequiredFields: 58,
      totalRows: 0, // FIXED: Add totalRows for empty data
      missingCriticalFields: ['property_data'],
      rowErrors: [],
      fieldValidation: {
        totalFields: 0,
        validFields: 0,
        missingRequired: ['property_data'],
        missingRecommended: [],
        invalidFormats: []
      }
    }
  }

  // MINISTRY CRITICAL FIELDS (MUST HAVE for Schema 1.13 compliance)
  const criticalFields: Record<string, { rawDataKey?: string, type: 'string' | 'number' | 'date' }> = {
    property_number: { rawDataKey: 'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera', type: 'string' },
    total_price: { rawDataKey: 'Cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]', type: 'number' },
    area: { type: 'number' }, // Calculated field
    price_per_m2: { rawDataKey: 'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]', type: 'number' },
    wojewodztwo: { rawDataKey: 'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', type: 'string' },
    powiat: { rawDataKey: 'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', type: 'string' },
    gmina: { rawDataKey: 'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', type: 'string' }
  }

  // MINISTRY RECOMMENDED FIELDS (SHOULD HAVE for better compliance)
  const recommendedFields: Record<string, { rawDataKey?: string, type: 'string' | 'number' | 'date' }> = {
    property_type: { rawDataKey: 'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny', type: 'string' },
    miejscowosc: { rawDataKey: 'Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', type: 'string' },
    ulica: { rawDataKey: 'Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', type: 'string' },
    kod_pocztowy: { rawDataKey: 'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', type: 'string' },
    liczba_pokoi: { rawDataKey: 'Liczba pokoi', type: 'number' },
    kondygnacja: { rawDataKey: 'Numer kondygnacji', type: 'number' },
    construction_year: { rawDataKey: 'Rok budowy', type: 'number' },
    energy_class: { rawDataKey: 'Klasa energetyczna', type: 'string' },
    data_pierwszej_oferty: { rawDataKey: 'Data pierwszej oferty', type: 'date' },
    developer_name: { rawDataKey: 'Nazwa dewelopera', type: 'string' }
  }

  let complianceScore = 0
  const totalRequiredFields = 58
  const invalidFormats: { field: string, count: number, examples: string[] }[] = []

  // GLOBAL FIELD CHECKS: Check if fields exist across dataset
  const globalMissingRequired: string[] = []
  const globalMissingRecommended: string[] = []

  for (const [fieldName, config] of Object.entries(criticalFields)) {
    const hasField = data.some(item => {
      const value = item[fieldName as keyof ParsedProperty]
      return value !== undefined && value !== null && value !== ''
    })

    if (hasField) {
      complianceScore += 3 // Critical fields worth more points
    } else {
      const displayName = config.rawDataKey || fieldName
      errors.push(`KRYTYCZNE: Brak wymaganego pola '${displayName}' we wszystkich wierszach`)
      missingCriticalFields.push(fieldName)
      globalMissingRequired.push(displayName)
    }
  }

  for (const [fieldName, config] of Object.entries(recommendedFields)) {
    const hasField = data.some(item => {
      const value = item[fieldName as keyof ParsedProperty]
      return value !== undefined && value !== null && value !== ''
    })

    if (hasField) {
      complianceScore += 2
    } else {
      const displayName = config.rawDataKey || fieldName
      warnings.push(`Zalecane: Brak pola '${displayName}'`)
      globalMissingRecommended.push(displayName)
    }
  }

  // ROW-LEVEL VALIDATION: Validate each property individually
  data.forEach((property, index) => {
    const rowNumber = index + 2 // +2 for header and 1-based indexing
    const rowErrs: string[] = []
    const rowWarns: string[] = []

    // VALIDATION 1: Property Number (REQUIRED)
    if (!property.property_number || property.property_number.trim() === '') {
      rowErrs.push('Brak numeru lokalu (pole wymagane)')
    }

    // VALIDATION 2: Price Validation (REQUIRED)
    if (!property.price_per_m2 || property.price_per_m2 <= 0) {
      rowErrs.push('Brak lub nieprawidłowa cena za m² (musi być > 0)')
    } else if (property.price_per_m2 < 1000) {
      rowWarns.push(`Niska cena za m²: ${property.price_per_m2} zł (może być błąd?)`)
    } else if (property.price_per_m2 > 50000) {
      rowWarns.push(`Bardzo wysoka cena za m²: ${property.price_per_m2} zł (może być błąd?)`)
    }

    if (!property.total_price || property.total_price <= 0) {
      rowErrs.push('Brak lub nieprawidłowa cena całkowita (musi być > 0)')
    }

    // VALIDATION 3: Area Validation (REQUIRED - calculated from price/m² × price)
    if (!property.area || property.area <= 0) {
      rowErrs.push('Brak lub nieprawidłowa powierzchnia (musi być > 0)')
    } else if (property.area < 10) {
      rowWarns.push(`Bardzo mała powierzchnia: ${property.area} m² (może być błąd?)`)
    } else if (property.area > 500) {
      rowWarns.push(`Bardzo duża powierzchnia: ${property.area} m² (może być błąd?)`)
    }

    // VALIDATION 4: Price Consistency Check
    if (property.total_price && property.price_per_m2 && property.area) {
      const calculatedPrice = Math.round(property.price_per_m2 * property.area)
      const priceDiff = Math.abs(calculatedPrice - property.total_price)
      const percentDiff = (priceDiff / property.total_price) * 100

      if (percentDiff > 5) { // More than 5% difference
        rowWarns.push(`Niezgodność cen: cena całkowita (${property.total_price} zł) nie odpowiada iloczynowi ceny za m² × powierzchnia (${calculatedPrice} zł, różnica: ${percentDiff.toFixed(1)}%)`)
      }
    }

    // VALIDATION 5: Location Fields (REQUIRED by Ministry)
    const wojewodztwo = property.raw_data?.['Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'] as string
    const powiat = property.raw_data?.['Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'] as string
    const gmina = property.raw_data?.['Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'] as string

    if (!wojewodztwo || wojewodztwo.trim() === '') {
      rowErrs.push('Brak województwa (pole wymagane)')
    }
    if (!powiat || powiat.trim() === '') {
      rowErrs.push('Brak powiatu (pole wymagane)')
    }
    if (!gmina || gmina.trim() === '') {
      rowErrs.push('Brak gminy (pole wymagane)')
    }

    // VALIDATION 6: Postal Code Format (if present)
    const kodPocztowy = property.raw_data?.['Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'] as string
    if (kodPocztowy && !/^\d{2}-\d{3}$/.test(kodPocztowy)) {
      rowWarns.push(`Nieprawidłowy format kodu pocztowego: "${kodPocztowy}" (powinien być XX-XXX)`)
    }

    // VALIDATION 7: Developer Information (REQUIRED by Ministry)
    const developerName = property.raw_data?.['Nazwa dewelopera'] as string
    const nip = property.raw_data?.['Nr NIP'] as string

    if (!developerName || developerName.trim() === '') {
      rowErrs.push('Brak nazwy dewelopera (pole wymagane)')
    }
    if (!nip || nip.trim() === '') {
      rowErrs.push('Brak numeru NIP dewelopera (pole wymagane)')
    } else if (!/^\d{10}$/.test(nip.replace(/[-\s]/g, ''))) {
      rowWarns.push(`Nieprawidłowy format NIP: "${nip}" (powinien być 10 cyfr)`)
    }

    // VALIDATION 8: Date Format Validation (if present)
    const dataOferty = property.raw_data?.['Data pierwszej oferty'] as string
    if (dataOferty && dataOferty.trim() !== '') {
      // Check YYYY-MM-DD format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dataOferty)) {
        rowWarns.push(`Nieprawidłowy format daty pierwszej oferty: "${dataOferty}" (powinien być YYYY-MM-DD)`)
      } else {
        // Validate date is not in future
        const offerDate = new Date(dataOferty)
        const today = new Date()
        if (offerDate > today) {
          rowWarns.push(`Data pierwszej oferty jest w przyszłości: ${dataOferty}`)
        }
      }
    }

    // VALIDATION 9: Property Type (RECOMMENDED)
    const propertyType = property.raw_data?.['Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny'] as string
    if (!propertyType || propertyType.trim() === '') {
      rowWarns.push('Brak rodzaju nieruchomości (pole zalecane)')
    }

    // VALIDATION 10: Rooms Count (RECOMMENDED, if present should be valid)
    if (property.liczba_pokoi !== undefined && property.liczba_pokoi !== null) {
      if (property.liczba_pokoi <= 0 || property.liczba_pokoi > 20) {
        rowWarns.push(`Nieprawidłowa liczba pokoi: ${property.liczba_pokoi} (powinna być 1-20)`)
      }
    }

    // VALIDATION 11: Construction Year (RECOMMENDED, if present should be valid)
    if (property.construction_year !== undefined && property.construction_year !== null) {
      const currentYear = new Date().getFullYear()
      if (property.construction_year < 1900 || property.construction_year > currentYear + 5) {
        rowWarns.push(`Nieprawidłowy rok budowy: ${property.construction_year} (powinien być ${1900}-${currentYear + 5})`)
      }
    }

    // Add row to errors list if any issues found
    if (rowErrs.length > 0 || rowWarns.length > 0) {
      rowErrors.push({
        rowNumber,
        propertyNumber: property.property_number || 'Brak numeru',
        errors: rowErrs,
        warnings: rowWarns
      })
    }
  })

  // AGGREGATED DATA QUALITY CHECKS
  const withoutNumbers = data.filter(item => !item.property_number || item.property_number.trim() === '').length
  if (withoutNumbers > 0) {
    errors.push(`${withoutNumbers} mieszkań bez numeru lokalu (${Math.round(withoutNumbers/data.length*100)}%)`)
  }

  const withoutPrices = data.filter(item => !item.total_price || !item.price_per_m2).length
  if (withoutPrices > 0) {
    errors.push(`${withoutPrices} mieszkań bez kompletnych danych cenowych`)
  }

  const withoutLocation = data.filter(item => {
    const wojewodztwo = item.raw_data?.['Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego']
    const powiat = item.raw_data?.['Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego']
    const gmina = item.raw_data?.['Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego']
    return !wojewodztwo || !powiat || !gmina
  }).length
  if (withoutLocation > 0) {
    errors.push(`${withoutLocation} mieszkań bez wymaganych danych lokalizacji (województwo/powiat/gmina)`)
  }

  // FORMAT VALIDATION SUMMARY
  const invalidPostalCodes = data.filter(item => {
    const kod = item.raw_data?.['Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'] as string
    return kod && !/^\d{2}-\d{3}$/.test(kod)
  })
  if (invalidPostalCodes.length > 0) {
    invalidFormats.push({
      field: 'Kod pocztowy',
      count: invalidPostalCodes.length,
      examples: invalidPostalCodes.slice(0, 3).map(p => p.raw_data?.['Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'] as string)
    })
  }

  const invalidNIPs = data.filter(item => {
    const nip = item.raw_data?.['Nr NIP'] as string
    return nip && !/^\d{10}$/.test(nip.replace(/[-\s]/g, ''))
  })
  if (invalidNIPs.length > 0) {
    invalidFormats.push({
      field: 'NIP',
      count: invalidNIPs.length,
      examples: invalidNIPs.slice(0, 3).map(p => p.raw_data?.['Nr NIP'] as string)
    })
  }

  // Calculate percentage compliance
  const maxScore = (Object.keys(criticalFields).length * 3) + (Object.keys(recommendedFields).length * 2)
  const compliancePercentage = Math.round((complianceScore / maxScore) * 100)

  // Ministry compliance threshold: 77% (45/58 fields)
  const hasBlockingErrors = errors.length > 0 || rowErrors.some(r => r.errors.length > 0)
  const isCompliant = !hasBlockingErrors && compliancePercentage >= 77

  if (!isCompliant && !hasBlockingErrors) {
    warnings.push(`Zgodność Ministerstwa: ${compliancePercentage}% (wymagane: 77%)`)
  }

  // Field validation summary
  const validFields = data.length > 0 ? Object.keys(criticalFields).filter(field =>
    data.some(item => item[field as keyof ParsedProperty])
  ).length + Object.keys(recommendedFields).filter(field =>
    data.some(item => item[field as keyof ParsedProperty])
  ).length : 0

  const fieldValidation: FieldValidationSummary = {
    totalFields: Object.keys(criticalFields).length + Object.keys(recommendedFields).length,
    validFields,
    missingRequired: globalMissingRequired,
    missingRecommended: globalMissingRecommended,
    invalidFormats
  }

  return {
    valid: isCompliant,
    errors,
    warnings,
    complianceScore: compliancePercentage,
    totalRequiredFields,
    missingCriticalFields,
    rowErrors,
    fieldValidation
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