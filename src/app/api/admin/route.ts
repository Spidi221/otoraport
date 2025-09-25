import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { adminService } from '@/lib/admin-service'
import { cookies } from 'next/headers'

// Admin users - in production this would be from database
const ADMIN_EMAILS = [
  'admin@otoraport.pl',
  'bartlomiej@agencjaai.pl',
  'chudziszewski221@gmail.com'
]

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookie
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-maichqozswcomegcsaqg-auth-token')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken.value)

    if (error || !user?.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'stats'

    switch (action) {
      case 'stats': {
        const stats = await adminService.getSystemStats()
        return NextResponse.json({
          success: true,
          data: stats
        })
      }

      case 'developers': {
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        
        const developers = await adminService.getAllDevelopers(page, limit)
        return NextResponse.json({
          success: true,
          data: developers
        })
      }

      case 'logs': {
        const level = searchParams.get('level') as 'info' | 'warning' | 'error' | undefined
        const limit = parseInt(searchParams.get('limit') || '100')
        
        const logs = await adminService.getSystemLogs(level, limit)
        return NextResponse.json({
          success: true,
          data: logs
        })
      }

      case 'compliance': {
        const report = await adminService.getComplianceReport()
        return NextResponse.json({
          success: true,
          data: report
        })
      }

      case 'revenue': {
        const timeframe = searchParams.get('timeframe') as '7d' | '30d' | '90d' | '12m' || '30d'
        const analytics = await adminService.getRevenueAnalytics(timeframe)
        return NextResponse.json({
          success: true,
          data: analytics
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Admin API error:', error)

    await adminService.logSystemEvent(
      'error',
      'Admin API error',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      undefined // User email not available in error context
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookie
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-maichqozswcomegcsaqg-auth-token')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken.value)

    if (error || !user?.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'update-subscription': {
        const { developerId, status, endDate } = data
        
        if (!developerId || !status) {
          return NextResponse.json(
            { error: 'Developer ID and status are required' },
            { status: 400 }
          )
        }

        await adminService.updateDeveloperSubscription(developerId, status, endDate)

        return NextResponse.json({
          success: true,
          message: 'Developer subscription updated successfully'
        })
      }

      case 'approve-ministry': {
        const { developerId, approved } = data
        
        if (!developerId || typeof approved !== 'boolean') {
          return NextResponse.json(
            { error: 'Developer ID and approval status are required' },
            { status: 400 }
          )
        }

        await adminService.approveDeveloperForMinistry(developerId, approved)

        return NextResponse.json({
          success: true,
          message: `Developer ${approved ? 'approved' : 'rejected'} for ministry`
        })
      }

      case 'system-cleanup': {
        const results = await adminService.performSystemCleanup()

        return NextResponse.json({
          success: true,
          data: results,
          message: 'System cleanup completed'
        })
      }

      case 'log-event': {
        const { level, message, details, userId } = data
        
        if (!level || !message) {
          return NextResponse.json(
            { error: 'Level and message are required' },
            { status: 400 }
          )
        }

        await adminService.logSystemEvent(level, message, details, userId)

        return NextResponse.json({
          success: true,
          message: 'Event logged successfully'
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Admin POST error:', error)
    
    await adminService.logSystemEvent(
      'error',
      'Admin POST error',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      user?.email
    )

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}