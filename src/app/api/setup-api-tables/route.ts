import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    // Read the SQL script
    const sqlScript = readFileSync(
      join(process.cwd(), 'database-extensions-api-v1.sql'),
      'utf-8'
    );

    // Execute the SQL script
    const { data, error } = await createAdminClient.rpc('exec_sql', {
      sql_script: sqlScript
    });

    if (error) {
      // If the function doesn't exist, try executing individual statements
      console.log('exec_sql function not available, trying individual statements...');

      // Split SQL into statements and execute them one by one
      const statements = sqlScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      const results = [];
      for (const statement of statements) {
        try {
          const { error: stmtError } = await createAdminClient.rpc('exec', {
            sql: statement
          });

          if (stmtError) {
            // Try direct query execution
            const { error: queryError } = await createAdminClient.from('pg_stat_statements').select('*').limit(1);
            if (queryError) {
              // Use raw SQL execution
              const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
                method: 'POST',
                headers: {
                  'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                  'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sql: statement })
              });

              if (!response.ok) {
                console.warn(`Failed to execute statement: ${statement.substring(0, 100)}...`);
                results.push({ statement: statement.substring(0, 100), error: 'Failed to execute' });
              } else {
                results.push({ statement: statement.substring(0, 100), success: true });
              }
            }
          } else {
            results.push({ statement: statement.substring(0, 100), success: true });
          }
        } catch (err) {
          console.warn(`Error executing statement: ${statement.substring(0, 100)}...`, err);
          results.push({ statement: statement.substring(0, 100), error: err instanceof Error ? err.message : 'Unknown error' });
        }
      }

      return NextResponse.json({
        status: 'partial_success',
        message: 'Database setup completed with some warnings',
        timestamp: new Date().toISOString(),
        results,
        note: 'You may need to run the SQL script manually in Supabase SQL Editor'
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'API database tables created successfully',
      timestamp: new Date().toISOString(),
      data
    });

  } catch (error) {
    console.error('Setup API tables error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to setup API tables',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      note: 'Please run the database-extensions-api-v1.sql script manually in Supabase SQL Editor'
    }, { status: 500 });
  }
}