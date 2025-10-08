/**
 * Admin Users Management API
 * Task #57.3 - Build User Management Interface and API
 *
 * GET: List all users with pagination, search, filter, and sort
 * Features:
 * - Pagination (limit, offset)
 * - Search by email
 * - Filter by subscription_plan
 * - Sort by created_at, properties_count
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/require-admin'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface UserListItem {
  id: string
  email: string
  company_name: string
  subscription_plan: string | null
  subscription_status: string | null
  properties_count: number
  projects_count: number
  created_at: string
  is_admin: boolean
  last_login_at: string | null
}

export async function GET(request: NextRequest) {
  // Require admin access
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const planFilter = searchParams.get('plan') || 'all'
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build base query
    let query = supabase
      .from('developers')
      .select(`
        id,
        email,
        company_name,
        subscription_plan,
        subscription_status,
        created_at,
        is_admin,
        last_login_at,
        user_id
      `, { count: 'exact' })

    // Apply search filter (email or company name)
    if (search) {
      query = query.or(`email.ilike.%${search}%,company_name.ilike.%${search}%`)
    }

    // Apply subscription plan filter
    if (planFilter && planFilter !== 'all') {
      query = query.eq('subscription_plan', planFilter)
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'email', 'company_name', 'subscription_plan']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const ascending = sortOrder === 'asc'

    query = query.order(sortColumn, { ascending })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: developers, error: devError, count } = await query

    if (devError) {
      console.error('❌ ADMIN USERS API: Error fetching developers:', devError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // For each developer, fetch properties and projects count
    const userIds = developers?.map(d => d.id) || []

    const [
      { data: propertiesCounts },
      { data: projectsCounts }
    ] = await Promise.all([
      // Get properties count per developer
      supabase
        .from('properties')
        .select('developer_id')
        .in('developer_id', userIds),

      // Get projects count per developer
      supabase
        .from('projects')
        .select('developer_id')
        .in('developer_id', userIds)
    ])

    // Count properties and projects per developer
    const propertiesCountMap: Record<string, number> = {}
    const projectsCountMap: Record<string, number> = {}

    propertiesCounts?.forEach(p => {
      propertiesCountMap[p.developer_id] = (propertiesCountMap[p.developer_id] || 0) + 1
    })

    projectsCounts?.forEach(p => {
      projectsCountMap[p.developer_id] = (projectsCountMap[p.developer_id] || 0) + 1
    })

    // Build response with counts
    const users: UserListItem[] = (developers || []).map(dev => ({
      id: dev.id,
      email: dev.email,
      company_name: dev.company_name,
      subscription_plan: dev.subscription_plan,
      subscription_status: dev.subscription_status,
      properties_count: propertiesCountMap[dev.id] || 0,
      projects_count: projectsCountMap[dev.id] || 0,
      created_at: dev.created_at || '',
      is_admin: dev.is_admin || false,
      last_login_at: dev.last_login_at
    }))

    // Sort by properties_count if requested (can't do in SQL easily with joined count)
    if (sortBy === 'properties_count') {
      users.sort((a, b) => {
        const diff = a.properties_count - b.properties_count
        return ascending ? diff : -diff
      })
    }

    // Log admin action
    await logAdminAction(
      adminCheck.user.id,
      'list_users',
      null,
      { page, limit, search, planFilter },
      request
    )

    return NextResponse.json({
      users,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      filters: {
        search,
        plan: planFilter,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error('❌ ADMIN USERS API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
