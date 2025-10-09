import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * POST /api/custom-domain/register
 *
 * Register a custom domain for Enterprise users
 * Generates verification token for DNS TXT record
 */

const registerSchema = z.object({
  domain: z.string()
    .min(3, 'Domena musi mieć minimum 3 znaki')
    .max(255, 'Domena może mieć maksymalnie 255 znaków')
    .regex(
      /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i,
      'Nieprawidłowy format domeny. Użyj formatu: domena.pl lub subdomena.domena.pl'
    )
    .transform(val => val.toLowerCase()),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ CUSTOM DOMAIN REGISTER: Not authenticated');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, subscription_plan, custom_domain')
      .eq('user_id', user.id)
      .single();

    if (devError || !developer) {
      console.error('❌ CUSTOM DOMAIN REGISTER: Developer not found', devError);
      return NextResponse.json(
        { success: false, error: 'Profil dewelopera nie został znaleziony' },
        { status: 404 }
      );
    }

    // Check for Enterprise plan
    if (developer.subscription_plan !== 'enterprise') {
      console.log('❌ CUSTOM DOMAIN REGISTER: Not Enterprise plan');
      return NextResponse.json(
        {
          success: false,
          error: 'plan_required',
          message: 'Plan Enterprise wymagany dla custom domain'
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { domain } = registerSchema.parse(body);

    console.log('🌐 CUSTOM DOMAIN REGISTER: Registering domain:', domain);

    // Check if domain is available (using database function)
    const { data: isAvailable, error: checkError } = await supabase
      .rpc('is_custom_domain_available', { check_domain: domain });

    if (checkError) {
      console.error('❌ CUSTOM DOMAIN REGISTER: Error checking availability:', checkError);
      return NextResponse.json(
        { success: false, error: 'Błąd sprawdzania dostępności domeny' },
        { status: 500 }
      );
    }

    if (!isAvailable) {
      console.log('❌ CUSTOM DOMAIN REGISTER: Domain not available:', domain);
      return NextResponse.json(
        {
          success: false,
          error: 'not_available',
          message: 'Domena jest niedostępna lub zarezerwowana'
        },
        { status: 400 }
      );
    }

    // Register domain (using database function for atomic operation)
    const { data: result, error: registerError } = await supabase
      .rpc('register_custom_domain', {
        developer_id_param: developer.id,
        domain_param: domain
      });

    if (registerError) {
      console.error('❌ CUSTOM DOMAIN REGISTER: Error registering domain:', registerError);
      return NextResponse.json(
        { success: false, error: 'Błąd rejestracji domeny' },
        { status: 500 }
      );
    }

    // Parse result
    const registrationResult = result as {
      success: boolean;
      domain?: string;
      verification_token?: string;
      message?: string;
      error?: string;
    };

    if (!registrationResult.success) {
      console.error('❌ CUSTOM DOMAIN REGISTER: Registration failed:', registrationResult);
      return NextResponse.json(
        {
          success: false,
          error: registrationResult.error || 'unknown',
          message: registrationResult.message || 'Błąd rejestracji domeny'
        },
        { status: 400 }
      );
    }

    console.log('✅ CUSTOM DOMAIN REGISTER: Domain registered successfully:', domain);

    // Return success with verification instructions
    return NextResponse.json({
      success: true,
      domain: registrationResult.domain,
      verification: {
        token: registrationResult.verification_token,
        txtRecordName: `_oto-raport-verification.${registrationResult.domain}`,
        txtRecordValue: registrationResult.verification_token,
        instructions: {
          pl: [
            '1. Zaloguj się do panelu zarządzania DNS swojej domeny',
            '2. Dodaj nowy rekord TXT:',
            `   - Host/Nazwa: _oto-raport-verification.${registrationResult.domain}`,
            `   - Wartość: ${registrationResult.verification_token}`,
            '   - TTL: 3600 (lub domyślny)',
            '3. Poczekaj na propagację DNS (5-30 minut)',
            '4. Wróć tutaj i kliknij "Weryfikuj DNS"'
          ]
        }
      },
      message: registrationResult.message
    });

  } catch (error) {
    console.error('💥 CUSTOM DOMAIN REGISTER: Unexpected error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: error.errors[0].message,
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
