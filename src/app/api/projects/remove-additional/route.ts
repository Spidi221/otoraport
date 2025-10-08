import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { removeAdditionalProjectFromSubscription } from '@/lib/stripe';

/**
 * POST /api/projects/remove-additional
 * Remove an additional project from Pro plan (-50zł/month)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('*')
      .eq('id', user.id)
      .single();

    if (devError || !developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    if (developer.subscription_plan !== 'pro') {
      return NextResponse.json(
        { error: 'Only available for Pro plan' },
        { status: 400 }
      );
    }

    if ((developer.additional_projects_count || 0) === 0) {
      return NextResponse.json(
        { error: 'No additional projects to remove' },
        { status: 400 }
      );
    }

    const newCount = (developer.additional_projects_count || 0) - 1;

    const result = await removeAdditionalProjectFromSubscription(
      developer.stripe_subscription_id!,
      newCount
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update subscription' },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from('developers')
      .update({ additional_projects_count: newCount })
      .eq('id', developer.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Database update failed' },
        { status: 500 }
      );
    }

    const baseCost = 24900;
    const additionalCost = newCount * 5000;
    const totalCost = baseCost + additionalCost;

    return NextResponse.json({
      success: true,
      additional_projects_count: newCount,
      billing: {
        base_plan: '249 zł',
        additional_projects: newCount > 0 ? `${newCount} × 50 zł = ${newCount * 50} zł` : '0 zł',
        total_monthly: `${(totalCost / 100).toFixed(0)} zł`
      },
      message: `Usunięto dodatkowy projekt. Nowy koszt: ${(totalCost / 100).toFixed(0)} zł/msc`
    });

  } catch (error) {
    console.error('Error in POST /api/projects/remove-additional:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
