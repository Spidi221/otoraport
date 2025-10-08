/**
 * Admin Middleware - Require Admin Access
 * Task #57.2 - Develop Admin Middleware and Protected Routes
 *
 * Use this to protect admin-only API routes and pages.
 * Checks both is_admin flag in developers table AND admin_roles table.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export interface AdminCheckResult {
  isAdmin: boolean
  user: any | null
  developerId: string | null
  adminRoles: string[]
  error?: string
}

/**
 * Check if the current user has admin access
 * Returns detailed admin status including roles
 */
export async function checkAdminAccess(): Promise<AdminCheckResult> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        isAdmin: false,
        user: null,
        developerId: null,
        adminRoles: [],
        error: 'Not authenticated'
      }
    }

    // Check is_admin flag in developers table
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, is_admin')
      .eq('user_id', user.id)
      .maybeSingle()

    // If user has is_admin=true, they're an admin
    if (developer?.is_admin) {
      // Also fetch their specific roles from admin_roles
      const { data: roles } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)

      return {
        isAdmin: true,
        user,
        developerId: developer.id,
        adminRoles: roles?.map(r => r.role) || ['admin']
      }
    }

    // Check admin_roles table as fallback
    const { data: adminRoles, error: rolesError } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)

    if (rolesError) {
      console.error('❌ ADMIN MIDDLEWARE: Error checking admin_roles:', rolesError)
    }

    const hasAdminRole = adminRoles && adminRoles.length > 0

    return {
      isAdmin: hasAdminRole,
      user,
      developerId: developer?.id || null,
      adminRoles: hasAdminRole ? adminRoles.map(r => r.role) : [],
      error: hasAdminRole ? undefined : 'User does not have admin access'
    }

  } catch (error) {
    console.error('❌ ADMIN MIDDLEWARE: Unexpected error:', error)
    return {
      isAdmin: false,
      user: null,
      developerId: null,
      adminRoles: [],
      error: 'Internal server error checking admin access'
    }
  }
}

/**
 * Middleware function to require admin access
 * Use this in API routes to enforce admin-only access
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const adminCheck = await requireAdmin(request)
 *   if (adminCheck instanceof NextResponse) {
 *     return adminCheck // 401 or 403 error
 *   }
 *   // User is admin, proceed with request
 *   const { user, developerId, adminRoles } = adminCheck
 * }
 */
export async function requireAdmin(
  request?: NextRequest
): Promise<AdminCheckResult | NextResponse> {
  const adminCheck = await checkAdminAccess()

  if (!adminCheck.isAdmin) {
    const statusCode = adminCheck.user ? 403 : 401
    const message = adminCheck.user
      ? 'Access denied. Admin privileges required.'
      : 'Authentication required.'

    // Log unauthorized access attempt
    if (adminCheck.user) {
      console.warn(
        `⚠️ ADMIN ACCESS DENIED: User ${adminCheck.user.email} attempted to access admin resource`
      )
    }

    return NextResponse.json(
      {
        error: message,
        code: statusCode === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED',
        details: adminCheck.error
      },
      { status: statusCode }
    )
  }

  // Log admin access
  console.log(
    `✅ ADMIN ACCESS GRANTED: ${adminCheck.user.email} (roles: ${adminCheck.adminRoles.join(', ')})`
  )

  return adminCheck
}

/**
 * Check if user has specific admin role
 */
export function hasRole(adminCheck: AdminCheckResult, role: 'super_admin' | 'admin' | 'support'): boolean {
  return adminCheck.adminRoles.includes(role)
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(adminCheck: AdminCheckResult): boolean {
  return hasRole(adminCheck, 'super_admin')
}

/**
 * Log admin action to audit trail
 * Use this to track all admin operations
 */
export async function logAdminAction(
  adminUserId: string,
  action: string,
  targetUserId?: string | null,
  details?: any,
  request?: NextRequest
) {
  try {
    const supabase = await createClient()

    // Extract IP and user agent from request if available
    const ip_address = request?.headers.get('x-forwarded-for') ||
                      request?.headers.get('x-real-ip') ||
                      'unknown'
    const user_agent = request?.headers.get('user-agent') || 'unknown'

    await supabase
      .from('admin_audit_logs')
      .insert({
        admin_user_id: adminUserId,
        action,
        target_user_id: targetUserId,
        details: details || {},
        ip_address,
        user_agent
      })

    console.log(`📝 ADMIN AUDIT: ${action} by ${adminUserId}`)
  } catch (error) {
    console.error('❌ Failed to log admin action:', error)
    // Don't throw - audit logging failure shouldn't break the request
  }
}
