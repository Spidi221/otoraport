/**
 * Comprehensive test suite for Ministry Validation (Task #99.5)
 *
 * Tests all 5 subtasks:
 * - 99.1: DEVELOPER_FIELDS, REQUIRED_FIELDS, RECOMMENDED_FIELDS
 * - 99.2: Zod schemas for validation sections
 * - 99.3: Section breakdown calculation
 * - 99.4: Detailed missing field feedback
 * - 99.5: Integration tests
 */

import { describe, it, expect } from 'vitest'
import {
  validateProperty,
  validateProperties,
  DEVELOPER_FIELDS,
  REQUIRED_FIELDS,
  RECOMMENDED_FIELDS,
  DeveloperInfoSchema,
  LocationSchema,
  PricingSchema,
  TechnicalSchema,
  validateNIP,
  validateREGON,
  validatePostalCode,
  validateEmail
} from '../ministry-validation'
import type { ParsedProperty } from '../api-schemas'

// ============================================================================
// TEST DATA FIXTURES
// ============================================================================

const createCompleteProperty = (): ParsedProperty => ({
  property_number: 'A1/23',
  property_type: 'lokal mieszkalny',
  price_per_m2: 15000,
  total_price: 750000,
  final_price: 750000,
  area: 50,
  liczba_pokoi: 3,
  kondygnacja: 5,
  construction_year: 2024,
  energy_class: 'A',
  raw_data: {
    // Developer information (columns 1-28)
    'Nazwa dewelopera': 'Test Developer Sp. z o.o.',
    'Forma prawna dewelopera': 'Sp. z o.o.',
    'Nr KRS': '0000123456',
    'Nr NIP': '1234567890',
    'Nr REGON': '123456789',
    'Nr telefonu': '+48 123 456 789',
    'Adres poczty elektronicznej': 'contact@developer.pl',

    // Location information
    'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'mazowieckie',
    'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'warszawski',
    'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Warszawa',
    'Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Warszawa',
    'Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Testowa',
    'Nr nieruchomości lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': '10',
    'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': '00-001',

    // Additional fields
    'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny': 'lokal mieszkalny',
    'Data pierwszej oferty': '2024-01-01',
    'Liczba pokoi': '3'
  }
})

const createMinimalProperty = (): ParsedProperty => ({
  property_number: 'B2/45',
  price_per_m2: 12000,
  total_price: 480000,
  area: 40,
  raw_data: {
    'Nazwa dewelopera': 'Minimal Developer',
    'Nr NIP': '9876543210',
    'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'pomorskie',
    'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'gdański',
    'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Gdańsk',
    'Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Gdańsk',
    'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': '80-001'
  }
})

const createInvalidProperty = (): ParsedProperty => ({
  property_number: '',
  price_per_m2: -100,
  total_price: 0,
  area: 5,
  raw_data: {
    'Nazwa dewelopera': '',
    'Nr NIP': 'invalid',
    'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': '',
    'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'invalid'
  }
})

// ============================================================================
// SUBTASK 99.1: FIELD DEFINITIONS TESTS
// ============================================================================

describe('Task #99.1: Field Definitions', () => {
  it('DEVELOPER_FIELDS should contain all 28 ministry developer fields', () => {
    const fields = Object.keys(DEVELOPER_FIELDS)
    expect(fields.length).toBe(28)

    // Basic company info (10 fields)
    expect(fields).toContain('nazwa_dewelopera')
    expect(fields).toContain('forma_prawna')
    expect(fields).toContain('nr_krs')
    expect(fields).toContain('nr_ceidg')
    expect(fields).toContain('nip')
    expect(fields).toContain('regon')
    expect(fields).toContain('telefon')
    expect(fields).toContain('email')
    expect(fields).toContain('fax')
    expect(fields).toContain('strona_www')

    // Headquarters address (8 fields)
    expect(fields).toContain('siedziba_wojewodztwo')
    expect(fields).toContain('siedziba_kod_pocztowy')

    // Sales office address (8 fields)
    expect(fields).toContain('biuro_wojewodztwo')
    expect(fields).toContain('biuro_kod_pocztowy')

    // Additional info (2 fields)
    expect(fields).toContain('dodatkowe_lokalizacje')
    expect(fields).toContain('sposob_kontaktu')
  })

  it('REQUIRED_FIELDS should contain critical ministry fields', () => {
    const fields = Object.keys(REQUIRED_FIELDS)

    // Location fields
    expect(fields).toContain('wojewodztwo')
    expect(fields).toContain('powiat')
    expect(fields).toContain('gmina')
    expect(fields).toContain('miejscowosc')
    expect(fields).toContain('kod_pocztowy')

    // Pricing fields
    expect(fields).toContain('price_per_m2')
    expect(fields).toContain('total_price')
    expect(fields).toContain('area')

    // Property identification
    expect(fields).toContain('property_number')

    // Developer information
    expect(fields).toContain('developer_name')
    expect(fields).toContain('nip')
  })

  it('RECOMMENDED_FIELDS should contain optional but important fields', () => {
    const fields = Object.keys(RECOMMENDED_FIELDS)

    expect(fields).toContain('ulica')
    expect(fields).toContain('property_type')
    expect(fields).toContain('liczba_pokoi')
    expect(fields).toContain('construction_year')
    expect(fields).toContain('base_price')
    expect(fields).toContain('final_price')
  })
})

// ============================================================================
// SUBTASK 99.2: ZOD SCHEMA VALIDATION TESTS
// ============================================================================

describe('Task #99.2: Zod Schema Validation', () => {
  describe('DeveloperInfoSchema', () => {
    it('should validate complete developer info', () => {
      const validData = {
        nazwa_dewelopera: 'Test Developer Sp. z o.o.',
        nip: '1234567890',
        email: 'test@example.com',
        strona_www: 'https://example.com',
        siedziba_kod_pocztowy: '00-001',
        biuro_kod_pocztowy: '80-001'
      }

      const result = DeveloperInfoSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid NIP format', () => {
      const invalidData = {
        nazwa_dewelopera: 'Test',
        nip: 'invalid'
      }

      const result = DeveloperInfoSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        nazwa_dewelopera: 'Test',
        nip: '1234567890',
        email: 'invalid-email'
      }

      const result = DeveloperInfoSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid postal code format', () => {
      const invalidData = {
        nazwa_dewelopera: 'Test',
        nip: '1234567890',
        siedziba_kod_pocztowy: 'invalid'
      }

      const result = DeveloperInfoSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('LocationSchema', () => {
    it('should validate complete location info', () => {
      const validData = {
        wojewodztwo: 'mazowieckie',
        powiat: 'warszawski',
        gmina: 'Warszawa',
        miejscowosc: 'Warszawa',
        ulica: 'Testowa',
        numer: '10',
        kod_pocztowy: '00-001'
      }

      const result = LocationSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing required location fields', () => {
      const invalidData = {
        wojewodztwo: '',
        powiat: '',
        gmina: '',
        miejscowosc: '',
        kod_pocztowy: '00-001'
      }

      const result = LocationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid postal code format', () => {
      const invalidData = {
        wojewodztwo: 'mazowieckie',
        powiat: 'warszawski',
        gmina: 'Warszawa',
        miejscowosc: 'Warszawa',
        kod_pocztowy: '00001' // Invalid format (no dash)
      }

      const result = LocationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('PricingSchema', () => {
    it('should validate complete pricing info', () => {
      const validData = {
        price_per_m2: 15000,
        total_price: 750000,
        final_price: 750000
      }

      const result = PricingSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative prices', () => {
      const invalidData = {
        price_per_m2: -100,
        total_price: 750000
      }

      const result = PricingSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject zero prices', () => {
      const invalidData = {
        price_per_m2: 0,
        total_price: 0
      }

      const result = PricingSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('TechnicalSchema', () => {
    it('should validate complete technical info', () => {
      const validData = {
        property_number: 'A1/23',
        property_type: 'lokal mieszkalny',
        area: 50,
        liczba_pokoi: 3,
        kondygnacja: 5,
        construction_year: 2024,
        energy_class: 'A',
        data_pierwszej_oferty: '2024-01-01'
      }

      const result = TechnicalSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject area below minimum', () => {
      const invalidData = {
        property_number: 'A1',
        area: 5 // Too small
      }

      const result = TechnicalSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject area above maximum', () => {
      const invalidData = {
        property_number: 'A1',
        area: 600 // Too large
      }

      const result = TechnicalSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid construction year', () => {
      const invalidData = {
        property_number: 'A1',
        area: 50,
        construction_year: 1800 // Too old
      }

      const result = TechnicalSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid date format', () => {
      const invalidData = {
        property_number: 'A1',
        area: 50,
        data_pierwszej_oferty: '01-01-2024' // Wrong format
      }

      const result = TechnicalSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

// ============================================================================
// SUBTASK 99.3: SECTION BREAKDOWN TESTS
// ============================================================================

describe('Task #99.3: Section Breakdown Calculation', () => {
  it('should calculate section breakdown for complete property', () => {
    const property = createCompleteProperty()
    const result = validateProperty(property)

    expect(result.sectionBreakdown).toBeDefined()
    expect(result.sectionBreakdown!.developer.total).toBe(28)
    expect(result.sectionBreakdown!.location.total).toBe(7)
    expect(result.sectionBreakdown!.pricing.total).toBe(3)
    expect(result.sectionBreakdown!.technical.total).toBe(8)

    // Percentages should be 0-100
    expect(result.sectionBreakdown!.developer.percentage).toBeGreaterThanOrEqual(0)
    expect(result.sectionBreakdown!.developer.percentage).toBeLessThanOrEqual(100)
    expect(result.sectionBreakdown!.location.percentage).toBeGreaterThanOrEqual(0)
    expect(result.sectionBreakdown!.location.percentage).toBeLessThanOrEqual(100)
  })

  it('should calculate high completion percentage for complete property', () => {
    const property = createCompleteProperty()
    const result = validateProperty(property)

    expect(result.sectionBreakdown!.location.percentage).toBeGreaterThanOrEqual(90)
    expect(result.sectionBreakdown!.pricing.percentage).toBeGreaterThanOrEqual(90)
    expect(result.sectionBreakdown!.technical.percentage).toBeGreaterThanOrEqual(80)
  })

  it('should calculate low completion percentage for minimal property', () => {
    const property = createMinimalProperty()
    const result = validateProperty(property)

    expect(result.sectionBreakdown!.developer.percentage).toBeLessThan(50)
    expect(result.sectionBreakdown!.technical.percentage).toBeLessThan(80)
  })

  it('should aggregate section breakdown across batch', () => {
    const properties = [
      createCompleteProperty(),
      createMinimalProperty(),
      createCompleteProperty()
    ]

    const result = validateProperties(properties)

    expect(result.sectionBreakdown).toBeDefined()
    expect(result.sectionBreakdown!.developer.total).toBe(28)
    expect(result.sectionBreakdown!.location.total).toBe(7)
    expect(result.sectionBreakdown!.pricing.total).toBe(3)
    expect(result.sectionBreakdown!.technical.total).toBe(8)
  })
})

// ============================================================================
// SUBTASK 99.4: DETAILED MISSING FIELD FEEDBACK TESTS
// ============================================================================

describe('Task #99.4: Detailed Missing Field Feedback', () => {
  it('should provide detailed missing field information', () => {
    const property = createMinimalProperty()
    const result = validateProperty(property)

    expect(result.missingFieldsDetailed).toBeDefined()
    expect(Array.isArray(result.missingFieldsDetailed)).toBe(true)
  })

  it('should categorize missing fields by section', () => {
    const property = createMinimalProperty()
    const result = validateProperty(property)

    const sections = new Set(result.missingFieldsDetailed?.map(f => f.section))
    expect(sections.size).toBeGreaterThan(0)
    expect(['developer', 'location', 'pricing', 'technical'].some(s => sections.has(s as any))).toBe(true)
  })

  it('should categorize missing fields by severity', () => {
    const property = createMinimalProperty()
    const result = validateProperty(property)

    const severities = new Set(result.missingFieldsDetailed?.map(f => f.severity))
    expect(['critical', 'warning'].some(s => severities.has(s as any))).toBe(true)
  })

  it('should provide display names for missing fields', () => {
    const property = createMinimalProperty()
    const result = validateProperty(property)

    result.missingFieldsDetailed?.forEach(field => {
      expect(field.displayName).toBeDefined()
      expect(field.displayName.length).toBeGreaterThan(0)
      expect(field.fieldName).toBeDefined()
    })
  })

  it('should aggregate missing fields summary in batch validation', () => {
    const properties = [
      createCompleteProperty(),
      createMinimalProperty()
    ]

    const result = validateProperties(properties)

    expect(result.missingFieldsSummary).toBeDefined()
    expect(result.missingFieldsSummary!.developer).toBeDefined()
    expect(result.missingFieldsSummary!.location).toBeDefined()
    expect(result.missingFieldsSummary!.pricing).toBeDefined()
    expect(result.missingFieldsSummary!.technical).toBeDefined()
  })

  it('should not duplicate missing fields in summary', () => {
    const properties = [
      createMinimalProperty(),
      createMinimalProperty()
    ]

    const result = validateProperties(properties)

    const allFields = [
      ...result.missingFieldsSummary!.developer,
      ...result.missingFieldsSummary!.location,
      ...result.missingFieldsSummary!.pricing,
      ...result.missingFieldsSummary!.technical
    ]

    const uniqueFields = new Set(allFields)
    expect(allFields.length).toBe(uniqueFields.size)
  })
})

// ============================================================================
// SUBTASK 99.5: INTEGRATION TESTS
// ============================================================================

describe('Task #99.5: Integration Tests', () => {
  describe('Complete Property Validation', () => {
    it('should pass validation for complete property', () => {
      const property = createCompleteProperty()
      const result = validateProperty(property)

      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
      expect(result.missingRequired.length).toBe(0)
    })

    it('should have high compliance score for complete property', () => {
      const properties = [createCompleteProperty()]
      const result = validateProperties(properties)

      expect(result.complianceScore).toBeGreaterThanOrEqual(80)
    })
  })

  describe('Minimal Property Validation', () => {
    it('should pass validation for minimal property with all required fields', () => {
      const property = createMinimalProperty()
      const result = validateProperty(property)

      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should have warnings for missing recommended fields', () => {
      const property = createMinimalProperty()
      const result = validateProperty(property)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.missingRecommended.length).toBeGreaterThan(0)
    })
  })

  describe('Invalid Property Validation', () => {
    it('should fail validation for invalid property', () => {
      const property = createInvalidProperty()
      const result = validateProperty(property)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should report all critical errors', () => {
      const property = createInvalidProperty()
      const result = validateProperty(property)

      expect(result.missingRequired.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.severity === 'critical')).toBe(true)
    })
  })

  describe('Batch Validation', () => {
    it('should validate multiple properties', () => {
      const properties = [
        createCompleteProperty(),
        createMinimalProperty(),
        createInvalidProperty()
      ]

      const result = validateProperties(properties)

      expect(result.totalProperties).toBe(3)
      expect(result.propertyResults.length).toBe(3)
    })

    it('should calculate correct valid/invalid counts', () => {
      const properties = [
        createCompleteProperty(),
        createMinimalProperty(),
        createInvalidProperty()
      ]

      const result = validateProperties(properties)

      expect(result.validProperties).toBe(2)
      expect(result.invalidProperties).toBe(1)
    })

    it('should aggregate errors and warnings', () => {
      const properties = [
        createCompleteProperty(),
        createInvalidProperty()
      ]

      const result = validateProperties(properties)

      expect(result.globalErrors.length).toBeGreaterThan(0)
    })
  })

  describe('Format Validation', () => {
    it('should validate NIP format correctly', () => {
      expect(validateNIP('1234567890').valid).toBe(false) // Invalid checksum
      expect(validateNIP('').valid).toBe(false)
      expect(validateNIP('invalid').valid).toBe(false)
    })

    it('should validate REGON format correctly', () => {
      expect(validateREGON('123456789').valid).toBe(true)
      expect(validateREGON('12345678901234').valid).toBe(true)
      expect(validateREGON('12345').valid).toBe(false)
    })

    it('should validate postal code format correctly', () => {
      expect(validatePostalCode('00-001').valid).toBe(true)
      expect(validatePostalCode('80-123').valid).toBe(true)
      expect(validatePostalCode('00001').valid).toBe(false)
      expect(validatePostalCode('invalid').valid).toBe(false)
    })

    it('should validate email format correctly', () => {
      expect(validateEmail('test@example.com').valid).toBe(true)
      expect(validateEmail('invalid').valid).toBe(false)
      expect(validateEmail('').valid).toBe(true) // Optional field
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty properties array', () => {
      const result = validateProperties([])

      expect(result.totalProperties).toBe(0)
      expect(result.validProperties).toBe(0)
      expect(result.complianceScore).toBe(0)
    })

    it('should handle property with null raw_data', () => {
      const property: ParsedProperty = {
        property_number: 'A1',
        price_per_m2: 15000,
        total_price: 750000,
        area: 50,
        raw_data: {}
      }

      const result = validateProperty(property)

      expect(result).toBeDefined()
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle property with undefined fields', () => {
      const property: ParsedProperty = {
        raw_data: {
          'Nazwa dewelopera': 'Test',
          'Nr NIP': '1234567890'
        }
      }

      const result = validateProperty(property)

      expect(result).toBeDefined()
      expect(result.missingRequired.length).toBeGreaterThan(0)
    })
  })
})
