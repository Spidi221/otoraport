import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PropertyStatus } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get property IDs and new status from request
    const body = await request.json()
    const { propertyIds, newStatus } = body

    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Property IDs are required' },
        { status: 400 }
      )
    }

    if (!newStatus || !['available', 'reserved', 'sold'].includes(newStatus)) {
      return NextResponse.json(
        { success: false, error: 'Valid status is required (available, reserved, or sold)' },
        { status: 400 }
      )
    }

    console.log(`🔄 BULK STATUS: User ${user.email} changing status of ${propertyIds.length} properties to ${newStatus}`)

    // Get developer info
    const { data: developer } = await supabase
      .from('developers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!developer) {
      return NextResponse.json(
        { success: false, error: 'Developer profile not found' },
        { status: 404 }
      )
    }

    // Verify properties belong to this developer
    const { data: propertiesToUpdate, error: verifyError } = await supabase
      .from('properties')
      .select(`
        id,
        property_number,
        status,
        projects!inner(developer_id)
      `)
      .in('id', propertyIds)
      .eq('projects.developer_id', developer.id)

    if (verifyError) {
      console.error('❌ BULK STATUS: Verification error:', verifyError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify properties' },
        { status: 500 }
      )
    }

    if (!propertiesToUpdate || propertiesToUpdate.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No properties found or you do not have permission to update them' },
        { status: 403 }
      )
    }

    const verifiedIds = propertiesToUpdate.map(p => p.id)

    // Update the status
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        status: newStatus as PropertyStatus,
        updated_at: new Date().toISOString()
      })
      .in('id', verifiedIds)

    if (updateError) {
      console.error('❌ BULK STATUS: Update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update property status' },
        { status: 500 }
      )
    }

    console.log(`✅ BULK STATUS: Successfully updated ${verifiedIds.length} properties to ${newStatus}`)

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: verifiedIds.length,
        propertyIds: verifiedIds,
        newStatus
      }
    })

  } catch (error) {
    console.error('💥 BULK STATUS: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
