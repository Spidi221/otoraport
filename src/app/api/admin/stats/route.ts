/**
 * Admin Stats API
 * Task #57.2 - Admin Dashboard
 *
 * Returns dashboard statistics for admin panel
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/require-admin'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Require admin access
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  try {
    const supabase = createAdminClient()

    // Fetch all stats in parallel
    const [
      { count: totalUsers },
      { count: activeSubscriptions },
      { count: totalProperties },
      { count: totalProjects },
      { count: recentUploads }
    ] = await Promise.all([
      // Total users
      supabase
        .from('developers')
        .select('*', { count: 'exact', head: true }),

      // Active subscriptions
      supabase
        .from('developers')
        .select('*', { count: 'exact', head: true })
        .in('subscription_status', ['active', 'trialing']),

      // Total properties
      supabase
        .from('properties')
        .select('*', { count: 'exact', head: true }),

      // Total projects
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true }),

      // Recent uploads (last 7 days)
      supabase
        .from('csv_generation_logs')
        .select('*', { count: 'exact', head: true })
        .gte('generated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // Log admin action
    await logAdminAction(
      adminCheck.user.id,
      'view_dashboard_stats',
      null,
      null,
      request
    )

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      totalProperties: totalProperties || 0,
      totalProjects: totalProjects || 0,
      recentUploads: recentUploads || 0
    })

  } catch (error) {
    console.error('❌ ADMIN STATS API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
