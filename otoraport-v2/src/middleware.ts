import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

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
  }

  // Add security headers to response
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Server', 'OTORAPORT')

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
