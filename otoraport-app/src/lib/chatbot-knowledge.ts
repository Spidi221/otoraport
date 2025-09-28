/**
 * OTORAPORT Chatbot Knowledge Base - Phase 1
 * Comprehensive knowledge base for FAQ chatbot covering all aspects of the service
 */

export interface KnowledgeItem {
  id: string;
  category: string;
  keywords: string[];
  question: string;
  answer: string;
  followUpQuestions?: string[];
  priority: number; // Higher number = higher priority for matching
}

export const knowledgeBase: KnowledgeItem[] = [
  // Core Service Explanation
  {
    id: 'service-overview',
    category: 'Podstawy',
    keywords: ['co to', 'czym jest', 'otoraport', 'służy', 'robi', 'oferuje', 'usługa'],
    question: 'Co to jest OTORAPORT?',
    answer: 'OTORAPORT to automatyczne rozwiązanie do raportowania cen mieszkań zgodnie z wymogami ustawy z 21 maja 2025 roku. Pomagamy deweloperom spełnić obowiązek codziennej publikacji danych o cenach nieruchomości na portalu dane.gov.pl w formacie XML 1.13.',
    followUpQuestions: ['Jakie są wymagania prawne?', 'Ile kosztuje usługa?', 'Jak szybki jest setup?'],
    priority: 10
  },
  
  // Legal Requirements
  {
    id: 'legal-requirements',
    category: 'Prawo',
    keywords: ['ustawa', '21 maja', '2025', 'wymagania', 'prawne', 'obowiązek', 'ministerstwo', 'coi'],
    question: 'Jakie są wymagania ustawy z 21 maja 2025 roku?',
    answer: 'Ustawa wymaga od deweloperów:\n\n• **Codzienną aktualizację** danych o cenach mieszkań\n• Publikację w formacie **XML zgodnym ze schematem 1.13**\n• Publikację wyłącznie przez portal **dane.gov.pl** (zgodnie z instrukcjami COI)\n• Strukturalne dane o każdej nieruchomości (cena za m², powierzchnia, lokalizacja)\n• Obsługę formatów CSV, XML lub XLSX',
    followUpQuestions: ['Jakie są kary za brak compliance?', 'Czy naprawdę musi być codziennie?', 'Co z portalem dane.gov.pl?'],
    priority: 9
  },

  {
    id: 'penalties',
    category: 'Prawo',
    keywords: ['kary', 'grzywna', '200k', 'sankcje', 'niewykonanie', 'brak', 'compliance'],
    question: 'Jakie są kary za brak compliance?',
    answer: 'Za niewykonanie obowiązków przewidzianych w ustawie grożą kary finansowe do **200 000 PLN**. To znacząca kwota, która wielokrotnie przekracza koszt automatyzacji przez OTORAPORT. Przy ręcznym compliance (40h/miesiąc × 60 PLN/h = 2400 PLN miesięcznie) + ryzyko kar, automatyzacja to oczywista decyzja biznesowa.',
    followUpQuestions: ['Ile kosztuje OTORAPORT?', 'Jak się zabezpieczyć?', 'Czy są już sprawdzane firmy?'],
    priority: 8
  },

  {
    id: 'daily-requirement',
    category: 'Prawo',
    keywords: ['codziennie', 'daily', 'aktualizacja', 'często', 'kiedy'],
    question: 'Czy naprawdę muszę publikować dane codziennie?',
    answer: 'Tak - według oficjalnej instrukcji COI dane muszą być aktualizowane **codziennie**. To nie oznacza, że musisz ręcznie aktualizować co dzień, ale system musi być skonfigurowany do codziennej publikacji. OTORAPORT automatycznie spełnia ten wymóg - po pierwszej konfiguracji wszystko dzieje się bez Twojego udziału.',
    followUpQuestions: ['Jak OTORAPORT to automatyzuje?', 'Co jeśli zapomnę zaktualizować?', 'Ile to kosztuje czasu ręcznie?'],
    priority: 8
  },

  // Pricing Plans
  {
    id: 'pricing-basic',
    category: 'Cennik',
    keywords: ['basic', 'podstawowy', '149', 'najtańszy', 'cena', 'koszt', 'plan'],
    question: 'Co zawiera plan Basic za 149 zł/miesiąc?',
    answer: 'Plan **Basic (149 zł/miesiąc)** to podstawowy package compliance:\n\n✅ **Automatyczne XML/MD endpoints** dla ministerstwa\n✅ **Codzienna publikacja** na dane.gov.pl\n✅ **Auto-file generation** zgodny z formatem 1.13\n✅ **Email templates** i powiadomienia\n✅ **Basic dashboard** do zarządzania\n✅ **Setup w <10 minut**\n✅ **14 dni darmowego okresu próbnego**',
    followUpQuestions: ['Co ma plan Pro?', 'Czy Basic to wystarczy?', 'Jak zacząć period próbny?'],
    priority: 7
  },

  {
    id: 'pricing-pro',
    category: 'Cennik',
    keywords: ['pro', 'średni', '249', 'profesjonalny', 'strony', 'prezentacyjne'],
    question: 'Co zawiera plan Pro za 249 zł/miesiąc?',
    answer: 'Plan **Pro (249 zł/miesiąc)** = Basic + strony prezentacyjne:\n\n✅ **Wszystko z planu Basic**\n✅ **Strony prezentacyjne** dla Twoich klientów\n✅ **Subdomena .cenysync.pl** (np. twoja-firma.cenysync.pl)\n✅ **Customizable templates** dla stron\n✅ **Analytics i lead capture** forms\n✅ **Lista mieszkań z cenami** (jak konkurencja)\n✅ **Historia zmian cen**\n✅ **SEO optimization**',
    followUpQuestions: ['Co ma plan Enterprise?', 'Czym różni się od Basic?', 'Czy mogę zmienić plan?'],
    priority: 7
  },

  {
    id: 'pricing-enterprise',
    category: 'Cennik',
    keywords: ['enterprise', 'najdroższy', '399', 'premium', 'custom', 'white-label'],
    question: 'Co zawiera plan Enterprise za 399 zł/miesiąc?',
    answer: 'Plan **Enterprise (399 zł/miesiąc)** = Pro + premium features:\n\n✅ **Wszystko z planu Pro**\n✅ **Custom domain** (twoja-domena.pl)\n✅ **White-label solution** (Twoja marka)\n✅ **API access** do integracji\n✅ **Multiple companies** management\n✅ **Priority support** (szybsza obsługa)\n✅ **Custom integrations** możliwe\n✅ **Dedicated account manager**',
    followUpQuestions: ['Czy warto dla małej firmy?', 'Jakie są korzyści API?', 'Co to white-label?'],
    priority: 7
  },

  // File Formats and Upload
  {
    id: 'file-formats',
    category: 'Techniczne',
    keywords: ['csv', 'xml', 'excel', 'xlsx', 'format', 'plik', 'upload', 'wgrywanie'],
    question: 'Jakie formaty plików obsługuje OTORAPORT?',
    answer: 'OTORAPORT obsługuje **wszystkie popularne formaty**:\n\n📁 **CSV** - najpopularniejszy format eksportu\n📁 **XML** - bezpośredni import z systemów deweloperskich\n📁 **Excel/XLSX** - łatwy import z arkuszy kalkulacyjnych\n\nSystem **automatycznie rozpoznaje format** i parsuje dane. Wystarczy jeden upload miesięcznie - reszta dzieje się automatycznie. To ogromna przewaga nad konkurencją, która wymaga ręcznego wprowadzania każdego lokalu.',
    followUpQuestions: ['Jak przygotować plik CSV?', 'Jaka struktura danych?', 'Co z błędami w pliku?'],
    priority: 6
  },

  {
    id: 'data-structure',
    category: 'Techniczne',
    keywords: ['struktura', 'dane', 'kolumny', 'pola', 'wymagane', 'format'],
    question: 'Jaka powinna być struktura danych w pliku?',
    answer: 'Wymagane pola w pliku (CSV/Excel/XML):\n\n🏠 **ID mieszkania** - unikalny identyfikator\n🏠 **Adres/lokalizacja** - dokładny adres nieruchomości\n🏠 **Powierzchnia** - w metrach kwadratowych\n🏠 **Cena całkowita** - kwota w PLN\n🏠 **Cena za m²** - automatycznie liczona jeśli nie podana\n🏠 **Status** - dostępny/sprzedany/zarezerwowany\n🏠 **Data ostatniej zmiany** (opcjonalne)\n\nSystem ma **smart auto-fill** i automatycznie dopasowuje kolumny. Znacznie prostsze niż u konkurencji!',
    followUpQuestions: ['Co jeśli brakuje jakiegoś pola?', 'Jak system rozpoznaje kolumny?', 'Czy można edytować dane później?'],
    priority: 6
  },

  // Competition and Advantages
  {
    id: 'vs-competition',
    category: 'Przewagi',
    keywords: ['wykazcen', 'konkurencja', 'porównanie', 'lepsze', 'różnice', 'przewaga'],
    question: 'Czym OTORAPORT różni się od konkurencji (np. wykazcen.pl)?',
    answer: '🚀 **OTORAPORT przewagi nad wykazcen.pl:**\n\n⚡ **Szybszy onboarding**: <10 min vs ich 12,5 min\n🤖 **Automatyzacja**: CSV/XML bulk import vs manual input każdego lokalu\n📊 **Lepszy XML workflow**: mamy gotowy n8n z poprawną strukturą\n💰 **Lepsza cena**: więcej funkcji w podstawowych pakietach\n🏗️ **Skalowalność**: architekteka gotowa na 1000+ klientów\n📱 **Modern UI/UX**: lepszy design i user experience',
    followUpQuestions: ['Ile kosztuje wykazcen?', 'Jakie mają ograniczenia?', 'Czy można migrować dane?'],
    priority: 8
  },

  {
    id: 'setup-speed',
    category: 'Przewagi',
    keywords: ['szybkość', 'setup', 'konfiguracja', '10 minut', 'onboarding', 'wdrożenie'],
    question: 'Jak szybki jest setup OTORAPORT?',
    answer: '⚡ **Najszybszy setup na polskim rynku - poniżej 10 minut!**\n\n1️⃣ **Rejestracja** (2 min) - Google OAuth lub email\n2️⃣ **Upload pliku** (1 min) - CSV/XML/Excel\n3️⃣ **Auto-mapping** (2 min) - system rozpoznaje kolumny\n4️⃣ **Weryfikacja** (3 min) - sprawdzenie danych\n5️⃣ **Aktywacja** (1 min) - pierwszy raport gotowy!\n\n🎯 **Konkurencja**: wykazcen.pl = 12,5 min, inne rozwiązania = godziny\n🎯 **OTORAPORT**: <10 min do pełnego compliance',
    followUpQuestions: ['Co potrzebuję do startu?', 'Czy mogę przetestować za darmo?', 'Co jeśli mam problemy?'],
    priority: 7
  },

  // Technical Integration
  {
    id: 'dane-gov-integration',
    category: 'Techniczne',
    keywords: ['dane.gov.pl', 'integracja', 'api', 'publikacja', 'xml', 'portal'],
    question: 'Jak OTORAPORT integruje się z portalem dane.gov.pl?',
    answer: '🔗 **Bezpośrednia integracja z oficjalnym API dane.gov.pl:**\n\n✅ **Oficjalne API** - używamy certyfikowanego API ministerstwa\n✅ **XML format 1.13** - najnowsza wersja zgodna z COI\n✅ **Automatyczna publikacja** - bez ręcznej pracy\n✅ **Real-time status** - monitorowanie publikacji 24/7\n✅ **Error handling** - automatyczne retry przy problemach\n✅ **Compliance monitoring** - stały nadzór nad wymogami\n\nTo **jedyne rozwiązanie z pełną integracją** - konkurencja często wymaga ręcznych kroków.',
    followUpQuestions: ['Co jeśli API nie działa?', 'Jak często dane są publikowane?', 'Czy można sprawdzić status?'],
    priority: 8
  },

  // Trial and Getting Started
  {
    id: 'free-trial',
    category: 'Start',
    keywords: ['darmowy', 'trial', 'próbny', '14 dni', 'test', 'bezpłatnie'],
    question: 'Czy mogę przetestować OTORAPORT za darmo?',
    answer: '🎁 **TAK! 14 dni pełni funkcjonalności za darmo:**\n\n✅ **Bez karty kredytowej** - nie musisz podawać danych płatniczych\n✅ **Pełny dostęp** - wszystkie funkcje planu Basic\n✅ **Prawdziwe dane** - możesz uploadować swoje pliki\n✅ **Bez zobowiązań** - możesz anulować w każdej chwili\n✅ **Support włączony** - pomożemy w konfiguracji\n\n🚀 **Start w 2 kroki**: Rejestracja → Upload pliku → Gotowe!\n📞 **Potrzebujesz pomocy?** Nasz support pomoże w setupie.',
    followUpQuestions: ['Jak się zarejestrować?', 'Co po okresie próbnym?', 'Czy mogę przedłużyć trial?'],
    priority: 9
  },

  {
    id: 'getting-started',
    category: 'Start',
    keywords: ['start', 'początek', 'rejestracja', 'jak zacząć', 'pierwszy krok'],
    question: 'Jak zacząć korzystać z OTORAPORT?',
    answer: '🚀 **3 proste kroki do compliance:**\n\n**KROK 1: Rejestracja** (2 min)\n• Kliknij "Wypróbuj za darmo" na stronie\n• Zaloguj się przez Google lub podaj email\n• Bez karty kredytowej, bez zobowiązań\n\n**KROK 2: Upload danych** (3 min)\n• Wgraj plik CSV/XML/Excel z cenami mieszkań\n• System automatycznie rozpozna strukturę\n• Sprawdź czy dane się zgadzają\n\n**KROK 3: Aktywacja** (2 min)\n• Potwierdź konfigurację\n• System automatycznie publikuje pierwszy raport\n• Gotowe - ministerstwo ma dostęp 24/7!',
    followUpQuestions: ['Jakie dane potrzebuję?', 'Co jeśli mam problemy?', 'Ile to kosztuje?'],
    priority: 9
  },

  // Support and Contact
  {
    id: 'support-options',
    category: 'Wsparcie',
    keywords: ['pomoc', 'support', 'kontakt', 'wsparcie', 'help', 'problem'],
    question: 'Jaki jest dostęp do wsparcia technicznego?',
    answer: '🆘 **Pełne wsparcie techniczne 24/7:**\n\n📧 **Email support** - odpowiedź w ciągu 2h (Basic/Pro)\n⚡ **Priority support** - odpowiedź w ciągu 30min (Enterprise)\n💬 **Live chat** - dostępny w godzinach 9-17\n📞 **Telefon** - dla pilnych problemów compliance\n📚 **Dokumentacja** - pełny przewodnik online\n🎥 **Video tutorials** - nagrania krok po kroku\n\n**Enterprise klienci** otrzymują **dedykowanego account managera** do bezpośredniego kontaktu.',
    followUpQuestions: ['Jakie są godziny wsparcia?', 'Ile kosztuje telefon?', 'Czy jest polska obsługa?'],
    priority: 6
  },

  {
    id: 'contact-info',
    category: 'Kontakt',
    keywords: ['kontakt', 'email', 'telefon', 'adres', 'biuro', 'gdzie'],
    question: 'Jak skontaktować się z OTORAPORT?',
    answer: '📞 **Kontakt z zespołem OTORAPORT:**\n\n📧 **Email**: support@otoraport.pl\n📧 **Sprzedaż**: sales@otoraport.pl\n💬 **Live Chat**: dostępny na stronie 9-17\n📞 **Telefon wsparcia**: +48 123 456 789\n\n🏢 **Biuro**: Warszawa, Polska\n⏰ **Godziny pracy**: PN-PT 9:00-17:00\n🌐 **Status systemu**: status.otoraport.pl\n\n**Uwaga**: To jest chatbot FAQ - dla złożonych problemów skorzystaj z powyższych kanałów.',
    followUpQuestions: ['Czy można umówić demo?', 'Jakie są godziny telefonu?', 'Czy jest obsługa weekendowa?'],
    priority: 5
  },

  // Automation and Time Savings
  {
    id: 'time-savings',
    category: 'Korzyści',
    keywords: ['czas', 'oszczędność', 'godziny', 'praca', 'manualnie', 'automatycznie'],
    question: 'Ile czasu oszczędza OTORAPORT?',
    answer: '⏰ **Ogromne oszczędności czasu i pieniędzy:**\n\n**Praca ręczna (bez OTORAPORT):**\n• 40 godzin miesięcznie na compliance\n• 2400 PLN kosztów pracy (60 PLN/h)\n• Stres i ryzyko błędów\n• Ryzyko kar do 200k PLN\n\n**Z OTORAPORT:**\n• 10 minut setup raz na start\n• 2 minuty miesięcznie na upload nowych cen\n• 149-399 PLN miesięcznie za pełną automatyzację\n• Zero stresu, pełny compliance\n\n💰 **ROI**: oszczędność 2000+ PLN miesięcznie + eliminacja ryzyka kar',
    followUpQuestions: ['Ile kosztuje plan Basic?', 'Co jeśli będą zmiany w prawie?', 'Czy automatyzacja jest pewna?'],
    priority: 8
  },

  // Errors and Troubleshooting
  {
    id: 'common-errors',
    category: 'Problemy',
    keywords: ['błąd', 'error', 'problem', 'nie działa', 'niepoprawny'],
    question: 'Co robić gdy wystąpi błąd w systemie?',
    answer: '🔧 **Rozwiązywanie problemów krok po kroku:**\n\n**Błędy uploadu pliku:**\n• Sprawdź format (CSV/XML/Excel obsługiwane)\n• Weryfikuj czy plik ma wymagane kolumny\n• Usuń specjalne znaki z nazw kolumn\n\n**Problemy z publikacją:**\n• System automatycznie ponawiać próby\n• Sprawdź status na dashboard\n• Skontaktuj się z supportem jeśli błąd utrzymuje się >2h\n\n**Ogólne problemy:**\n• Odświeź przeglądarkę\n• Wyloguj się i zaloguj ponownie\n• Skontaktuj się z supportem: support@otoraport.pl\n\n✅ **99.9% uptime guarantee** - rzadko są problemy!',
    followUpQuestions: ['Jaki jest email wsparcia?', 'Ile trwa naprawa błędów?', 'Co z utratą danych?'],
    priority: 6
  }
];

/**
 * Function to find relevant knowledge items based on user query
 */
export function findRelevantKnowledge(query: string, limit = 3): KnowledgeItem[] {
  const normalizedQuery = query.toLowerCase();
  const words = normalizedQuery.split(' ').filter(word => word.length > 2);
  
  // Score each knowledge item
  const scoredItems = knowledgeBase.map(item => {
    let score = 0;
    
    // Check keywords
    item.keywords.forEach(keyword => {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        score += 3 * item.priority;
      }
    });
    
    // Check individual words
    words.forEach(word => {
      item.keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(word)) {
          score += 1 * item.priority;
        }
      });
      
      // Check in question and answer
      if (item.question.toLowerCase().includes(word)) {
        score += 2 * item.priority;
      }
      if (item.answer.toLowerCase().includes(word)) {
        score += 1 * item.priority;
      }
    });
    
    return { item, score };
  });
  
  // Sort by score and return top results
  return scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}

/**
 * Get default greeting message
 */
export function getGreeting(): string {
  return `Cześć! 👋 Jestem asystentem OTORAPORT - pomagam z automatyzacją raportowania cen mieszkań zgodnie z ustawą z 21 maja 2025.

**Mogę pomóc z:**
• Wyjaśnieniem wymagań prawnych i kar
• Informacjami o planach cenowych (Basic 149zł, Pro 249zł, Enterprise 399zł)
• Procesem onboardingu (<10 min setup)
• Formatami plików (CSV, XML, Excel)
• Integracją z dane.gov.pl

**Jak mogę Ci pomóc?** 🚀`;
}

/**
 * Get fallback response when no matching knowledge found
 */
export function getFallbackResponse(): string {
  return `Hmm, nie jestem pewien jak odpowiedzieć na to pytanie. 

**Możesz zapytać o:**
• Wymagania ustawy z 21 maja 2025
• Plany cenowe i funkcjonalności
• Proces rejestracji i setup
• Formaty plików i upload danych
• Integrację z dane.gov.pl

**Dla złożonych pytań skontaktuj się z naszym zespołem:**
📧 support@otoraport.pl
💬 Live chat (9-17)
📞 +48 123 456 789

Jak jeszcze mogę pomóc? 😊`;
}

/**
 * Categories for organizing knowledge
 */
export const knowledgeCategories = [
  'Podstawy',
  'Prawo', 
  'Cennik',
  'Techniczne',
  'Przewagi',
  'Start',
  'Wsparcie',
  'Kontakt',
  'Korzyści',
  'Problemy'
] as const;