/**
 * NOTIFICATIONS API - Update and delete individual notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/api-schemas'

export const dynamic = 'force-dynamic'

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

    // Parse request body
    const body = await request.json()
    const { read } = body

    if (typeof read !== 'boolean') {
      return NextResponse.json({ error: 'Invalid read status' }, { status: 400 })
    }

    // Update notification (RLS ensures ownership)
    const { data, error: updateError } = await supabase
      .from('notifications')
      .update({ read })
      .eq('id', id)
      .eq('developer_id', developer.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ NOTIFICATIONS API: Error updating notification:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, notification: data })

  } catch (error: unknown) {
    console.error('❌ NOTIFICATIONS API: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Delete notification (RLS ensures ownership)
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('developer_id', developer.id)

    if (deleteError) {
      console.error('❌ NOTIFICATIONS API: Error deleting notification:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    console.error('❌ NOTIFICATIONS API: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
