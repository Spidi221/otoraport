import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Validation schema for subdomain
const checkSubdomainSchema = z.object({
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

    // Parse and validate request body
    const body = await req.json();
    const validation = checkSubdomainSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          available: false,
          reason: validation.error.errors[0]?.message || 'Nieprawidłowy format subdomeny'
        },
        { status: 400 }
      );
    }

    const { subdomain } = validation.data;

    // Check if subdomain is available using database function
    const { data, error } = await supabase
      .rpc('is_subdomain_available', { check_subdomain: subdomain });

    if (error) {
      console.error('Error checking subdomain availability:', error);
      return NextResponse.json(
        {
          available: false,
          reason: 'Błąd podczas sprawdzania dostępności'
        },
        { status: 500 }
      );
    }

    const isAvailable = data as boolean;

    if (!isAvailable) {
      // Check if it's reserved or taken
      const { data: reservedData } = await supabase
        .from('reserved_subdomains')
        .select('subdomain')
        .eq('subdomain', subdomain)
        .single();

      const reason = reservedData
        ? 'Subdomena jest zarezerwowana'
        : 'Subdomena jest już zajęta';

      return NextResponse.json({
        available: false,
        reason
      });
    }

    return NextResponse.json({
      available: true
    });

  } catch (error) {
    console.error('Unexpected error in subdomain check:', error);
    return NextResponse.json(
      {
        available: false,
        reason: 'Wystąpił nieoczekiwany błąd'
      },
      { status: 500 }
    );
  }
}
