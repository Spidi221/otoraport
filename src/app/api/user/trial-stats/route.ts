/**
 * Trial Stats API - Task #49
 * Returns user's trial period statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get developer info
    const adminClient = await createAdminClient()
    const { data: developer, error: devError } = await adminClient
      .from('developers')
      .select('id, created_at, trial_ends_at')
      .eq('user_id', user.id)
      .single()

    if (devError || !developer) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      )
    }

    // Get properties count
    const { count: propertiesCount, error: propsError } = await adminClient
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('developer_id', developer.id)

    // Get projects count
    const { count: projectsCount, error: projError } = await adminClient
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('developer_id', developer.id)

    // Get uploads count
    const { count: uploadsCount, error: uploadsError } = await adminClient
      .from('csv_generation_logs')
      .select('id', { count: 'exact', head: true })
      .eq('developer_id', developer.id)

    // Calculate days used
    const createdAt = new Date(developer.created_at)
    const trialEndsAt = developer.trial_ends_at ? new Date(developer.trial_ends_at) : new Date()
    const now = new Date()

    const daysUsed = Math.min(
      14,
      Math.ceil((Math.min(now.getTime(), trialEndsAt.getTime()) - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    )

    return NextResponse.json({
      propertiesCount: propertiesCount || 0,
      projectsCount: projectsCount || 0,
      uploadsCount: uploadsCount || 0,
      daysUsed
    })

  } catch (error) {
    console.error('Error fetching trial stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
