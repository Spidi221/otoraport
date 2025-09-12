import OpenAI from 'openai';
import { findRelevantKnowledge, KnowledgeItem } from './chatbot-knowledge';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIResponse {
  response: string;
  confidence: number;
  sources?: string[];
  suggestedQuestions?: string[];
  model: 'faq' | 'ai' | 'hybrid';
}

/**
 * System prompt for OTORAPORT chatbot
 */
const SYSTEM_PROMPT = `Jesteś profesjonalnym asystentem OTORAPORT - systemu automatyzacji raportowania cen mieszkań zgodnie z ustawą z 21 maja 2025 roku.

KONTEKST BIZNESOWY:
- OTORAPORT pomaga deweloperom spełnić obowiązek codziennej publikacji danych o cenach na portalu dane.gov.pl
- System obsługuje formaty CSV, XML, Excel i automatycznie generuje pliki XML 1.13
- Oferujemy plany: Basic (149 zł/mies), Pro (249 zł/mies), Enterprise (399 zł/mies)
- Zapewniamy 14-dniowy darmowy trial bez karty kredytowej

TWOJA ROLA:
- Odpowiadaj profesjonalnie po polsku
- Pomagaj w onboardingu i rozwiązywaniu problemów technicznych
- Objaśniaj wymagania prawne i compliance
- Promuj korzyści automatyzacji vs manual work
- Kieruj do trial i kontaktu ze sprzedażą gdy odpowiednie

STYL KOMUNIKACJI:
- Profesjonalny ale przystępny
- Używaj emoji dla lepszej czytelności (ale nie przesadzaj)
- Konkretne odpowiedzi z przykładami
- Zawsze oferuj następne kroki lub dodatkowe pytania

WAŻNE INFORMACJE:
- Ustawa wymaga codziennego raportowania od deweloperów
- Kary za brak compliance mogą być znaczne
- Nasz system automatyzuje proces vs manualna praca
- Portal dane.gov.pl to jedyny oficjalny kanał publikacji
- Format XML 1.13 jest obowiązkowy dla ministerstwa

Zawsze pomagaj użytkownikom osiągnąć compliance i efektywność!`;

/**
 * Enhanced AI-powered chat response using OpenAI GPT-4o
 */
export async function getAIChatResponse(
  message: string,
  conversationHistory: Array<{type: 'user' | 'bot'; content: string; timestamp: Date}> = [],
  sessionId: string
): Promise<AIResponse> {
  try {
    // First, try to find relevant knowledge from our FAQ base
    const relevantKnowledge = findRelevantKnowledge(message, 3);
    let model: 'faq' | 'ai' | 'hybrid' = 'ai';
    
    // If we have high-confidence FAQ matches, use hybrid approach
    if (relevantKnowledge.length > 0 && relevantKnowledge[0].priority >= 8) {
      model = 'hybrid';
    }
    
    // Prepare context from knowledge base
    let contextualInfo = '';
    if (relevantKnowledge.length > 0) {
      contextualInfo = '\n\nRELEVANT KNOWLEDGE BASE INFO:\n' + 
        relevantKnowledge.map(item => 
          `Q: ${item.question}\nA: ${item.answer}\n`
        ).join('\n');
    }
    
    // Prepare conversation history
    const historyMessages = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + contextualInfo },
        ...historyMessages,
        { role: 'user', content: message }
      ],
      max_tokens: 800,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });
    
    const aiResponse = completion.choices[0]?.message?.content || 
      'Przepraszam, wystąpił błąd w generowaniu odpowiedzi. Spróbuj ponownie.';
    
    // Generate suggested follow-up questions based on context
    const suggestedQuestions = await generateFollowUpQuestions(message, aiResponse);
    
    // Extract sources from knowledge base if used
    const sources = relevantKnowledge.map(item => item.id);
    
    // Calculate confidence based on model type and response quality
    let confidence = 0.9; // High confidence for AI responses
    if (model === 'hybrid') confidence = 0.95;
    if (aiResponse.includes('nie jestem pewien') || aiResponse.includes('przepraszam')) {
      confidence = Math.max(0.6, confidence - 0.2);
    }
    
    console.log(`[AI Chat] Session: ${sessionId} | Model: ${model} | Confidence: ${confidence} | Token usage: ${completion.usage?.total_tokens || 'unknown'}`);
    
    return {
      response: aiResponse,
      confidence,
      sources: sources.length > 0 ? sources : undefined,
      suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : undefined,
      model
    };
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Fallback to knowledge base if AI fails
    const relevantKnowledge = findRelevantKnowledge(message, 1);
    if (relevantKnowledge.length > 0) {
      const fallbackItem = relevantKnowledge[0];
      return {
        response: fallbackItem.answer + '\n\n💡 *Odpowiedź z bazy wiedzy - AI tymczasowo niedostępne*',
        confidence: 0.7,
        sources: [fallbackItem.id],
        suggestedQuestions: fallbackItem.followUpQuestions?.slice(0, 3),
        model: 'faq'
      };
    }
    
    // Final fallback
    return {
      response: 'Przepraszam, wystąpił błąd z systemem AI. Skontaktuj się z naszym supportem na support@otoraport.pl lub spróbuj ponownie za chwilę.',
      confidence: 0.3,
      model: 'faq'
    };
  }
}

/**
 * Generate contextual follow-up questions using AI
 */
async function generateFollowUpQuestions(userMessage: string, botResponse: string): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Generate exactly 3 relevant follow-up questions in Polish for OTORAPORT chatbot based on the conversation. Questions should help user continue the conversation naturally. Return only the questions, one per line, without numbers or bullets.'
        },
        {
          role: 'user', 
          content: `User asked: "${userMessage}"\nBot answered: "${botResponse}"\n\nGenerate 3 follow-up questions:`
        }
      ],
      max_tokens: 150,
      temperature: 0.8
    });
    
    const questions = completion.choices[0]?.message?.content
      ?.split('\n')
      .filter(q => q.trim().length > 0)
      .map(q => q.trim().replace(/^[\d\-\*\•]\s*/, ''))
      .slice(0, 3) || [];
      
    return questions;
    
  } catch (error) {
    console.error('Follow-up questions generation error:', error);
    // Return generic follow-ups based on user message keywords
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('cena') || lowerMessage.includes('koszt')) {
      return ['Jaki plan najlepiej pasuje do mojej firmy?', 'Czy są dodatkowe koszty?', 'Jak działa darmowy trial?'];
    } else if (lowerMessage.includes('prawo') || lowerMessage.includes('ustawa')) {
      return ['Jakie są kary za brak compliance?', 'Co z deadlineami raportowania?', 'Jak OTORAPORT zapewnia zgodność?'];
    } else {
      return ['Jak zacząć korzystać z OTORAPORT?', 'Ile trwa setup?', 'Czy potrzebuję pomocy technicznej?'];
    }
  }
}

/**
 * Health check for OpenAI API
 */
export async function checkOpenAIHealth(): Promise<boolean> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 5
    });
    
    return !!completion.choices[0]?.message?.content;
  } catch (error) {
    console.error('OpenAI Health Check Failed:', error);
    return false;
  }
}