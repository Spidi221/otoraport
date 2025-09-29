import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Custom domain middleware for Enterprise plans
 * Routes custom domains to proper developer presentation pages
 */

export async function handleCustomDomain(request: NextRequest): Promise<NextResponse | null> {
  const hostname = request.headers.get('host') || ''
  const { pathname, search } = request.nextUrl
  
  // Skip if it's the main domain or subdomain
  if (
    hostname === 'localhost:3000' ||
    hostname === 'localhost:3006' ||
    hostname.includes('otoraport.pl') ||
    hostname.includes('vercel.app') ||
    hostname.includes('127.0.0.1')
  ) {
    return null // Continue with normal routing
  }

  console.log(`Custom domain detected: ${hostname} -> ${pathname}`)

  try {
    // Look up developer by custom domain
    const { data: developer, error } = await createAdminClient()
      .from('developers')
      .select(`
        id,
        client_id,
        company_name,
        subscription_plan,
        custom_domain,
        presentation_url,
        presentation_generated_at
      `)
      .eq('custom_domain', hostname)
      .eq('subscription_plan', 'enterprise')
      .single()

    if (error || !developer) {
      console.log(`No developer found for domain: ${hostname}`)
      
      // Return 404 page for unknown custom domains
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head>
            <title>Domain Not Found - OTORAPORT</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: system-ui; text-align: center; padding: 100px 20px; }
                .container { max-width: 600px; margin: 0 auto; }
                .logo { color: #007bff; font-size: 2rem; font-weight: bold; margin-bottom: 2rem; }
                .error { color: #dc3545; font-size: 1.5rem; margin-bottom: 1rem; }
                .description { color: #666; margin-bottom: 2rem; }
                .support { background: #f8f9fa; padding: 20px; border-radius: 8px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">OTORAPORT</div>
                <div class="error">Domain Not Configured</div>
                <div class="description">
                    The domain <strong>${hostname}</strong> is not configured in our system.
                </div>
                <div class="support">
                    <p>If you're a developer, please:</p>
                    <ul style="text-align: left;">
                        <li>Verify your custom domain in the OTORAPORT dashboard</li>
                        <li>Ensure you have an Enterprise subscription</li>
                        <li>Contact support if the issue persists</li>
                    </ul>
                    <p><strong>Support:</strong> <a href="mailto:support@otoraport.pl">support@otoraport.pl</a></p>
                </div>
            </div>
        </body>
        </html>`,
        { 
          status: 404,
          headers: { 
            'content-type': 'text/html',
            'cache-control': 'no-cache'
          }
        }
      )
    }

    // Handle different paths on custom domain
    if (pathname === '/' || pathname === '') {
      // Root path - redirect to presentation page
      const presentationUrl = developer.presentation_url || 
        `/api/presentation/preview?clientId=${developer.client_id}`
      
      return NextResponse.redirect(new URL(presentationUrl, request.url))
    }
    
    if (pathname.startsWith('/api/public/')) {
      // Rewrite public API calls to use the developer's client_id
      const newPathname = pathname.replace(
        '/api/public/',
        `/api/public/${developer.client_id}/`
      )
      
      const rewriteUrl = new URL(newPathname + search, request.url)
      console.log(`Rewriting API call: ${pathname} -> ${newPathname}`)
      
      return NextResponse.rewrite(rewriteUrl)
    }
    
    if (pathname === '/data.xml') {
      // Direct XML access via custom domain
      const xmlUrl = new URL(`/api/public/${developer.client_id}/data.xml`, request.url)
      return NextResponse.rewrite(xmlUrl)
    }
    
    if (pathname === '/data.md5') {
      // Direct MD5 access via custom domain
      const md5Url = new URL(`/api/public/${developer.client_id}/data.md5`, request.url)
      return NextResponse.rewrite(md5Url)
    }
    
    if (pathname.startsWith('/presentation')) {
      // Presentation page access
      const presentationUrl = new URL(
        `/api/presentation/preview?clientId=${developer.client_id}${search}`,
        request.url
      )
      return NextResponse.rewrite(presentationUrl)
    }

    // For other paths, serve a custom domain landing page
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
          <title>${developer.company_name} - Property Listings</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
              body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  margin: 0; padding: 0; 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
              }
              .container { text-align: center; max-width: 800px; padding: 40px 20px; }
              .logo { font-size: 3rem; font-weight: bold; margin-bottom: 1rem; }
              .tagline { font-size: 1.2rem; margin-bottom: 3rem; opacity: 0.9; }
              .links { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
              .link { 
                  background: rgba(255,255,255,0.2); 
                  padding: 15px 25px; 
                  border-radius: 8px; 
                  text-decoration: none; 
                  color: white;
                  backdrop-filter: blur(10px);
                  transition: all 0.3s ease;
              }
              .link:hover { 
                  background: rgba(255,255,255,0.3); 
                  transform: translateY(-2px);
              }
              .footer { 
                  position: fixed; 
                  bottom: 20px; 
                  left: 50%; 
                  transform: translateX(-50%);
                  font-size: 0.9rem; 
                  opacity: 0.7;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo">${developer.company_name}</div>
              <div class="tagline">Professional Real Estate Listings Portal</div>
              <div class="links">
                  <a href="/presentation" class="link">📋 View Properties</a>
                  <a href="/data.xml" class="link">📄 XML Data Feed</a>
                  <a href="/data.md5" class="link">🔐 Data Checksum</a>
              </div>
          </div>
          <div class="footer">
              Powered by <strong>OTORAPORT</strong> | Ministry Compliant Housing Data
          </div>
      </body>
      </html>`,
      { 
        status: 200,
        headers: { 
          'content-type': 'text/html',
          'cache-control': 'public, max-age=300'
        }
      }
    )

  } catch (error) {
    console.error('Custom domain middleware error:', error)
    
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
          <title>Service Error - OTORAPORT</title>
          <meta charset="UTF-8">
      </head>
      <body style="font-family: system-ui; text-align: center; padding: 100px 20px;">
          <h1>Service Temporarily Unavailable</h1>
          <p>We're experiencing technical difficulties. Please try again in a few moments.</p>
          <p>If the problem persists, contact <a href="mailto:support@otoraport.pl">support@otoraport.pl</a></p>
      </body>
      </html>`,
      { 
        status: 503,
        headers: { 
          'content-type': 'text/html',
          'retry-after': '60'
        }
      }
    )
  }
}

/**
 * Validates custom domain format and availability
 */
export function validateCustomDomain(domain: string): {
  valid: boolean
  error?: string
} {
  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
  
  if (!domainRegex.test(domain)) {
    return {
      valid: false,
      error: 'Invalid domain format. Use format: example.com'
    }
  }
  
  // Block reserved domains
  const reservedDomains = [
    'otoraport.pl',
    'localhost',
    'vercel.app',
    'herokuapp.com',
    'google.com',
    'facebook.com',
    'dane.gov.pl'
  ]
  
  if (reservedDomains.some(reserved => domain.includes(reserved))) {
    return {
      valid: false,
      error: 'This domain is reserved and cannot be used'
    }
  }
  
  return { valid: true }
}

/**
 * Generate DNS setup instructions for custom domain
 */
export function generateDNSInstructions(domain: string, clientId: string): {
  records: Array<{
    type: string
    name: string
    value: string
    description: string
  }>
  instructions: string
} {
  const records = [
    {
      type: 'CNAME',
      name: domain,
      value: 'cname.vercel-dns.com',
      description: 'Points your domain to OTORAPORT hosting'
    },
    {
      type: 'TXT',
      name: `_otoraport.${domain}`,
      value: `client-id=${clientId}`,
      description: 'Verifies domain ownership'
    }
  ]
  
  const instructions = `
## DNS Configuration for ${domain}

1. **Add CNAME Record:**
   - Type: CNAME
   - Name: ${domain} (or @)
   - Value: cname.vercel-dns.com
   - TTL: 300 (5 minutes)

2. **Add Verification TXT Record:**
   - Type: TXT  
   - Name: _otoraport.${domain}
   - Value: client-id=${clientId}
   - TTL: 300 (5 minutes)

3. **Wait for propagation** (up to 24 hours)

4. **Verify in OTORAPORT dashboard**

⚠️ **Important:** Make sure SSL is enabled for HTTPS access.
  `
  
  return { records, instructions }
}