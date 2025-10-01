import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get property IDs from request
    const body = await request.json()
    const { propertyIds } = body

    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Property IDs are required' },
        { status: 400 }
      )
    }

    console.log(`🗑️ BULK DELETE: User ${user.email} deleting ${propertyIds.length} properties`)

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

    // Verify properties belong to this developer and delete them
    // First, get the properties through projects to verify ownership
    const { data: propertiesToDelete, error: verifyError } = await supabase
      .from('properties')
      .select(`
        id,
        property_number,
        projects!inner(developer_id)
      `)
      .in('id', propertyIds)
      .eq('projects.developer_id', developer.id)

    if (verifyError) {
      console.error('❌ BULK DELETE: Verification error:', verifyError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify properties' },
        { status: 500 }
      )
    }

    if (!propertiesToDelete || propertiesToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No properties found or you do not have permission to delete them' },
        { status: 403 }
      )
    }

    const verifiedIds = propertiesToDelete.map(p => p.id)

    // Delete the properties
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .in('id', verifiedIds)

    if (deleteError) {
      console.error('❌ BULK DELETE: Delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete properties' },
        { status: 500 }
      )
    }

    console.log(`✅ BULK DELETE: Successfully deleted ${verifiedIds.length} properties`)

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: verifiedIds.length,
        propertyIds: verifiedIds
      }
    })

  } catch (error) {
    console.error('💥 BULK DELETE: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
