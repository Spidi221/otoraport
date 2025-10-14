#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nxghzexmwmkvhtxvtzed.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54Z2h6ZXhtd21rdmh0eHZ0emVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODA0ODI3NywiZXhwIjoyMDQzNjI0Mjc3fQ.Rx3T7v8HIMq6MvvSJmNSE-T9-o5ckEwxL85EKQm_Wv0'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking raw_csv_data table...')

// Check table exists and count rows
const { data, error, count } = await supabase
  .from('raw_csv_data')
  .select('*', { count: 'exact', head: true })

if (error) {
  console.error('❌ Error querying raw_csv_data:', error.message)
  process.exit(1)
}

console.log(`✅ Table exists. Total rows: ${count}`)

if (count > 0) {
  // Get sample data
  const { data: sampleData, error: sampleError } = await supabase
    .from('raw_csv_data')
    .select('id, file_name, row_number, uploaded_at, raw_data')
    .order('uploaded_at', { ascending: false })
    .limit(3)

  if (sampleError) {
    console.error('❌ Error fetching sample data:', sampleError.message)
    process.exit(1)
  }

  console.log('\n📋 Sample data (3 most recent):')
  sampleData.forEach((row, idx) => {
    console.log(`\n--- Row ${idx + 1} ---`)
    console.log(`  File: ${row.file_name}`)
    console.log(`  Row #: ${row.row_number}`)
    console.log(`  Uploaded: ${new Date(row.uploaded_at).toLocaleString('pl-PL')}`)
    console.log(`  Raw data columns: ${Object.keys(row.raw_data).length}`)
    console.log(`  First 5 columns: ${Object.keys(row.raw_data).slice(0, 5).join(', ')}`)
  })
} else {
  console.log('⚠️ Table is empty - no data uploaded yet')
}
