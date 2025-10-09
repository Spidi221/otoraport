import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Validation schema for subdomain claim
const claimSubdomainSchema = z.object({
  subdomain: z
    .string()
    .min(3, 'Subdomena musi mieć minimum 3 znaki')
    .max(63, 'Subdomena może mieć maksymalnie 63 znaki')
    .regex(/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/,
      'Subdomena może zawierać tylko małe litery, cyfry i myślniki (nie na początku/końcu)')
    .toLowerCase()
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany' },
        { status: 401 }
      );
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, subscription_plan')
      .eq('user_id', user.id)
      .single();

    if (devError || !developer) {
      return NextResponse.json(
        { error: 'Nie znaleziono profilu dewelopera' },
        { status: 404 }
      );
    }

    // Check if user has Pro or Enterprise plan
    if (!['pro', 'enterprise'].includes(developer.subscription_plan || '')) {
      return NextResponse.json(
        {
          error: 'Plan Pro lub Enterprise wymagany',
          message: 'Subdomena jest dostępna tylko dla planów Pro i Enterprise. Upgrade swój plan aby kontynuować.'
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = claimSubdomainSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.errors[0]?.message || 'Nieprawidłowy format subdomeny'
        },
        { status: 400 }
      );
    }

    const { subdomain } = validation.data;

    // Use database function to claim subdomain (atomic operation)
    const { data, error } = await supabase
      .rpc('claim_subdomain', {
        developer_id_param: developer.id,
        subdomain_param: subdomain
      });

    if (error) {
      console.error('Error claiming subdomain:', error);
      return NextResponse.json(
        { error: 'Błąd podczas przypisywania subdomeny' },
        { status: 500 }
      );
    }

    const result = data as {
      success: boolean;
      subdomain?: string;
      error?: string;
      message: string;
    };

    if (!result.success) {
      const statusCode = result.error === 'plan_required' ? 403 : 400;
      return NextResponse.json(
        {
          error: result.message
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      subdomain: result.subdomain,
      message: result.message,
      url: `https://${result.subdomain}.otoraport.pl`
    });

  } catch (error) {
    console.error('Unexpected error claiming subdomain:', error);
    return NextResponse.json(
      { error: 'Wystąpił nieoczekiwany błąd' },
      { status: 500 }
    );
  }
}
