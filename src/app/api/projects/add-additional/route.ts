import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addAdditionalProjectToSubscription } from '@/lib/stripe';

/**
 * POST /api/projects/add-additional
 * Purchase an additional project for Pro plan (+50zł/month)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('*')
      .eq('id', user.id)
      .single();

    if (devError || !developer) {
      return NextResponse.json(
        { error: 'Developer profile not found' },
        { status: 404 }
      );
    }

    // Validate Pro plan
    if (developer.subscription_plan !== 'pro') {
      return NextResponse.json(
        {
          error: 'Dodatkowe projekty dostępne tylko w planie Pro',
          current_plan: developer.subscription_plan
        },
        { status: 400 }
      );
    }

    // Validate has active subscription
    if (!developer.stripe_subscription_id || developer.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'Aktywna subskrypcja wymagana' },
        { status: 400 }
      );
    }

    // Increment additional_projects_count
    const newCount = (developer.additional_projects_count || 0) + 1;

    // Update Stripe subscription
    const result = await addAdditionalProjectToSubscription(
      developer.stripe_subscription_id,
      newCount
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update subscription' },
        { status: 500 }
      );
    }

    // Update database
    const { error: updateError } = await supabase
      .from('developers')
      .update({
        additional_projects_count: newCount
      })
      .eq('id', developer.id);

    if (updateError) {
      console.error('Error updating additional_projects_count:', updateError);
      return NextResponse.json(
        { error: 'Failed to update database' },
        { status: 500 }
      );
    }

    // Calculate new monthly cost
    const baseCost = 24900; // 249zł Pro plan
    const additionalCost = newCount * 5000; // 50zł per project
    const totalCost = baseCost + additionalCost;

    return NextResponse.json({
      success: true,
      additional_projects_count: newCount,
      billing: {
        base_plan: '249 zł',
        additional_projects: `${newCount} × 50 zł = ${newCount * 50} zł`,
        total_monthly: `${(totalCost / 100).toFixed(0)} zł`
      },
      message: `Dodano dodatkowy projekt. Nowy koszt: ${(totalCost / 100).toFixed(0)} zł/msc`
    });

  } catch (error) {
    console.error('Error in POST /api/projects/add-additional:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
