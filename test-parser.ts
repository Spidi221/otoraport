#!/usr/bin/env ts-node
/**
 * Universal CSV Parser Test Suite
 * Tests parser with 3 different formats: Ministerial, INPRO, Custom
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseCSVSmart, SmartParseResult } from './src/lib/smart-csv-parser.ts'

interface TestResult {
  format: string
  filename: string
  success: boolean
  detectedFormat?: string
  formatConfidence?: number
  totalRows: number
  validRows: number
  mappedFields: number
  confidence: number
  criticalFieldsMapped: string[]
  missingCriticalFields: string[]
  errors: string[]
  sampleData?: any
}

const CRITICAL_FIELDS = [
  'property_number',
  'area',
  'price_per_m2',
  'total_price',
  'wojewodztwo',
  'powiat',
  'gmina'
]

function testCSVFile(filePath: string, expectedFormat: string): TestResult {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Testing: ${path.basename(filePath)}`)
  console.log(`Expected format: ${expectedFormat.toUpperCase()}`)
  console.log('='.repeat(80))

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const result: SmartParseResult = parseCSVSmart(fileContent)

    // Check which critical fields are mapped
    const criticalFieldsMapped: string[] = []
    const missingCriticalFields: string[] = []

    CRITICAL_FIELDS.forEach(field => {
      if (result.data.length > 0 && result.data[0][field as keyof typeof result.data[0]]) {
        criticalFieldsMapped.push(field)
      } else {
        // Check if it's in raw_data
        const hasInRawData = result.data.some(row =>
          row.raw_data && Object.keys(row.raw_data).some(key =>
            key.toLowerCase().includes(field.replace('_', ' '))
          )
        )
        if (hasInRawData) {
          criticalFieldsMapped.push(field + ' (in raw_data)')
        } else {
          missingCriticalFields.push(field)
        }
      }
    })

    const testResult: TestResult = {
      format: expectedFormat,
      filename: path.basename(filePath),
      success: result.success,
      detectedFormat: result.detectedFormat,
      formatConfidence: result.formatConfidence,
      totalRows: result.totalRows,
      validRows: result.validRows,
      mappedFields: Object.keys(result.mappings).length,
      confidence: result.confidence,
      criticalFieldsMapped,
      missingCriticalFields,
      errors: result.errors,
      sampleData: result.data[0]
    }

    // Print results
    console.log(`\n✅ PARSING SUCCESS`)
    console.log(`📋 Detected Format: ${result.detectedFormat?.toUpperCase()} (${result.formatConfidence?.toFixed(1)}% confidence)`)
    console.log(`📊 Rows: ${result.validRows}/${result.totalRows} valid`)
    console.log(`🗺️  Mapped Fields: ${Object.keys(result.mappings).length}`)
    console.log(`📈 Overall Confidence: ${(result.confidence * 100).toFixed(1)}%`)

    console.log(`\n🎯 Critical Fields Status:`)
    console.log(`   ✅ Mapped: ${criticalFieldsMapped.join(', ')}`)
    if (missingCriticalFields.length > 0) {
      console.log(`   ❌ Missing: ${missingCriticalFields.join(', ')}`)
    }

    console.log(`\n🔍 Sample Property Data:`)
    const sample = result.data[0]
    if (sample) {
      console.log(`   - Property Number: ${sample.property_number || 'N/A'}`)
      console.log(`   - Area: ${sample.area || 'N/A'} m²`)
      console.log(`   - Price per m²: ${sample.price_per_m2 || 'N/A'} PLN`)
      console.log(`   - Total Price: ${sample.total_price || 'N/A'} PLN`)
      console.log(`   - Location: ${sample.wojewodztwo || 'N/A'}, ${sample.powiat || 'N/A'}, ${sample.gmina || 'N/A'}`)
    }

    console.log(`\n📝 Top 10 Mapped Columns:`)
    const mappings = Object.entries(result.mappings).slice(0, 10)
    mappings.forEach(([field, column]) => {
      console.log(`   ${field} → "${column}"`)
    })

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`)
      result.errors.slice(0, 5).forEach(err => console.log(`   - ${err}`))
      if (result.errors.length > 5) {
        console.log(`   ... and ${result.errors.length - 5} more`)
      }
    }

    return testResult

  } catch (error) {
    console.error(`❌ PARSING FAILED:`, error)
    return {
      format: expectedFormat,
      filename: path.basename(filePath),
      success: false,
      totalRows: 0,
      validRows: 0,
      mappedFields: 0,
      confidence: 0,
      criticalFieldsMapped: [],
      missingCriticalFields: CRITICAL_FIELDS,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

// Main test execution
async function runTests() {
  console.log('\n')
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗')
  console.log('║                     OTORAPORT UNIVERSAL CSV PARSER TEST                   ║')
  console.log('║                              Version 1.0                                  ║')
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝')

  const results: TestResult[] = []

  // Test 1: INPRO Format
  const inproPath = path.join(__dirname, 'backup dokumentów real estate app', 'Ceny-ofertowe-mieszkan-dewelopera-inpro_s__a-2025-09-13 (1).csv')
  if (fs.existsSync(inproPath)) {
    results.push(testCSVFile(inproPath, 'inpro'))
  } else {
    console.log(`\n⚠️  INPRO test file not found: ${inproPath}`)
  }

  // Test 2: Custom Format
  const customPath = path.join(__dirname, 'dokumenty', 'wzorcowy_csv_template.csv')
  if (fs.existsSync(customPath)) {
    results.push(testCSVFile(customPath, 'custom'))
  } else {
    console.log(`\n⚠️  Custom test file not found: ${customPath}`)
  }

  // Test 3: Ministerial Format (if exists)
  const ministerialPath = path.join(__dirname, 'backup dokumentów real estate app', 'Wcorcowy_zakres_danych_dotyczących_cen_mieszkań (1).csv')
  if (fs.existsSync(ministerialPath)) {
    results.push(testCSVFile(ministerialPath, 'ministerial'))
  } else {
    console.log(`\n⚠️  Ministerial test file not found: ${ministerialPath}`)
  }

  // Summary Report
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('📊 COMPREHENSIVE TEST SUMMARY')
  console.log('='.repeat(80))

  const successCount = results.filter(r => r.success).length
  const totalTests = results.length

  console.log(`\n✅ Tests Passed: ${successCount}/${totalTests}`)

  console.log(`\n📋 Format Detection Accuracy:`)
  results.forEach(r => {
    const match = r.detectedFormat === r.format ? '✅' : '❌'
    console.log(`   ${match} ${r.filename}`)
    console.log(`      Expected: ${r.format.toUpperCase()} | Detected: ${r.detectedFormat?.toUpperCase()} (${r.formatConfidence?.toFixed(1)}%)`)
  })

  console.log(`\n📈 Field Mapping Coverage:`)
  results.forEach(r => {
    const coverage = (r.criticalFieldsMapped.length / CRITICAL_FIELDS.length * 100).toFixed(1)
    console.log(`   ${r.filename}: ${r.criticalFieldsMapped.length}/${CRITICAL_FIELDS.length} critical fields (${coverage}%)`)
  })

  console.log(`\n🎯 Overall Statistics:`)
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length
  const avgMappedFields = results.reduce((sum, r) => sum + r.mappedFields, 0) / results.length
  const totalValidRows = results.reduce((sum, r) => sum + r.validRows, 0)

  console.log(`   Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`)
  console.log(`   Average Mapped Fields: ${avgMappedFields.toFixed(1)}`)
  console.log(`   Total Valid Rows Parsed: ${totalValidRows}`)

  console.log(`\n${'='.repeat(80)}\n`)

  // Exit code based on success
  const allPassed = successCount === totalTests
  process.exit(allPassed ? 0 : 1)
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error)
  process.exit(1)
})
