import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { handleCustomDomain } from '@/lib/custom-domain-middleware'

export async function middleware(req: NextRequest) {
  // PHASE 2: Handle custom domains first (Enterprise feature)
  const customDomainResponse = await handleCustomDomain(req)
  if (customDomainResponse) {
    return customDomainResponse
  }

  const { pathname } = req.nextUrl

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

  // For protected routes, check auth using SSR client
  const { createSupabaseMiddlewareClient } = await import('@/lib/supabase-ssr')
  const { supabase, response } = createSupabaseMiddlewareClient(req)

  // Check if user is authenticated
  const { data: { session }, error } = await supabase.auth.getSession()

  // User must be logged in for protected routes
  if (!session?.user || error) {
    const url = new URL('/auth/signin', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // For protected routes, log for monitoring
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/upload') ||
    pathname.startsWith('/admin')
  ) {
    console.log(`AUTH: User accessing protected route ${pathname}`)
  }

  // Use the SSR response for auth, fallback to NextResponse for public routes
  const res = response || NextResponse.next()

  // SECURITY: Add comprehensive security headers to all responses
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Content Security Policy - prevents XSS attacks
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://maichqozswcomegcsaqg.supabase.co;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://api.openai.com https://accounts.google.com https://www.googleapis.com https://maichqozswcomegcsaqg.supabase.co;
    frame-src https://accounts.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  res.headers.set('Content-Security-Policy', cspHeader)

  return res
}

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