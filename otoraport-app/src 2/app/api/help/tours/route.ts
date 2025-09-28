import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
import { supabaseAdmin } from '@/lib/supabase';
import { InAppHelpSystem, HelpContext } from '@/lib/help-system';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 'dashboard';
    const section = searchParams.get('section') || 'main';
    const subscriptionPlan = searchParams.get('subscription_plan') || 'basic';
    const onboardingStep = parseInt(searchParams.get('onboarding_step') || '0');

    const context: HelpContext = {
      page,
      section,
      user_action: 'viewing',
      subscription_plan: subscriptionPlan,
      onboarding_step: onboardingStep,
      feature_flags: []
    };

    // Get available guided tour
    const tour = await InAppHelpSystem.getGuidedTour(context);

    if (!tour) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No guided tour available for current context'
      });
    }

    return NextResponse.json({
      success: true,
      data: tour,
      metadata: {
        context,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Guided tours API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching guided tours',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST endpoint to track tour progress
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tour_id, event_type, step_index, completion_data } = await request.json();

    if (!tour_id || !event_type) {
      return NextResponse.json(
        { success: false, error: 'Tour ID and event type are required' },
        { status: 400 }
      );
    }

    const validEvents = ['tour_started', 'step_started', 'step_completed', 'tour_completed', 'tour_skipped'];
    if (!validEvents.includes(event_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Get developer ID
    const developer = auth.developer;

    // Save tour progress to database
    const { error: saveError } = await supabaseAdmin
      .from('tour_progress')
      .insert({
        user_id: developer.id,
        tour_id,
        event_type,
        step_index: step_index || null,
        completion_data: completion_data || null,
        created_at: new Date().toISOString()
      });

    if (saveError) {
      console.error('Error saving tour progress:', saveError);
      // Don't fail the request - analytics is not critical
    }

    // Handle specific events
    if (event_type === 'tour_completed') {
      // Update user's onboarding progress if this was an onboarding tour
      if (tour_id === 'onboarding_tour') {
        await supabaseAdmin
          .from('developers')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq('id', developer.id);
      }

      // Send completion analytics
      console.log(`Tour completed: ${tour_id} by user ${auth.user.email}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Tour progress tracked successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tour progress tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while tracking tour progress',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update tour completion rates (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (in production, implement proper admin check)
    if (!auth.user.email.includes('admin') && !auth.user.email.includes('bartlomiej')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Calculate tour completion rates from database
    const { data: tourStats, error } = await supabaseAdmin
      .from('tour_progress')
      .select('tour_id, event_type')
      .in('event_type', ['tour_started', 'tour_completed']);

    if (error) {
      throw error;
    }

    // Group by tour and calculate completion rates
    const tourData = {};
    tourStats?.forEach(stat => {
      if (!tourData[stat.tour_id]) {
        tourData[stat.tour_id] = { started: 0, completed: 0 };
      }
      if (stat.event_type === 'tour_started') {
        tourData[stat.tour_id].started++;
      } else if (stat.event_type === 'tour_completed') {
        tourData[stat.tour_id].completed++;
      }
    });

    const completionRates = Object.entries(tourData).map(([tourId, data]: [string, any]) => ({
      tour_id: tourId,
      completion_rate: data.started > 0 ? data.completed / data.started : 0,
      total_started: data.started,
      total_completed: data.completed
    }));

    return NextResponse.json({
      success: true,
      data: completionRates,
      message: 'Tour completion rates calculated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tour completion rates calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while calculating completion rates',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}