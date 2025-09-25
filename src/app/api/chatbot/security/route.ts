import { NextResponse } from 'next/server';
import { getSecurityStats, resetSessionSecurity } from '@/lib/chatbot-security';

/**
 * GET /api/chatbot/security - Get security statistics
 */
export async function GET() {
  try {
    const stats = getSecurityStats();
    
    return NextResponse.json({
      name: 'OTORAPORT Chatbot Security Monitor',
      timestamp: new Date().toISOString(),
      stats,
      description: 'Real-time security monitoring for chatbot interactions'
    });
  } catch (error) {
    console.error('Security stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get security statistics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chatbot/security - Security administration actions
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sessionId } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    switch (action) {
      case 'reset_session':
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId is required for reset_session action' },
            { status: 400 }
          );
        }
        
        const success = resetSessionSecurity(sessionId);
        return NextResponse.json({
          success,
          message: success 
            ? `Session ${sessionId} security data has been reset`
            : `Session ${sessionId} not found`
        });
      
      case 'get_stats':
        const stats = getSecurityStats();
        return NextResponse.json({ stats });
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Security admin error:', error);
    return NextResponse.json(
      { error: 'Security administration failed' },
      { status: 500 }
    );
  }
}