const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://maichqozswcomegcsaqg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTUwMjMsImV4cCI6MjA3MzE3MTAyM30.pFj72PPCCGZue4-M1hzhAjptuedJdY-qiS4gRWHAxVU';

console.log('=== TESTING SCHEMA FIX ===\n');

async function testSchemaFix() {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('1. Testing Service Role Database Access...');
  try {
    const { data: developers, error } = await supabaseAdmin
      .from('developers')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Service Role Error:', error);
      return false;
    } else {
      console.log('✅ Service Role - Developers table accessible:', developers.length, 'rows found');
    }
  } catch (error) {
    console.error('❌ Service Role Exception:', error.message);
    return false;
  }

  console.log('\n2. Testing Anonymous Client Access...');
  try {
    const { data: developers, error } = await supabase
      .from('developers')
      .select('id, email, name, company_name')
      .limit(5);

    if (error) {
      console.error('❌ Anonymous Error:', error);
      // This might fail due to RLS, but the connection should work
      if (error.code !== '42501' && error.code !== 'PGRST116') {
        return false;
      } else {
        console.log('✅ Anonymous Client - Connection works (RLS blocking access as expected)');
      }
    } else {
      console.log('✅ Anonymous Client - Query successful:', developers.length, 'rows');
    }
  } catch (error) {
    console.error('❌ Anonymous Exception:', error.message);
    return false;
  }

  console.log('\n3. Testing All Core Tables...');
  const tables = ['developers', 'projects', 'properties', 'uploaded_files', 'generated_files', 'payments'];

  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`❌ Table ${table}:`, error);
        return false;
      } else {
        console.log(`✅ Table ${table}: Accessible`);
      }
    } catch (error) {
      console.error(`❌ Table ${table} Exception:`, error.message);
      return false;
    }
  }

  console.log('\n4. Testing Database Insert Operation...');
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('developers')
      .insert({
        email: testEmail,
        name: 'Test User',
        client_id: `test-${Date.now()}`
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert Error:', insertError);
      return false;
    } else {
      console.log('✅ Insert successful:', insertData.email);

      // Clean up test data
      await supabaseAdmin
        .from('developers')
        .delete()
        .eq('id', insertData.id);
      console.log('✅ Test data cleaned up');
    }
  } catch (error) {
    console.error('❌ Insert Exception:', error.message);
    return false;
  }

  console.log('\n5. Testing Schema Information...');
  try {
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('pg_stat_user_tables')
      .select('schemaname, tablename, n_tup_ins, n_tup_upd');

    if (tableError) {
      // Try alternative approach
      const { data: columns, error: colError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('table_name, column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'developers')
        .limit(5);

      if (colError) {
        console.error('❌ Schema info error:', colError);
      } else {
        console.log('✅ Schema accessible - developers table has', columns.length, 'columns');
      }
    } else {
      console.log('✅ Database statistics accessible');
    }
  } catch (error) {
    console.log('⚠️  Schema info not accessible, but this is not critical');
  }

  console.log('\n6. Testing Specific Query from Frontend...');
  try {
    // This simulates the exact query that was failing
    const testUserId = '9a17b9b6-d601-40bb-9f01-2dbeab74290a';
    const { data: userDevelopers, error: userError } = await supabase
      .from('developers')
      .select('*')
      .eq('user_id', testUserId);

    if (userError) {
      if (userError.code === '42501' || userError.code === 'PGRST116') {
        console.log('✅ User query works (RLS properly blocking unauthorized access)');
      } else {
        console.error('❌ User query error:', userError);
        return false;
      }
    } else {
      console.log('✅ User query successful:', userDevelopers.length, 'rows');
    }
  } catch (error) {
    console.error('❌ User query exception:', error.message);
    return false;
  }

  return true;
}

testSchemaFix().then(success => {
  if (success) {
    console.log('\n🎉 SCHEMA FIX TEST PASSED!');
    console.log('✅ Database is working correctly');
    console.log('✅ PGRST002 error should be resolved');
    console.log('\nNext steps:');
    console.log('1. The frontend should now be able to connect');
    console.log('2. You may need to authenticate users properly');
    console.log('3. Check that RLS policies match your auth system');
  } else {
    console.log('\n❌ SCHEMA FIX TEST FAILED');
    console.log('The database still has issues that need to be resolved');
  }
}).catch(error => {
  console.error('\n💥 FATAL TEST ERROR:', error);
});