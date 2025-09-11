import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { analyticsService } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const timeframe = searchParams.get('timeframe') as '30d' | '90d' | '12m' || '30d'

    console.log(`Analytics request for user ${session.user.email}: ${reportType} (${timeframe})`)

    switch (reportType) {
      case 'overview': {
        const priceAnalytics = await analyticsService.getPriceAnalytics(userId, timeframe)
        return NextResponse.json({
          success: true,
          data: priceAnalytics
        })
      }

      case 'trends': {
        const trends = await analyticsService.getMarketTrends(userId, timeframe as '3m' | '6m' | '12m')
        return NextResponse.json({
          success: true,
          data: trends
        })
      }

      case 'breakdown': {
        const breakdown = await analyticsService.getPropertyTypeBreakdown(userId)
        return NextResponse.json({
          success: true,
          data: breakdown
        })
      }

      case 'projects': {
        const projects = await analyticsService.getProjectPerformance(userId)
        return NextResponse.json({
          success: true,
          data: projects
        })
      }

      case 'competitors': {
        const competitors = await analyticsService.getCompetitorAnalysis(userId)
        return NextResponse.json({
          success: true,
          data: competitors
        })
      }

      case 'full-report': {
        const report = await analyticsService.generateMarketReport(userId)
        return NextResponse.json({
          success: true,
          data: report
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    )
  }
}

// Export detailed market report as PDF/Excel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { format, reportType } = await request.json()
    const userId = (session.user as any).id

    console.log(`Export request for user ${session.user.email}: ${reportType} as ${format}`)

    const report = await analyticsService.generateMarketReport(userId)

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: report,
        downloadUrl: null // Would generate download link in real implementation
      })
    }

    // In production, would generate PDF/Excel files
    return NextResponse.json({
      success: true,
      message: 'Report export functionality will be implemented',
      data: {
        format,
        reportType,
        generatedAt: new Date().toISOString(),
        downloadUrl: `/exports/report-${userId}-${Date.now()}.${format}`
      }
    })

  } catch (error) {
    console.error('Analytics export error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}