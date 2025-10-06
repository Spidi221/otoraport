/**
 * Email Preferences API Endpoint
 * Manage user email notification preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface EmailPreferences {
  email_notifications_enabled?: boolean
  email_weekly_digest?: boolean
  email_data_staleness_alerts?: boolean
  email_endpoint_health_alerts?: boolean
  email_support_updates?: boolean
  email_marketing?: boolean
}

/**
 * GET /api/user/email-preferences
 * Get current email preferences
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get developer profile with email preferences
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select(`
        email_notifications_enabled,
        email_weekly_digest,
        email_data_staleness_alerts,
        email_endpoint_health_alerts,
        email_support_updates,
        email_marketing
      `)
      .eq('user_id', user.id)
      .single()

    if (devError) {
      console.error('❌ Error fetching email preferences:', devError)
      return NextResponse.json(
        { error: 'Failed to fetch email preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      preferences: developer
    })

  } catch (error) {
    console.error('❌ Email preferences GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/email-preferences
 * Update email preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: EmailPreferences = await request.json()

    // Validate that at least one preference is being updated
    const validKeys = [
      'email_notifications_enabled',
      'email_weekly_digest',
      'email_data_staleness_alerts',
      'email_endpoint_health_alerts',
      'email_support_updates',
      'email_marketing'
    ]

    const updates: EmailPreferences = {}
    for (const key of validKeys) {
      if (key in body && typeof body[key as keyof EmailPreferences] === 'boolean') {
        updates[key as keyof EmailPreferences] = body[key as keyof EmailPreferences]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid preferences to update' },
        { status: 400 }
      )
    }

    // Update developer email preferences
    const { data: developer, error: updateError } = await supabase
      .from('developers')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating email preferences:', updateError)
      return NextResponse.json(
        { error: 'Failed to update email preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email preferences updated successfully',
      preferences: {
        email_notifications_enabled: developer.email_notifications_enabled,
        email_weekly_digest: developer.email_weekly_digest,
        email_data_staleness_alerts: developer.email_data_staleness_alerts,
        email_endpoint_health_alerts: developer.email_endpoint_health_alerts,
        email_support_updates: developer.email_support_updates,
        email_marketing: developer.email_marketing
      }
    })

  } catch (error) {
    console.error('❌ Email preferences PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
