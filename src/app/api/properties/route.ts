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

    // Parse pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    console.log(`📄 PROPERTIES API: Pagination - page: ${page}, limit: ${limit}, offset: ${offset}`)

    // First get developer's projects
    const { data: projects } = await createAdminClient()
      .from('projects')
      .select('id')
      .eq('developer_id', developer.id)

    const projectIds = projects?.map(p => p.id) || []

    if (projectIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: limit,
          totalPages: 0
        }
      })
    }

    // Get total count first (without pagination)
    const { count: totalCount } = await createAdminClient()
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .in('project_id', projectIds)

    // Then get paginated properties
    const { data: properties, error } = await createAdminClient()
      .from('properties')
      .select('id, project_id, raw_data, created_at, updated_at')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ PROPERTIES API: Database error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    console.log(`✅ PROPERTIES API: Found ${properties?.length || 0} properties (page ${page} of ${Math.ceil((totalCount || 0) / limit)})`)

    // CRITICAL FIX: Extract data from nested raw_data JSONB structure
    // CSV parser stores: { raw_data: { property_number: X, raw_data: { "CSV Column": value } } }
    const transformedProperties = properties?.map(prop => {
      const rawData = (prop.raw_data as any) || {}

      // Helper: Get value from raw_data with fallback to nested raw_data.raw_data
      const getValue = (field: string, ministryColumn?: string): any => {
        // Check top level first
        if (rawData[field] !== undefined && rawData[field] !== null && rawData[field] !== '') {
          return rawData[field]
        }

        // Check nested raw_data
        const nestedData = rawData.raw_data || {}

        // Try ministry column name first (exact match from CSV)
        if (ministryColumn && nestedData[ministryColumn] !== undefined && nestedData[ministryColumn] !== null && nestedData[ministryColumn] !== '') {
          const value = nestedData[ministryColumn]
          // Parse numbers if string
          if (typeof value === 'string') {
            const parsed = parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''))
            return isNaN(parsed) ? value : parsed
          }
          return value
        }

        // Try field name
        if (nestedData[field] !== undefined && nestedData[field] !== null && nestedData[field] !== '') {
          const value = nestedData[field]
          // Parse numbers if string
          if (typeof value === 'string') {
            const parsed = parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''))
            return isNaN(parsed) ? value : parsed
          }
          return value
        }

        return null
      }

      return {
        id: prop.id,
        project_id: prop.project_id,
        property_number: getValue('property_number', 'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera') || getValue('apartment_number') || 'N/A',
        property_type: getValue('property_type') || 'mieszkanie',
        area: getValue('area', 'Powierzchnia użytkowa lokalu mieszkalnego lub powierzchnia domu jednorodzinnego [m2]') || getValue('surface_area') || 0,
        price_per_m2: getValue('price_per_m2', 'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]') || 0,
        total_price: getValue('total_price', 'Cena lokalu mieszkalnego lub domu jednorodzinnego [zł]') || getValue('base_price') || 0,
        final_price: getValue('final_price') || getValue('total_price', 'Cena lokalu mieszkalnego lub domu jednorodzinnego [zł]') || getValue('base_price') || 0,
        status: getValue('status') || getValue('status_sprzedazy') || 'available',
        created_at: prop.created_at,
        updated_at: prop.updated_at
      }
    }) || []

    // Return paginated response format expected by frontend
    return NextResponse.json({
      success: true,
      data: transformedProperties,
      pagination: {
        total: totalCount || 0,
        page: page,
        limit: limit,
        totalPages: Math.ceil((totalCount || 0) / limit)
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