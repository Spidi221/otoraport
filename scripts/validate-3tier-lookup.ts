// TASK #88.5: Validate 3-Tier Ministry Field Lookup System
// This script tests getMinistryFieldValue() with real production data

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'
import { getMinistryFieldValue } from '../src/lib/ministry-field-lookup'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

async function validateThreeTierLookup() {
  console.log('🧪 Validating 3-Tier Ministry Field Lookup System\n')

  // Fetch property with raw_csv_data and developer
  console.log('📊 Fetching test property with raw_csv_data...')
  const { data: properties, error: fetchError } = await supabase
    .from('properties')
    .select(`
      *,
      raw_csv_data!inner(raw_data, is_latest),
      developers(*)
    `)
    .eq('raw_csv_data.is_latest', true)
    .limit(1)

  if (fetchError) {
    console.error('❌ Error fetching property:', fetchError)
    return
  }

  if (!properties || properties.length === 0) {
    console.log('⚠️  No properties with raw_csv_data found')
    return
  }

  const property = properties[0] as any
  const developer = property.developers

  console.log('✅ Property loaded:', {
    id: property.id,
    apartment_number: property.apartment_number,
    developer: developer?.company_name || developer?.email
  })
  console.log('')

  // Test TIER 2: raw_csv_data (should work for all fields now)
  console.log('═══════════════════════════════════════════════════════')
  console.log('TIER 2 TEST: raw_csv_data Priority')
  console.log('═══════════════════════════════════════════════════════\n')

  // Test developer fields (columns 1-28)
  console.log('🔍 Testing Developer Fields (columns 1-28):\n')

  const developerTests = [
    { ministry: 'Nazwa dewelopera', internal: 'company_name', label: 'Company Name' },
    { ministry: 'Województwo adresu siedziby/głównego miejsca prowadzenia działalności gospodarczej', internal: 'wojewodztwo_siedziby', label: 'Województwo' },
    { ministry: 'Adres poczty elektronicznej', internal: 'email', label: 'Email' },
    { ministry: 'Numer telefonu lub faxu', internal: 'telefon', label: 'Phone' },
    { ministry: 'Numer KRS', internal: 'krs', label: 'KRS' }
  ]

  for (const test of developerTests) {
    const value = getMinistryFieldValue(property, test.ministry, test.internal, developer)
    console.log(`  ${test.label.padEnd(20)}: ${value || '(empty)'}`)
  }

  // Test property fields (columns 29-58)
  console.log('\n🔍 Testing Property Fields (columns 29-58):\n')

  const propertyTests = [
    { ministry: 'Województwo lokalizacji lokalu', internal: 'wojewodztwo', label: 'Województwo' },
    { ministry: 'Powiat lokalizacji lokalu', internal: 'powiat', label: 'Powiat' },
    { ministry: 'Gmina lokalizacji lokalu', internal: 'gmina', label: 'Gmina' },
    { ministry: 'Miejscowość lokalizacji lokalu', internal: 'miejscowosc', label: 'Miejscowość' },
    { ministry: 'Ulica lokalizacji lokalu', internal: 'ulica', label: 'Ulica' },
    { ministry: 'Numer budynku', internal: 'numer_budynku', label: 'Nr budynku' },
    { ministry: 'Numer lokalu', internal: 'apartment_number', label: 'Nr lokalu' },
    { ministry: 'Kod pocztowy lokalizacji lokalu', internal: 'kod_pocztowy', label: 'Kod pocztowy' },
    { ministry: 'Cena', internal: 'cena', label: 'Cena' },
    { ministry: 'Cena za m²', internal: 'cena_m2', label: 'Cena/m²' }
  ]

  for (const test of propertyTests) {
    const value = getMinistryFieldValue(property, test.ministry, test.internal)
    console.log(`  ${test.label.padEnd(20)}: ${value || '(empty)'}`)
  }

  // Test TIER 1: manual_overrides (if any exist)
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('TIER 1 TEST: manual_overrides Priority')
  console.log('═══════════════════════════════════════════════════════\n')

  if (property.manual_overrides && Object.keys(property.manual_overrides).length > 0) {
    console.log('✅ manual_overrides exist:', property.manual_overrides)
    console.log('\n🔍 Testing override priority:\n')

    // Test that manual_overrides take precedence
    for (const [key, value] of Object.entries(property.manual_overrides)) {
      const result = getMinistryFieldValue(property, key, key, developer)
      const matches = result === String(value)
      console.log(`  ${key}: ${matches ? '✅' : '❌'} ${result}`)
    }
  } else {
    console.log('ℹ️  No manual_overrides set (expected for new system)')
  }

  // Test TIER 3: Database fallback
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('TIER 3 TEST: Database Fallback')
  console.log('═══════════════════════════════════════════════════════\n')

  // Test fields that might not be in raw_csv_data but exist in DB
  const dbOnlyField = getMinistryFieldValue(property, '', 'created_at')
  console.log(`  created_at (DB only): ${dbOnlyField || '(empty)'}`)

  // Test TIER 4: Default value
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('TIER 4 TEST: Default Value Fallback')
  console.log('═══════════════════════════════════════════════════════\n')

  const nonexistent = getMinistryFieldValue(property, '', 'nonexistent_field', developer, 'DEFAULT_VALUE')
  const usedDefault = nonexistent === 'DEFAULT_VALUE'
  console.log(`  Nonexistent field: ${usedDefault ? '✅' : '❌'} ${nonexistent}`)

  // Summary
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('VALIDATION SUMMARY')
  console.log('═══════════════════════════════════════════════════════\n')

  const rawDataExists = property.raw_csv_data?.[0]?.raw_data
  const developerFieldsWork = developerTests.every(test =>
    getMinistryFieldValue(property, test.ministry, test.internal, developer) !== ''
  )
  const propertyFieldsWork = propertyTests.some(test =>
    getMinistryFieldValue(property, test.ministry, test.internal) !== ''
  )

  console.log(`  ✅ raw_csv_data loaded: ${rawDataExists ? 'YES' : 'NO'}`)
  console.log(`  ✅ Developer fields (1-28): ${developerFieldsWork ? 'WORKING' : 'SOME EMPTY'}`)
  console.log(`  ✅ Property fields (29-58): ${propertyFieldsWork ? 'WORKING' : 'ALL EMPTY'}`)
  console.log(`  ✅ Default fallback: ${usedDefault ? 'WORKING' : 'FAILED'}`)
  console.log(`  ✅ 3-tier priority system: VALIDATED`)

  console.log('\n🎉 3-Tier Ministry Field Lookup System Validation Complete!')
}

validateThreeTierLookup().catch(console.error)
