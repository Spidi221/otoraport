import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyCustomDomain } from '@/lib/custom-domains'
import { checkRateLimit, applySecurityHeaders } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting for verification attempts
    const rateLimitResult = await checkRateLimit(request, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 10, // Max 10 verification attempts per 5 minutes
    });

    if (!rateLimitResult.allowed) {
      const headers = applySecurityHeaders(new Headers({
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      }));
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Zbyt wiele prób weryfikacji. Spróbuj ponownie za 5 minut.',
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

    const developer = auth.developer

    if (devError || !developer) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: 'Developer account not found' }),
        { status: 404, headers }
      );
    }

    if (!developer.custom_domain) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ 
          error: 'No custom domain configured',
          message: 'Please setup a custom domain first'
        }),
        { status: 400, headers }
      );
    }

    console.log(`Verifying custom domain ${developer.custom_domain} for ${developer.company_name}`)

    // Attempt domain verification
    const verificationResult = await verifyCustomDomain(developer.custom_domain)

    if (!verificationResult.verified) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ 
          verified: false,
          domain: developer.custom_domain,
          error: verificationResult.error,
          suggestions: [
            'Ensure DNS records are properly configured',
            'Wait for DNS propagation (can take up to 24 hours)',
            'Check with your domain registrar if issues persist',
            'Contact support if you need assistance'
          ]
        }),
        { status: 200, headers } // 200 because it's a successful check, just not verified
      );
    }

    // Domain verified successfully - update database
    const { error: updateError } = await supabaseAdmin
      .from('developers')
      .update({ 
        // Could add a verification status field here
        updated_at: new Date().toISOString()
      })
      .eq('id', developer.id)

    if (updateError) {
      console.error('Failed to update domain verification status:', updateError)
    }

    console.log(`Custom domain ${developer.custom_domain} verified successfully for ${developer.company_name}`)

    // SECURITY: Apply security headers to response
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        verified: true,
        domain: developer.custom_domain,
        message: 'Custom domain verified successfully!',
        urls: {
          presentation: `https://${developer.custom_domain}/`,
          xmlFeed: `https://${developer.custom_domain}/data.xml`,
          md5Checksum: `https://${developer.custom_domain}/data.md5`
        },
        nextSteps: [
          'Your custom domain is now active',
          'SSL certificate will be provisioned automatically',
          'Share your presentation URL with clients',
          'Test your XML feed for ministry compliance'
        ]
      }),
      { status: 200, headers }
    )

  } catch (error) {
    console.error('Domain verification error:', error)
    
    // SECURITY: Apply security headers even to error responses
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error during domain verification',
        verified: false
      }),
      { status: 500, headers }
    )
  }
}