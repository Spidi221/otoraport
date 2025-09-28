#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

// Konfiguracja Supabase - dane z LOGIN-CREDENTIALS.md
const supabaseUrl = 'https://maichqozswcomegcsaqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDatabase() {
  console.log('🔍 Inspecting Supabase database...\n');

  // Lista wszystkich tabel
  const { data: tables, error: tablesError } = await supabase.rpc('get_table_list');

  if (tablesError) {
    console.log('❌ Error getting tables:', tablesError.message);
    // Fallback - sprawdź główne tabele ręcznie
    await checkMainTables();
    return;
  }

  console.log('📊 Tables found:', tables);
}

async function checkMainTables() {
  const mainTables = ['developers', 'projects', 'properties', 'subscriptions', 'uploaded_files'];

  for (const table of mainTables) {
    try {
      console.log(`\n📋 Table: ${table}`);

      // Count records
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`  ❌ Error: ${countError.message}`);
        continue;
      }

      console.log(`  📈 Records: ${count}`);

      // Sample data (first 3 records)
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(3);

      if (error) {
        console.log(`  ❌ Error getting data: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        console.log(`  🔍 Sample record:`, Object.keys(data[0]));
        console.log(`  📄 Structure:`, JSON.stringify(data[0], null, 2));
      }

    } catch (err) {
      console.log(`  ❌ Error inspecting ${table}:`, err.message);
    }
  }
}

async function runQuery(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.log('❌ SQL Error:', error.message);
      return;
    }

    console.log('✅ Query Result:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  if (command === 'query' && process.argv[3]) {
    await runQuery(process.argv[3]);
  } else if (command === 'inspect') {
    await inspectDatabase();
  } else {
    console.log(`
🛠️  Database Inspector Commands:

node db-inspector.js inspect                    - Show all tables and structure
node db-inspector.js query "SELECT * FROM..."  - Run custom SQL query

Examples:
node db-inspector.js inspect
node db-inspector.js query "SELECT COUNT(*) FROM developers"
node db-inspector.js query "SELECT * FROM properties LIMIT 5"
    `);

    // Default action - inspect
    await checkMainTables();
  }
}

main().catch(console.error);