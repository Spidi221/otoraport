/**
 * PROPERTIES API - List and create properties for authenticated developer
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/api-schemas'
import { enforcePropertyLimit, logLimitViolation } from '@/lib/middleware/subscription-limits'
import { canAccessFeature } from '@/lib/middleware/trial-middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get properties with pagination
    const { data: properties, error: propsError, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('developer_id', developer.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (propsError) {
      console.error('❌ PROPERTIES API: Error fetching properties:', propsError)
      return NextResponse.json({ error: propsError.message }, { status: 500 })
    }

    return NextResponse.json({
      properties: properties || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error: unknown) {
    console.error('❌ PROPERTIES API: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get developer profile with subscription info
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, subscription_plan')
      .eq('user_id', user.id)
      .single()

    if (devError || !developer) {
      return NextResponse.json({ error: 'Developer profile not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()

    // TRIAL CHECK: Block property creation if trial expired
    const trialCheck = await canAccessFeature(developer.id, 'properties')
    if (!trialCheck.allowed) {
      console.log('❌ PROPERTIES API: Trial check failed:', trialCheck.reason)
      return NextResponse.json(
        {
          error: 'Trial expired',
          message: trialCheck.reason || 'Twój okres próbny wygasł. Upgrade aby kontynuować.',
          upgradeUrl: '/dashboard/settings#subscription'
        },
        { status: 403 }
      )
    }

    // SUBSCRIPTION LIMIT CHECK: Enforce property limit before creating
    const limitCheck = await enforcePropertyLimit(developer.id, 1)

    if (!limitCheck.allowed && limitCheck.error) {
      // Log the violation for analytics
      await logLimitViolation(developer.id, 'property', {
        current: limitCheck.error.currentUsage.properties || 0,
        limit: limitCheck.error.currentUsage.limit || 0,
        attempted: 1,
        plan: developer.subscription_plan || 'basic'
      })

      console.log(`⛔ PROPERTIES API: Property limit exceeded for developer ${developer.id}`)
      return NextResponse.json(limitCheck.error, { status: 403 })
    }

    // Create property
    const { data: property, error: createError } = await supabase
      .from('properties')
      .insert({
        ...body,
        developer_id: developer.id
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ PROPERTIES API: Error creating property:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    console.log(`✅ PROPERTIES API: Created property ${property.id}`)
    return NextResponse.json({ success: true, property }, { status: 201 })

  } catch (error: unknown) {
    console.error('❌ PROPERTIES API: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get property ID from query
    const searchParams = request.nextUrl.searchParams
    const propertyId = searchParams.get('id')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
    }

    // Delete property (verify ownership via RLS)
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('developer_id', developer.id)

    if (deleteError) {
      console.error('❌ PROPERTIES API: Error deleting property:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    console.error('❌ PROPERTIES API: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
