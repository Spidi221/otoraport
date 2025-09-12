import { NextRequest, NextResponse } from 'next/server';
import { findRelevantKnowledge, getFallbackResponse, getGreeting } from '@/lib/chatbot-knowledge';

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
    const body: ChatbotRequest = await req.json();
    
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const userMessage = body.message.trim();
    
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

    // Find relevant knowledge items
    const relevantKnowledge = findRelevantKnowledge(userMessage, 2);
    
    let response: string;
    let confidence: number;
    let sources: string[] = [];
    let suggestedQuestions: string[] = [];

    if (relevantKnowledge.length > 0) {
      // Use the best matching knowledge item
      const bestMatch = relevantKnowledge[0];
      response = bestMatch.answer;
      confidence = 0.9; // High confidence for direct knowledge base matches
      sources = [bestMatch.id];
      
      // Add follow-up questions if available
      if (bestMatch.followUpQuestions) {
        suggestedQuestions = bestMatch.followUpQuestions.slice(0, 3);
      }
      
      // If we have multiple relevant items, mention them
      if (relevantKnowledge.length > 1) {
        const additionalInfo = relevantKnowledge.slice(1).map(item => 
          `\n\n**Zobacz też**: ${item.question}`
        ).join('');
        response += additionalInfo;
      }
    } else {
      // No direct match found - use fallback with some context-aware suggestions
      response = getFallbackResponse();
      confidence = 0.3;
      
      // Try to provide some contextual suggestions based on common keywords
      const lowerMessage = userMessage.toLowerCase();
      if (lowerMessage.includes('cena') || lowerMessage.includes('koszt') || lowerMessage.includes('ile')) {
        suggestedQuestions = [
          'Ile kosztuje plan Basic?',
          'Co zawiera plan Pro?',
          'Jaki plan wybrać dla mojej firmy?'
        ];
      } else if (lowerMessage.includes('prawo') || lowerMessage.includes('ustawa') || lowerMessage.includes('wymagania')) {
        suggestedQuestions = [
          'Jakie są wymagania ustawy z 21 maja 2025?',
          'Jakie są kary za brak compliance?',
          'Czy naprawdę musi być codziennie?'
        ];
      } else if (lowerMessage.includes('start') || lowerMessage.includes('początek') || lowerMessage.includes('jak')) {
        suggestedQuestions = [
          'Jak zacząć korzystać z OTORAPORT?',
          'Czy mogę przetestować za darmo?',
          'Jak szybki jest setup?'
        ];
      } else {
        suggestedQuestions = [
          'Co to jest OTORAPORT?',
          'Jakie są wymagania prawne?',
          'Ile kosztuje usługa?'
        ];
      }
    }

    // Log the interaction for analytics (in production, you'd store this properly)
    console.log(`[Chatbot] Query: "${userMessage}" | Confidence: ${confidence} | Sources: ${sources.join(', ')}`);

    const chatbotResponse: ChatbotResponse = {
      response,
      confidence,
      sources: sources.length > 0 ? sources : undefined,
      suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : undefined
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
  return NextResponse.json({
    name: 'OTORAPORT Chatbot API',
    version: '1.0.0',
    phase: '1',
    description: 'FAQ chatbot for OTORAPORT - automated real estate price reporting compliance',
    features: [
      'Knowledge base FAQ responses',
      'Context-aware suggestions', 
      'Polish language support',
      'Ready for AI integration'
    ],
    endpoints: {
      'POST /api/chatbot': 'Send message to chatbot',
      'GET /api/chatbot': 'Get API information'
    },
    status: 'active'
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