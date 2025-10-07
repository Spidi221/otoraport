/**
 * PROPERTIES API - Single property update
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/api-schemas'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema
const updatePropertySchema = z.object({
  status: z.enum(['available', 'sold', 'reserved']).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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
    const validatedData = updatePropertySchema.parse(body)

    // Update property (RLS will verify ownership)
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update(validatedData)
      .eq('id', id)
      .eq('developer_id', developer.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ PROPERTY UPDATE: Error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (!updatedProperty) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 })
    }

    console.log(`✅ PROPERTY UPDATE: Updated property ${id} status to ${validatedData.status}`)

    return NextResponse.json({
      success: true,
      property: updatedProperty
    })

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('❌ PROPERTY UPDATE: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
