import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase'
import { applySecurityHeaders, RATE_LIMIT_TIERS, checkRateLimit } from '@/lib/security'

// In production, this would be a proper logging service like Winston or external service
const securityLogs: Array<{
  id: string
  timestamp: string
  type: string
  ip: string
  userAgent?: string
  endpoint?: string
  details?: any
  severity: string
}> = []

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for security endpoint
    const rateLimitResult = await checkRateLimit(request, RATE_LIMIT_TIERS.lenient)

    if (!rateLimitResult.allowed) {
      const headers = applySecurityHeaders(new Headers({
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      }))

      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers }
      )
    }

    // Authentication check - only authenticated users can view logs
    const auth = await getAuthenticatedDeveloper(request)

    if (!auth.success || !auth.user) {
      const headers = applySecurityHeaders(new Headers())
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers }
      )
    }

    // Admin-only endpoint for viewing security logs
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
    const isAdmin = auth.user.email && adminEmails.includes(auth.user.email)

    if (!isAdmin) {
      const headers = applySecurityHeaders(new Headers())
      return new NextResponse(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers }
      )
    }

    // Get query parameters for filtering
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000)
    const type = url.searchParams.get('type')
    const severity = url.searchParams.get('severity')

    // Filter logs
    let filteredLogs = securityLogs

    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type)
    }

    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === severity)
    }

    // Sort by timestamp (newest first) and limit
    const logs = filteredLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }))

    return new NextResponse(
      JSON.stringify({
        success: true,
        data: {
          logs,
          total: filteredLogs.length,
          limit,
          filters: { type, severity }
        }
      }),
      { status: 200, headers }
    )

  } catch (error) {
    console.error('Security logs API error:', error)

    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }))

    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers }
    )
  }
}

// Add log entry (internal function)
export function addSecurityLog(logEntry: {
  type: 'rate_limit' | 'validation_error' | 'suspicious_activity' | 'blocked_request'
  ip: string
  userAgent?: string
  endpoint?: string
  details?: any
}): void {
  const log = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...logEntry,
    severity: logEntry.type === 'blocked_request' ? 'high' : 'medium'
  }

  securityLogs.push(log)

  // Keep only last 10000 logs in memory
  if (securityLogs.length > 10000) {
    securityLogs.splice(0, securityLogs.length - 10000)
  }

  // Log to console for immediate visibility
  console.warn('🔒 SECURITY EVENT:', log)
}