#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://maichqozswcomegcsaqg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Verifying raw_csv_data columns for 2025-10-09.csv...\n')

// Get one sample record
const { data, error } = await supabase
  .from('raw_csv_data')
  .select('file_name, row_number, raw_data')
  .eq('file_name', '2025-10-09.csv')
  .limit(1)
  .single()

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

if (!data) {
  console.error('❌ No data found for 2025-10-09.csv')
  process.exit(1)
}

const rawData = data.raw_data
const columnCount = Object.keys(rawData).length

console.log(`📋 File: ${data.file_name}`)
console.log(`📍 Row number: ${data.row_number}`)
console.log(`📊 Total columns in raw_data: ${columnCount}\n`)

if (columnCount < 58) {
  console.log(`❌ FAIL: Expected at least 58 ministerial columns, found only ${columnCount}`)
  process.exit(1)
}

console.log(`✅ SUCCESS: Found ${columnCount} columns (58+ ministerial columns)\n`)

// Show first 10 column names
console.log('📝 First 10 column names:')
Object.keys(rawData).slice(0, 10).forEach((key, idx) => {
  console.log(`  ${idx + 1}. ${key}`)
})

console.log(`\n... and ${columnCount - 10} more columns`)

// Check for key ministerial columns
const keyColumns = [
  'Nazwa dewelopera',
  'Nr NIP',
  'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera',
  'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
  'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'
]

console.log('\n🔑 Key ministerial columns check:')
let allPresent = true
keyColumns.forEach(col => {
  const present = rawData.hasOwnProperty(col)
  console.log(`  ${present ? '✅' : '❌'} ${col}`)
  if (!present) allPresent = false
})

if (allPresent) {
  console.log('\n✅ ALL KEY COLUMNS PRESENT - Task 81.1 VERIFIED!')
} else {
  console.log('\n❌ SOME KEY COLUMNS MISSING')
  process.exit(1)
}
