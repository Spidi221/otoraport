const { createClient } = require('@supabase/supabase-js');

// Test Supabase connection
async function testSupabase() {
  const supabaseUrl = 'https://maichqozswcomegcsaqg.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔍 Testing Supabase connection...');

    // Test 1: List users
    console.log('📊 Checking auth users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Users error:', usersError);
    } else {
      console.log(`✅ Found ${users.users.length} users in auth`);
      users.users.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }

    // Test 2: Check developers table
    console.log('\n📊 Checking developers table...');
    const { data: developers, error: devError } = await supabase
      .from('developers')
      .select('*')
      .limit(10);

    if (devError) {
      console.error('❌ Developers error:', devError);
    } else {
      console.log(`✅ Found ${developers.length} developers`);
      developers.forEach(dev => {
        console.log(`   - ${dev.email} (client_id: ${dev.client_id})`);
      });
    }

    // Test 3: Specific user check
    console.log('\n🔍 Checking specific emails...');
    const testEmails = ['demo@otoraport.pl', 'chudziszewski221@gmail.com'];

    for (const email of testEmails) {
      const { data: user, error } = await supabase.auth.admin.getUserByEmail(email);
      if (error) {
        console.error(`❌ ${email}: ${error.message}`);
      } else if (user.user) {
        console.log(`✅ ${email}: exists, confirmed: ${user.user.email_confirmed_at ? 'YES' : 'NO'}`);
      } else {
        console.log(`❌ ${email}: not found`);
      }
    }

  } catch (error) {
    console.error('💥 Connection failed:', error.message);
  }
}

testSupabase();