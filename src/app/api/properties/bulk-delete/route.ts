/**
 * PROPERTIES API - Bulk delete multiple properties with cache invalidation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/api-schemas'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

// Validation schema
const bulkDeleteSchema = z.object({
  propertyIds: z.array(z.string()).min(1, 'At least one property ID required'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get developer profile with client_id
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, client_id')
      .eq('user_id', user.id)
      .single()

    if (devError || !developer) {
      return NextResponse.json({ error: 'Developer profile not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { propertyIds } = bulkDeleteSchema.parse(body)

    console.log(`🗑️  BULK DELETE: Attempting to delete ${propertyIds.length} properties`)

    // First, verify all properties belong to this developer (security check before transaction)
    const { data: propertiesToDelete, error: verifyError } = await supabase
      .from('properties')
      .select('id')
      .in('id', propertyIds)
      .eq('developer_id', developer.id)

    if (verifyError) {
      console.error('❌ BULK DELETE: Verification error:', verifyError)
      return NextResponse.json({ error: verifyError.message }, { status: 500 })
    }

    const verifiedIds = propertiesToDelete?.map(p => p.id) || []

    if (verifiedIds.length === 0) {
      return NextResponse.json({
        error: 'No properties found or you do not have permission to delete these properties'
      }, { status: 404 })
    }

    if (verifiedIds.length < propertyIds.length) {
      console.warn(`⚠️  BULK DELETE: Only ${verifiedIds.length}/${propertyIds.length} properties verified`)
    }

    // Delete properties in a transaction (all or nothing)
    // Note: Supabase uses RLS which ensures transactional integrity
    const { data: deletedProperties, error: deleteError } = await supabase
      .from('properties')
      .delete()
      .in('id', verifiedIds)
      .eq('developer_id', developer.id)
      .select()

    if (deleteError) {
      console.error('❌ BULK DELETE: Error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const deletedCount = deletedProperties?.length || 0

    console.log(`✅ BULK DELETE: Successfully deleted ${deletedCount} properties`)

    // CACHE INVALIDATION: Revalidate ministry endpoints after successful delete
    try {
      const clientId = developer.client_id

      // Revalidate all ministry data endpoints
      revalidatePath(`/api/public/${clientId}/data.xml`)
      revalidatePath(`/api/public/${clientId}/data.csv`)
      revalidatePath(`/api/public/${clientId}/data.md5`)

      console.log(`🔄 CACHE INVALIDATION: Revalidated ministry endpoints for client ${clientId}`)
    } catch (cacheError) {
      // Log cache invalidation errors but don't fail the request
      console.error('⚠️  CACHE INVALIDATION: Error revalidating paths:', cacheError)
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      requestedCount: propertyIds.length,
      verifiedCount: verifiedIds.length,
    })

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('❌ BULK DELETE: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
