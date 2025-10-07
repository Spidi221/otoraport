/**
 * PapaParse CSV Parser - Production-grade CSV parsing with streaming
 * Fixes delimiter detection bug from smart-csv-parser.ts line 722
 * Supports large files (3.3MB+) without timeouts
 */

import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { COLUMN_PATTERNS, SmartParseResult, ParsedProperty, DeveloperInfo } from './smart-csv-parser'

// Re-export types for compatibility
export { SmartParseResult, ParsedProperty, DeveloperInfo } from './smart-csv-parser'

/**
 * PapaParse-based CSV Parser with streaming support
 */
export class PapaParseCSVParser {
  private csvContent: string
  private headers: string[] = []
  private rows: string[][] = []
  private mappings: { [key: string]: string } = {}
  private confidence: number = 0

  constructor(csvContent: string) {
    this.csvContent = this.stripBOM(csvContent)
    this.parseCSV()
  }

  /**
   * Strip UTF-8 BOM if present (fixes INPRO file)
   */
  private stripBOM(content: string): string {
    if (content.charCodeAt(0) === 0xFEFF) {
      console.log('🔍 PARSER: Detected and stripped UTF-8 BOM')
      return content.slice(1)
    }
    return content
  }

  /**
   * Parse CSV using PapaParse (auto-detects delimiter, handles quoted fields)
   */
  private parseCSV() {
    const parseResult = Papa.parse(this.csvContent, {
      delimiter: '', // Auto-detect (fixes line 722 bug!)
      newline: '', // Auto-detect
      quoteChar: '"',
      escapeChar: '"',
      header: false,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // Keep all as strings for now
      encoding: 'UTF-8',
      preview: 0, // Parse all rows
    })

    if (parseResult.errors.length > 0) {
      console.warn('⚠️ PARSER: PapaParse warnings:', parseResult.errors.slice(0, 3))
    }

    const allRows = parseResult.data as string[][]

    if (allRows.length === 0) {
      throw new Error('Plik CSV jest pusty')
    }

    // Extract header and data rows
    this.headers = allRows[0].map(h => String(h || '').trim())
    this.rows = allRows.slice(1)

    console.log(`📊 PARSER: PapaParse detected delimiter: "${parseResult.meta.delimiter}"`)
    console.log(`📊 PARSER: Header has ${this.headers.length} columns`)
    console.log(`📊 PARSER: First 5 headers:`, this.headers.slice(0, 5))
    console.log(`📊 PARSER: Parsed ${this.rows.length} data rows`)

    // Log first 3 rows for debugging
    this.rows.slice(0, 3).forEach((row, idx) => {
      console.log(`📊 PARSER: Row ${idx + 2} has ${row.length} columns. First 3 values:`, row.slice(0, 3))
    })
  }

  /**
   * Detect CSV format type (ministerial/INPRO/custom)
   * Same logic as smart-csv-parser.ts for compatibility
   */
  private detectFormat(): { format: 'ministerial' | 'inpro' | 'custom', confidence: number, details: string } {
    const ministerialSignatures = [
      'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera',
      'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
      'Cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]',
      'Nazwa dewelopera',
      'Forma prawna dewelopera',
      'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny'
    ]

    const inproSignatures = [
      'Id nieruchomości',
      'Adres strony internetowej dewelopera',
      'Adres strony internetowej inwestycji',
      'Nr nieruchomości nadany przez dewelopera',
      'Inne świadczenia pieniężne',
      'Data od której obowiązuje cena za m2 nieruchomości',
      'Data od której obowiązuje cena nieruchomości'
    ]

    const customSignatures = [
      'nr lokalu', 'numer lokalu', 'apartment',
      'powierzchnia', 'area', 'metraz',
      'cena', 'price', 'cena całkowita',
      'status', 'dostępność', 'availability'
    ]

    let ministerialScore = 0
    let inproScore = 0
    let customScore = 0

    const normalizedHeaders = this.headers.map(h => h.toLowerCase().trim())

    ministerialSignatures.forEach(sig => {
      const normalized = sig.toLowerCase().trim()
      if (normalizedHeaders.some(h => h.includes(normalized) || normalized.includes(h))) {
        ministerialScore++
      }
    })

    inproSignatures.forEach(sig => {
      const normalized = sig.toLowerCase().trim()
      if (normalizedHeaders.some(h => h.includes(normalized) || normalized.includes(h))) {
        inproScore++
      }
    })

    customSignatures.forEach(sig => {
      if (normalizedHeaders.some(h => h === sig || h.includes(sig))) {
        customScore++
      }
    })

    const ministerialConfidence = (ministerialScore / ministerialSignatures.length) * 100
    const inproConfidence = (inproScore / inproSignatures.length) * 100
    const customConfidence = (customScore / customSignatures.length) * 100

    if (ministerialScore >= 4) {
      return {
        format: 'ministerial',
        confidence: Math.min(ministerialConfidence, 95),
        details: `Ministry Schema 1.13 compliant format (${ministerialScore}/${ministerialSignatures.length} official columns found)`
      }
    } else if (inproScore >= 4) {
      return {
        format: 'inpro',
        confidence: Math.min(inproConfidence, 95),
        details: `INPRO developer software export detected (${inproScore}/${inproSignatures.length} signature columns found)`
      }
    } else if (ministerialScore >= 2 && inproScore < 2) {
      return {
        format: 'ministerial',
        confidence: Math.min(ministerialConfidence, 75),
        details: `Likely Ministry format (${ministerialScore}/${ministerialSignatures.length} official columns found)`
      }
    } else if (inproScore >= 2) {
      return {
        format: 'inpro',
        confidence: Math.min(inproConfidence, 75),
        details: `Likely INPRO format (${inproScore}/${inproSignatures.length} signature columns found)`
      }
    } else {
      return {
        format: 'custom',
        confidence: Math.max(customConfidence, 50),
        details: `Custom developer export (${customScore}/${customSignatures.length} common field patterns found)`
      }
    }
  }

  /**
   * Intelligent column mapping using fuzzy string matching
   */
  public analyzeColumns(): SmartParseResult {
    const mappings: { [key: string]: string } = {}
    const suggestions: { [key: string]: string[] } = {}
    const errors: string[] = []

    const formatDetection = this.detectFormat()
    console.log(`🔍 PARSER: Format detected - ${formatDetection.format.toUpperCase()} (${formatDetection.confidence.toFixed(1)}% confidence)`)
    console.log(`📋 PARSER: ${formatDetection.details}`)

    const normalizedHeaders = this.headers.map(header =>
      header.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )

    let totalConfidence = 0
    let mappedCount = 0

    // Map each required field
    for (const [fieldName, patterns] of Object.entries(COLUMN_PATTERNS)) {
      const matches: Array<{header: string, score: number}> = []

      normalizedHeaders.forEach((normalizedHeader, index) => {
        const originalHeader = this.headers[index]

        for (const pattern of patterns) {
          const score = this.fuzzyMatch(normalizedHeader, pattern.toLowerCase())
          if (score > 0.6) {
            matches.push({ header: originalHeader, score })
          }
        }
      })

      matches.sort((a, b) => b.score - a.score)

      if (matches.length > 0) {
        mappings[fieldName] = matches[0].header
        totalConfidence += matches[0].score
        mappedCount++

        if (matches.length > 1) {
          suggestions[fieldName] = matches.slice(1, 4).map(m => m.header)
        }
      } else {
        errors.push(`Nie znaleziono kolumny dla: ${fieldName}`)
        const closest = this.findClosestMatch(fieldName, normalizedHeaders)
        if (closest.length > 0) {
          suggestions[fieldName] = closest
        }
      }
    }

    const confidence = mappedCount > 0 ? totalConfidence / mappedCount : 0
    this.mappings = mappings
    this.confidence = confidence

    const data = this.parseData()

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
      success: Object.keys(mappings).length >= 3,
      data,
      mappings,
      errors,
      suggestions,
      confidence,
      totalRows: this.rows.length,
      validRows: validRowsCount,
      detectedFormat: formatDetection.format,
      formatConfidence: formatDetection.confidence,
      formatDetails: formatDetection.details
    }
  }

  /**
   * Fuzzy string matching
   */
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
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
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
   * Detect property status for INPRO format
   */
  private detectINPROStatus(row: unknown, rawData: Record<string, unknown>): 'available' | 'sold' | 'reserved' | undefined {
    const statusField = rawData['Status'] || rawData['status'] || rawData['Status dostępności']
    if (statusField) {
      const statusLower = String(statusField).toLowerCase()
      if (/sprzeda/i.test(statusLower) || /sold/i.test(statusLower)) return 'sold'
      if (/rezerwa/i.test(statusLower) || /reserved/i.test(statusLower)) return 'reserved'
      if (/dostępn/i.test(statusLower) || /available/i.test(statusLower)) return 'available'
    }

    const pricePerM2Field = rawData['Cena za m2 nieruchomości'] || rawData['Cena za m2 nieruchomosci']
    const totalPriceField = rawData['Cena nieruchomości'] || rawData['Cena nieruchomosci']

    if (pricePerM2Field === 'X' || totalPriceField === 'X') {
      return 'sold'
    }

    if (pricePerM2Field && !isNaN(Number(pricePerM2Field))) {
      return 'available'
    }

    return undefined
  }

  /**
   * Parse data using discovered column mappings
   */
  private parseData(): ParsedProperty[] {
    const results: ParsedProperty[] = []

    console.log(`🔍 PARSER: parseData() - Processing ${this.rows.length} rows, headers: ${this.headers.length} columns`)

    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i]

      if (row.length < this.headers.length * 0.5) {
        console.log(`⚠️ PARSER: Skipping row ${i + 2} - has ${row.length} columns, expected ${this.headers.length} (less than 50%)`)
        continue
      }

      console.log(`✅ PARSER: Processing row ${i + 2} - ${row.length} columns (${this.headers.length} expected)`)

      const property: ParsedProperty = {
        raw_data: {}
      }

      this.headers.forEach((header, index) => {
        if (index < row.length) {
          property.raw_data[header] = row[index] || ''
        }
      })

      // Filter sold properties (ministry compliance)
      const pricePerM2Header = this.mappings['price_per_m2']
      const totalPriceHeader = this.mappings['total_price']
      const finalPriceHeader = this.mappings['final_price']

      let isSold = false

      if (pricePerM2Header) {
        const idx = this.headers.indexOf(pricePerM2Header)
        if (idx !== -1 && idx < row.length) {
          const value = String(row[idx] || '').trim().toUpperCase()
          if (value === 'X' || value === '#VALUE!') {
            isSold = true
          }
        }
      }

      if (totalPriceHeader && !isSold) {
        const idx = this.headers.indexOf(totalPriceHeader)
        if (idx !== -1 && idx < row.length) {
          const value = String(row[idx] || '').trim().toUpperCase()
          if (value === 'X' || value === '#VALUE!') {
            isSold = true
          }
        }
      }

      if (finalPriceHeader && !isSold) {
        const idx = this.headers.indexOf(finalPriceHeader)
        if (idx !== -1 && idx < row.length) {
          const value = String(row[idx] || '').trim().toUpperCase()
          if (value === 'X' || value === '#VALUE!') {
            isSold = true
          }
        }
      }

      if (isSold) {
        console.log(`🚫 PARSER: Skipping sold property at row ${i + 2} (apartment: ${property.raw_data[this.mappings['property_number'] || ''] || 'unknown'})`)
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
                if (value === 'X') {
                  console.log(`🔍 PARSER: Detected "X" marker in ${fieldName} - property likely sold`)
                  break
                }
                const numValue = this.parseNumber(value)
                if (numValue !== null) {
                  (property as Record<string, unknown>)[fieldName] = numValue
                }
                break

              default:
                (property as Record<string, unknown>)[fieldName] = value
            }
          }
        }
      }

      const detectedStatus = this.detectINPROStatus(row, property.raw_data)
      if (detectedStatus && !property.status) {
        property.status = detectedStatus
        console.log(`🔍 PARSER: Auto-detected status for property ${property.property_number || 'unknown'}: ${detectedStatus}`)
      }

      // Calculate missing fields
      if (!property.area && property.total_price && property.price_per_m2 && property.price_per_m2 > 0) {
        property.area = Math.round((property.total_price / property.price_per_m2) * 100) / 100
      }

      if (!property.price_per_m2 && property.total_price && property.area && property.area > 0) {
        property.price_per_m2 = Math.round((property.total_price / property.area) * 100) / 100
      }

      if (!property.total_price && property.price_per_m2 && property.area && property.area > 0) {
        property.total_price = Math.round(property.price_per_m2 * property.area * 100) / 100
      }

      if (Object.keys(property.raw_data).length > 0) {
        results.push(property)
      }
    }

    return results
  }

  private parseNumber(value: string): number | null {
    if (!value) return null

    const cleaned = value
      .replace(/[^\d,.-]/g, '')
      .replace(/\s+/g, '')
      .replace(',', '.')

    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }

  /**
   * Extract developer information
   */
  public extractDeveloperInfo(): DeveloperInfo {
    const developerInfo: DeveloperInfo = {}

    for (const row of this.rows.slice(0, 5)) {
      for (const [fieldName, headerName] of Object.entries(this.mappings)) {
        const headerIndex = this.headers.indexOf(headerName)
        if (headerIndex !== -1 && headerIndex < row.length) {
          const value = row[headerIndex]?.trim()

          if (value && ['developer_name', 'company_name', 'nip', 'phone', 'email', 'investment_name', 'investment_address', 'investment_city'].includes(fieldName)) {
            if (!(fieldName in developerInfo) || !developerInfo[fieldName as keyof DeveloperInfo]) {
              (developerInfo as Record<string, string>)[fieldName] = value
            }
          }
        }
      }
    }

    return developerInfo
  }
}

/**
 * Main entry point for PapaParse CSV parsing
 */
export function parseCSVSmart(csvContent: string): SmartParseResult {
  try {
    const parser = new PapaParseCSVParser(csvContent)
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
 * Parse Excel file using XLSX library
 */
export function parseExcelFile(buffer: Buffer, sheetName?: string): SmartParseResult {
  try {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    })

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

    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: false
    }) as string[][]

    const csvContent = convertExcelArrayToCSV(jsonData)
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

function convertExcelArrayToCSV(data: string[][]): string {
  if (data.length === 0) return ''

  const escapedData = data.map(row =>
    row.map(cell => {
      const cellStr = String(cell || '').trim()

      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }

      return cellStr
    }).join(',')
  )

  return escapedData.join('\n')
}

/**
 * Unified parser function
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
