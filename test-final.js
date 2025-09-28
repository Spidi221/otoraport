#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

// Najnowsze klucze
const supabaseUrl = 'https://maichqozswcomegcsaqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTUwMjMsImV4cCI6MjA3MzE3MTAyM30.pFj72PPCCGZue4-M1hzhAjptuedJdY-qiS4gRWHAxVU';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8';

console.log('🔗 Final connection test after RLS disabled...\n');

async function finalTest() {
  // Użyj service key - najpotężniejszy
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔑 Using Service Role Key...');

  try {
    // Test 1: Raw SQL query
    console.log('\n🔍 Test 1: Raw SQL - Show tables');
    const { data: tables, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    });

    if (sqlError) {
      console.log('❌ SQL Error:', sqlError.message);
    } else {
      console.log('✅ SQL works:', tables);
    }

    // Test 2: Try different approach - schema introspection
    console.log('\n📋 Test 2: Try to list any public table');
    const possibleTables = ['developers', 'users', 'properties', 'accounts', 'sessions'];

    for (const tableName of possibleTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName}: Found! (${count} records)`);

          // If we found data, get sample
          if (count > 0) {
            const { data: sample } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);

            if (sample && sample[0]) {
              console.log(`    📄 Sample structure:`, Object.keys(sample[0]));
            }
          }
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: ${err.message}`);
      }
    }

    // Test 3: Direct database health check
    console.log('\n💓 Test 3: Database health check');
    const healthQuery = "SELECT version()";
    const { data: version, error: healthError } = await supabase.rpc('exec_sql', {
      sql: healthQuery
    });

    if (healthError) {
      console.log('❌ Health check failed:', healthError.message);
    } else {
      console.log('✅ Database is healthy:', version);
    }

  } catch (err) {
    console.log('💥 General error:', err.message);
    console.log('Stack:', err.stack);
  }
}

finalTest().catch(console.error);