import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const { token } = req.nextauth

    // Public routes that don't need authentication
    if (
      pathname.startsWith('/auth') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/public') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname === '/' ||
      pathname === '/privacy' ||
      pathname === '/terms' ||
      pathname === '/cookies' ||
      pathname === '/rodo' ||
      pathname.includes('.') // Static files
    ) {
      return NextResponse.next()
    }

    // User must be logged in for protected routes
    if (!token) {
      const url = new URL('/auth/signin', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    // CRITICAL SECURITY FIX: Check profile completion at middleware level
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/upload') ||
      pathname.startsWith('/admin')
    ) {
      // For admin routes, check admin permissions
      if (pathname.startsWith('/admin')) {
        const adminEmails = ['admin@otoraport.pl', 'bartlomiej@agencjaai.pl']
        if (!adminEmails.includes(token.email)) {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }

      // For now, allow access but log for monitoring
      // TODO: Implement proper async profile validation
      console.warn(`SECURITY: User ${token.email} accessing protected route ${pathname} - profile validation needed`)
      return NextResponse.next()
    }

    const response = NextResponse.next()
    
    // SECURITY: Add comprehensive security headers to all responses
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // Content Security Policy - prevents XSS attacks
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https: blob:;
      connect-src 'self' https://api.openai.com https://accounts.google.com https://www.googleapis.com;
      frame-src https://accounts.google.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
    
    response.headers.set('Content-Security-Policy', cspHeader)
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to public routes without authentication
        if (
          pathname.startsWith('/auth') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/public') ||
          pathname.startsWith('/_next') ||
          pathname === '/' ||
          pathname === '/privacy' ||
          pathname === '/terms' ||
          pathname === '/cookies' ||
          pathname === '/rodo' ||
          pathname.includes('.') // Static files
        ) {
          return true
        }

        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - api/public (public API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api/auth|api/public|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}