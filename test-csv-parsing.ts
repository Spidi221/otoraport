/**
 * CSV Parsing Test Suite - Task 34
 * Tests smart-csv-parser.ts with real CSV files from backup directory
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseCSVSmart, validateMinistryCompliance } from './src/lib/smart-csv-parser'

interface TestResult {
  filename: string
  fileSize: string
  success: boolean
  totalRows: number
  validRows: number
  parsedProperties: number
  confidence: number
  detectedFormat?: string
  formatConfidence?: number
  mappedFields: number
  errors: string[]
  warnings: string[]
  complianceScore?: number
  validationStats?: {
    tooFewColumns: number
    emptyRows: number
    soldProperties: number
    invalidCriticalData: number
    successfullyParsed: number
  }
  executionTime: number
}

const TEST_FILES = [
  'backup dokumentów real estate app/przykładowe pliki/2025-09-11.csv',
  'backup dokumentów real estate app/przykładowe pliki/2025-10-02.xlsx - wzorcowy zakres danych.csv',
  'backup dokumentów real estate app/przykładowe pliki/Ceny-ofertowe-mieszkan-dewelopera-inpro_s__a-2025-10-02.csv',
  'backup dokumentów real estate app/przykładowe pliki/atal - Dane.csv',
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

async function testCSVFile(filePath: string): Promise<TestResult> {
  const startTime = Date.now()

  console.log(`\n${'='.repeat(80)}`)
  console.log(`📂 Testing: ${path.basename(filePath)}`)
  console.log('='.repeat(80))

  const result: TestResult = {
    filename: path.basename(filePath),
    fileSize: '0 B',
    success: false,
    totalRows: 0,
    validRows: 0,
    parsedProperties: 0,
    confidence: 0,
    mappedFields: 0,
    errors: [],
    warnings: [],
    executionTime: 0
  }

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      result.errors.push(`File not found: ${filePath}`)
      return result
    }

    // Get file stats
    const stats = fs.statSync(filePath)
    result.fileSize = formatBytes(stats.size)
    console.log(`📊 File Size: ${result.fileSize}`)

    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8')
    console.log(`✅ File read successfully (${content.length} characters)`)

    // Parse CSV
    console.log('🔄 Parsing CSV...')
    const parseResult = parseCSVSmart(content)

    // Update result
    result.success = parseResult.success
    result.totalRows = parseResult.totalRows
    result.validRows = parseResult.validRows
    result.parsedProperties = parseResult.data.length
    result.confidence = parseResult.confidence
    result.detectedFormat = parseResult.detectedFormat
    result.formatConfidence = parseResult.formatConfidence
    result.mappedFields = Object.keys(parseResult.mappings).length
    result.errors = parseResult.errors
    result.validationStats = parseResult.validationStats

    console.log(`\n📋 PARSE RESULTS:`)
    console.log(`   ✓ Success: ${parseResult.success ? '✅ YES' : '❌ NO'}`)
    console.log(`   ✓ Format: ${parseResult.detectedFormat?.toUpperCase()} (${parseResult.formatConfidence?.toFixed(1)}%)`)
    console.log(`   ✓ Total Rows: ${parseResult.totalRows}`)
    console.log(`   ✓ Valid Rows: ${parseResult.validRows}`)
    console.log(`   ✓ Parsed Properties: ${parseResult.data.length}`)
    console.log(`   ✓ Confidence: ${(parseResult.confidence * 100).toFixed(1)}%`)
    console.log(`   ✓ Mapped Fields: ${Object.keys(parseResult.mappings).length}`)

    if (parseResult.validationStats) {
      console.log(`\n📊 VALIDATION STATS:`)
      console.log(`   ✓ Successfully Parsed: ${parseResult.validationStats.successfullyParsed}`)
      console.log(`   ⚠ Empty Rows Skipped: ${parseResult.validationStats.emptyRows}`)
      console.log(`   ⚠ Too Few Columns: ${parseResult.validationStats.tooFewColumns}`)
      console.log(`   ⚠ Sold Properties: ${parseResult.validationStats.soldProperties}`)
      console.log(`   ⚠ Invalid Data: ${parseResult.validationStats.invalidCriticalData}`)
    }

    // Show sample of mapped fields
    console.log(`\n🗺️ FIELD MAPPINGS (first 10):`)
    Object.entries(parseResult.mappings).slice(0, 10).forEach(([field, header]) => {
      console.log(`   ${field} → "${header}"`)
    })

    // Show sample property data
    if (parseResult.data.length > 0) {
      const sample = parseResult.data[0]
      console.log(`\n🏠 SAMPLE PROPERTY DATA:`)
      console.log(`   Property Number: ${sample.property_number || 'N/A'}`)
      console.log(`   Area: ${sample.area || 'N/A'} m²`)
      console.log(`   Price per m²: ${sample.price_per_m2 || 'N/A'} PLN`)
      console.log(`   Total Price: ${sample.total_price || 'N/A'} PLN`)
      console.log(`   Status: ${sample.status || 'N/A'}`)
      console.log(`   Raw Data Keys: ${Object.keys(sample.raw_data).length} fields`)
    }

    // Validate Ministry compliance
    if (parseResult.data.length > 0) {
      console.log(`\n🏛️ MINISTRY COMPLIANCE CHECK:`)
      const compliance = validateMinistryCompliance(parseResult.data)
      result.complianceScore = compliance.complianceScore
      result.warnings = compliance.warnings

      console.log(`   ✓ Valid: ${compliance.valid ? '✅ YES' : '❌ NO'}`)
      console.log(`   ✓ Compliance Score: ${compliance.complianceScore}%`)
      console.log(`   ✓ Required Fields: ${compliance.totalRequiredFields}`)

      if (compliance.errors.length > 0) {
        console.log(`\n   ❌ ERRORS:`)
        compliance.errors.forEach(err => console.log(`      - ${err}`))
        result.errors.push(...compliance.errors)
      }

      if (compliance.warnings.length > 0) {
        console.log(`\n   ⚠️ WARNINGS (first 5):`)
        compliance.warnings.slice(0, 5).forEach(warn => console.log(`      - ${warn}`))
      }

      if (compliance.missingCriticalFields.length > 0) {
        console.log(`\n   🚫 MISSING CRITICAL FIELDS:`)
        compliance.missingCriticalFields.forEach(field => console.log(`      - ${field}`))
      }
    }

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    console.error(`\n❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  result.executionTime = Date.now() - startTime
  console.log(`\n⏱️ Execution Time: ${result.executionTime}ms`)

  return result
}

async function runAllTests() {
  console.log('🚀 STARTING CSV PARSING TESTS')
  console.log('=' .repeat(80))
  console.log('Task 34: Test CSV parsing with sample files')
  console.log('=' .repeat(80))

  const results: TestResult[] = []
  const projectRoot = process.cwd()

  for (const relativeFilePath of TEST_FILES) {
    const filePath = path.join(projectRoot, relativeFilePath)
    const result = await testCSVFile(filePath)
    results.push(result)
  }

  // Generate summary report
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(80))

  const successfulTests = results.filter(r => r.success).length
  const totalTests = results.length
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalTests
  const totalProperties = results.reduce((sum, r) => sum + r.parsedProperties, 0)
  const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0)

  console.log(`\n✅ Tests Passed: ${successfulTests}/${totalTests} (${Math.round(successfulTests/totalTests*100)}%)`)
  console.log(`📈 Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`)
  console.log(`🏠 Total Properties Parsed: ${totalProperties}`)
  console.log(`⏱️ Total Execution Time: ${totalExecutionTime}ms`)

  console.log(`\n📋 DETAILED RESULTS:\n`)

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${index + 1}. ${status} ${result.filename}`)
    console.log(`   Size: ${result.fileSize}`)
    console.log(`   Format: ${result.detectedFormat?.toUpperCase()} (${result.formatConfidence?.toFixed(1)}%)`)
    console.log(`   Rows: ${result.validRows}/${result.totalRows} valid`)
    console.log(`   Properties: ${result.parsedProperties}`)
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`)
    console.log(`   Mapped Fields: ${result.mappedFields}`)
    console.log(`   Compliance: ${result.complianceScore || 0}%`)
    console.log(`   Time: ${result.executionTime}ms`)

    if (result.errors.length > 0) {
      console.log(`   ❌ Errors: ${result.errors.length}`)
      result.errors.slice(0, 3).forEach(err => console.log(`      - ${err}`))
    }

    if (result.validationStats) {
      console.log(`   📊 Validation:`)
      console.log(`      Parsed: ${result.validationStats.successfullyParsed}`)
      console.log(`      Skipped: ${result.validationStats.emptyRows + result.validationStats.tooFewColumns + result.validationStats.soldProperties + result.validationStats.invalidCriticalData}`)
      console.log(`      (Empty: ${result.validationStats.emptyRows}, Sold: ${result.validationStats.soldProperties}, Invalid: ${result.validationStats.invalidCriticalData})`)
    }
    console.log()
  })

  // Generate markdown report
  const reportPath = path.join(projectRoot, '.coderabbit-analysis', 'CSV_PARSING_TEST_REPORT.md')
  generateMarkdownReport(results, reportPath)
  console.log(`\n📄 Full report saved to: ${reportPath}`)

  // Final verdict
  console.log(`\n${'='.repeat(80)}`)
  if (successfulTests === totalTests && avgConfidence > 0.7) {
    console.log('✅ ALL TESTS PASSED - CSV parser is working correctly!')
  } else if (successfulTests > 0) {
    console.log('⚠️ PARTIAL SUCCESS - Some tests passed, but issues detected')
  } else {
    console.log('❌ ALL TESTS FAILED - CSV parser needs fixes')
  }
  console.log('='.repeat(80))

  return results
}

function generateMarkdownReport(results: TestResult[], outputPath: string) {
  const timestamp = new Date().toISOString()

  let markdown = `# 📊 CSV Parsing Test Report - Task 34\n\n`
  markdown += `**Generated:** ${timestamp}\n`
  markdown += `**Test Files:** ${results.length}\n`
  markdown += `**Status:** ${results.filter(r => r.success).length}/${results.length} PASSED\n\n`
  markdown += `---\n\n`

  markdown += `## Executive Summary\n\n`
  const successRate = Math.round(results.filter(r => r.success).length / results.length * 100)
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length
  const totalProperties = results.reduce((sum, r) => sum + r.parsedProperties, 0)

  markdown += `- **Success Rate:** ${successRate}%\n`
  markdown += `- **Average Confidence:** ${(avgConfidence * 100).toFixed(1)}%\n`
  markdown += `- **Total Properties Parsed:** ${totalProperties}\n`
  markdown += `- **Total Execution Time:** ${results.reduce((sum, r) => sum + r.executionTime, 0)}ms\n\n`

  markdown += `---\n\n`

  results.forEach((result, index) => {
    markdown += `## Test ${index + 1}: ${result.filename}\n\n`
    markdown += `**Status:** ${result.success ? '✅ PASS' : '❌ FAIL'}\n\n`

    markdown += `### File Information\n\n`
    markdown += `- **Size:** ${result.fileSize}\n`
    markdown += `- **Detected Format:** ${result.detectedFormat?.toUpperCase()} (${result.formatConfidence?.toFixed(1)}% confidence)\n`
    markdown += `- **Execution Time:** ${result.executionTime}ms\n\n`

    markdown += `### Parsing Results\n\n`
    markdown += `- **Total Rows:** ${result.totalRows}\n`
    markdown += `- **Valid Rows:** ${result.validRows}\n`
    markdown += `- **Parsed Properties:** ${result.parsedProperties}\n`
    markdown += `- **Confidence:** ${(result.confidence * 100).toFixed(1)}%\n`
    markdown += `- **Mapped Fields:** ${result.mappedFields}\n\n`

    if (result.validationStats) {
      markdown += `### Validation Statistics\n\n`
      markdown += `- **Successfully Parsed:** ${result.validationStats.successfullyParsed}\n`
      markdown += `- **Empty Rows Skipped:** ${result.validationStats.emptyRows}\n`
      markdown += `- **Too Few Columns:** ${result.validationStats.tooFewColumns}\n`
      markdown += `- **Sold Properties:** ${result.validationStats.soldProperties}\n`
      markdown += `- **Invalid Data:** ${result.validationStats.invalidCriticalData}\n\n`
    }

    if (result.complianceScore !== undefined) {
      markdown += `### Ministry Compliance\n\n`
      markdown += `- **Compliance Score:** ${result.complianceScore}%\n`
      markdown += `- **Status:** ${result.complianceScore >= 77 ? '✅ COMPLIANT' : '⚠️ NON-COMPLIANT'}\n\n`
    }

    if (result.errors.length > 0) {
      markdown += `### Errors\n\n`
      result.errors.forEach(err => {
        markdown += `- ❌ ${err}\n`
      })
      markdown += `\n`
    }

    if (result.warnings.length > 0) {
      markdown += `### Warnings (first 5)\n\n`
      result.warnings.slice(0, 5).forEach(warn => {
        markdown += `- ⚠️ ${warn}\n`
      })
      markdown += `\n`
    }

    markdown += `---\n\n`
  })

  markdown += `## Final Verdict\n\n`
  if (successRate === 100 && avgConfidence > 0.7) {
    markdown += `✅ **ALL TESTS PASSED** - CSV parser is working correctly!\n\n`
    markdown += `The smart CSV parser successfully processed all test files with high confidence. ` +
                `The parser correctly detected format types, mapped columns, and validated data ` +
                `according to Ministry compliance requirements.\n`
  } else if (successRate > 50) {
    markdown += `⚠️ **PARTIAL SUCCESS** - Most tests passed, but some issues detected.\n\n`
    markdown += `Review the detailed results above for specific errors and warnings.\n`
  } else {
    markdown += `❌ **TESTS FAILED** - CSV parser needs fixes.\n\n`
    markdown += `Critical issues detected. Review error messages and fix parser logic.\n`
  }

  markdown += `\n---\n\n`
  markdown += `*Generated by test-csv-parsing.ts - Task 34*\n`

  // Ensure directory exists
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(outputPath, markdown, 'utf-8')
}

// Run tests
runAllTests()
  .then(() => {
    console.log('\n✅ Test suite completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  })
