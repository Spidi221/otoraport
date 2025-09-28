// API endpoint for sending trial expiry warnings (cron job or manual trigger)

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTrialExpiryWarning } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    // Basic auth check - only allow from cron jobs or admin
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret) {
      console.warn('CRON_SECRET not configured - trial warning emails disabled')
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 })
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find developers with trials expiring in 3, 7, or 1 days
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Get developers on trial status
    const { data: developersToNotify, error } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('subscription_status', 'trial')
      .not('subscription_end_date', 'is', null)
      
    if (error) {
      console.error('Error fetching developers for trial warnings:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const emailsSent = []
    const emailsSkipped = []
    const emailsFailed = []

    for (const developer of developersToNotify || []) {
      if (!developer.subscription_end_date) continue
      
      const trialEndDate = new Date(developer.subscription_end_date)
      const daysUntilExpiry = Math.ceil((trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      
      // Send warnings at 7, 3, and 1 days before expiry
      let shouldSend = false
      if (daysUntilExpiry === 7 || daysUntilExpiry === 3 || daysUntilExpiry === 1) {
        shouldSend = true
      }

      if (!shouldSend) {
        emailsSkipped.push({
          email: developer.email,
          name: developer.name,
          daysUntilExpiry,
          reason: `Not a warning day (${daysUntilExpiry} days left)`
        })
        continue
      }

      // Check if we already sent warning for this day
      const warningKey = `trial_warning_${daysUntilExpiry}d`
      if (developer.email_notifications_sent?.includes(warningKey)) {
        emailsSkipped.push({
          email: developer.email,
          name: developer.name,
          daysUntilExpiry,
          reason: `Already sent ${daysUntilExpiry} day warning`
        })
        continue
      }

      try {
        const emailResult = await sendTrialExpiryWarning(developer, daysUntilExpiry)
        
        if (emailResult.success) {
          // Update the developer record to track that we sent this warning
          const existingNotifications = developer.email_notifications_sent || []
          await supabaseAdmin
            .from('developers')
            .update({
              email_notifications_sent: [...existingNotifications, warningKey],
              updated_at: new Date().toISOString()
            })
            .eq('id', developer.id)

          emailsSent.push({
            email: developer.email,
            name: developer.name,
            daysUntilExpiry,
            result: 'success'
          })
        } else {
          emailsFailed.push({
            email: developer.email,
            name: developer.name,
            daysUntilExpiry,
            error: emailResult.error
          })
        }
      } catch (emailError) {
        console.error(`Trial warning email failed for ${developer.email}:`, emailError)
        emailsFailed.push({
          email: developer.email,
          name: developer.name,
          daysUntilExpiry,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        })
      }
    }

    console.log('Trial warning email batch completed:', {
      total: developersToNotify?.length || 0,
      sent: emailsSent.length,
      skipped: emailsSkipped.length,
      failed: emailsFailed.length
    })

    return NextResponse.json({
      success: true,
      message: `Trial warning batch completed`,
      stats: {
        total: developersToNotify?.length || 0,
        sent: emailsSent.length,
        skipped: emailsSkipped.length,
        failed: emailsFailed.length
      },
      details: {
        sent: emailsSent,
        skipped: emailsSkipped,
        failed: emailsFailed
      }
    })

  } catch (error) {
    console.error('Trial warning email batch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow manual trigger with admin auth
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const adminKey = searchParams.get('admin_key')
  
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Forward to POST handler with proper auth
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${process.env.CRON_SECRET}`,
      'content-type': 'application/json'
    }
  })
  
  return POST(mockRequest as any)
}