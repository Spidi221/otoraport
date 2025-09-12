import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get developer information
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (devError || !developer) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      )
    }

    // Get projects count
    const { count: projectsCount } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('developer_id', developer.id)

    // Get properties count and data
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('developer_id', developer.id)

    const projectIds = projects?.map(p => p.id) || []

    const { data: properties, count: propertiesCount } = await supabaseAdmin
      .from('properties')
      .select('*', { count: 'exact' })
      .in('project_id', projectIds)

    // Calculate price statistics
    const propertiesWithPrices = properties?.filter(p => p.total_price && p.total_price > 0) || []
    const avgPrice = propertiesWithPrices.length > 0 
      ? propertiesWithPrices.reduce((sum, p) => sum + p.total_price, 0) / propertiesWithPrices.length 
      : 0

    // Calculate area statistics  
    const propertiesWithArea = properties?.filter(p => p.area && p.area > 0) || []
    const avgArea = propertiesWithArea.length > 0
      ? propertiesWithArea.reduce((sum, p) => sum + p.area, 0) / propertiesWithArea.length
      : 0

    // Status distribution
    const statusCounts = properties?.reduce((acc, p) => {
      const status = p.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as { [key: string]: number }) || {}

    // Recent activity (uploads, changes)
    const recentPropertiesCount = properties?.filter(p => {
      const createdAt = new Date(p.created_at)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return createdAt > weekAgo
    }).length || 0

    // Compliance status
    const complianceStatus = {
      xmlUrl: developer.xml_url || null,
      mdUrl: developer.md_url || null,
      lastGenerated: developer.updated_at,
      isCompliant: !!(developer.xml_url && developer.md_url && propertiesCount && propertiesCount > 0)
    }

    // Subscription info
    const subscription = {
      plan: developer.subscription_plan || 'trial',
      status: developer.subscription_status || 'trial',
      trialEndsAt: developer.subscription_end_date,
      isActive: developer.subscription_status === 'active' || developer.subscription_status === 'trial'
    }

    const stats = {
      projects: {
        total: projectsCount || 0
      },
      properties: {
        total: propertiesCount || 0,
        recent: recentPropertiesCount,
        avgPrice: Math.round(avgPrice),
        avgArea: Math.round(avgArea * 10) / 10, // Round to 1 decimal
        statusDistribution: statusCounts
      },
      compliance: complianceStatus,
      subscription,
      developer: {
        name: developer.name,
        companyName: developer.company_name,
        email: developer.email,
        nip: developer.nip,
        clientId: developer.client_id
      }
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}