/**
 * PROPERTIES API - Bulk update multiple properties
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/api-schemas'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema
const bulkUpdateSchema = z.object({
  propertyIds: z.array(z.string()).min(1, 'At least one property ID required'),
  status: z.enum(['available', 'sold', 'reserved']),
})

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (devError || !developer) {
      return NextResponse.json({ error: 'Developer profile not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { propertyIds, status } = bulkUpdateSchema.parse(body)

    console.log(`🔄 BULK UPDATE: Updating ${propertyIds.length} properties to status: ${status}`)

    // Update multiple properties (RLS will verify ownership)
    const { data: updatedProperties, error: updateError } = await supabase
      .from('properties')
      .update({ status })
      .in('id', propertyIds)
      .eq('developer_id', developer.id)
      .select()

    if (updateError) {
      console.error('❌ BULK UPDATE: Error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const updatedCount = updatedProperties?.length || 0

    console.log(`✅ BULK UPDATE: Successfully updated ${updatedCount}/${propertyIds.length} properties`)

    return NextResponse.json({
      success: true,
      updatedCount,
      requestedCount: propertyIds.length,
      properties: updatedProperties,
    })

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('❌ BULK UPDATE: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
