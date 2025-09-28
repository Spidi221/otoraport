#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

// Nowe klucze z zaktualizowanego LOGIN-CREDENTIALS.md
const supabaseUrl = 'https://maichqozswcomegcsaqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTUwMjMsImV4cCI6MjA3MzE3MTAyM30.j7gYhUUJA_-TLCmBCVSvB8lFhk_T16mAE2bvp9aFX-A';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8';

console.log('🔗 Testing connection with updated keys...\n');

async function testNewConnection() {
  // Test z Service Role Key - najpotężniejszy klucz
  console.log('🔑 Testing with Service Role Key...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Test podstawowy - lista tabel
    console.log('📋 1. Listing tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('❌ Error listing tables:', tablesError.message);
    } else {
      console.log('✅ Tables found:');
      tables.forEach(table => console.log(`   📄 ${table.table_name}`));
    }

    // Test 2 - sprawdź developers
    console.log('\n👥 2. Testing developers table...');
    const { data: devs, error: devsError, count } = await supabase
      .from('developers')
      .select('id, company_name, email', { count: 'exact' })
      .limit(5);

    if (devsError) {
      console.log('❌ Developers error:', devsError.message);
    } else {
      console.log(`✅ Developers table works! Found ${count} records`);
      if (devs && devs.length > 0) {
        console.log('📊 Sample data:', devs);
      }
    }

    // Test 3 - sprawdź properties
    console.log('\n🏠 3. Testing properties table...');
    const { data: props, error: propsError, count: propsCount } = await supabase
      .from('properties')
      .select('id, apartment_number, price_per_m2', { count: 'exact' })
      .limit(3);

    if (propsError) {
      console.log('❌ Properties error:', propsError.message);
    } else {
      console.log(`✅ Properties table works! Found ${propsCount} records`);
      if (props && props.length > 0) {
        console.log('📊 Sample properties:', props);
      }
    }

    // Test 4 - sprawdź subscriptions
    console.log('\n💰 4. Testing subscriptions table...');
    const { data: subs, error: subsError, count: subsCount } = await supabase
      .from('subscriptions')
      .select('id, plan_type, status', { count: 'exact' })
      .limit(3);

    if (subsError) {
      console.log('❌ Subscriptions error:', subsError.message);
    } else {
      console.log(`✅ Subscriptions table works! Found ${subsCount} records`);
      if (subs && subs.length > 0) {
        console.log('📊 Sample subscriptions:', subs);
      }
    }

  } catch (err) {
    console.log('💥 General error:', err.message);
  }
}

testNewConnection().catch(console.error);