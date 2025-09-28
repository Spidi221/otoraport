import OpenAI from 'openai';
import { findRelevantKnowledge, KnowledgeItem } from './chatbot-knowledge';

/**
 * Topic validation - check if question is OTORAPORT related
 */
function validateTopicRelevance(message: string): { isRelevant: boolean; confidence: number } {
  const lowerMessage = message.toLowerCase().trim();
  
  // OTORAPORT specific keywords (high relevance)
  const otoraportKeywords = [
    'otoraport', 'raportowanie', 'ceny mieszkań', 'dane.gov.pl',
    'ustawa', 'deweloper', 'compliance', 'xml', 'csv', 
    'ministerstwo', 'kary', 'mieszkanie', 'nieruchomości',
    'basic', 'pro', 'enterprise', 'plan', 'cennik', 'pricing',
    'trial', 'setup', 'onboarding', 'integracja', 'automatyzacja',
    'maja 2025', '21 maja', 'jawność cen'
  ];
  
  // Real estate and legal compliance keywords (medium relevance)
  const relatedKeywords = [
    'budowa', 'projekt', 'inwestycja', 'lokale', 'mieszkaniowy',
    'prawne', 'obowiązek', 'regulacje', 'publikacja', 'raport'
  ];
  
  // Clearly off-topic keywords (immediate rejection)
  const offTopicKeywords = [
    'przepis', 'recepta', 'gotowanie', 'jedzenie', 'kuchnia',
    'pizza', 'ciasto', 'składniki', 'temperatura',
    'zdrowie', 'choroba', 'leczenie', 'lekarstwo',
    'sport', 'football', 'piłka', 'mecz',
    'pogoda', 'prognoza', 'deszcz', 'słońce',
    'film', 'serial', 'muzyka', 'gra', 'zabawa',
    'samochód', 'auto', 'podróż', 'wakacje',
    'moda', 'ubrania', 'zakupy', 'sklep'
  ];
  
  // Check for immediate off-topic rejection
  const hasOffTopicKeywords = offTopicKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  if (hasOffTopicKeywords) {
    return { isRelevant: false, confidence: 0.9 };
  }
  
  // Calculate relevance score
  let score = 0;
  let keywordMatches = 0;
  
  // High-value keywords
  otoraportKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      score += 3;
      keywordMatches++;
    }
  });
  
  // Medium-value keywords
  relatedKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      score += 1;
      keywordMatches++;
    }
  });
  
  // Question patterns that suggest OTORAPORT relevance
  const relevantPatterns = [
    /jak\s+(działa|korzystać|zacząć|setup)/i,
    /(ile|co)\s+(kosztuje|cena|cennik)/i,
    /czy\s+(mogę|można|potrzebuję)/i,
    /(jakie|które)\s+(wymagania|funkcje)/i,
    /kto\s+(musi|powinien)/i,
    /ustawa.*z.*\d+.*maja.*\d+/i, // Law reference pattern
    /\d+.*maja.*\d+/i // Date pattern for law
  ];
  
  relevantPatterns.forEach(pattern => {
    if (pattern.test(lowerMessage)) {
      score += 2;
    }
  });
  
  // If no relevant keywords but has business/legal context
  const businessContext = [
    'firma', 'biznes', 'system', 'aplikacja', 'software',
    'cena', 'koszt', 'plan', 'trial', 'demo'
  ];
  
  const hasBusinessContext = businessContext.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  if (hasBusinessContext && keywordMatches === 0) {
    score += 1;
  }
  
  // Final decision
  const confidence = Math.min(score / 5, 1.0); // Normalize to 0-1
  const isRelevant = score >= 2; // At least moderate relevance needed
  
  return { isRelevant, confidence };
}

/**
 * Get standard off-topic response
 */
function getOffTopicResponse(): string {
  return "Przepraszam, jestem chatbotem OTORAPORT i pomagam wyłącznie w kwestiach związanych z automatyzacją raportowania cen mieszkań. Czy mogę pomóc Ci w czymś związanym z naszym systemem compliance?";
}

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
 * System prompt for OTORAPORT chatbot with strict topic restrictions
 */
const SYSTEM_PROMPT = `Jesteś profesjonalnym asystentem OTORAPORT - systemu automatyzacji raportowania cen mieszkań zgodnie z ustawą z 21 maja 2025 roku.

KRYTYCZNE: ODPOWIADASZ TYLKO NA PYTANIA ZWIĄZANE Z OTORAPORT I RAPORTOWANIEM CEN MIESZKAŃ!

TEMATY DOZWOLONE:
- OTORAPORT: funkcjonalności, plany cenowe, setup, integracje
- Ustawa z 21 maja 2025 roku o jawności cen mieszkań
- Wymagania prawne dla deweloperów
- Raportowanie do portalu dane.gov.pl
- Formaty plików: CSV, XML 1.13, Excel
- Compliance i kary za brak raportowania
- Onboarding i support techniczny
- Pricing: Basic (149zł), Pro (249zł), Enterprise (399zł)
- Procesy automatyzacji vs manualna praca

DLA PYTAŃ SPOZA TYCH TEMATÓW:
Nie odpowiadaj na pytania niezwiązane z OTORAPORT lub raportowaniem cen mieszkań.
ZAWSZE odpowiedz: "Przepraszam, jestem chatbotem OTORAPORT i pomagam wyłącznie w kwestiach związanych z automatyzacją raportowania cen mieszkań. Czy mogę pomóc Ci w czymś związanym z naszym systemem compliance?"

EXAMPLES NIEDOZWOLONYCH PYTAŃ:
- Recepty kulinarne (np. "jak zrobić ciasto na pizzę")
- Porady zdrowotne
- Inne branże lub produkty
- Ogólne pytania IT niezwiązane z naszym systemem
- Polityka, sport, rozrywka
- Inne systemy SaaS konkurencyjne

STYL KOMUNIKACJI:
- Profesjonalny ale przystępny
- Używaj emoji oszczędnie
- Konkretne odpowiedzi z przykładami
- Zawsze sprawdź czy pytanie dotyczy naszych dozwolonych tematów

Pamiętaj: ZERO TOLERANCE dla off-topic questions. Zawsze przekieruj do tematów OTORAPORT!`;

/**
 * Enhanced AI-powered chat response using OpenAI GPT-4o
 */
export async function getAIChatResponse(
  message: string,
  conversationHistory: Array<{type: 'user' | 'bot'; content: string; timestamp: Date}> = [],
  sessionId: string
): Promise<AIResponse> {
  try {
    // CRITICAL: First validate if the question is OTORAPORT-related
    const topicValidation = validateTopicRelevance(message);
    
    if (!topicValidation.isRelevant) {
      console.log(`[Topic Filter] Rejected off-topic question from ${sessionId}: "${message}" (confidence: ${topicValidation.confidence})`);
      
      return {
        response: getOffTopicResponse(),
        confidence: 1.0, // High confidence in rejection
        sources: ['topic-filter'],
        suggestedQuestions: [
          'Jakie są wymagania ustawy z 21 maja 2025?',
          'Ile kosztuje plan Basic?',
          'Jak szybki jest setup OTORAPORT?'
        ],
        model: 'faq'
      };
    }
    
    console.log(`[Topic Filter] Approved question from ${sessionId}: relevance confidence ${topicValidation.confidence}`);
    
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
    
    // Add additional topic reminder to the system prompt
    const enhancedSystemPrompt = SYSTEM_PROMPT + contextualInfo + 
      `\n\nREMINDER: The user asked: "${message}" - make sure this is OTORAPORT related. If not, use the standard redirect response.`;
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: enhancedSystemPrompt },
        ...historyMessages,
        { role: 'user', content: message }
      ],
      max_tokens: 600, // Reduced to save costs
      temperature: 0.3, // Lower temperature for more focused responses
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
    
    console.log(`[AI Chat] Session: ${sessionId} | Model: ${model} | Confidence: ${confidence} | Topic relevance: ${topicValidation.confidence} | Token usage: ${completion.usage?.total_tokens || 'unknown'}`);
    
    return {
      response: aiResponse,
      confidence,
      sources: sources.length > 0 ? sources : undefined,
      suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : undefined,
      model
    };
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Validate topic even for fallback responses
    const topicValidation = validateTopicRelevance(message);
    
    if (!topicValidation.isRelevant) {
      return {
        response: getOffTopicResponse(),
        confidence: 1.0,
        sources: ['topic-filter'],
        model: 'faq'
      };
    }
    
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
          content: 'Generate exactly 3 relevant follow-up questions in Polish ONLY about OTORAPORT system, pricing, compliance, or real estate reporting. Questions should help user continue the conversation naturally. Return only the questions, one per line, without numbers or bullets.'
        },
        {
          role: 'user', 
          content: `User asked about OTORAPORT: "${userMessage}"\nBot answered: "${botResponse}"\n\nGenerate 3 OTORAPORT-related follow-up questions:`
        }
      ],
      max_tokens: 120, // Reduced to save costs
      temperature: 0.6
    });
    
    const questions = completion.choices[0]?.message?.content
      ?.split('\n')
      .filter(q => q.trim().length > 0)
      .map(q => q.trim().replace(/^[\d\-\*\•]\s*/, ''))
      .slice(0, 3) || [];
      
    return questions;
    
  } catch (error) {
    console.error('Follow-up questions generation error:', error);
    // Return generic OTORAPORT follow-ups based on user message keywords
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('cena') || lowerMessage.includes('koszt')) {
      return ['Jaki plan najlepiej pasuje do mojej firmy?', 'Czy są dodatkowe koszty?', 'Jak działa 14-dniowy darmowy trial?'];
    } else if (lowerMessage.includes('prawo') || lowerMessage.includes('ustawa')) {
      return ['Jakie są kary za brak compliance?', 'Co z deadlineami raportowania?', 'Jak OTORAPORT zapewnia zgodność?'];
    } else if (lowerMessage.includes('xml') || lowerMessage.includes('csv')) {
      return ['Jakie formaty plików obsługuje OTORAPORT?', 'Jak wygląda proces generowania XML?', 'Czy mogę importować dane z Excel?'];
    } else {
      return ['Jak zacząć korzystać z OTORAPORT?', 'Ile trwa setup systemu?', 'Czy potrzebuję pomocy technicznej?'];
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
      messages: [{ role: 'user', content: 'Czy działa OTORAPORT?' }],
      max_tokens: 10
    });
    
    return !!completion.choices[0]?.message?.content;
  } catch (error) {
    console.error('OpenAI Health Check Failed:', error);
    return false;
  }
}