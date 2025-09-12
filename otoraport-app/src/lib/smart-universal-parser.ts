// Universal file parser supporting CSV, Excel (.xlsx), and future formats
import * as XLSX from 'xlsx'

interface ColumnMapping {
  property_number: string[]
  property_type: string[]
  price_per_m2: string[]
  total_price: string[]
  final_price: string[]
  area: string[]
  parking_space: string[]
  parking_price: string[]
  status: string[]
  developer_name: string[]
  company_name: string[]
  nip: string[]
  phone: string[]
  email: string[]
  investment_name: string[]
  investment_address: string[]
  investment_city: string[]
}

// Enhanced Polish real estate field variations
const COLUMN_PATTERNS: ColumnMapping = {
  property_number: [
    'nr lokalu', 'numer lokalu', 'nr mieszkania', 'numer mieszkania', 
    'lokal', 'mieszkanie', 'nr', 'property_number', 'apartment_number',
    'nr_lokalu', 'numer_lokalu', 'mieszkanie_nr', 'lok', 'l.p.'
  ],
  property_type: [
    'typ', 'typ lokalu', 'typ mieszkania', 'rodzaj', 'property_type',
    'type', 'kategoria', 'typ_lokalu', 'rodzaj_lokalu', 'rodzaj nieruchomości'
  ],
  price_per_m2: [
    'cena za m²', 'cena za m2', 'cena m2', 'cena m²', 'cena/m2', 'cena/m²',
    'price_per_m2', 'price_per_sqm', 'cena_za_m2', 'cena_m2', 'cena za metr',
    'cena jednostkowa', 'cena za metr kwadratowy'
  ],
  total_price: [
    'cena całkowita', 'cena', 'cena brutto', 'cena bazowa', 'total_price',
    'price', 'cena_calkowita', 'cena_bazowa', 'cena_brutto', 'wartość'
  ],
  final_price: [
    'cena finalna', 'cena końcowa', 'cena ostateczna', 'final_price',
    'cena_finalna', 'cena_koncowa', 'cena_ostateczna', 'cena sprzedaży'
  ],
  area: [
    'powierzchnia', 'powierzchnia użytkowa', 'powierzchnia m²', 'powierzchnia m2',
    'area', 'size', 'metraż', 'pow', 'powierzchnia_uzytkowa', 'm2', 'm²',
    'pow. użytkowa', 'pow użytkowa'
  ],
  parking_space: [
    'parking', 'miejsce parkingowe', 'garaż', 'parking space', 'parking_space',
    'miejsce_parkingowe', 'mp', 'parking_spot', 'garage', 'miejsce postojowe'
  ],
  parking_price: [
    'cena parkingu', 'cena garażu', 'parking price', 'parking_price',
    'cena_parkingu', 'cena_garazu', 'parking_cost', 'koszt parkingu'
  ],
  status: [
    'status', 'dostępność', 'stan', 'availability', 'dostepnosc',
    'stan_sprzedaży', 'stan_sprzedazy', 'dostępny'
  ],
  developer_name: [
    'deweloper', 'nazwa dewelopera', 'developer', 'developer_name',
    'firma', 'nazwa_dewelopera', 'inwestor'
  ],
  company_name: [
    'nazwa firmy', 'company', 'company_name', 'nazwa_firmy',
    'firma', 'spółka', 'spolka', 'nazwa spółki'
  ],
  nip: [
    'nip', 'nr nip', 'numer nip', 'tax_id', 'vat_id', 'nr_nip',
    'numer NIP', 'NIP'
  ],
  phone: [
    'telefon', 'tel', 'phone', 'numer telefonu', 'kontakt',
    'tel.', 'telefon_kontaktowy', 'numer_telefonu', 'tel kontaktowy'
  ],
  email: [
    'email', 'e-mail', 'mail', 'adres email', 'contact_email',
    'email_kontaktowy', 'adres_email', 'e-mail kontaktowy'
  ],
  investment_name: [
    'inwestycja', 'nazwa inwestycji', 'project', 'investment',
    'investment_name', 'projekt', 'nazwa_inwestycji', 'osiedle',
    'nazwa osiedla', 'budynek'
  ],
  investment_address: [
    'adres', 'ulica', 'adres inwestycji', 'address', 'street',
    'investment_address', 'adres_inwestycji', 'lokalizacja', 'położenie'
  ],
  investment_city: [
    'miasto', 'miejscowość', 'city', 'town', 'gmina',
    'miejscowosc', 'investment_city', 'powiat'
  ]
}

export interface UniversalParseResult {
  success: boolean
  data: ParsedProperty[]
  mappings: { [key: string]: string }
  errors: string[]
  suggestions: { [key: string]: string[] }
  confidence: number
  totalRows: number
  validRows: number
  fileInfo: {
    type: 'csv' | 'excel' | 'unknown'
    sheets?: string[]
    selectedSheet?: string
    encoding?: string
  }
}

export interface ParsedProperty {
  property_number?: string
  property_type?: string
  price_per_m2?: number
  total_price?: number
  final_price?: number
  area?: number
  parking_space?: string
  parking_price?: number
  status?: string
  // Multi-project support
  project_name?: string
  project_address?: string
  project_city?: string
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
 * Universal parser supporting CSV, Excel, and future formats
 */
export class UniversalFileParser {
  private fileBuffer: ArrayBuffer | null = null
  private csvContent: string | null = null
  private workbook: XLSX.WorkBook | null = null
  private headers: string[] = []
  private rows: any[][] = []
  private mappings: { [key: string]: string } = {}
  private confidence: number = 0
  private fileInfo: UniversalParseResult['fileInfo']

  constructor(file: File | ArrayBuffer | string, fileName?: string) {
    this.fileInfo = { type: 'unknown' }
    
    if (typeof file === 'string') {
      // CSV content
      this.csvContent = file
      this.fileInfo.type = 'csv'
      this.parseCSV()
    } else if (file instanceof ArrayBuffer) {
      // Excel file
      this.fileBuffer = file
      this.fileInfo.type = 'excel'
      this.parseExcel()
    } else if (file instanceof File) {
      // Auto-detect file type
      if (file.name.endsWith('.csv')) {
        file.text().then(content => {
          this.csvContent = content
          this.fileInfo.type = 'csv'
          this.parseCSV()
        })
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        file.arrayBuffer().then(buffer => {
          this.fileBuffer = buffer
          this.fileInfo.type = 'excel'
          this.parseExcel()
        })
      }
    }
  }

  /**
   * Static factory method for async file parsing
   */
  static async fromFile(file: File): Promise<UniversalFileParser> {
    const parser = new UniversalFileParser('', file.name)
    
    if (file.name.endsWith('.csv')) {
      const content = await file.text()
      parser.csvContent = content
      parser.fileInfo.type = 'csv'
      parser.parseCSV()
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer()
      parser.fileBuffer = buffer
      parser.fileInfo.type = 'excel'
      parser.parseExcel()
    }
    
    return parser
  }

  private parseCSV() {
    if (!this.csvContent) return

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

  private parseExcel(sheetName?: string) {
    if (!this.fileBuffer) return

    try {
      // Parse Excel file
      this.workbook = XLSX.read(this.fileBuffer, { 
        type: 'array',
        cellText: false,
        cellDates: true
      })

      // Get sheet names
      this.fileInfo.sheets = this.workbook.SheetNames
      
      // Select sheet (first sheet or specified)
      const selectedSheet = sheetName || this.workbook.SheetNames[0]
      this.fileInfo.selectedSheet = selectedSheet

      const worksheet = this.workbook.Sheets[selectedSheet]
      
      // Convert to array of arrays
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false
      })

      if (rawData.length === 0) {
        throw new Error('Arkusz Excel jest pusty')
      }

      // Extract headers and data
      this.headers = rawData[0].map(cell => String(cell || '').trim())
      this.rows = rawData.slice(1).map(row => 
        row.map(cell => {
          // Handle different cell types
          if (cell instanceof Date) {
            return cell.toISOString().split('T')[0]
          }
          return String(cell || '').trim()
        })
      )

    } catch (error) {
      throw new Error(`Błąd parsowania pliku Excel: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private parseCSVLine(line: string): string[] {
    // Enhanced CSV parser with better quote handling
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    // Auto-detect separator (semicolon is common in Polish CSVs)
    const separator = line.includes(';') ? ';' : ','

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i += 2
          continue
        } else {
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
   * Intelligent column mapping with multi-project support
   */
  public analyzeColumns(): UniversalParseResult {
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
      validRows: data.filter(row => row.property_number).length,
      fileInfo: this.fileInfo
    }
  }

  /**
   * Parse data with multi-project support
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

      // Map known fields with multi-project support
      for (const [fieldName, headerName] of Object.entries(this.mappings)) {
        const headerIndex = this.headers.indexOf(headerName)
        if (headerIndex !== -1 && headerIndex < row.length) {
          const value = row[headerIndex]?.toString()?.trim()
          
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
              
              // Multi-project fields
              case 'investment_name':
                property.project_name = value
                break
              case 'investment_address':
                property.project_address = value
                break
              case 'investment_city':
                property.project_city = value
                break
              
              default:
                // String fields
                ;(property as any)[fieldName] = value
            }
          }
        }
      }

      // Only include rows with at least property number
      if (property.property_number || Object.keys(property.raw_data).length > 0) {
        results.push(property)
      }
    }

    return results
  }

  /**
   * Enhanced number parsing for Polish formats
   */
  private parseNumber(value: string): number | null {
    if (!value) return null

    // Handle Polish number format (spaces as thousands separator, comma as decimal)
    let cleaned = value
      .replace(/[^\d,.\-\s]/g, '') // Remove everything except digits, comma, dot, dash, spaces
      .trim()

    // Handle different formats
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Both comma and dot - assume comma is thousands separator
      cleaned = cleaned.replace(/,/g, '').replace('.', '.')
    } else if (cleaned.includes(',')) {
      // Check if comma is decimal separator or thousands separator
      const commaIndex = cleaned.lastIndexOf(',')
      const afterComma = cleaned.substring(commaIndex + 1)
      
      if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) {
        // Likely decimal separator
        cleaned = cleaned.replace(',', '.')
      } else {
        // Likely thousands separator
        cleaned = cleaned.replace(/,/g, '')
      }
    }
    
    // Remove spaces used as thousands separators
    cleaned = cleaned.replace(/\s+/g, '')

    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }

  /**
   * Get available Excel sheets for sheet selection
   */
  public getAvailableSheets(): string[] {
    return this.fileInfo.sheets || []
  }

  /**
   * Switch to different Excel sheet
   */
  public switchSheet(sheetName: string): boolean {
    if (this.fileInfo.type === 'excel' && this.fileBuffer && this.fileInfo.sheets?.includes(sheetName)) {
      this.parseExcel(sheetName)
      return true
    }
    return false
  }

  // ... (keep existing fuzzy matching methods)
  private fuzzyMatch(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    if (str1.includes(str2) || str2.includes(str1)) return 0.9
    
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
   * Extract developer and project information
   */
  public extractDeveloperInfo(): DeveloperInfo {
    const developerInfo: DeveloperInfo = {}

    // Look for developer info in first few rows or in consistent fields
    for (const row of this.rows.slice(0, 10)) {
      for (const [fieldName, headerName] of Object.entries(this.mappings)) {
        const headerIndex = this.headers.indexOf(headerName)
        if (headerIndex !== -1 && headerIndex < row.length) {
          const value = row[headerIndex]?.toString()?.trim()
          
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
 * Main entry point for universal file parsing
 */
export async function parseFileSmart(file: File): Promise<UniversalParseResult> {
  try {
    const parser = await UniversalFileParser.fromFile(file)
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
      validRows: 0,
      fileInfo: { type: 'unknown' }
    }
  }
}

/**
 * Legacy CSV support
 */
export function parseCSVSmart(csvContent: string): UniversalParseResult {
  try {
    const parser = new UniversalFileParser(csvContent)
    const result = parser.analyzeColumns()
    result.fileInfo.type = 'csv'
    return result
  } catch (error) {
    return {
      success: false,
      data: [],
      mappings: {},
      errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
      suggestions: {},
      confidence: 0,
      totalRows: 0,
      validRows: 0,
      fileInfo: { type: 'csv' }
    }
  }
}

/**
 * Validate parsed data against ministry requirements
 */
export function validateMinistryCompliance(data: ParsedProperty[]): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (data.length === 0) {
    errors.push('Brak danych nieruchomości do przetworzenia')
    return { valid: false, errors, warnings }
  }

  // Check required fields
  const requiredFields = ['property_number', 'total_price', 'area']
  const missingFields = requiredFields.filter(field => 
    !data.some(item => item[field as keyof ParsedProperty])
  )

  if (missingFields.length > 0) {
    errors.push(`Brakujące wymagane pola: ${missingFields.join(', ')}`)
  }

  // Check data quality
  const withoutNumbers = data.filter(item => !item.property_number).length
  if (withoutNumbers > data.length * 0.1) {
    warnings.push(`${withoutNumbers} mieszkań bez numeru lokalu`)
  }

  const withoutPrices = data.filter(item => !item.total_price).length
  if (withoutPrices > 0) {
    warnings.push(`${withoutPrices} mieszkań bez ceny`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}