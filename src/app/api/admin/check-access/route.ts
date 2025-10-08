/**
 * Admin Access Check API
 * Task #57.2 - Admin Middleware
 *
 * Client-side endpoint to verify admin access
 */

import { NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/middleware/require-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const adminCheck = await checkAdminAccess()

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        {
          isAdmin: false,
          error: adminCheck.error || 'Access denied'
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      isAdmin: true,
      roles: adminCheck.adminRoles,
      user: {
        id: adminCheck.user.id,
        email: adminCheck.user.email
      }
    })

  } catch (error) {
    console.error('❌ ADMIN CHECK ACCESS: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
