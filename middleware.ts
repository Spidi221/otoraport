import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseReqResClient } from '@/lib/supabase-ssr'
import { handleCustomDomain } from '@/lib/custom-domain-middleware'

export async function middleware(req: NextRequest) {
  // PHASE 2: Handle custom domains first (Enterprise feature)
  const customDomainResponse = await handleCustomDomain(req)
  if (customDomainResponse) {
    return customDomainResponse
  }

  const { pathname } = req.nextUrl

  // TEMPORARILY BYPASS ALL AUTH CHECKS - Let component-level auth handle it
  if (true) {
    // Still add security headers but skip auth check
    const res = NextResponse.next()

    // PHASE 2: Enhanced security headers for all responses
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set('X-XSS-Protection', '1; mode=block')
    res.headers.set('Server', 'OTORAPORT/2.0')

    return res
  }

  // Create response to handle cookies properly
  const res = NextResponse.next()

  // For protected routes, check using Supabase SSR
  try {
    const supabase = createSupabaseReqResClient(req, res)
    const { data: { user }, error } = await supabase.auth.getUser()

    // User must be logged in for protected routes
    if (!user || error) {
      console.log('MIDDLEWARE: No valid user session found:', error?.message || 'No user')
      const url = new URL('/auth/signin', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    console.log('MIDDLEWARE: Valid user session for:', user.email)
  } catch (error) {
    console.error('MIDDLEWARE: Auth check failed:', error)
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

  // PHASE 2: Enhanced security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), clipboard-read=(), clipboard-write=()')

  // Enhanced Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://maichqozswcomegcsaqg.supabase.co https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://api.openai.com https://accounts.google.com https://www.googleapis.com https://maichqozswcomegcsaqg.supabase.co https://api.stripe.com https://api.resend.com;
    frame-src https://accounts.google.com https://js.stripe.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
    block-all-mixed-content;
  `.replace(/\s{2,}/g, ' ').trim()

  res.headers.set('Content-Security-Policy', cspHeader)

  // Additional security headers for Phase 2
  res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  // Server identification removal
  res.headers.set('Server', 'OTORAPORT/2.0')

  // Cache control for sensitive pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
  }

  return res
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