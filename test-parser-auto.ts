/**
 * Automatyczny test parsera - weryfikacja "FILTER ON UPLOAD"
 * Testuje 4 przykładowe pliki bez potrzeby wrzucania przez dashboard
 */

import { readFileSync } from 'fs'
import { parseCSVSmart } from './src/lib/smart-csv-parser'

const FILES_DIR = './backup dokumentów real estate app/przykładowe pliki'

interface TestResult {
  filename: string
  totalRows: number
  parsedRows: number
  skippedRows: number
  hasXMarkers: boolean
  errors: string[]
  success: boolean
}

const tests: TestResult[] = []

// Test files
const testFiles = [
  {
    name: '2025-09-11.csv',
    expectedAvailable: 17 // ~20 total - ~3 sprzedane
  },
  {
    name: '2025-10-02.xlsx - wzorcowy zakres danych.csv',
    expectedAvailable: 19 // ~20 total - ~1 sprzedane
  },
  {
    name: 'Ceny-ofertowe-mieszkan-dewelopera-inpro_s__a-2025-10-02.csv',
    expectedAvailable: 3 // wszystkie dostępne
  },
  {
    name: 'atal - Dane.csv',
    expectedAvailable: 2700 // ~6109 total - ~3400 sprzedane
  }
]

console.log('🧪 AUTOMATYCZNY TEST PARSERA')
console.log('=' .repeat(80))
console.log('')

for (const testFile of testFiles) {
  const result: TestResult = {
    filename: testFile.name,
    totalRows: 0,
    parsedRows: 0,
    skippedRows: 0,
    hasXMarkers: false,
    errors: [],
    success: false
  }

  try {
    console.log(`📁 Testing: ${testFile.name}`)
    console.log('-'.repeat(80))

    // Read file
    const filePath = `${FILES_DIR}/${testFile.name}`
    const content = readFileSync(filePath, 'utf-8')

    // Count total rows
    const lines = content.split('\n').filter(line => line.trim())
    result.totalRows = lines.length - 1 // minus header

    console.log(`   Total rows (with header): ${lines.length}`)
    console.log(`   Data rows: ${result.totalRows}`)

    // Parse with smart parser
    const parseResult = parseCSVSmart(content)

    if (!parseResult.success) {
      result.errors = parseResult.errors || []
      console.log(`   ❌ Parse failed: ${result.errors.join(', ')}`)
      tests.push(result)
      continue
    }

    result.parsedRows = parseResult.data?.length || 0
    result.skippedRows = result.totalRows - result.parsedRows

    console.log(`   ✅ Parsed successfully`)
    console.log(`   📊 Parsed (available): ${result.parsedRows}`)
    console.log(`   🚫 Skipped (sold): ${result.skippedRows}`)
    console.log(`   🎯 Expected available: ${testFile.expectedAvailable}`)

    // Check if any parsed properties have "X" markers (should NOT happen)
    if (parseResult.data) {
      for (const property of parseResult.data) {
        const pricePerM2 = String(property.price_per_m2 || '').toUpperCase()
        const totalPrice = String(property.total_price || '').toUpperCase()
        const finalPrice = String(property.final_price || '').toUpperCase()

        if (pricePerM2 === 'X' || totalPrice === 'X' || finalPrice === 'X' ||
            pricePerM2.includes('#VALUE!') || totalPrice.includes('#VALUE!') || finalPrice.includes('#VALUE!')) {
          result.hasXMarkers = true
          result.errors.push(`Found "X" marker in property: ${property.property_number || 'unknown'}`)
        }
      }
    }

    // Verify results
    const tolerance = Math.max(5, testFile.expectedAvailable * 0.1) // 10% tolerance or 5 rows
    const diff = Math.abs(result.parsedRows - testFile.expectedAvailable)

    if (diff <= tolerance && !result.hasXMarkers) {
      result.success = true
      console.log(`   ✅ TEST PASSED (diff: ${diff} rows, tolerance: ${tolerance})`)
    } else {
      if (diff > tolerance) {
        result.errors.push(`Count mismatch: expected ${testFile.expectedAvailable}, got ${result.parsedRows} (diff: ${diff})`)
      }
      if (result.hasXMarkers) {
        result.errors.push('Found "X" markers in parsed data - parser not filtering!')
      }
      console.log(`   ❌ TEST FAILED: ${result.errors.join('; ')}`)
    }

    if (result.hasXMarkers) {
      console.log(`   ⚠️  Ministry compliance: BROKEN (CSV would contain sold properties)`)
    } else {
      console.log(`   ✅ Ministry compliance: OK (no "X" markers in parsed data)`)
    }

  } catch (error: any) {
    result.errors.push(error.message)
    console.log(`   ❌ Error: ${error.message}`)
  }

  tests.push(result)
  console.log('')
}

// Summary
console.log('=' .repeat(80))
console.log('📊 PODSUMOWANIE TESTÓW')
console.log('=' .repeat(80))
console.log('')

const passed = tests.filter(t => t.success).length
const failed = tests.filter(t => !t.success).length

console.log(`Total tests: ${tests.length}`)
console.log(`Passed: ${passed} ✅`)
console.log(`Failed: ${failed} ❌`)
console.log('')

if (failed > 0) {
  console.log('❌ FAILED TESTS:')
  tests.filter(t => !t.success).forEach(t => {
    console.log(`   - ${t.filename}`)
    t.errors.forEach(err => console.log(`     • ${err}`))
  })
  console.log('')
}

// Ministry compliance check
const ministryCompliance = tests.every(t => !t.hasXMarkers)
console.log(`Ministry compliance: ${ministryCompliance ? '✅ PASS' : '❌ FAIL'}`)
console.log(`Parser fix status: ${passed === tests.length ? '✅ READY FOR PRODUCTION' : '❌ NEEDS FIXES'}`)
console.log('')

// Exit code
process.exit(failed > 0 ? 1 : 0)
