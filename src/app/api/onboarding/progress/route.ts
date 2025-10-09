import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const progressSchema = z.object({
  step: z.number().min(1).max(6),
  completed_steps: z.array(z.number()),
  skipped_steps: z.array(z.number()),
  data: z.object({
    company_info: z
      .object({
        company_name: z.string().optional(),
        tax_id: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
    has_logo: z.boolean().optional(),
    has_csv: z.boolean().optional(),
  }),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = progressSchema.parse(body);

    // Update profile with onboarding progress
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Save company info if provided
    if (validatedData.data.company_info) {
      const { company_name, tax_id, phone, address } =
        validatedData.data.company_info;

      const updates: any = {};
      if (company_name) updates.company_name = company_name;
      if (tax_id) updates.tax_id = tax_id;
      if (phone) updates.phone = phone;
      if (address) updates.address = address;

      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', user.id);
      }
    }

    // Mark onboarding as completed if on last step
    if (validatedData.step === 6) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
    }

    // Store progress in a separate table (optional - for analytics)
    // This allows tracking user behavior through onboarding
    await supabase.from('onboarding_progress').upsert(
      {
        user_id: user.id,
        current_step: validatedData.step,
        completed_steps: validatedData.completed_steps,
        skipped_steps: validatedData.skipped_steps,
        has_logo: validatedData.data.has_logo || false,
        has_csv: validatedData.data.has_csv || false,
        updated_at: validatedData.timestamp,
      },
      {
        onConflict: 'user_id',
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Progress saved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Onboarding progress error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve onboarding progress
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get onboarding progress
    const { data: progress, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // No progress saved yet
      return NextResponse.json(
        {
          current_step: 1,
          completed_steps: [],
          skipped_steps: [],
          has_logo: false,
          has_csv: false,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(progress, { status: 200 });
  } catch (error) {
    console.error('Get onboarding progress error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
