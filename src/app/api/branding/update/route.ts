import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Validation schema for branding update
const updateBrandingSchema = z.object({
  branding_logo_url: z.string().url('Nieprawidłowy URL logo').nullable().optional(),
  branding_primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Kolor musi być w formacie hex (np. #FF5733)')
    .nullable()
    .optional(),
  branding_secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Kolor musi być w formacie hex (np. #33C3FF)')
    .nullable()
    .optional(),
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
          message: 'Branding jest dostępny tylko dla planów Pro i Enterprise. Upgrade swój plan aby kontynuować.'
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = updateBrandingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.errors[0]?.message || 'Nieprawidłowe dane'
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Update branding in database
    const { data, error } = await supabase
      .from('developers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', developer.id)
      .select('branding_logo_url, branding_primary_color, branding_secondary_color')
      .single();

    if (error) {
      console.error('Error updating branding:', error);
      return NextResponse.json(
        { error: 'Błąd podczas aktualizacji brandingu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Branding został zaktualizowany',
      branding: data,
    });

  } catch (error) {
    console.error('Unexpected error updating branding:', error);
    return NextResponse.json(
      { error: 'Wystąpił nieoczekiwany błąd' },
      { status: 500 }
    );
  }
}
