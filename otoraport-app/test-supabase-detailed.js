const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Detailed Supabase Test');
console.log('======================');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey);
console.log('');

// Test basic connection
async function testConnection() {
  console.log('Creating Supabase client...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Client created successfully');
    
    // Test auth methods
    console.log('\nTesting auth methods...');
    
    // Try to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('❌ getSession error:', sessionError);
    } else {
      console.log('✅ getSession works (no active session):', sessionData);
    }
    
    // Try to check if we can call auth methods
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      // This is expected when not logged in
      if (userError.message.includes('Invalid API key')) {
        console.log('❌ PROBLEM: Invalid API key detected!');
        console.log('   Error:', userError);
      } else if (userError.message.includes('not authenticated')) {
        console.log('✅ Auth works (not authenticated is expected)');
      } else {
        console.log('⚠️  Unexpected error:', userError.message);
      }
    }
    
    // Test if we can access public schema
    console.log('\nTesting database access...');
    
    // Create a test query
    const { data, error, status, statusText } = await supabase
      .from('developers')
      .select('id')
      .limit(1);
    
    console.log('Response status:', status);
    console.log('Response statusText:', statusText);
    
    if (error) {
      console.log('Database error:', error);
      
      // Check different error types
      if (error.message?.includes('Invalid API key')) {
        console.log('❌ CRITICAL: Invalid API key!');
        console.log('\nDEBUG INFO:');
        console.log('- Make sure the key is from the correct Supabase project');
        console.log('- Check if the key has not been regenerated');
        console.log('- Verify the key matches the project URL');
      } else if (error.code === '42501' || error.message?.includes('permission')) {
        console.log('✅ Database connection works (permission denied is expected for anon)');
      } else {
        console.log('⚠️  Other error:', error.code, '-', error.message);
      }
    } else {
      console.log('✅ Database query successful:', data);
    }
    
  } catch (err) {
    console.log('❌ Fatal error:', err);
    console.log('Stack:', err.stack);
  }
}

testConnection();