const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...');
console.log('================================');
console.log('URL:', supabaseUrl);
console.log('Anon Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');
console.log('Service Key (first 20 chars):', supabaseServiceKey?.substring(0, 20) + '...');
console.log('================================\n');

// Test with anon key
async function testAnonKey() {
  console.log('Testing with ANON key...');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try to fetch from developers table (should fail without auth)
    const { data, error } = await supabase
      .from('developers')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Anon key test error:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error details:', error.details);
      
      // Check if it's an API key error
      if (error.message.includes('Invalid API key') || error.message.includes('apikey')) {
        console.log('\n⚠️  PROBLEM: Invalid API key - klucz jest nieprawidłowy!');
        return false;
      }
      
      // It's normal for anon key to not have access to developers table
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.log('✅ Anon key works (permission denied is expected)');
        return true;
      }
    } else {
      console.log('✅ Anon key works - connected successfully');
      return true;
    }
  } catch (err) {
    console.log('❌ Anon key connection failed:', err.message);
    return false;
  }
}

// Test with service role key
async function testServiceKey() {
  console.log('\nTesting with SERVICE ROLE key...');
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Try to count developers
    const { count, error } = await supabaseAdmin
      .from('developers')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Service key test error:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error details:', error.details);
      
      // Check if it's an API key error
      if (error.message.includes('Invalid API key') || error.message.includes('apikey')) {
        console.log('\n⚠️  PROBLEM: Invalid SERVICE ROLE key!');
        return false;
      }
    } else {
      console.log('✅ Service key works - found', count || 0, 'developers in database');
      return true;
    }
  } catch (err) {
    console.log('❌ Service key connection failed:', err.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const anonOk = await testAnonKey();
  const serviceOk = await testServiceKey();
  
  console.log('\n================================');
  console.log('TEST RESULTS:');
  console.log('Anon Key:', anonOk ? '✅ WORKING' : '❌ FAILED');
  console.log('Service Key:', serviceOk ? '✅ WORKING' : '❌ FAILED');
  
  if (!anonOk || !serviceOk) {
    console.log('\n⚠️  ACTION REQUIRED:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/maichqozswcomegcsaqg/settings/api');
    console.log('2. Copy the correct keys:');
    console.log('   - anon (public) key -> NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('   - service_role (secret) key -> SUPABASE_SERVICE_ROLE_KEY');
    console.log('3. Update .env.local file');
    console.log('4. Restart the application');
  }
  
  process.exit(anonOk && serviceOk ? 0 : 1);
}

runTests();