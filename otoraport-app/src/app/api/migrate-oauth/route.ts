import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting OAuth bridge migration...')

    // Read the migration file
    const migrationPath = join(process.cwd(), 'oauth-bridge-migration.sql')
    const migrationSql = readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration SQL loaded, length:', migrationSql.length)

    // Split into individual statements
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log('🔍 Found', statements.length, 'SQL statements to execute')

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.trim()) {
        try {
          console.log(`⚙️  Executing statement ${i + 1}/${statements.length}:`, statement.substring(0, 60) + '...')
          
          const { error } = await supabaseAdmin.rpc('exec_sql', { 
            sql: statement + ';' 
          })
          
          if (error) {
            console.error(`❌ Statement ${i + 1} failed:`, error)
            errors.push(`Statement ${i + 1}: ${error.message}`)
            errorCount++
          } else {
            console.log(`✅ Statement ${i + 1} succeeded`)
            successCount++
          }
        } catch (err: any) {
          console.error(`❌ Exception in statement ${i + 1}:`, err)
          errors.push(`Statement ${i + 1}: ${err.message}`)
          errorCount++
        }
      }
    }

    console.log(`📊 Migration completed: ${successCount} success, ${errorCount} errors`)

    // Test the migration by checking if bridge table exists
    try {
      const { data: bridgeTest } = await supabaseAdmin
        .from('user_developer_bridge')
        .select('id')
        .limit(1)

      console.log('✅ Bridge table accessible:', !!bridgeTest)
    } catch (err) {
      console.log('⚠️  Bridge table test failed:', err)
    }

    // Test the RPC function
    try {
      const { data: rpcTest, error: rpcError } = await supabaseAdmin
        .rpc('get_developer_by_nextauth_user', { user_id: 'test-user-id' })

      if (rpcError) {
        console.log('ℹ️  RPC function exists but no data for test user (expected)')
      } else {
        console.log('✅ RPC function working')
      }
    } catch (err) {
      console.log('⚠️  RPC function test failed:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'OAuth bridge migration completed',
      results: {
        successCount,
        errorCount,
        totalStatements: statements.length,
        errors: errorCount > 0 ? errors : undefined
      }
    })

  } catch (error: any) {
    console.error('❌ OAuth migration failed:', error)
    return NextResponse.json(
      { 
        error: 'OAuth migration failed', 
        details: error.message,
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Test endpoint to check migration status
  try {
    console.log('🔍 Checking OAuth migration status...')

    // Check if bridge table exists
    const { data: bridgeExists, error: bridgeError } = await supabaseAdmin
      .from('user_developer_bridge')
      .select('count(*)', { count: 'exact' })

    // Check if RPC function exists
    const { data: rpcTest, error: rpcError } = await supabaseAdmin
      .rpc('get_developer_by_nextauth_user', { user_id: 'test-user-id' })

    // Check NextAuth tables
    const { data: usersTable, error: usersError } = await supabaseAdmin
      .from('users')
      .select('count(*)', { count: 'exact' })

    const { data: accountsTable, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('count(*)', { count: 'exact' })

    return NextResponse.json({
      migration_status: {
        bridge_table_exists: !bridgeError,
        bridge_records_count: bridgeExists ? bridgeExists[0]?.count || 0 : 0,
        rpc_function_exists: rpcError?.code !== '42883', // Function not found
        nextauth_users_exists: !usersError,
        nextauth_users_count: usersTable ? usersTable[0]?.count || 0 : 0,
        nextauth_accounts_exists: !accountsError,
        nextauth_accounts_count: accountsTable ? accountsTable[0]?.count || 0 : 0,
        ready_for_oauth: !bridgeError && rpcError?.code !== '42883' && !usersError
      },
      errors: {
        bridge_error: bridgeError?.message,
        rpc_error: rpcError?.code === '42883' ? 'Function not found' : rpcError?.message,
        users_error: usersError?.message,
        accounts_error: accountsError?.message
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Status check failed', details: error.message },
      { status: 500 }
    )
  }
}