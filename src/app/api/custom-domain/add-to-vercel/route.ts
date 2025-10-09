import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addDomainToVercel, isVercelConfigured } from '@/lib/vercel-domains';

/**
 * POST /api/custom-domain/add-to-vercel
 *
 * Add verified domain to Vercel project
 * Requires domain to be verified first
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ CUSTOM DOMAIN ADD TO VERCEL: Not authenticated');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get developer profile with domain info
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, custom_domain, custom_domain_verified, custom_domain_added_to_vercel')
      .eq('user_id', user.id)
      .single();

    if (devError || !developer) {
      console.error('❌ CUSTOM DOMAIN ADD TO VERCEL: Developer not found', devError);
      return NextResponse.json(
        { success: false, error: 'Profil dewelopera nie został znaleziony' },
        { status: 404 }
      );
    }

    // Check if domain is registered and verified
    if (!developer.custom_domain) {
      console.log('❌ CUSTOM DOMAIN ADD TO VERCEL: No domain registered');
      return NextResponse.json(
        {
          success: false,
          error: 'no_domain',
          message: 'Brak zarejestrowanej domeny'
        },
        { status: 400 }
      );
    }

    if (!developer.custom_domain_verified) {
      console.log('❌ CUSTOM DOMAIN ADD TO VERCEL: Domain not verified');
      return NextResponse.json(
        {
          success: false,
          error: 'not_verified',
          message: 'Domena musi być najpierw zweryfikowana'
        },
        { status: 400 }
      );
    }

    // Check if already added to Vercel
    if (developer.custom_domain_added_to_vercel) {
      console.log('✅ CUSTOM DOMAIN ADD TO VERCEL: Domain already added');
      return NextResponse.json({
        success: true,
        domain: developer.custom_domain,
        alreadyAdded: true,
        message: 'Domena jest już dodana do Vercel',
        nextStep: 'configure_dns'
      });
    }

    // Check if Vercel is configured
    if (!isVercelConfigured()) {
      console.error('❌ CUSTOM DOMAIN ADD TO VERCEL: Vercel not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'vercel_not_configured',
          message: 'Vercel API nie jest skonfigurowane. Skontaktuj się z administratorem.'
        },
        { status: 500 }
      );
    }

    const domain = developer.custom_domain;

    console.log('🌐 CUSTOM DOMAIN ADD TO VERCEL: Adding domain to Vercel:', domain);

    // Add domain to Vercel
    const vercelResult = await addDomainToVercel(domain);

    if (!vercelResult.success) {
      console.error('❌ CUSTOM DOMAIN ADD TO VERCEL: Vercel API error:', vercelResult);
      return NextResponse.json(
        {
          success: false,
          error: vercelResult.errorCode || 'vercel_error',
          message: vercelResult.error || 'Błąd dodawania domeny do Vercel'
        },
        { status: 500 }
      );
    }

    console.log('✅ CUSTOM DOMAIN ADD TO VERCEL: Domain added to Vercel successfully');

    // Update database
    const { error: updateError } = await supabase
      .from('developers')
      .update({
        custom_domain_added_to_vercel: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', developer.id);

    if (updateError) {
      console.error('❌ CUSTOM DOMAIN ADD TO VERCEL: Error updating database:', updateError);
      // Don't fail - domain is added to Vercel, just log the error
      console.warn('⚠️ Domain added to Vercel but database update failed');
    }

    // Determine DNS configuration instructions
    const isSubdomain = domain.split('.').length > 2;
    const dnsInstructions = isSubdomain
      ? {
          type: 'CNAME' as const,
          host: domain,
          value: 'cname.vercel-dns.com',
          instructions: {
            pl: [
              '1. Zaloguj się do panelu zarządzania DNS swojej domeny',
              '2. Dodaj nowy rekord CNAME:',
              `   - Host/Nazwa: ${domain}`,
              '   - Wartość/Target: cname.vercel-dns.com',
              '   - TTL: 3600 (lub domyślny)',
              '3. Poczekaj na propagację DNS (5-60 minut)',
              '4. Wróć tutaj i sprawdź status propagacji'
            ]
          }
        }
      : {
          type: 'A' as const,
          host: domain,
          value: '76.76.21.21',
          instructions: {
            pl: [
              '1. Zaloguj się do panelu zarządzania DNS swojej domeny',
              '2. Dodaj nowy rekord A:',
              `   - Host/Nazwa: @ (lub ${domain})`,
              '   - Wartość/IP: 76.76.21.21',
              '   - TTL: 3600 (lub domyślny)',
              '3. Poczekaj na propagację DNS (5-60 minut)',
              '4. Wróć tutaj i sprawdź status propagacji'
            ]
          }
        };

    console.log('✅ CUSTOM DOMAIN ADD TO VERCEL: Success, returning DNS instructions');

    return NextResponse.json({
      success: true,
      domain,
      verification: vercelResult.verification,
      dnsInstructions,
      message: 'Domena została dodana do Vercel! Skonfiguruj teraz DNS.',
      nextStep: 'configure_dns'
    });

  } catch (error) {
    console.error('💥 CUSTOM DOMAIN ADD TO VERCEL: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
