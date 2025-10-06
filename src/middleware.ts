import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { applySecurityHeadersToResponse } from '@/lib/security-headers'
import { checkSubscriptionAccess, getSubscriptionErrorMessage } from '@/lib/subscription-enforcement'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes without auth
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/api/public',
    '/pricing',
    '/about'
  ]

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Update session and get user (this refreshes the auth token)
  const { user, response } = await updateSession(req)

  // For protected routes, check authentication
  if (!isPublicRoute) {
    if (!user) {
      console.log('MIDDLEWARE: No user, redirecting to signin from:', pathname)
      const url = new URL('/auth/signin', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    console.log('MIDDLEWARE: User authenticated:', user.email, 'accessing:', pathname)

    // Check subscription access for protected routes (except dashboard itself and settings)
    const exemptRoutes = ['/dashboard', '/dashboard/settings', '/forgot-password', '/terms', '/privacy']
    const needsSubscriptionCheck = !exemptRoutes.some(route => pathname === route)

    if (needsSubscriptionCheck) {
      const subscriptionCheck = await checkSubscriptionAccess(req, user.id)

      if (!subscriptionCheck.hasAccess) {
        const errorMessage = getSubscriptionErrorMessage(subscriptionCheck.reason)

        // For API routes, return 403 Forbidden
        if (pathname.startsWith('/api/')) {
          console.log(`❌ MIDDLEWARE: Subscription check failed for API ${pathname}:`, subscriptionCheck.reason)
          return NextResponse.json(
            {
              error: 'Subscription required',
              message: errorMessage,
              reason: subscriptionCheck.reason
            },
            { status: 403 }
          )
        }

        // For pages, redirect to dashboard with error message
        console.log(`❌ MIDDLEWARE: Subscription check failed for page ${pathname}:`, subscriptionCheck.reason)
        const url = new URL('/dashboard', req.url)
        url.searchParams.set('subscription_error', subscriptionCheck.reason || 'no_subscription')
        return NextResponse.redirect(url)
      }

      console.log('✅ MIDDLEWARE: Subscription check passed for:', pathname)
    }
  }

  // Add security headers to response (uses centralized utility)
  applySecurityHeadersToResponse(response)

  // Cache control for sensitive pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Supabase auth routes)
     * - api/public (public API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api/auth|api/public|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
