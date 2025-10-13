/**
 * DEBUG ENDPOINT - Test RLS Policies
 * REMOVE THIS IN PRODUCTION!
 *
 * Tests if RLS policies work correctly by querying properties directly
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        authError: authError?.message
      }, { status: 401 })
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, client_id, user_id')
      .eq('user_id', user.id)
      .single()

    if (devError || !developer) {
      return NextResponse.json({
        error: 'Developer profile not found',
        devError: devError?.message,
        user_id: user.id
      }, { status: 404 })
    }

    // TEST 1: Count properties with RLS (regular client)
    const { count: rlsCount, error: rlsError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developer.id)

    // TEST 2: Count properties without RLS (admin client)
    const { count: adminCount, error: adminError } = await adminSupabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developer.id)

    // TEST 3: Get sample properties with RLS
    const { data: sampleProps, error: sampleError } = await supabase
      .from('properties')
      .select('id, apartment_number, developer_id')
      .eq('developer_id', developer.id)
      .limit(3)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      auth: {
        user_id: user.id,
        email: user.email
      },
      developer: {
        id: developer.id,
        client_id: developer.client_id,
        user_id: developer.user_id
      },
      tests: {
        rls_query: {
          count: rlsCount,
          error: rlsError?.message || null,
          working: !rlsError && rlsCount !== null
        },
        admin_query: {
          count: adminCount,
          error: adminError?.message || null,
          working: !adminError && adminCount !== null
        },
        sample_properties: {
          count: sampleProps?.length || 0,
          properties: sampleProps || [],
          error: sampleError?.message || null
        }
      },
      conclusion: {
        rls_enabled: !rlsError && rlsCount !== null,
        properties_accessible: (rlsCount || 0) > 0,
        issue: rlsCount === 0 && adminCount && adminCount > 0
          ? 'RLS is blocking access - policies might be wrong'
          : rlsCount === 0
          ? 'No properties in database for this developer'
          : null
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Unexpected error',
      message: error?.message,
      stack: error?.stack
    }, { status: 500 })
  }
}
