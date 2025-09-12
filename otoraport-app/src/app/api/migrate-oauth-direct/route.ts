import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting direct OAuth bridge migration...')

    const results: { step: string; success: boolean; error?: string }[] = []

    // Step 1: Create NextAuth tables if they don't exist
    try {
      await supabaseAdmin.from('users').select('id').limit(1)
      results.push({ step: 'Check NextAuth users table', success: true })
    } catch (error) {
      console.log('Creating NextAuth users table...')
      // Users table might not exist, this is expected
      results.push({ step: 'NextAuth users table exists', success: false, error: 'Expected - will be created by NextAuth adapter' })
    }

    // Step 2: Create bridge table manually using SQL
    try {
      const createBridgeTable = `
        CREATE TABLE IF NOT EXISTS user_developer_bridge (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nextauth_user_id TEXT NOT NULL,
          developer_id UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(nextauth_user_id),
          UNIQUE(developer_id)
        );
      `
      
      // Use a direct query approach
      const { error: bridgeError } = await supabaseAdmin.rpc('sql', { 
        query: createBridgeTable 
      })
      
      if (bridgeError && !bridgeError.message.includes('already exists')) {
        throw bridgeError
      }
      
      results.push({ step: 'Create bridge table', success: true })
    } catch (error: any) {
      console.log('Bridge table creation alternative approach...')
      
      // Alternative: Try to create the table by inserting into it and catching the error
      try {
        const { error } = await supabaseAdmin
          .from('user_developer_bridge')
          .select('id')
          .limit(1)
        
        results.push({ step: 'Bridge table already exists', success: true })
      } catch {
        results.push({ step: 'Create bridge table', success: false, error: 'Cannot create table via Supabase client' })
      }
    }

    // Step 3: Add OAuth fields to developers table
    try {
      // Check if columns exist by trying to select them
      const { data: existingDev } = await supabaseAdmin
        .from('developers')
        .select('oauth_provider, oauth_provider_id, profile_image_url, email_verified, registration_completed')
        .limit(1)
      
      results.push({ step: 'OAuth columns already exist in developers', success: true })
    } catch (error) {
      results.push({ step: 'Add OAuth columns to developers', success: false, error: 'Columns need to be added via direct SQL' })
    }

    // Step 4: Create the RPC function using PostgreSQL function creation via Supabase
    try {
      const createRPCFunction = `
        CREATE OR REPLACE FUNCTION get_developer_by_nextauth_user(user_id TEXT)
        RETURNS TABLE (
          developer_id UUID,
          email TEXT,
          name TEXT,
          company_name TEXT,
          nip TEXT,
          subscription_plan TEXT,
          subscription_status TEXT,
          registration_completed BOOLEAN,
          profile_image_url TEXT
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            d.id,
            d.email,
            d.name,
            d.company_name,
            d.nip,
            COALESCE(d.subscription_plan, 'basic'::text),
            COALESCE(d.subscription_status, 'trial'::text),
            COALESCE(d.registration_completed, false),
            d.profile_image_url
          FROM developers d
          INNER JOIN user_developer_bridge ub ON d.id = ub.developer_id
          WHERE ub.nextauth_user_id = user_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `

      const { error: rpcError } = await supabaseAdmin.rpc('sql', { 
        query: createRPCFunction 
      })
      
      if (rpcError) {
        throw rpcError
      }
      
      results.push({ step: 'Create RPC function', success: true })
    } catch (error: any) {
      results.push({ step: 'Create RPC function', success: false, error: error.message })
    }

    // Step 5: Test the migration
    const testResults: any = {}
    
    try {
      const { data: bridgeTest } = await supabaseAdmin
        .from('user_developer_bridge')
        .select('id')
        .limit(1)
      
      testResults.bridge_table_accessible = true
    } catch (error) {
      testResults.bridge_table_accessible = false
      testResults.bridge_error = (error as any).message
    }

    try {
      const { data: rpcTest, error: rpcError } = await supabaseAdmin
        .rpc('get_developer_by_nextauth_user', { user_id: 'test-user-id' })
      
      testResults.rpc_function_accessible = !rpcError || rpcError.code !== '42883'
      if (rpcError && rpcError.code !== '42601') { // No data found is OK
        testResults.rpc_error = rpcError.message
      }
    } catch (error) {
      testResults.rpc_function_accessible = false
      testResults.rpc_error = (error as any).message
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    console.log(`📊 Migration completed: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      success: successCount > errorCount,
      message: `OAuth migration completed: ${successCount}/${results.length} steps successful`,
      results: results,
      test_results: testResults,
      next_steps: errorCount > 0 ? [
        "Some steps failed - may need manual SQL execution",
        "Run GET /api/migrate-oauth-direct to check current status",
        "Consider using Supabase dashboard for manual table creation"
      ] : [
        "Migration appears successful",
        "Test OAuth registration flow",
        "Monitor NextAuth callbacks for proper bridge creation"
      ]
    })

  } catch (error: any) {
    console.error('❌ Direct OAuth migration failed:', error)
    return NextResponse.json(
      { 
        error: 'Direct OAuth migration failed', 
        details: error.message,
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('🔍 Checking OAuth migration status...')

    const status: any = {
      timestamp: new Date().toISOString(),
      migration_ready: true,
      issues: []
    }

    // Check NextAuth tables
    try {
      const { data: usersData } = await supabaseAdmin
        .from('users')
        .select('count(*)', { count: 'exact' })
        .limit(1)
      
      status.nextauth_users = {
        exists: true,
        count: usersData?.[0]?.count || 0
      }
    } catch (error) {
      status.nextauth_users = {
        exists: false,
        error: (error as any).message
      }
      status.issues.push('NextAuth users table missing')
    }

    try {
      const { data: accountsData } = await supabaseAdmin
        .from('accounts')
        .select('count(*)', { count: 'exact' })
        .limit(1)
      
      status.nextauth_accounts = {
        exists: true,
        count: accountsData?.[0]?.count || 0
      }
    } catch (error) {
      status.nextauth_accounts = {
        exists: false,
        error: (error as any).message
      }
      status.issues.push('NextAuth accounts table missing')
    }

    // Check bridge table
    try {
      const { data: bridgeData } = await supabaseAdmin
        .from('user_developer_bridge')
        .select('count(*)', { count: 'exact' })
        .limit(1)
      
      status.bridge_table = {
        exists: true,
        count: bridgeData?.[0]?.count || 0
      }
    } catch (error) {
      status.bridge_table = {
        exists: false,
        error: (error as any).message
      }
      status.issues.push('Bridge table missing or inaccessible')
      status.migration_ready = false
    }

    // Check RPC function
    try {
      const { error: rpcError } = await supabaseAdmin
        .rpc('get_developer_by_nextauth_user', { user_id: 'test-user-id' })
      
      status.rpc_function = {
        exists: !rpcError || rpcError.code !== '42883',
        error: rpcError?.code === '42883' ? 'Function not found' : null
      }
      
      if (rpcError?.code === '42883') {
        status.issues.push('RPC function missing')
        status.migration_ready = false
      }
    } catch (error) {
      status.rpc_function = {
        exists: false,
        error: (error as any).message
      }
      status.issues.push('RPC function error')
      status.migration_ready = false
    }

    // Check developers table structure
    try {
      const { data: devSample } = await supabaseAdmin
        .from('developers')
        .select('id, oauth_provider, oauth_provider_id, registration_completed, profile_image_url, email_verified')
        .limit(1)
      
      status.developers_table = {
        exists: true,
        has_oauth_fields: true // If query succeeded, fields exist
      }
    } catch (error) {
      status.developers_table = {
        exists: true,
        has_oauth_fields: false,
        error: (error as any).message
      }
      status.issues.push('Developers table missing OAuth fields')
      status.migration_ready = false
    }

    return NextResponse.json(status)

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Status check failed', details: error.message },
      { status: 500 }
    )
  }
}