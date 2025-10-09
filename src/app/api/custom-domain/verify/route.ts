import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { promises as dns } from 'dns';

/**
 * POST /api/custom-domain/verify
 *
 * Verify domain ownership by checking DNS TXT record
 * Looks for _oto-raport-verification.{domain} TXT record with matching token
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ CUSTOM DOMAIN VERIFY: Not authenticated');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get developer profile with domain info
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, custom_domain, custom_domain_verified, custom_domain_verification_token')
      .eq('user_id', user.id)
      .single();

    if (devError || !developer) {
      console.error('❌ CUSTOM DOMAIN VERIFY: Developer not found', devError);
      return NextResponse.json(
        { success: false, error: 'Profil dewelopera nie został znaleziony' },
        { status: 404 }
      );
    }

    // Check if domain is registered
    if (!developer.custom_domain || !developer.custom_domain_verification_token) {
      console.log('❌ CUSTOM DOMAIN VERIFY: No domain registered');
      return NextResponse.json(
        {
          success: false,
          error: 'no_domain',
          message: 'Brak zarejestrowanej domeny do weryfikacji'
        },
        { status: 400 }
      );
    }

    // Check if already verified
    if (developer.custom_domain_verified) {
      console.log('✅ CUSTOM DOMAIN VERIFY: Domain already verified');
      return NextResponse.json({
        success: true,
        domain: developer.custom_domain,
        verified: true,
        message: 'Domena jest już zweryfikowana'
      });
    }

    const domain = developer.custom_domain;
    const expectedToken = developer.custom_domain_verification_token;
    const txtRecordName = `_oto-raport-verification.${domain}`;

    console.log('🔍 CUSTOM DOMAIN VERIFY: Checking DNS TXT record:', txtRecordName);

    try {
      // Resolve TXT records for verification subdomain
      const records = await dns.resolveTxt(txtRecordName);

      console.log('📋 CUSTOM DOMAIN VERIFY: Found TXT records:', records);

      // Flatten the records (DNS returns array of arrays)
      const flatRecords = records.map(record => record.join(''));

      // Check if any record matches our token
      const isVerified = flatRecords.some(record => record === expectedToken);

      if (!isVerified) {
        console.log('❌ CUSTOM DOMAIN VERIFY: Token not found in TXT records');
        return NextResponse.json(
          {
            success: false,
            error: 'verification_failed',
            message: 'Nie znaleziono poprawnego rekordu TXT. Sprawdź konfigurację DNS.',
            debug: {
              expected: expectedToken,
              found: flatRecords,
              txtRecordName
            }
          },
          { status: 400 }
        );
      }

      console.log('✅ CUSTOM DOMAIN VERIFY: Token verified, updating database');

      // Mark domain as verified using database function
      const { data: result, error: verifyError } = await supabase
        .rpc('verify_custom_domain', {
          developer_id_param: developer.id
        });

      if (verifyError) {
        console.error('❌ CUSTOM DOMAIN VERIFY: Error marking as verified:', verifyError);
        return NextResponse.json(
          { success: false, error: 'Błąd aktualizacji statusu weryfikacji' },
          { status: 500 }
        );
      }

      const verifyResult = result as {
        success: boolean;
        domain?: string;
        message?: string;
        error?: string;
      };

      if (!verifyResult.success) {
        console.error('❌ CUSTOM DOMAIN VERIFY: Verification update failed:', verifyResult);
        return NextResponse.json(
          {
            success: false,
            error: verifyResult.error || 'unknown',
            message: verifyResult.message || 'Błąd weryfikacji'
          },
          { status: 500 }
        );
      }

      console.log('✅ CUSTOM DOMAIN VERIFY: Domain verified successfully:', domain);

      return NextResponse.json({
        success: true,
        domain,
        verified: true,
        message: 'Domena została zweryfikowana! Możesz teraz dodać ją do Vercel.',
        nextStep: 'add_to_vercel'
      });

    } catch (dnsError: unknown) {
      console.error('❌ CUSTOM DOMAIN VERIFY: DNS resolution error:', dnsError);

      // Parse DNS error
      let errorMessage = 'Nie można znaleźć rekordu TXT. Sprawdź konfigurację DNS.';
      let errorCode = 'dns_not_found';

      if (dnsError && typeof dnsError === 'object' && 'code' in dnsError) {
        const error = dnsError as { code?: string; errno?: number };

        switch (error.code) {
          case 'ENOTFOUND':
          case 'ENODATA':
            errorMessage = 'Rekord TXT nie został jeszcze dodany lub propagacja DNS nie jest zakończona. Poczekaj 5-30 minut i spróbuj ponownie.';
            errorCode = 'dns_not_found';
            break;
          case 'ETIMEOUT':
            errorMessage = 'Timeout podczas sprawdzania DNS. Spróbuj ponownie za chwilę.';
            errorCode = 'dns_timeout';
            break;
          case 'ESERVFAIL':
            errorMessage = 'Błąd serwera DNS. Sprawdź konfigurację domeny.';
            errorCode = 'dns_server_error';
            break;
          default:
            errorMessage = `Błąd DNS: ${error.code || 'Unknown'}`;
            errorCode = 'dns_error';
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: errorCode,
          message: errorMessage,
          instructions: {
            pl: [
              '1. Upewnij się, że dodałeś rekord TXT w panelu DNS',
              `2. Nazwa rekordu: ${txtRecordName}`,
              `3. Wartość: ${expectedToken}`,
              '4. Poczekaj 5-30 minut na propagację DNS',
              '5. Spróbuj ponownie'
            ]
          }
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('💥 CUSTOM DOMAIN VERIFY: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
