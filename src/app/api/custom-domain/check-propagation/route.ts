import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { promises as dns } from 'dns';

/**
 * GET /api/custom-domain/check-propagation
 *
 * Check DNS propagation status for custom domain
 * Verifies A or CNAME records point to Vercel
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ CUSTOM DOMAIN CHECK PROPAGATION: Not authenticated');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get developer profile with domain info
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, custom_domain, custom_domain_verified, custom_domain_added_to_vercel, custom_domain_dns_configured')
      .eq('user_id', user.id)
      .single();

    if (devError || !developer) {
      console.error('❌ CUSTOM DOMAIN CHECK PROPAGATION: Developer not found', devError);
      return NextResponse.json(
        { success: false, error: 'Profil dewelopera nie został znaleziony' },
        { status: 404 }
      );
    }

    // Check prerequisites
    if (!developer.custom_domain) {
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
      return NextResponse.json(
        {
          success: false,
          error: 'not_verified',
          message: 'Domena musi być najpierw zweryfikowana'
        },
        { status: 400 }
      );
    }

    if (!developer.custom_domain_added_to_vercel) {
      return NextResponse.json(
        {
          success: false,
          error: 'not_added_to_vercel',
          message: 'Domena musi być najpierw dodana do Vercel'
        },
        { status: 400 }
      );
    }

    const domain = developer.custom_domain;
    const isSubdomain = domain.split('.').length > 2;

    console.log('🔍 CUSTOM DOMAIN CHECK PROPAGATION: Checking DNS for:', domain);

    try {
      let isConfigured = false;
      let recordType: 'A' | 'CNAME' = isSubdomain ? 'CNAME' : 'A';
      let expectedValue = isSubdomain ? 'cname.vercel-dns.com' : '76.76.21.21';
      let actualValue: string | undefined;

      if (isSubdomain) {
        // Check CNAME record
        try {
          const cnameRecords = await dns.resolveCname(domain);
          actualValue = cnameRecords[0];

          // Check if CNAME points to Vercel
          isConfigured = cnameRecords.some(record =>
            record.toLowerCase().includes('vercel-dns.com') ||
            record.toLowerCase().includes('vercel.app')
          );

          console.log('📋 CUSTOM DOMAIN CHECK PROPAGATION: CNAME records:', cnameRecords);
        } catch (cnameError) {
          console.log('⚠️ CUSTOM DOMAIN CHECK PROPAGATION: No CNAME, checking A record');

          // Fallback: check A record for subdomain
          try {
            const aRecords = await dns.resolve4(domain);
            actualValue = aRecords[0];
            isConfigured = aRecords.includes('76.76.21.21');
            recordType = 'A';
            expectedValue = '76.76.21.21';

            console.log('📋 CUSTOM DOMAIN CHECK PROPAGATION: A records:', aRecords);
          } catch {
            // No records found
            console.log('❌ CUSTOM DOMAIN CHECK PROPAGATION: No DNS records found');
          }
        }
      } else {
        // Check A record for root domain
        try {
          const aRecords = await dns.resolve4(domain);
          actualValue = aRecords[0];

          // Check if A record points to Vercel IP
          isConfigured = aRecords.includes('76.76.21.21');

          console.log('📋 CUSTOM DOMAIN CHECK PROPAGATION: A records:', aRecords);
        } catch (aError) {
          console.log('❌ CUSTOM DOMAIN CHECK PROPAGATION: No A records found');
        }
      }

      // If configured and not yet marked in DB, update it
      if (isConfigured && !developer.custom_domain_dns_configured) {
        console.log('✅ CUSTOM DOMAIN CHECK PROPAGATION: DNS configured, updating database');

        const { error: updateError } = await supabase
          .from('developers')
          .update({
            custom_domain_dns_configured: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', developer.id);

        if (updateError) {
          console.error('❌ CUSTOM DOMAIN CHECK PROPAGATION: Error updating database:', updateError);
        }
      }

      // Return status
      if (isConfigured) {
        console.log('✅ CUSTOM DOMAIN CHECK PROPAGATION: DNS is configured correctly');

        return NextResponse.json({
          success: true,
          domain,
          configured: true,
          recordType,
          actualValue,
          expectedValue,
          message: 'DNS jest skonfigurowane poprawnie! Twoja domena jest gotowa do użycia.',
          status: 'ready'
        });
      } else {
        console.log('⏳ CUSTOM DOMAIN CHECK PROPAGATION: DNS not yet configured');

        return NextResponse.json({
          success: true,
          domain,
          configured: false,
          recordType,
          actualValue: actualValue || 'brak',
          expectedValue,
          message: 'DNS nie jest jeszcze skonfigurowane lub propagacja nie jest zakończona.',
          status: 'pending',
          instructions: {
            pl: isSubdomain
              ? [
                  'Dodaj rekord CNAME:',
                  `  Host: ${domain}`,
                  '  Wartość: cname.vercel-dns.com',
                  '',
                  'Propagacja DNS może zająć 5-60 minut.'
                ]
              : [
                  'Dodaj rekord A:',
                  `  Host: @ lub ${domain}`,
                  '  Wartość: 76.76.21.21',
                  '',
                  'Propagacja DNS może zająć 5-60 minut.'
                ]
          }
        });
      }

    } catch (dnsError) {
      console.error('❌ CUSTOM DOMAIN CHECK PROPAGATION: DNS error:', dnsError);

      let errorMessage = 'Nie można sprawdzić DNS. Spróbuj ponownie za chwilę.';

      if (dnsError && typeof dnsError === 'object' && 'code' in dnsError) {
        const error = dnsError as { code?: string };

        switch (error.code) {
          case 'ENOTFOUND':
          case 'ENODATA':
            errorMessage = 'Brak rekordów DNS dla tej domeny. Sprawdź konfigurację.';
            break;
          case 'ETIMEOUT':
            errorMessage = 'Timeout podczas sprawdzania DNS. Spróbuj ponownie.';
            break;
          case 'ESERVFAIL':
            errorMessage = 'Błąd serwera DNS.';
            break;
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'dns_error',
          message: errorMessage,
          status: 'error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 CUSTOM DOMAIN CHECK PROPAGATION: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
