/**
 * PROPERTIES API - List properties for authenticated developer
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/api-schemas'

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
