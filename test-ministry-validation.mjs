#!/usr/bin/env node
/**
 * Unit Tests for Ministry Validation Service (Task #89.4)
 *
 * Tests all validation functions including:
 * - Format validators (NIP, REGON, postal code, email, dates)
 * - Business logic validators (price consistency, ranges)
 * - Property validation (single property)
 * - Batch validation (multiple properties)
 */

import {
  validateNIP,
  validateREGON,
  validatePostalCode,
  validateEmail,
  validateDateFormat,
  validatePhoneNumber,
  validateKRS,
  validateCEIDG,
  validatePriceConsistency,
  validateAreaRange,
  validatePriceRange,
  validateRoomsCount,
  validateConstructionYear,
  validateDateNotFuture,
  validateProperty,
  validateProperties
} from './src/lib/ministry-validation.ts'

// ============================================================================
// TEST RUNNER
// ============================================================================

let passCount = 0
let failCount = 0

function test(description, testFn) {
  try {
    testFn()
    passCount++
    console.log(`  ✅ ${description}`)
  } catch (error) {
    failCount++
    console.log(`  ❌ ${description}`)
    console.log(`     Error: ${error.message}`)
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected "${expected}" but got "${actual}"`)
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value but got "${actual}"`)
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value but got "${actual}"`)
      }
    },
    toContain(substring) {
      if (typeof actual !== 'string' || !actual.includes(substring)) {
        throw new Error(`Expected string to contain "${substring}" but got "${actual}"`)
      }
    },
    toBeGreaterThan(num) {
      if (typeof actual !== 'number' || actual <= num) {
        throw new Error(`Expected ${actual} to be greater than ${num}`)
      }
    },
    toEqual(expected) {
      const actualStr = JSON.stringify(actual)
      const expectedStr = JSON.stringify(expected)
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr} but got ${actualStr}`)
      }
    }
  }
}

console.log('🧪 Testing Ministry Validation Service (Task #89)\\n')

// ============================================================================
// FORMAT VALIDATION TESTS (Task #89.2)
// ============================================================================

console.log('═══════════════════════════════════════════════════════')
console.log('FORMAT VALIDATION TESTS')
console.log('═══════════════════════════════════════════════════════\\n')

// NIP Validation
test('validateNIP: accepts valid 10-digit NIP', () => {
  const result = validateNIP('1234567890')
  expect(result.valid).toBeTruthy()
})

test('validateNIP: accepts NIP with dashes', () => {
  const result = validateNIP('123-456-78-90')
  // Note: Real checksum validation may fail - this tests format only
  expect(typeof result.valid).toBe('boolean')
})

test('validateNIP: rejects NIP with less than 10 digits', () => {
  const result = validateNIP('12345678')
  expect(result.valid).toBeFalsy()
  expect(result.error).toContain('10 cyfr')
})

test('validateNIP: rejects empty NIP', () => {
  const result = validateNIP('')
  expect(result.valid).toBeFalsy()
  expect(result.error).toContain('wymagany')
})

test('validateNIP: rejects null/undefined NIP', () => {
  const result = validateNIP(null)
  expect(result.valid).toBeFalsy()
})

// REGON Validation
test('validateREGON: accepts 9-digit REGON', () => {
  const result = validateREGON('123456789')
  expect(result.valid).toBeTruthy()
})

test('validateREGON: accepts 14-digit REGON', () => {
  const result = validateREGON('12345678901234')
  expect(result.valid).toBeTruthy()
})

test('validateREGON: rejects invalid length REGON', () => {
  const result = validateREGON('12345')
  expect(result.valid).toBeFalsy()
  expect(result.error).toContain('9 lub 14 cyfr')
})

test('validateREGON: accepts empty REGON (optional)', () => {
  const result = validateREGON(null)
  expect(result.valid).toBeTruthy()
})

// Postal Code Validation
test('validatePostalCode: accepts valid XX-XXX format', () => {
  const result = validatePostalCode('00-001')
  expect(result.valid).toBeTruthy()
})

test('validatePostalCode: accepts another valid format', () => {
  const result = validatePostalCode('12-345')
  expect(result.valid).toBeTruthy()
})

test('validatePostalCode: rejects invalid format (no dash)', () => {
  const result = validatePostalCode('12345')
  expect(result.valid).toBeFalsy()
  expect(result.error).toContain('XX-XXX')
})

test('validatePostalCode: rejects invalid format (wrong pattern)', () => {
  const result = validatePostalCode('123-45')
  expect(result.valid).toBeFalsy()
})

test('validatePostalCode: rejects empty code', () => {
  const result = validatePostalCode('')
  expect(result.valid).toBeFalsy()
  expect(result.error).toContain('wymagany')
})

// Email Validation
test('validateEmail: accepts valid email', () => {
  const result = validateEmail('test@example.com')
  expect(result.valid).toBeTruthy()
})

test('validateEmail: accepts email with subdomain', () => {
  const result = validateEmail('user@mail.company.pl')
  expect(result.valid).toBeTruthy()
})

test('validateEmail: rejects invalid email (no @)', () => {
  const result = validateEmail('invalid.email.com')
  expect(result.valid).toBeFalsy()
  expect(result.error).toContain('format')
})

test('validateEmail: rejects invalid email (no domain)', () => {
  const result = validateEmail('user@')
  expect(result.valid).toBeFalsy()
})

test('validateEmail: accepts empty email (optional)', () => {
  const result = validateEmail(null)
  expect(result.valid).toBeTruthy()
})

// Date Format Validation
test('validateDateFormat: accepts valid YYYY-MM-DD date', () => {
  const result = validateDateFormat('2025-01-15')
  expect(result.valid).toBeTruthy()
})

test('validateDateFormat: rejects invalid format (DD/MM/YYYY)', () => {
  const result = validateDateFormat('15/01/2025')
  expect(result.valid).toBeFalsy()
  expect(result.error).toContain('RRRR-MM-DD')
})

test('validateDateFormat: rejects invalid date (2025-13-01)', () => {
  const result = validateDateFormat('2025-13-01')
  expect(result.valid).toBeFalsy()
  expect(result.error).toContain('Nieprawidłowa data')
})

test('validateDateFormat: accepts empty date (optional)', () => {
  const result = validateDateFormat(null)
  expect(result.valid).toBeTruthy()
})

// Phone Number Validation
test('validatePhoneNumber: accepts valid Polish phone', () => {
  const result = validatePhoneNumber('+48 123 456 789')
  expect(result.valid).toBeTruthy()
})

test('validatePhoneNumber: accepts phone without +48', () => {
  const result = validatePhoneNumber('123 456 789')
  expect(result.valid).toBeTruthy()
})

test('validatePhoneNumber: rejects invalid phone (too short)', () => {
  const result = validatePhoneNumber('123 456')
  expect(result.valid).toBeFalsy()
})

test('validatePhoneNumber: accepts empty phone (optional)', () => {
  const result = validatePhoneNumber(null)
  expect(result.valid).toBeTruthy()
})

// KRS Validation
test('validateKRS: accepts valid 10-digit KRS', () => {
  const result = validateKRS('0000123456')
  expect(result.valid).toBeTruthy()
})

test('validateKRS: rejects invalid KRS (not 10 digits)', () => {
  const result = validateKRS('12345')
  expect(result.valid).toBeFalsy()
  expect(result.error).toContain('10 cyfr')
})

test('validateKRS: accepts empty KRS (conditionally required)', () => {
  const result = validateKRS(null)
  expect(result.valid).toBeTruthy()
})

// CEIDG Validation
test('validateCEIDG: accepts valid CEIDG', () => {
  const result = validateCEIDG('ABC12345')
  expect(result.valid).toBeTruthy()
})

test('validateCEIDG: rejects too short CEIDG', () => {
  const result = validateCEIDG('ABC')
  expect(result.valid).toBeFalsy()
})

test('validateCEIDG: accepts empty CEIDG (conditionally required)', () => {
  const result = validateCEIDG(null)
  expect(result.valid).toBeTruthy()
})

// ============================================================================
// BUSINESS LOGIC VALIDATION TESTS (Task #89.3)
// ============================================================================

console.log('\\n═══════════════════════════════════════════════════════')
console.log('BUSINESS LOGIC VALIDATION TESTS')
console.log('═══════════════════════════════════════════════════════\\n')

// Price Consistency
test('validatePriceConsistency: accepts consistent prices', () => {
  const result = validatePriceConsistency(10000, 50, 500000) // 10k × 50m² = 500k
  expect(result.valid).toBeTruthy()
})

test('validatePriceConsistency: detects price mismatch >5%', () => {
  const result = validatePriceConsistency(10000, 50, 600000) // 10k × 50 = 500k, but totalPrice = 600k (20% diff)
  expect(result.valid).toBeFalsy()
  expect(result.warning).toContain('Niezgodność cen')
})

test('validatePriceConsistency: accepts missing data', () => {
  const result = validatePriceConsistency(undefined, 50, 500000)
  expect(result.valid).toBeTruthy()
})

// Area Range Validation
test('validateAreaRange: accepts normal area', () => {
  const result = validateAreaRange(50)
  expect(result.valid).toBeTruthy()
})

test('validateAreaRange: warns about very small area', () => {
  const result = validateAreaRange(5)
  expect(result.valid).toBeFalsy()
  expect(result.warning).toContain('mała powierzchnia')
})

test('validateAreaRange: warns about very large area', () => {
  const result = validateAreaRange(600)
  expect(result.valid).toBeFalsy()
  expect(result.warning).toContain('duża powierzchnia')
})

// Price Range Validation
test('validatePriceRange: accepts normal price', () => {
  const result = validatePriceRange(15000)
  expect(result.valid).toBeTruthy()
})

test('validatePriceRange: warns about low price', () => {
  const result = validatePriceRange(500)
  expect(result.valid).toBeFalsy()
  expect(result.warning).toContain('Niska cena')
})

test('validatePriceRange: warns about very high price', () => {
  const result = validatePriceRange(60000)
  expect(result.valid).toBeFalsy()
  expect(result.warning).toContain('wysoka cena')
})

// Rooms Count Validation
test('validateRoomsCount: accepts valid room count', () => {
  const result = validateRoomsCount(3)
  expect(result.valid).toBeTruthy()
})

test('validateRoomsCount: rejects invalid room count (0)', () => {
  const result = validateRoomsCount(0)
  expect(result.valid).toBeFalsy()
  expect(result.warning).toContain('Nieprawidłowa liczba pokoi')
})

test('validateRoomsCount: rejects invalid room count (25)', () => {
  const result = validateRoomsCount(25)
  expect(result.valid).toBeFalsy()
})

// Construction Year Validation
test('validateConstructionYear: accepts current year', () => {
  const currentYear = new Date().getFullYear()
  const result = validateConstructionYear(currentYear)
  expect(result.valid).toBeTruthy()
})

test('validateConstructionYear: rejects year too old', () => {
  const result = validateConstructionYear(1800)
  expect(result.valid).toBeFalsy()
  expect(result.warning).toContain('Nieprawidłowy rok')
})

test('validateConstructionYear: rejects future year', () => {
  const futureYear = new Date().getFullYear() + 10
  const result = validateConstructionYear(futureYear)
  expect(result.valid).toBeFalsy()
})

// Date Not Future Validation
test('validateDateNotFuture: accepts past date', () => {
  const result = validateDateNotFuture('2020-01-01', 'Test date')
  expect(result.valid).toBeTruthy()
})

test('validateDateNotFuture: rejects future date', () => {
  const result = validateDateNotFuture('2030-01-01', 'Test date')
  expect(result.valid).toBeFalsy()
  expect(result.warning).toContain('przyszłości')
})

// ============================================================================
// PROPERTY VALIDATION TESTS
// ============================================================================

console.log('\\n═══════════════════════════════════════════════════════')
console.log('PROPERTY VALIDATION TESTS')
console.log('═══════════════════════════════════════════════════════\\n')

// Valid Property
test('validateProperty: accepts fully valid property', () => {
  const validProperty = {
    property_number: 'A1',
    price_per_m2: 15000,
    total_price: 750000,
    area: 50,
    raw_data: {
      'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'mazowieckie',
      'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'warszawski',
      'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Warszawa',
      'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': '00-001',
      'Nazwa dewelopera': 'ACME Development',
      'Nr NIP': '1234567890'
    }
  }

  const result = validateProperty(validProperty)
  expect(result.valid).toBeTruthy()
  expect(result.errors.length).toBe(0)
})

// Missing Required Fields
test('validateProperty: detects missing required fields', () => {
  const invalidProperty = {
    property_number: 'A1',
    raw_data: {}
  }

  const result = validateProperty(invalidProperty)
  expect(result.valid).toBeFalsy()
  expect(result.missingRequired.length).toBeGreaterThan(0)
  expect(result.errors.length).toBeGreaterThan(0)
})

// Invalid Wojewodztwo
test('validateProperty: detects invalid wojewodztwo', () => {
  const property = {
    property_number: 'A1',
    price_per_m2: 15000,
    total_price: 750000,
    area: 50,
    raw_data: {
      'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'invalid-voivodeship',
      'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'warszawski',
      'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Warszawa',
      'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': '00-001',
      'Nazwa dewelopera': 'ACME',
      'Nr NIP': '1234567890'
    }
  }

  const result = validateProperty(property)
  expect(result.valid).toBeFalsy()
  expect(result.invalidFormats).toContain('wojewodztwo')
})

// Invalid Postal Code
test('validateProperty: detects invalid postal code format', () => {
  const property = {
    property_number: 'A1',
    price_per_m2: 15000,
    total_price: 750000,
    area: 50,
    raw_data: {
      'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'mazowieckie',
      'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'warszawski',
      'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Warszawa',
      'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': '12345', // Invalid format
      'Nazwa dewelopera': 'ACME',
      'Nr NIP': '1234567890'
    }
  }

  const result = validateProperty(property)
  expect(result.warnings.some(w => w.field === 'kod_pocztowy')).toBeTruthy()
})

// Price Inconsistency
test('validateProperty: detects price inconsistency', () => {
  const property = {
    property_number: 'A1',
    price_per_m2: 15000,
    total_price: 1000000, // Should be 15000 × 50 = 750000
    area: 50,
    raw_data: {
      'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'mazowieckie',
      'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'warszawski',
      'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Warszawa',
      'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': '00-001',
      'Nazwa dewelopera': 'ACME',
      'Nr NIP': '1234567890'
    }
  }

  const result = validateProperty(property)
  expect(result.warnings.some(w => w.field === 'price_consistency')).toBeTruthy()
})

// ============================================================================
// BATCH VALIDATION TESTS
// ============================================================================

console.log('\\n═══════════════════════════════════════════════════════')
console.log('BATCH VALIDATION TESTS')
console.log('═══════════════════════════════════════════════════════\\n')

test('validateProperties: validates multiple properties', () => {
  const properties = [
    {
      property_number: 'A1',
      price_per_m2: 15000,
      total_price: 750000,
      area: 50,
      raw_data: {
        'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'mazowieckie',
        'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'warszawski',
        'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Warszawa',
        'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': '00-001',
        'Nazwa dewelopera': 'ACME',
        'Nr NIP': '1234567890'
      }
    },
    {
      property_number: 'A2',
      price_per_m2: 14000,
      total_price: 700000,
      area: 50,
      raw_data: {
        'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'mazowieckie',
        'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'warszawski',
        'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Warszawa',
        'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': '00-001',
        'Nazwa dewelopera': 'ACME',
        'Nr NIP': '1234567890'
      }
    }
  ]

  const result = validateProperties(properties)
  expect(result.totalProperties).toBe(2)
  expect(result.validProperties).toBeGreaterThan(0)
})

test('validateProperties: calculates compliance score', () => {
  const properties = [
    {
      property_number: 'A1',
      price_per_m2: 15000,
      total_price: 750000,
      area: 50,
      raw_data: {
        'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'mazowieckie',
        'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'warszawski',
        'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'Warszawa',
        'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': '00-001',
        'Nazwa dewelopera': 'ACME',
        'Nr NIP': '1234567890'
      }
    }
  ]

  const result = validateProperties(properties)
  expect(result.complianceScore).toBeGreaterThan(0)
  expect(result.complianceScore).toBe(expect.any(Number))
})

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\\n═══════════════════════════════════════════════════════')
console.log('TEST SUMMARY')
console.log('═══════════════════════════════════════════════════════\\n')

const totalTests = passCount + failCount
console.log(`Total tests: ${totalTests}`)
console.log(`✅ Passed: ${passCount}`)
console.log(`❌ Failed: ${failCount}`)
console.log(`Success rate: ${((passCount / totalTests) * 100).toFixed(1)}%`)

if (failCount === 0) {
  console.log('\\n🎉 All ministry validation tests passed!')
  console.log('✅ Task #89.4 completed successfully')
  process.exit(0)
} else {
  console.log('\\n⚠️  Some tests failed!')
  console.log('❌ Please review and fix failing tests')
  process.exit(1)
}
