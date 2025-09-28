#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

// Konfiguracja z LOGIN-CREDENTIALS.md
const supabaseUrl = 'https://maichqozswcomegcsaqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTUwMjMsImV4cCI6MjA3MzE3MTAyM30.j7gYhUUJA_-TLCmBCVSvB8lFhk_T16mAE2bvp9aFX-A';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8';

console.log('🔗 Testing Supabase connection...\n');

async function testConnection() {
  // Test 1: Basic connection with anon key
  console.log('📡 Test 1: Basic connection with anon key');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabaseAnon.from('developers').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('  ❌ Anon key error:', error.message);
    } else {
      console.log('  ✅ Anon key works! Developers count:', data);
    }
  } catch (err) {
    console.log('  ❌ Connection failed:', err.message);
  }

  // Test 2: Service role key
  console.log('\n📡 Test 2: Service role key');
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabaseService.from('developers').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('  ❌ Service key error:', error.message);
    } else {
      console.log('  ✅ Service key works! Developers count:', data);
    }
  } catch (err) {
    console.log('  ❌ Service connection failed:', err.message);
  }

  // Test 3: Check if URL is accessible
  console.log('\n🌐 Test 3: Check Supabase URL');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log('  📊 HTTP Status:', response.status);
    console.log('  📝 Status Text:', response.statusText);

    if (response.ok) {
      console.log('  ✅ URL is accessible');
    } else {
      console.log('  ❌ URL has issues');
    }
  } catch (err) {
    console.log('  ❌ URL not reachable:', err.message);
  }

  // Test 4: List tables using information_schema
  console.log('\n📋 Test 4: List tables');
  try {
    const { data, error } = await supabaseService
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.log('  ❌ Cannot list tables:', error.message);
    } else {
      console.log('  ✅ Tables found:');
      data.forEach(table => console.log('    -', table.table_name));
    }
  } catch (err) {
    console.log('  ❌ Error listing tables:', err.message);
  }
}

testConnection().catch(console.error);