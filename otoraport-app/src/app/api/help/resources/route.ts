import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
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
    const userAction = searchParams.get('user_action') || 'viewing';
    const subscriptionPlan = searchParams.get('subscription_plan') || 'basic';
    const onboardingStep = parseInt(searchParams.get('onboarding_step') || '0');

    const context: HelpContext = {
      page,
      section,
      user_action: userAction,
      subscription_plan: subscriptionPlan,
      onboarding_step: onboardingStep,
      feature_flags: []
    };

    // Get contextual help resources
    const resources = await InAppHelpSystem.getContextualHelp(context);

    return NextResponse.json({
      success: true,
      data: resources,
      metadata: {
        context,
        total_resources: resources.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Help resources API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching help resources',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { resource_id, action } = await request.json();

    if (!resource_id || !action) {
      return NextResponse.json(
        { success: false, error: 'Resource ID and action are required' },
        { status: 400 }
      );
    }

    if (!['view', 'helpful', 'not_helpful'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be: view, helpful, or not_helpful' },
        { status: 400 }
      );
    }

    // Track resource usage
    await InAppHelpSystem.trackResourceUsage(resource_id, auth.user.email, action);

    return NextResponse.json({
      success: true,
      message: `Resource ${action} tracked successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Help resource tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while tracking resource usage',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}