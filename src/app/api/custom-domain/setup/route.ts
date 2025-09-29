import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase'
import { createAdminClient } from '@/lib/supabase/server'
import { setupCustomDomain, generateDNSInstructions } from '@/lib/custom-domains'
import { checkRateLimit, applySecurityHeaders, sanitizeInput } from '@/lib/security'

interface SetupDomainRequest {
  domain: string
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting for domain setup (expensive operation)
    const rateLimitResult = await checkRateLimit(request, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // Max 3 domain setups per hour
    });

    if (!rateLimitResult.allowed) {
      const headers = applySecurityHeaders(new Headers({
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      }));
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Zbyt wiele prób konfiguracji domeny. Spróbuj ponownie za godzinę.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        }),
        { status: 429, headers }
      );
    }

    // Check authentication
    const auth = await getAuthenticatedDeveloper(request)
    if (!auth.success || !auth.user || !auth.developer) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: auth.error || 'Unauthorized. Please log in.' }),
        { status: 401, headers }
      );
    }

    const { domain }: SetupDomainRequest = await request.json()

    if (!domain) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: 'Domain is required' }),
        { status: 400, headers }
      );
    }

    // Sanitize domain input
    const cleanDomain = sanitizeInput(domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, ''))

    // Get developer and check subscription
    const { data: developer, error: devError } = await createAdminClient()
      .from('developers')
      .select('id, company_name, subscription_plan, custom_domain')
      .eq('id', auth.developer.id)
      .single()

    if (devError || !developer) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: 'Developer account not found' }),
        { status: 404, headers }
      );
    }

    // PHASE 2: Check Enterprise plan requirement
    if (developer.subscription_plan !== 'enterprise') {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ 
          error: 'Custom domains require Enterprise plan',
          requiredPlan: 'enterprise',
          currentPlan: developer.subscription_plan,
          upgradeUrl: '/pricing'
        }),
        { status: 403, headers }
      );
    }

    // Check if developer already has a custom domain
    if (developer.custom_domain && developer.custom_domain !== cleanDomain) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ 
          error: 'You already have a custom domain configured',
          currentDomain: developer.custom_domain,
          message: 'Contact support to change your custom domain'
        }),
        { status: 409, headers }
      );
    }

    console.log(`Setting up custom domain ${cleanDomain} for ${developer.company_name}`)

    // Setup custom domain using Vercel API or fallback
    const setupResult = await setupCustomDomain(cleanDomain, developer.id)

    if (!setupResult.success) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ 
          error: setupResult.error || 'Failed to setup custom domain',
          status: setupResult.status
        }),
        { status: 400, headers }
      );
    }

    // Save domain to database
    const { error: updateError } = await createAdminClient()
      .from('developers')
      .update({ 
        custom_domain: cleanDomain,
        updated_at: new Date().toISOString()
      })
      .eq('id', developer.id)

    if (updateError) {
      console.error('Failed to save custom domain:', updateError)
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: 'Failed to save domain configuration' }),
        { status: 500, headers }
      );
    }

    // Generate DNS instructions
    const dnsInstructions = generateDNSInstructions(
      cleanDomain, 
      setupResult.verificationToken || 'verification_token'
    )

    console.log(`Custom domain ${cleanDomain} setup initiated for ${developer.company_name}`)

    // SECURITY: Apply security headers to response
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        success: true,
        domain: cleanDomain,
        status: setupResult.status,
        dnsRecords: setupResult.dnsRecords,
        dnsInstructions,
        verificationToken: setupResult.verificationToken,
        message: 'Custom domain setup initiated. Please configure DNS records.',
        nextSteps: [
          'Configure DNS records as shown below',
          'Wait for DNS propagation (up to 24 hours)',
          'Click "Verify Domain" in dashboard',
          'SSL certificate will be issued automatically'
        ]
      }),
      { status: 201, headers }
    )

  } catch (error) {
    console.error('Custom domain setup error:', error)
    
    // SECURITY: Apply security headers even to error responses
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));
    
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error during domain setup' }),
      { status: 500, headers }
    )
  }
}