const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://maichqozswcomegcsaqg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTUwMjMsImV4cCI6MjA3MzE3MTAyM30.pFj72PPCCGZue4-M1hzhAjptuedJdY-qiS4gRWHAxVU';

console.log('=== SUPABASE DATABASE DIAGNOSTICS ===\n');

async function diagnoseDatabase() {
  // Test 1: Service Role Client
  console.log('1. Testing Service Role Client...');
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Service Role Error:', tablesError);
    } else {
      console.log('✅ Service Role - Tables found:', tables.map(t => t.table_name));
    }
  } catch (error) {
    console.error('❌ Service Role Exception:', error.message);
  }

  // Test 2: Anonymous Client
  console.log('\n2. Testing Anonymous Client...');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: developers, error: developersError } = await supabase
      .from('developers')
      .select('*')
      .limit(1);

    if (developersError) {
      console.error('❌ Anonymous Client Error:', developersError);
    } else {
      console.log('✅ Anonymous Client - Developers query successful:', developers.length, 'rows');
    }
  } catch (error) {
    console.error('❌ Anonymous Client Exception:', error.message);
  }

  // Test 3: Check if developers table exists
  console.log('\n3. Testing table existence...');
  try {
    const { data, error } = await supabaseAdmin
      .rpc('pg_get_tabledef', { table_name: 'developers' });

    if (error) {
      console.error('❌ Table definition error:', error);
    } else {
      console.log('✅ Developers table exists');
    }
  } catch (error) {
    console.error('❌ Table check exception:', error.message);
  }

  // Test 4: Direct connection test
  console.log('\n4. Testing direct connection...');
  try {
    const { data, error } = await supabaseAdmin
      .from('pg_stat_activity')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Direct connection error:', error);
    } else {
      console.log('✅ Database connection working');
    }
  } catch (error) {
    console.error('❌ Connection exception:', error.message);
  }

  // Test 5: Schema cache reload
  console.log('\n5. Attempting schema cache reload...');
  try {
    const { data, error } = await supabaseAdmin
      .rpc('pg_notify', {
        channel: 'pgrst',
        payload: 'reload schema'
      });

    if (error) {
      console.error('❌ Schema reload error:', error);
    } else {
      console.log('✅ Schema cache reload signal sent');
    }
  } catch (error) {
    console.error('❌ Schema reload exception:', error.message);
  }

  // Test 6: Check current user and permissions
  console.log('\n6. Checking current user and permissions...');
  try {
    const { data, error } = await supabaseAdmin
      .rpc('current_user');

    if (error) {
      console.error('❌ Current user error:', error);
    } else {
      console.log('✅ Current user:', data);
    }
  } catch (error) {
    console.error('❌ User check exception:', error.message);
  }
}

diagnoseDatabase().then(() => {
  console.log('\n=== DIAGNOSTICS COMPLETE ===');
}).catch(error => {
  console.error('Fatal error:', error);
});