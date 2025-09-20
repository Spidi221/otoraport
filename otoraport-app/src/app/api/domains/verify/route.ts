// API endpoint dla weryfikacji custom domains
// POST /api/domains/verify

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyCustomDomain } from '@/lib/custom-domains';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { domain } = await request.json();

    // Get developer profile
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('id, custom_domain, subscription_plan, company_name')
      .eq('email', session.user.email)
      .single();

    if (devError || !developer) {
      return NextResponse.json(
        { success: false, error: 'Developer profile not found' },
        { status: 404 }
      );
    }

    // Check if user has Enterprise plan
    if (developer.subscription_plan !== 'enterprise') {
      return NextResponse.json(
        {
          success: false,
          error: 'Custom domains require Enterprise plan'
        },
        { status: 403 }
      );
    }

    // Use provided domain or developer's configured domain
    const targetDomain = domain || developer.custom_domain;

    if (!targetDomain) {
      return NextResponse.json(
        {
          success: false,
          error: 'No domain to verify. Setup custom domain first.'
        },
        { status: 400 }
      );
    }

    // Verify domain ownership and DNS configuration
    const verificationResult = await verifyCustomDomain(targetDomain);

    if (verificationResult.verified) {
      // Update domain status in database
      await supabaseAdmin
        .from('developers')
        .update({
          custom_domain: targetDomain,
          // Could add domain_verified_at field
        })
        .eq('id', developer.id);

      console.log(`✅ Domain verified successfully: ${targetDomain} for developer: ${developer.company_name}`);

      return NextResponse.json({
        success: true,
        verified: true,
        domain: targetDomain,
        message: `Domena ${targetDomain} została pomyślnie zweryfikowana`,
        nextSteps: [
          'Możesz teraz wdrożyć swoją stronę prezentacyjną',
          'SSL certificate zostanie automatycznie wygenerowany',
          'Strona będzie dostępna pod adresem https://' + targetDomain
        ]
      });
    } else {
      return NextResponse.json({
        success: false,
        verified: false,
        domain: targetDomain,
        error: verificationResult.error || 'Domain verification failed',
        troubleshooting: [
          'Sprawdź czy rekordy DNS zostały prawidłowo skonfigurowane',
          'DNS propagacja może potrwać do 24 godzin',
          'Upewnij się, że nie ma konfliktów z innymi rekordami',
          'Skontaktuj się z supportem jeśli problem się powtarza'
        ]
      });
    }

  } catch (error) {
    console.error('Domain verification API error:', error);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: 'Internal server error during domain verification'
      },
      { status: 500 }
    );
  }
}

// GET /api/domains/verify - check verification status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get developer profile
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('custom_domain, subscription_plan')
      .eq('email', session.user.email)
      .single();

    if (!developer) {
      return NextResponse.json(
        { success: false, error: 'Developer profile not found' },
        { status: 404 }
      );
    }

    if (developer.subscription_plan !== 'enterprise') {
      return NextResponse.json({
        success: true,
        canVerify: false,
        reason: 'Enterprise plan required'
      });
    }

    if (!developer.custom_domain) {
      return NextResponse.json({
        success: true,
        canVerify: false,
        reason: 'No custom domain configured'
      });
    }

    // Check current verification status without updating
    const verificationResult = await verifyCustomDomain(developer.custom_domain);

    return NextResponse.json({
      success: true,
      canVerify: true,
      domain: developer.custom_domain,
      verified: verificationResult.verified,
      lastChecked: new Date().toISOString(),
      error: verificationResult.error || undefined
    });

  } catch (error) {
    console.error('Get verification status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}