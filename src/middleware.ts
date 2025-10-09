import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { applySecurityHeadersToResponse } from '@/lib/security-headers'
import { checkSubscriptionAccess, getSubscriptionErrorMessage } from '@/lib/subscription-enforcement'
import { getTrialStatusByUserId } from '@/lib/middleware/trial-middleware'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const host = req.headers.get('host') || ''

  // ============================================================================
  // SUBDOMAIN ROUTING (for public property pages)
  // ============================================================================
  // Extract subdomain from host (e.g., "firma.otoraport.pl" -> "firma")
  const subdomain = host.split('.')[0]
  const isSubdomain = host.includes('.otoraport.pl') && subdomain !== 'www' && subdomain !== 'app' && subdomain !== host

  // If it's a subdomain request and not an API/auth route, handle subdomain routing
  if (isSubdomain && !pathname.startsWith('/api') && !pathname.startsWith('/auth') && !pathname.startsWith('/_next')) {
    console.log(`🌐 SUBDOMAIN ROUTING: ${subdomain}.otoraport.pl -> ${pathname}`)

    // Rewrite to public property page with subdomain as parameter
    // This will be handled by app/[subdomain]/page.tsx
    const url = req.nextUrl.clone()
    url.pathname = `/public/${subdomain}${pathname}`

    console.log(`🌐 REWRITE TO: ${url.pathname}`)

    return NextResponse.rewrite(url)
  }

  // Allow public routes without auth
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/api/public',
    '/public', // Public property pages with subdomain routing
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

    // Admin routes bypass subscription/trial check (handled by admin middleware)
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')

    // Ministry endpoints are ALWAYS accessible (compliance requirement)
    const isMinistryEndpoint = pathname.startsWith('/api/public/')

    // Trial expired page is always accessible
    const isTrialExpiredPage = pathname === '/trial-expired'

    // Check subscription AND trial access for protected routes
    const exemptRoutes = ['/dashboard', '/dashboard/settings', '/forgot-password', '/terms', '/privacy', '/contact', '/trial-expired']
    const needsAccessCheck = !exemptRoutes.some(route => pathname === route) && !isAdminRoute && !isMinistryEndpoint

    if (needsAccessCheck) {
      // First check trial status (more specific than subscription check)
      const trialStatus = await getTrialStatusByUserId(user.id)

      if (trialStatus && trialStatus.status === 'expired') {
        console.log(`⏰ MIDDLEWARE: Trial expired for user ${user.email}`)

        // For API routes, return 403 Forbidden
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            {
              error: 'Trial expired',
              message: 'Twój okres próbny wygasł. Upgrade aby kontynuować.',
              reason: 'trial_expired'
            },
            { status: 403 }
          )
        }

        // For pages, redirect to trial-expired page
        return NextResponse.redirect(new URL('/trial-expired', req.url))
      }

      // Then check general subscription access
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

        // For pages, redirect appropriately
        console.log(`❌ MIDDLEWARE: Subscription check failed for page ${pathname}:`, subscriptionCheck.reason)

        // If trial_expired, go to trial-expired page
        if (subscriptionCheck.reason === 'trial_expired') {
          return NextResponse.redirect(new URL('/trial-expired', req.url))
        }

        // Otherwise, go to dashboard with error
        const url = new URL('/dashboard', req.url)
        url.searchParams.set('subscription_error', subscriptionCheck.reason || 'no_subscription')
        return NextResponse.redirect(url)
      }

      console.log('✅ MIDDLEWARE: Access check passed for:', pathname)
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
