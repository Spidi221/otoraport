// API endpoint dla konfiguracji custom domains - Enterprise feature
// POST /api/domains/setup

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
import { supabaseAdmin } from '@/lib/supabase';
import { setupCustomDomain } from '@/lib/custom-domains';
import { checkSubscriptionLimits } from '@/lib/subscription-plans';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { domain } = await request.json();

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('id', auth.developer.id)
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
          error: 'Custom domains require Enterprise plan',
          upgrade_required: true,
          current_plan: developer.subscription_plan
        },
        { status: 403 }
      );
    }

    // Check subscription limits
    const limitsCheck = await checkSubscriptionLimits(developer.id);
    if (!limitsCheck.withinLimits) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription limits exceeded',
          limits: limitsCheck.limits,
          current_usage: limitsCheck.currentUsage
        },
        { status: 403 }
      );
    }

    // Setup custom domain
    const setupResult = await setupCustomDomain(domain, developer.id);

    if (!setupResult.success) {
      return NextResponse.json(setupResult, { status: 400 });
    }

    // Log activity
    console.log(`✅ Custom domain setup initiated: ${domain} for developer: ${developer.company_name}`);

    return NextResponse.json({
      success: true,
      domain,
      status: setupResult.status,
      dnsRecords: setupResult.dnsRecords,
      instructions: `Skonfiguruj rekordy DNS dla domeny ${domain}. Szczegóły w odpowiedzi.`,
      verificationToken: setupResult.verificationToken,
      estimatedPropagationTime: '5-30 minut'
    });

  } catch (error) {
    console.error('Domain setup API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during domain setup'
      },
      { status: 500 }
    );
  }
}

// GET /api/domains/setup - get current domain configuration
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get developer profile with custom domain info
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id, custom_domain, presentation_url, presentation_generated_at, subscription_plan')
      .eq('id', auth.developer.id)
      .single();

    if (!developer) {
      return NextResponse.json(
        { success: false, error: 'Developer profile not found' },
        { status: 404 }
      );
    }

    const hasEnterprise = developer.subscription_plan === 'enterprise';

    if (!hasEnterprise) {
      return NextResponse.json({
        success: true,
        hasCustomDomain: false,
        requiresUpgrade: true,
        currentPlan: developer.subscription_plan,
        message: 'Custom domains dostępne w planie Enterprise'
      });
    }

    if (!developer.custom_domain) {
      return NextResponse.json({
        success: true,
        hasCustomDomain: false,
        canSetup: true,
        message: 'Brak skonfigurowanej domeny'
      });
    }

    // Get domain configuration details
    const { getDomainConfig } = await import('@/lib/custom-domains');
    const domainConfig = await getDomainConfig(developer.id);

    return NextResponse.json({
      success: true,
      hasCustomDomain: true,
      domain: developer.custom_domain,
      verified: domainConfig.verified,
      presentationUrl: developer.presentation_url,
      lastGenerated: developer.presentation_generated_at,
      dnsInstructions: domainConfig.dnsInstructions,
      status: domainConfig.verified ? 'active' : 'pending_verification'
    });

  } catch (error) {
    console.error('Get domain config API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}