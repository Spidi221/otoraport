import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth, getDeveloperProfile } from '@/lib/supabase-single'
import { supabaseAdmin } from '@/lib/supabase-single'

export async function GET(request: NextRequest) {
  try {
    console.log('🏠 PROPERTIES API: Getting user properties')

    // Authenticate user
    const user = await getServerAuth(request)
    if (!user) {
      console.log('❌ PROPERTIES API: Unauthorized - no user')
      return NextResponse.json({ error: 'Unauthorized - please sign in' }, { status: 401 })
    }

    // Get developer profile
    const developer = await getDeveloperProfile(user.id)
    if (!developer) {
      console.log('❌ PROPERTIES API: No developer profile found')
      return NextResponse.json({ error: 'Developer profile not found' }, { status: 404 })
    }

    console.log('✅ PROPERTIES API: Fetching properties for developer:', developer.client_id)

    // Get properties for this developer
    const { data: properties, error } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('developer_id', developer.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ PROPERTIES API: Database error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    console.log(`✅ PROPERTIES API: Found ${properties?.length || 0} properties`)

    return NextResponse.json({
      success: true,
      properties: properties || [],
      count: properties?.length || 0
    })

  } catch (error: any) {
    console.error('💥 PROPERTIES API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}