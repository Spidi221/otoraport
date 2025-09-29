import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth, getDeveloperProfile } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

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

    // First get developer's projects
    const { data: projects } = await createAdminClient()
      .from('projects')
      .select('id')
      .eq('developer_id', developer.id)

    const projectIds = projects?.map(p => p.id) || []

    if (projectIds.length === 0) {
      return NextResponse.json({
        success: true,
        properties: []
      })
    }

    // Then get properties for those projects
    const { data: properties, error } = await createAdminClient()
      .from('properties')
      .select('id, project_id, raw_data, created_at, updated_at')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ PROPERTIES API: Database error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    console.log(`✅ PROPERTIES API: Found ${properties?.length || 0} properties`)

    // Transform properties - extract data from raw_data JSONB
    const transformedProperties = properties?.map(prop => ({
      id: prop.id,
      project_id: prop.project_id,
      property_number: (prop.raw_data as any)?.property_number || 'N/A',
      property_type: (prop.raw_data as any)?.property_type || 'mieszkanie',
      area: (prop.raw_data as any)?.area || 0,
      price_per_m2: (prop.raw_data as any)?.price_per_m2 || 0,
      total_price: (prop.raw_data as any)?.total_price || 0,
      final_price: (prop.raw_data as any)?.final_price || (prop.raw_data as any)?.total_price || 0,
      status: (prop.raw_data as any)?.status || 'available',
      created_at: prop.created_at,
      updated_at: prop.updated_at
    })) || []

    // Return paginated response format expected by frontend
    return NextResponse.json({
      success: true,
      data: transformedProperties,
      pagination: {
        total: transformedProperties.length,
        page: 1,
        limit: transformedProperties.length,
        totalPages: 1
      }
    })

  } catch (error: any) {
    console.error('💥 PROPERTIES API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}