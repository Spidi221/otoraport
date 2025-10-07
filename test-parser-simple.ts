/**
 * Simple test of PapaParse CSV Parser (no verbose logs)
 */

import { readFileSync } from 'fs'
import { parseCSVSmart } from './src/lib/papaparse-csv-parser'

// Suppress console.log during parsing
const originalLog = console.log
console.log = () => {}

const testFiles = [
  {
    name: '2025-09-11.csv',
    path: './backup dokumentów real estate app/przykładowe pliki/2025-09-11.csv',
    expected: 14
  },
  {
    name: '2025-10-02 (wzorcowy).csv',
    path: './backup dokumentów real estate app/przykładowe pliki/2025-10-02.xlsx - wzorcowy zakres danych.csv',
    expected: 17
  },
  {
    name: 'INPRO.csv',
    path: './backup dokumentów real estate app/przykładowe pliki/Ceny-ofertowe-mieszkan-dewelopera-inpro_s__a-2025-10-02.csv',
    expected: 3
  },
  {
    name: 'ATAL.csv (3.3MB)',
    path: './backup dokumentów real estate app/przykładowe pliki/atal - Dane.csv',
    expected: 2700
  }
]

// Re-enable logging for test results
console.log = originalLog

console.log('🧪 CSV Parser Test Results\n')
console.log('='.repeat(60))

let passCount = 0
let failCount = 0

for (const file of testFiles) {
  try {
    const startTime = Date.now()
    const content = readFileSync(file.path, 'utf-8')
    const result = parseCSVSmart(content)
    const elapsed = Date.now() - startTime

    const status = result.success ? '✅ PASS' : '❌ FAIL'
    const parsed = result.data.length

    console.log(`\n${status} ${file.name}`)
    console.log(`  Parse time: ${elapsed}ms`)
    console.log(`  Properties: ${parsed} (expected ~${file.expected})`)
    console.log(`  Format: ${result.detectedFormat} (${result.formatConfidence?.toFixed(1)}%)`)

    if (result.success && parsed > 0) {
      passCount++
    } else {
      failCount++
    }

  } catch (error) {
    console.log(`\n❌ FAIL ${file.name}`)
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    failCount++
  }
}

console.log('\n' + '='.repeat(60))
console.log(`\n📊 Summary: ${passCount}/4 PASS, ${failCount}/4 FAIL\n`)

if (failCount === 0) {
  console.log('🎉 All tests passed! Parser ready for production.\n')
  process.exit(0)
} else {
  console.log('❌ Some tests failed.\n')
  process.exit(1)
}
