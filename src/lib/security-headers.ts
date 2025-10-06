/**
 * Security Headers Utility
 * Provides consistent security headers for all responses (success and error)
 */

export interface SecurityHeaders {
  'X-Frame-Options': string
  'X-Content-Type-Options': string
  'X-XSS-Protection': string
  'Referrer-Policy': string
  'Strict-Transport-Security': string
  'Content-Security-Policy': string
  'Permissions-Policy': string
  'Server': string
}

/**
 * Get all security headers for responses
 * These headers protect against XSS, clickjacking, MIME sniffing, etc.
 */
export function getSecurityHeaders(): SecurityHeaders {
  return {
    // Prevent the page from being framed (clickjacking protection)
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS filter in older browsers
    'X-XSS-Protection': '1; mode=block',

    // Control how much referrer information is sent
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Force HTTPS for 1 year (31536000 seconds)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // Content Security Policy - strict but allows necessary resources
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com", // unsafe-inline needed for Next.js, Vercel Analytics
      "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for styled-jsx and Tailwind
      "img-src 'self' data: https: blob:", // Allow images from HTTPS and data URLs
      "font-src 'self' data:",
      "connect-src 'self' https://vercel.live https://*.supabase.co wss://*.supabase.co https://api.stripe.com", // Supabase + Stripe + Vercel
      "frame-ancestors 'none'", // Same as X-Frame-Options: DENY
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; '),

    // Permissions Policy (formerly Feature-Policy)
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)', // Allow Stripe payments
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', '),

    // Hide server version
    'Server': 'OTORAPORT'
  }
}

/**
 * Apply security headers to a Headers object
 */
export function applySecurityHeaders(headers: Headers): void {
  const securityHeaders = getSecurityHeaders()

  for (const [key, value] of Object.entries(securityHeaders)) {
    headers.set(key, value)
  }
}

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeadersToResponse(response: Response): void {
  applySecurityHeaders(response.headers)
}

/**
 * Create a JSON error response with security headers
 */
export function createSecureErrorResponse(
  error: { message: string; code?: string },
  status: number
): Response {
  const headers = new Headers({
    'Content-Type': 'application/json'
  })

  applySecurityHeaders(headers)

  return new Response(
    JSON.stringify({
      error: error.message,
      code: error.code,
      status
    }),
    {
      status,
      headers
    }
  )
}

/**
 * Create an HTML error response with security headers
 */
export function createSecureHTMLErrorResponse(
  title: string,
  message: string,
  status: number
): Response {
  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8'
  })

  applySecurityHeaders(headers)

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - OTORAPORT</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      max-width: 600px;
      margin: 100px auto;
      padding: 20px;
      text-align: center;
    }
    .error-container {
      background: #fee2e2;
      border: 2px solid #dc2626;
      border-radius: 8px;
      padding: 40px;
    }
    h1 {
      color: #dc2626;
      font-size: 48px;
      margin: 0 0 20px 0;
    }
    p {
      color: #7f1d1d;
      font-size: 18px;
      margin: 0;
    }
    a {
      display: inline-block;
      margin-top: 30px;
      padding: 12px 24px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
    }
    a:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>${status}</h1>
    <p><strong>${title}</strong></p>
    <p>${message}</p>
    <a href="/">Wróć na stronę główną</a>
  </div>
</body>
</html>
  `

  return new Response(html, {
    status,
    headers
  })
}
