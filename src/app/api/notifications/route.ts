/**
 * NOTIFICATIONS API - List notifications for authenticated developer
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

    // Get notifications with pagination
    const { data: notifications, error: notifError, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('developer_id', developer.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (notifError) {
      console.error('❌ NOTIFICATIONS API: Error fetching notifications:', notifError)
      return NextResponse.json({ error: notifError.message }, { status: 500 })
    }

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error: unknown) {
    console.error('❌ NOTIFICATIONS API: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
