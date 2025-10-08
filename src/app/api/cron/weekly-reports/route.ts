/**
 * WEEKLY REPORTS CRON JOB
 *
 * Vercel Cron configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/weekly-reports",
 *     "schedule": "0 8 * * 1"
 *   }]
 * }
 *
 * Runs every Monday at 8:00 AM UTC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWeeklyReportEmail } from '@/lib/email-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max execution time

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Starting weekly reports job...')

    const supabase = await createClient()

    // Get all active developers with email notifications enabled
    const { data: developers, error: devError } = await supabase
      .from('developers')
      .select('*')
      .eq('email_notifications_enabled', true)
      .or('notification_frequency.eq.weekly,notification_frequency.eq.daily')

    if (devError) {
      console.error('[Cron] Error fetching developers:', devError)
      return NextResponse.json({ error: devError.message }, { status: 500 })
    }

    if (!developers || developers.length === 0) {
      console.log('[Cron] No developers with email notifications enabled')
      return NextResponse.json({
        success: true,
        message: 'No developers to email',
        sent: 0
      })
    }

    console.log(`[Cron] Found ${developers.length} developers to email`)

    const results = []
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Send weekly report to each developer
    for (const developer of developers) {
      try {
        // Get properties statistics
        const { data: allProperties, count: totalCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact' })
          .eq('developer_id', developer.id)

        const total = totalCount || 0

        // Count by status
        const available = allProperties?.filter(p => p.status === 'available').length || 0
        const sold = allProperties?.filter(p => p.status === 'sold').length || 0
        const reserved = allProperties?.filter(p => p.status === 'reserved').length || 0

        // Get new properties this week
        const { count: newThisWeek } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('developer_id', developer.id)
          .gte('created_at', oneWeekAgo.toISOString())

        // Get properties sold this week
        const { count: soldThisWeek } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('developer_id', developer.id)
          .eq('status', 'sold')
          .gte('updated_at', oneWeekAgo.toISOString())

        // Calculate average price per m²
        const availableProps = allProperties?.filter(p => p.status === 'available' && p.price && p.area) || []
        const avgPricePerM2 = availableProps.length > 0
          ? availableProps.reduce((sum, p) => sum + (p.price / p.area), 0) / availableProps.length
          : 0

        // Send email
        const emailResult = await sendWeeklyReportEmail(developer, {
          totalProperties: total,
          availableProperties: available,
          soldProperties: sold,
          reservedProperties: reserved,
          newPropertiesThisWeek: newThisWeek || 0,
          soldThisWeek: soldThisWeek || 0,
          avgPricePerM2: Math.round(avgPricePerM2)
        })

        results.push({
          developer: developer.email,
          success: emailResult.success,
          error: emailResult.error
        })

        console.log(`[Cron] Email sent to ${developer.email}:`, emailResult.success ? 'Success' : 'Failed')

      } catch (error) {
        console.error(`[Cron] Error processing developer ${developer.email}:`, error)
        results.push({
          developer: developer.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`[Cron] Weekly reports completed: ${successCount} sent, ${failureCount} failed`)

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      results
    })

  } catch (error) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
