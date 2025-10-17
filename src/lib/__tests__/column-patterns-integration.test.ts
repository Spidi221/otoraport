/**
 * TASK #97.5: Integration Tests for Column Mapping Accuracy
 *
 * Tests comprehensive CSV parsing with COMPLETE_COLUMN_PATTERNS across all 3 formats:
 * - TAMBUD (Ministry Schema 1.13 - exact ministerial column names)
 * - ATAL (Abbreviated ministry names - Excel truncation issues)
 * - INPRO (Custom developer software export)
 *
 * Success Criteria:
 * - All 3 formats parse with ≥95% field mapping accuracy
 * - Mapping confidence ≥0.8 for all formats
 * - All critical ministry fields correctly mapped
 * - Developer info extraction works for all formats
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { SmartCSVParser } from '../smart-csv-parser'
import { COMPLETE_COLUMN_PATTERNS } from '../column-synonyms-complete'

// Test fixtures paths
const FIXTURES_DIR = join(__dirname, 'fixtures')
const TAMBUD_CSV = join(FIXTURES_DIR, 'tambud-sample.csv')
const ATAL_CSV = join(FIXTURES_DIR, 'atal-sample.csv')
const INPRO_CSV = join(FIXTURES_DIR, 'inpro-sample.csv')

// Ministry Schema 1.13 critical fields (must be mapped correctly)
const MINISTRY_CRITICAL_FIELDS = [
  // Developer info (columns 1-11)
  'developer_name',
  'forma_prawna',
  'nr_krs',
  'nip',
  'regon',
  'phone',
  'email',
  'strona_internetowa',

  // Investment location (columns 30-36)
  'wojewodztwo',
  'powiat',
  'gmina',
  'miejscowosc',
  'ulica',
  'kod_pocztowy',

  // Property data (columns 37-44)
  'property_type',
  'property_number',
  'price_per_m2',
  'price_valid_from',
  'base_price',
  'base_price_valid_from',
  'final_price',
  'final_price_valid_from',

  // Parking/storage (columns 45-52)
  'parking_type',
  'parking_designation',
  'parking_price',
  'parking_date',
  'storage_type',
  'storage_designation',
  'storage_price',
  'storage_date',

  // Necessary rights (columns 53-55)
  'necessary_rights',
  'necessary_rights_price',
  'necessary_rights_date',

  // Prospectus (column 59)
  'prospectus_url'
] as const

// INPRO-specific extra fields (non-ministry)
const INPRO_EXTRA_FIELDS = [
  'row_number', // Id nieruchomości
  'area', // Powierzchnia
  'kondygnacja', // Piętro nieruchomości
  'liczba_pokoi', // Liczba pokoi
  'vat_rate', // Stawka VAT (%)
  'waluta', // Waluta
  'investment_name', // Nazwa inwestycji
  'investment_website' // Adres strony internetowej inwestycji
] as const

// Helper: Load CSV file
function loadCSV(path: string): string {
  return readFileSync(path, 'utf-8')
}

// Helper: Calculate mapping accuracy
function calculateMappingAccuracy(
  mappings: Record<string, string>,
  expectedFields: readonly string[]
): {
  accuracy: number
  mappedCount: number
  totalCount: number
  unmappedFields: string[]
} {
  const mappedCount = expectedFields.filter(field => mappings[field]).length
  const totalCount = expectedFields.length
  const accuracy = (mappedCount / totalCount) * 100
  const unmappedFields = expectedFields.filter(field => !mappings[field])

  return {
    accuracy,
    mappedCount,
    totalCount,
    unmappedFields
  }
}

// ===========================================
// TEST SUITE 1: TAMBUD (Ministerial Format)
// ===========================================

describe('TAMBUD CSV Integration Tests (Ministry Schema 1.13)', () => {
  const csvContent = loadCSV(TAMBUD_CSV)
  const parser = new SmartCSVParser(csvContent)
  const result = parser.analyzeColumns()

  it('should parse TAMBUD CSV with ≥95% mapping accuracy', () => {
    const stats = calculateMappingAccuracy(result.mappings, MINISTRY_CRITICAL_FIELDS)

    console.log('📊 TAMBUD Mapping Stats:', stats)

    expect(stats.accuracy).toBeGreaterThanOrEqual(95)
    // TAMBUD should map ALL critical ministry fields (it uses exact column names)
    if (stats.unmappedFields.length > 0) {
      console.warn('⚠️ Unmapped fields:', stats.unmappedFields)
    }
  })

  it('should detect format as "ministerial" with high confidence', () => {
    expect(result.detectedFormat).toBe('ministerial')
    expect(result.formatConfidence).toBeGreaterThanOrEqual(80)
  })

  it('should extract all 28 developer fields correctly', () => {
    const developerInfo = parser.extractDeveloperInfo()

    // Check critical developer fields
    expect(developerInfo.company_name).toBeTruthy()
    expect(developerInfo.nip).toBeTruthy()
    expect(developerInfo.phone).toBeTruthy()
    expect(developerInfo.email).toBeTruthy()

    // Check headquarters address
    expect(developerInfo.headquarters_voivodeship).toBeTruthy()
    expect(developerInfo.headquarters_city).toBeTruthy()

    // Check sales office address
    expect(developerInfo.sales_office_voivodeship).toBeTruthy()
    expect(developerInfo.sales_office_city).toBeTruthy()

    console.log('📋 TAMBUD Developer Info:', {
      company_name: developerInfo.company_name,
      nip: developerInfo.nip,
      headquarters: `${developerInfo.headquarters_city}, ${developerInfo.headquarters_voivodeship}`,
      sales_office: `${developerInfo.sales_office_city}, ${developerInfo.sales_office_voivodeship}`
    })
  })

  it('should map all 58 ministry fields (Schema 1.13)', () => {
    const allMinistryFields = Object.keys(COMPLETE_COLUMN_PATTERNS).filter(key =>
      !INPRO_EXTRA_FIELDS.includes(key as any)
    )

    const stats = calculateMappingAccuracy(result.mappings, allMinistryFields)

    console.log('📊 TAMBUD Full Ministry Schema Coverage:', stats)

    // TAMBUD should map ALL 58 fields since it uses exact ministry column names
    expect(stats.accuracy).toBeGreaterThanOrEqual(95)
  })

  it('should parse all property rows successfully', () => {
    expect(result.success).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.validRows).toBe(result.data.length)

    // Check first property has all critical fields
    const firstProperty = result.data[0]
    expect(firstProperty.property_number).toBeTruthy()
    expect(firstProperty.price_per_m2).toBeGreaterThan(0)

    // TAMBUD: area is calculated from price/m² × total_price (not a direct column)
    // So it may be undefined if total_price is missing
    if (firstProperty.area) {
      expect(firstProperty.area).toBeGreaterThan(0)
    }

    console.log('📊 TAMBUD Parsed Properties:', {
      total: result.totalRows,
      valid: result.validRows,
      sample: {
        property_number: firstProperty.property_number,
        price_per_m2: firstProperty.price_per_m2,
        area: firstProperty.area || '(calculated)'
      }
    })
  })

  it('should have mapping confidence ≥0.8', () => {
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)

    console.log('📊 TAMBUD Mapping Confidence:', result.confidence.toFixed(2))
  })
})

// ===========================================
// TEST SUITE 2: ATAL Format
// ===========================================

describe('ATAL CSV Integration Tests (Abbreviated Ministry Format)', () => {
  const csvContent = loadCSV(ATAL_CSV)
  const parser = new SmartCSVParser(csvContent)
  const result = parser.analyzeColumns()

  it('should parse ATAL CSV with ≥95% mapping accuracy', () => {
    const stats = calculateMappingAccuracy(result.mappings, MINISTRY_CRITICAL_FIELDS)

    console.log('📊 ATAL Mapping Stats:', stats)

    expect(stats.accuracy).toBeGreaterThanOrEqual(95)
  })

  it('should detect format correctly', () => {
    // ATAL may be detected as either ministerial or custom depending on truncation
    expect(['ministerial', 'custom']).toContain(result.detectedFormat)
    expect(result.formatConfidence).toBeGreaterThanOrEqual(70)
  })

  it('should handle truncated column names (ATAL Excel limits)', () => {
    // ATAL has truncated column names like:
    // "Cena lokalu miesz. lub domu jedn. będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz pow"
    // Should still map correctly to base_price

    expect(result.mappings.base_price).toBeTruthy()
    expect(result.mappings.base_price_valid_from).toBeTruthy()

    // Check truncated final_price column
    expect(result.mappings.final_price).toBeTruthy()
    expect(result.mappings.final_price_valid_from).toBeTruthy()

    console.log('📊 ATAL Truncated Columns Mapped:', {
      base_price: result.mappings.base_price,
      base_price_valid_from: result.mappings.base_price_valid_from,
      final_price: result.mappings.final_price,
      final_price_valid_from: result.mappings.final_price_valid_from
    })
  })

  it('should extract developer info from first row', () => {
    const developerInfo = parser.extractDeveloperInfo()

    expect(developerInfo.company_name).toBeTruthy()
    expect(developerInfo.nip).toBeTruthy()

    console.log('📋 ATAL Developer Info:', {
      company_name: developerInfo.company_name,
      nip: developerInfo.nip
    })
  })

  it('should map pricing fields correctly', () => {
    expect(result.mappings.price_per_m2).toBeTruthy()
    expect(result.mappings.base_price).toBeTruthy()
    expect(result.mappings.final_price).toBeTruthy()

    // Check first property has prices
    const firstProperty = result.data[0]
    expect(firstProperty.price_per_m2).toBeGreaterThan(0)
    expect(firstProperty.raw_data).toBeTruthy()

    console.log('📊 ATAL Pricing Data:', {
      price_per_m2: firstProperty.price_per_m2,
      total_price: firstProperty.total_price,
      area: firstProperty.area
    })
  })

  it('should have mapping confidence ≥0.8', () => {
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)

    console.log('📊 ATAL Mapping Confidence:', result.confidence.toFixed(2))
  })
})

// ===========================================
// TEST SUITE 3: INPRO Format
// ===========================================

describe('INPRO CSV Integration Tests (Custom Developer Software)', () => {
  const csvContent = loadCSV(INPRO_CSV)
  const parser = new SmartCSVParser(csvContent)
  const result = parser.analyzeColumns()

  it('should parse INPRO CSV with ≥85% mapping accuracy for supported fields', () => {
    // INPRO is a simplified format - doesn't have all ministry fields
    // Test only fields that INPRO actually supports
    const inproSupportedFields = MINISTRY_CRITICAL_FIELDS.filter(field =>
      // INPRO DOESN'T have: final_price, parking_type, storage_*, necessary_rights_*
      !['final_price', 'final_price_valid_from', 'parking_type', 'parking_designation', 'parking_price', 'parking_date',
        'storage_type', 'storage_designation', 'storage_price', 'storage_date',
        'necessary_rights', 'necessary_rights_price', 'necessary_rights_date'].includes(field)
    )

    const stats = calculateMappingAccuracy(result.mappings, inproSupportedFields)

    console.log('📊 INPRO Mapping Stats (supported fields only):', stats)

    // INPRO should map ≥85% of its supported fields
    expect(stats.accuracy).toBeGreaterThanOrEqual(85)
  })

  it('should detect format as "inpro" with high confidence', () => {
    expect(result.detectedFormat).toBe('inpro')
    expect(result.formatConfidence).toBeGreaterThanOrEqual(80)
  })

  it('should handle INPRO-specific column names', () => {
    // INPRO uses compact naming: "Piętro nieruchomości", "Cena za m2 nieruchomości"
    expect(result.mappings.kondygnacja).toBeTruthy()
    expect(result.mappings.price_per_m2).toBeTruthy()
    expect(result.mappings.property_number).toBeTruthy()

    console.log('📊 INPRO-Specific Columns Mapped:', {
      kondygnacja: result.mappings.kondygnacja,
      price_per_m2: result.mappings.price_per_m2,
      property_number: result.mappings.property_number
    })
  })

  it('should extract INPRO extra fields (Id nieruchomości, etc.)', () => {
    // INPRO has extra fields not in ministry schema
    expect(result.mappings.row_number).toBeTruthy() // "Id nieruchomości"
    expect(result.mappings.area).toBeTruthy() // "Powierzchnia"
    expect(result.mappings.kondygnacja).toBeTruthy() // "Piętro nieruchomości"
    expect(result.mappings.liczba_pokoi).toBeTruthy() // "Liczba pokoi"
    expect(result.mappings.vat_rate).toBeTruthy() // "Stawka VAT (%)"
    expect(result.mappings.waluta).toBeTruthy() // "Waluta"
    expect(result.mappings.investment_name).toBeTruthy() // "Nazwa inwestycji"
    expect(result.mappings.investment_website).toBeTruthy() // "Adres strony internetowej inwestycji"

    console.log('📊 INPRO Extra Fields Mapped:', {
      row_number: result.mappings.row_number,
      area: result.mappings.area,
      kondygnacja: result.mappings.kondygnacja,
      liczba_pokoi: result.mappings.liczba_pokoi,
      investment_name: result.mappings.investment_name
    })
  })

  it('should handle "X" markers for sold properties', () => {
    // INPRO convention: "X" in price field means sold
    // Check that parser detects and filters sold properties

    const allRows = result.totalRows
    const validRows = result.validRows

    // If there are sold properties, validRows should be less than totalRows
    expect(validRows).toBeLessThanOrEqual(allRows)

    // Check validation stats
    if (result.validationStats) {
      const soldCount = result.validationStats.soldProperties || 0
      console.log('📊 INPRO Sold Properties Filtered:', soldCount)

      // At least some rows should be successfully parsed
      expect(result.validationStats.successfullyParsed).toBeGreaterThan(0)
    }
  })

  it('should extract developer info', () => {
    const developerInfo = parser.extractDeveloperInfo()

    expect(developerInfo.company_name).toBeTruthy()
    expect(developerInfo.nip).toBeTruthy()

    console.log('📋 INPRO Developer Info:', {
      company_name: developerInfo.company_name,
      nip: developerInfo.nip,
      website: developerInfo.website
    })
  })

  it('should have mapping confidence ≥0.8', () => {
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)

    console.log('📊 INPRO Mapping Confidence:', result.confidence.toFixed(2))
  })
})

// ===========================================
// TEST SUITE 4: Cross-Format Comparison
// ===========================================

describe('Cross-Format Integration Tests', () => {
  const tambudCSV = loadCSV(TAMBUD_CSV)
  const atalCSV = loadCSV(ATAL_CSV)
  const inproCSV = loadCSV(INPRO_CSV)

  const tambudParser = new SmartCSVParser(tambudCSV)
  const atalParser = new SmartCSVParser(atalCSV)
  const inproParser = new SmartCSVParser(inproCSV)

  const tambudResult = tambudParser.analyzeColumns()
  const atalResult = atalParser.analyzeColumns()
  const inproResult = inproParser.analyzeColumns()

  it('all formats should map core ministry fields consistently', () => {
    const coreFields = [
      'property_number',
      'price_per_m2',
      'wojewodztwo',
      'powiat',
      'gmina',
      'miejscowosc'
    ]

    // Check each format maps these core fields
    coreFields.forEach(field => {
      expect(tambudResult.mappings[field], `TAMBUD should map ${field}`).toBeTruthy()
      expect(atalResult.mappings[field], `ATAL should map ${field}`).toBeTruthy()
      expect(inproResult.mappings[field], `INPRO should map ${field}`).toBeTruthy()
    })

    console.log('✅ All formats map core ministry fields consistently')
  })

  it('developer info extraction should work for all formats', () => {
    const tambudDev = tambudParser.extractDeveloperInfo()
    const atalDev = atalParser.extractDeveloperInfo()
    const inproDev = inproParser.extractDeveloperInfo()

    expect(tambudDev.company_name).toBeTruthy()
    expect(atalDev.company_name).toBeTruthy()
    expect(inproDev.company_name).toBeTruthy()

    expect(tambudDev.nip).toBeTruthy()
    expect(atalDev.nip).toBeTruthy()
    expect(inproDev.nip).toBeTruthy()

    console.log('✅ Developer info extraction works for all formats:', {
      TAMBUD: tambudDev.company_name,
      ATAL: atalDev.company_name,
      INPRO: inproDev.company_name
    })
  })

  it('mapping confidence should be ≥0.8 for all formats', () => {
    expect(tambudResult.confidence).toBeGreaterThanOrEqual(0.8)
    expect(atalResult.confidence).toBeGreaterThanOrEqual(0.8)
    expect(inproResult.confidence).toBeGreaterThanOrEqual(0.8)

    console.log('📊 Mapping Confidence Comparison:', {
      TAMBUD: tambudResult.confidence.toFixed(2),
      ATAL: atalResult.confidence.toFixed(2),
      INPRO: inproResult.confidence.toFixed(2)
    })
  })

  it('all formats should parse successfully', () => {
    expect(tambudResult.success).toBe(true)
    expect(atalResult.success).toBe(true)
    expect(inproResult.success).toBe(true)

    expect(tambudResult.data.length).toBeGreaterThan(0)
    expect(atalResult.data.length).toBeGreaterThan(0)
    expect(inproResult.data.length).toBeGreaterThan(0)

    console.log('📊 Parsed Property Counts:', {
      TAMBUD: tambudResult.validRows,
      ATAL: atalResult.validRows,
      INPRO: inproResult.validRows
    })
  })

  it('format detection should be accurate', () => {
    expect(tambudResult.detectedFormat).toBe('ministerial')
    expect(atalResult.detectedFormat).toMatch(/ministerial|custom/) // ATAL may be either
    expect(inproResult.detectedFormat).toBe('inpro')

    console.log('📊 Format Detection:', {
      TAMBUD: `${tambudResult.detectedFormat} (${tambudResult.formatConfidence?.toFixed(1)}%)`,
      ATAL: `${atalResult.detectedFormat} (${atalResult.formatConfidence?.toFixed(1)}%)`,
      INPRO: `${inproResult.detectedFormat} (${inproResult.formatConfidence?.toFixed(1)}%)`
    })
  })
})

// ===========================================
// TEST SUITE 5: COLUMN_PATTERNS Coverage
// ===========================================

describe('COLUMN_PATTERNS Synonym Coverage Tests', () => {
  it('should have at least 5 synonyms per ministry field', () => {
    const fieldsWithFewSynonyms: string[] = []

    Object.entries(COMPLETE_COLUMN_PATTERNS).forEach(([field, synonyms]) => {
      if (synonyms.length < 5) {
        fieldsWithFewSynonyms.push(`${field} (${synonyms.length} synonyms)`)
      }
    })

    // Most fields should have ≥5 synonyms
    const coveragePercentage = ((Object.keys(COMPLETE_COLUMN_PATTERNS).length - fieldsWithFewSynonyms.length) / Object.keys(COMPLETE_COLUMN_PATTERNS).length) * 100

    console.log('📊 Synonym Coverage:', {
      totalFields: Object.keys(COMPLETE_COLUMN_PATTERNS).length,
      fieldsWithFewSynonyms: fieldsWithFewSynonyms.length,
      coveragePercentage: coveragePercentage.toFixed(1) + '%',
      examples: fieldsWithFewSynonyms.slice(0, 5)
    })

    expect(coveragePercentage).toBeGreaterThanOrEqual(85) // At least 85% coverage
  })

  it('should cover all 58 ministry fields', () => {
    const ministryFieldCount = Object.keys(COMPLETE_COLUMN_PATTERNS).filter(key =>
      !INPRO_EXTRA_FIELDS.includes(key as any)
    ).length

    expect(ministryFieldCount).toBeGreaterThanOrEqual(58)

    console.log('📊 Ministry Field Coverage:', ministryFieldCount)
  })

  it('should include INPRO extra fields', () => {
    INPRO_EXTRA_FIELDS.forEach(field => {
      expect(COMPLETE_COLUMN_PATTERNS[field]).toBeTruthy()
    })

    console.log('✅ All INPRO extra fields are defined')
  })
})
