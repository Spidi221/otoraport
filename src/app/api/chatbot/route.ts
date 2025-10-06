import { NextRequest, NextResponse } from 'next/server';
import { findRelevantKnowledge, getFallbackResponse, getGreeting } from '@/lib/chatbot-knowledge';
import { performSecurityCheck, getSecurityMessage } from '@/lib/chatbot-security';
import { getAIChatResponse, checkOpenAIHealth } from '@/lib/openai-integration';
import { generalAPIRateLimit } from '@/lib/security';

export interface ChatbotRequest {
  message: string;
  conversationHistory?: Array<{
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
  }>;
}

export interface ChatbotResponse {
  response: string;
  confidence: number;
  sources?: string[];
  suggestedQuestions?: string[];
}

/**
 * POST /api/chatbot
 * 
 * Phase 1 implementation using local knowledge base with mock OpenAI structure.
 * Ready for Phase 2+ expansion with real AI integration.
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Rate limiting for chatbot requests
    const rateLimitResult = await generalAPIRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          response: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.',
          error: 'Rate limit exceeded',
          confidence: 0.0
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      )
    }

    const body: ChatbotRequest & { sessionId?: string } = await req.json();
    
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const userMessage = body.message.trim();
    const sessionId = body.sessionId || req.headers.get('x-session-id') || req.ip || 'anonymous';
    
    // Perform security check
    const securityCheck = performSecurityCheck(userMessage, sessionId);
    if (!securityCheck.allowed) {
      console.log(`[Chatbot Security] Blocked message from ${sessionId}: ${securityCheck.reason} (score: ${securityCheck.suspicionScore})`);
      
      return NextResponse.json({
        response: getSecurityMessage(securityCheck),
        confidence: 0.0,
        blocked: true,
        reason: securityCheck.reason,
        waitTime: securityCheck.waitTime
      }, { status: 429 }); // Too Many Requests
    }
    
    // Handle empty or very short messages
    if (userMessage.length < 2) {
      return NextResponse.json({
        response: getGreeting(),
        confidence: 1.0,
        suggestedQuestions: [
          'Jakie są wymagania ustawy z 21 maja 2025?',
          'Ile kosztuje plan Basic?',
          'Jak szybki jest setup?'
        ]
      });
    }

    // Use AI-powered response with knowledge base integration
    const aiResponse = await getAIChatResponse(
      userMessage, 
      body.conversationHistory || [], 
      sessionId
    );

    // Log the interaction for analytics
    console.log(`[Chatbot AI] Session: ${sessionId} | Query: "${userMessage}" | Model: ${aiResponse.model} | Confidence: ${aiResponse.confidence} | Security Score: ${securityCheck.suspicionScore} | Sources: ${aiResponse.sources?.join(', ') || 'none'}`);

    const chatbotResponse: ChatbotResponse = {
      response: aiResponse.response,
      confidence: aiResponse.confidence,
      sources: aiResponse.sources,
      suggestedQuestions: aiResponse.suggestedQuestions
    };

    return NextResponse.json(chatbotResponse);

  } catch (error) {
    console.error('[Chatbot API] Error:', error);
    
    return NextResponse.json({
      response: 'Przepraszam, wystąpił błąd techniczny. Spróbuj ponownie za chwilę lub skontaktuj się z naszym supportem na support@otoraport.pl',
      confidence: 0.0,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * GET /api/chatbot - Health check and info endpoint
 */
export async function GET() {
  // Check OpenAI health
  const openaiHealthy = await checkOpenAIHealth();
  
  return NextResponse.json({
    name: 'OTORAPORT Chatbot API',
    version: '2.0.0',
    phase: 'AI-Powered',
    description: 'AI-powered chatbot for OTORAPORT with GPT-4o integration and comprehensive security',
    features: [
      'GPT-4o AI responses with knowledge base integration',
      'Hybrid AI + FAQ mode for optimal accuracy',
      'Context-aware conversations with memory',
      'Advanced security system (rate limiting, spam detection)',
      'Professional Polish language support',
      'Real-time follow-up question generation',
      'Session-based conversation tracking'
    ],
    ai: {
      model: 'gpt-4o',
      status: openaiHealthy ? 'healthy' : 'degraded',
      fallback: 'Knowledge base available if AI fails'
    },
    security: {
      features: ['Rate limiting', 'Spam detection', 'Profanity filtering', 'Malicious content blocking'],
      limits: '10 messages/minute per session'
    },
    endpoints: {
      'POST /api/chatbot': 'Send message to AI chatbot',
      'GET /api/chatbot': 'Get API information',
      'GET /api/chatbot/security': 'Security statistics (admin)'
    },
    status: 'active',
    timestamp: new Date().toISOString()
  });
}

/*
 * PHASE 2+ EXPANSION NOTES:
 * 
 * This API route is structured to easily integrate with OpenAI or Claude API:
 * 
 * 1. Add environment variable for API key
 * 2. Add AI service integration in separate function
 * 3. Use knowledge base as system prompt context
 * 4. Implement conversation memory/context
 * 5. Add sentiment analysis
 * 6. Add lead qualification scoring
 * 7. Add integration with CRM/support system
 * 
 * Example OpenAI integration structure:
 * 
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * 
 * const systemPrompt = `You are OTORAPORT assistant. Use this knowledge: ${JSON.stringify(relevantKnowledge)}`;
 * 
 * const completion = await openai.chat.completions.create({
 *   messages: [
 *     { role: "system", content: systemPrompt },
 *     { role: "user", content: userMessage }
 *   ],
 *   model: "gpt-4o",
 *   temperature: 0.7,
 *   max_tokens: 500
 * });
 */