// TASK #87.3: Quick smoke test for manual_overrides JSONB column
// This tests basic JSONB operations: insert, update, query

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

async function testManualOverrides() {
  console.log('🧪 Testing manual_overrides JSONB operations...\n')

  // Test 1: Get a property and check manual_overrides field
  console.log('Test 1: Verify manual_overrides field exists')
  const { data: properties, error: fetchError } = await supabase
    .from('properties')
    .select('id, apartment_number, manual_overrides')
    .limit(1)

  if (fetchError) {
    console.error('❌ Error fetching property:', fetchError)
    return
  }

  if (!properties || properties.length === 0) {
    console.log('⚠️  No properties found in database')
    return
  }

  const property = properties[0]
  console.log('✅ Property fetched:', {
    id: property.id,
    apartment_number: property.apartment_number,
    manual_overrides: property.manual_overrides
  })

  // Test 2: Update manual_overrides with sample data
  console.log('\nTest 2: Update manual_overrides with sample data')
  const sampleOverrides = {
    wojewodztwo_siedziby: 'mazowieckie',
    email: 'test@example.com',
    parking_price: '50000'
  }

  const { error: updateError } = await supabase
    .from('properties')
    .update({ manual_overrides: sampleOverrides })
    .eq('id', property.id)

  if (updateError) {
    console.error('❌ Error updating manual_overrides:', updateError)
    return
  }

  console.log('✅ Updated manual_overrides:', sampleOverrides)

  // Test 3: Query properties with specific override key (tests GIN index)
  console.log('\nTest 3: Query properties with wojewodztwo_siedziby override (uses GIN index)')
  const { data: filtered, error: queryError } = await supabase
    .from('properties')
    .select('id, apartment_number, manual_overrides')
    .filter('manual_overrides', 'cs', JSON.stringify({ wojewodztwo_siedziby: 'mazowieckie' }))
    .limit(5)

  if (queryError) {
    console.error('❌ Error querying with JSONB filter:', queryError)
    return
  }

  console.log(`✅ Found ${filtered?.length || 0} properties with wojewodztwo_siedziby override`)

  // Test 4: Clear manual_overrides (reset to empty object)
  console.log('\nTest 4: Clear manual_overrides')
  const { error: clearError } = await supabase
    .from('properties')
    .update({ manual_overrides: {} })
    .eq('id', property.id)

  if (clearError) {
    console.error('❌ Error clearing manual_overrides:', clearError)
    return
  }

  console.log('✅ Cleared manual_overrides (reset to {})')

  console.log('\n🎉 All manual_overrides JSONB tests passed!')
}

testManualOverrides().catch(console.error)
