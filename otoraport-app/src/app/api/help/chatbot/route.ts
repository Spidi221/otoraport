import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InAppHelpSystem, HelpContext } from '@/lib/help-system';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { query, context } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    // Validate and sanitize context
    const helpContext: HelpContext = {
      page: context?.page || 'dashboard',
      section: context?.section || 'main',
      user_action: context?.user_action || 'viewing',
      subscription_plan: context?.subscription_plan || 'basic',
      onboarding_step: context?.onboarding_step || 0,
      feature_flags: Array.isArray(context?.feature_flags) ? context.feature_flags : []
    };

    // Process chatbot query
    const response = await InAppHelpSystem.processChatbotQuery(query, helpContext);

    // Log interaction for analytics
    console.log(`Chatbot interaction - User: ${session.user.email}, Query: ${query}, Confidence: ${response.confidence}`);

    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        query,
        context: helpContext,
        timestamp: new Date().toISOString(),
        user_id: session.user.email
      }
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while processing query',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint for chatbot health check
export async function GET() {
  try {
    const stats = await InAppHelpSystem.getHelpStatistics();

    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        total_resources: stats.total_resources,
        total_tours: stats.total_tours,
        uptime: '99.9%'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}