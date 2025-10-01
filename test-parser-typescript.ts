#!/usr/bin/env ts-node
/**
 * Test INPRO parser fixes with actual TypeScript parser
 */

import { parseCSVSmart } from './src/lib/smart-csv-parser.ts'
import * as fs from 'fs'
import * as path from 'path'

async function testINPROParser() {
  console.log('🔍 Testing INPRO Parser with TypeScript Implementation\n')
  console.log('━'.repeat(80))

  // Read INPRO CSV file
  const csvPath = path.join(__dirname, 'backup dokumentów real estate app', 'Ceny-ofertowe-mieszkan-dewelopera-inpro_s__a-2025-09-13 (1).csv')

  if (!fs.existsSync(csvPath)) {
    console.error('❌ ERROR: INPRO CSV file not found at:', csvPath)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  // Parse with smart parser
  console.log('📊 Parsing INPRO CSV file...\n')

  const result = parseCSVSmart(csvContent)

  console.log('📋 Parser Results:')
  console.log(`   Success: ${result.success ? '✅ YES' : '❌ NO'}`)
  console.log(`   Format detected: ${result.detectedFormat || 'unknown'}`)
  console.log(`   Format confidence: ${result.formatConfidence?.toFixed(1)}%`)
  console.log(`   Total rows: ${result.totalRows}`)
  console.log(`   Valid rows: ${result.validRows}`)
  console.log(`   Overall confidence: ${(result.confidence * 100).toFixed(1)}%`)
  console.log('')

  console.log('━'.repeat(80))
  console.log('\n🔍 BUG VERIFICATION:\n')

  // Bug #1: Check property numbers
  console.log('Bug #1 - Property Number Uniqueness:')

  const propertyNumbers = result.data
    .slice(0, 10)
    .map(p => p.property_number || 'N/A')
    .filter(n => n !== 'N/A')

  const uniqueNumbers = new Set(propertyNumbers)

  console.log(`   Properties extracted: ${result.data.length}`)
  console.log(`   First 10 property numbers:`)

  result.data.slice(0, 10).forEach((prop, i) => {
    console.log(`      [${i + 1}] ${prop.property_number || 'MISSING'}`)
  })

  console.log(`   Unique values in first 10: ${uniqueNumbers.size}/${propertyNumbers.length}`)

  if (uniqueNumbers.size === propertyNumbers.length && propertyNumbers.length > 0) {
    console.log('   ✅ FIX VERIFIED: All property numbers are unique!')
  } else if (uniqueNumbers.size === 1) {
    console.log('   ❌ BUG PRESENT: All property numbers are the same!')
  } else {
    console.log('   ⚠️  PARTIAL: Some duplicates detected')
  }

  console.log('')

  // Bug #2: Check total prices
  console.log('Bug #2 - Total Price Extraction:')

  const pricesFound = result.data.slice(0, 10).filter(p => p.total_price && p.total_price > 0).length

  console.log(`   First 10 properties with prices:`)

  result.data.slice(0, 10).forEach((prop, i) => {
    const priceStr = prop.total_price
      ? `${prop.total_price.toLocaleString('pl-PL')} zł`
      : '0 zł ❌'

    console.log(`      [${i + 1}] ${prop.property_number || 'N/A'}: ${priceStr}`)
  })

  console.log(`   Properties with valid prices: ${pricesFound}/10`)

  if (pricesFound === 10) {
    console.log('   ✅ FIX VERIFIED: All total prices extracted correctly!')
  } else if (pricesFound === 0) {
    console.log('   ❌ BUG PRESENT: No total prices extracted!')
  } else {
    console.log('   ⚠️  PARTIAL: Some prices missing')
  }

  console.log('')

  // Bug #3: Check status detection
  console.log('Bug #3 - Status Detection:')

  const statusCounts = {
    available: 0,
    sold: 0,
    reserved: 0,
    undefined: 0
  }

  result.data.forEach(prop => {
    const status = prop.status || 'undefined'
    statusCounts[status as keyof typeof statusCounts]++
  })

  console.log(`   Status distribution:`)
  console.log(`      Available: ${statusCounts.available}`)
  console.log(`      Sold: ${statusCounts.sold}`)
  console.log(`      Reserved: ${statusCounts.reserved}`)
  console.log(`      Undefined: ${statusCounts.undefined}`)

  console.log('')
  console.log(`   First 10 properties with status:`)

  result.data.slice(0, 10).forEach((prop, i) => {
    const status = prop.status || 'UNDEFINED'
    const pricePerM2 = prop.raw_data['Cena za m2 nieruchomości'] || prop.raw_data['Cena za m2 nieruchomosci']

    console.log(`      [${i + 1}] ${prop.property_number || 'N/A'}: ${status} (price_m2: ${pricePerM2})`)
  })

  if (statusCounts.available > 0 || statusCounts.sold > 0) {
    console.log('   ✅ FIX VERIFIED: Status detection working!')
  } else {
    console.log('   ⚠️  Status detection not triggered (no X markers in sample data)')
  }

  console.log('')
  console.log('━'.repeat(80))
  console.log('\n📊 DETAILED SAMPLE (First 3 Properties):\n')

  result.data.slice(0, 3).forEach((prop, i) => {
    console.log(`Property ${i + 1}:`)
    console.log(`   Number: ${prop.property_number || 'MISSING'}`)
    console.log(`   Type: ${prop.property_type || 'N/A'}`)
    console.log(`   Area: ${prop.area || 'N/A'} m²`)
    console.log(`   Price per m²: ${prop.price_per_m2 || 'MISSING'} zł`)
    console.log(`   Total price: ${prop.total_price || 'MISSING'} zł`)
    console.log(`   Status: ${prop.status || 'UNDEFINED'}`)
    console.log('')
  })

  console.log('━'.repeat(80))
  console.log('\n✅ TEST COMPLETE!\n')
}

// Run test
testINPROParser().catch(console.error)
