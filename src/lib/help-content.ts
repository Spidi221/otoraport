// Help Center Content Data

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  relatedArticles?: string[];
  keywords: string[];
}

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  thumbnail?: string;
  videoUrl?: string;
  summary: string[];
  transcript?: string;
  isComingSoon?: boolean;
  enterpriseOnly?: boolean;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  authentication: boolean;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: {
    schema: Record<string, any>;
    example: string;
  };
  responses: Array<{
    code: number;
    description: string;
    example: string;
  }>;
  codeExamples: {
    curl: string;
    javascript: string;
    python: string;
  };
}

export interface TroubleshootingIssue {
  id: string;
  problem: string;
  causes: string[];
  solutions: string[];
  relatedArticles: string[];
}

// FAQ Categories
export const FAQ_CATEGORIES = {
  GENERAL: 'Ogólne',
  DATA_IMPORT: 'Import danych',
  ENDPOINTS: 'Endpointy i API',
  MINISTRY: 'Ministerstwo i compliance',
  BILLING: 'Subskrypcje i płatności',
  TECHNICAL: 'Techniczne',
} as const;

// FAQ Data
export const FAQ_ITEMS: FAQItem[] = [
  // Ogólne (5)
  {
    id: 'what-is-otoraport',
    question: 'Czym jest OTORAPORT i jak może pomóc mojej firmie?',
    answer: `OTORAPORT to system automatyzacji compliance dla deweloperów nieruchomości. Pomaga w:

• Automatycznym przesyłaniu danych o cenach mieszkań do Ministerstwa Rozwoju
• Generowaniu wymaganych formatów XML, CSV i MD5
• Zarządzaniu danymi nieruchomości w jednym miejscu
• Zapewnieniu zgodności z wymogami prawnymi

System eliminuje ręczną pracę i minimalizuje ryzyko błędów w raportowaniu.`,
    category: FAQ_CATEGORIES.GENERAL,
    keywords: ['otoraport', 'co to jest', 'funkcje', 'korzyści'],
  },
  {
    id: 'subscription-plans',
    question: 'Jakie plany subskrypcji są dostępne?',
    answer: `Oferujemy trzy plany subskrypcji:

**Free (Darmowy)**
• Do 50 nieruchomości
• Podstawowe endpointy XML/CSV/MD5
• Email support

**Pro (99 PLN/miesiąc)**
• Do 500 nieruchomości
• Własna subdomena
• Priorytetowy support
• Automatyczne aktualizacje

**Enterprise (Kontakt)**
• Nielimitowane nieruchomości
• Własna domena
• API access
• Branding i white-label
• Dedykowany account manager

Możesz w każdej chwili zmienić plan w ustawieniach.`,
    category: FAQ_CATEGORIES.GENERAL,
    keywords: ['plany', 'subskrypcja', 'ceny', 'pakiety'],
  },
  {
    id: 'change-subscription',
    question: 'Jak mogę zmienić swój plan subskrypcji?',
    answer: `Aby zmienić plan:

1. Przejdź do **Ustawienia** → **Subskrypcja**
2. Kliknij "Zmień plan"
3. Wybierz nowy plan
4. Potwierdź zmianę

**Upgrade:** Zmiana jest natychmiastowa, opłata jest proporcjonalna
**Downgrade:** Zmiana następuje z końcem obecnego okresu rozliczeniowego

Twoje dane pozostają bezpieczne podczas zmiany planu.`,
    category: FAQ_CATEGORIES.GENERAL,
    relatedArticles: ['subscription-plans', 'billing-info'],
    keywords: ['zmiana', 'plan', 'upgrade', 'downgrade'],
  },
  {
    id: 'contact-support',
    question: 'Jak skontaktować się z supportem?',
    answer: `Możesz skontaktować się z nami na kilka sposobów:

**Email:** support@otoraport.pl
Odpowiadamy w ciągu 24h (dni robocze)

**Chat AI:** Kliknij ikonę pomocy w prawym dolnym rogu
Dostępny 24/7 dla szybkich pytań

**Formularz kontaktowy:** W sekcji Kontakt w Centrum Pomocy

**Telefon:** +48 XXX XXX XXX
Pon-Pt, 9:00-17:00

Użytkownicy Pro i Enterprise otrzymują priorytetowe wsparcie.`,
    category: FAQ_CATEGORIES.GENERAL,
    keywords: ['kontakt', 'support', 'pomoc', 'wsparcie'],
  },
  {
    id: 'data-security',
    question: 'Czy moje dane są bezpieczne?',
    answer: `Tak! Bezpieczeństwo danych to nasz priorytet:

**Szyfrowanie:**
• SSL/TLS dla wszystkich połączeń
• Szyfrowanie danych w bazie danych
• Bezpieczne przechowywanie plików

**Compliance:**
• RODO compliant
• ISO 27001 standards
• Regularne audyty bezpieczeństwa

**Backup:**
• Codzienne backupy
• Możliwość przywrócenia danych
• Redundancja serwerów

**Dostęp:**
• Uwierzytelnianie dwuskładnikowe (wkrótce)
• Logi dostępu
• Row-level security

Twoje dane nigdy nie są udostępniane stronom trzecim.`,
    category: FAQ_CATEGORIES.GENERAL,
    keywords: ['bezpieczeństwo', 'dane', 'rodo', 'prywatność'],
  },

  // Import danych (5)
  {
    id: 'prepare-csv',
    question: 'Jak przygotować plik CSV z danymi nieruchomości?',
    answer: `Plik CSV powinien zawierać następujące kolumny:

**Wymagane pola:**
• nazwa_inwestycji
• adres_ulica
• adres_nr_domu
• adres_kod_pocztowy
• adres_miejscowosc
• numer_mieszkania
• powierzchnia_uzytkowa
• liczba_pokoi
• pietro
• cena_ofertowa
• data_aktualizacji

**Opcjonalne pola:**
• balkon (tak/nie)
• taras (tak/nie)
• parking (tak/nie)
• stan_wykonczen
• data_oddania

**Format:**
• Kodowanie: UTF-8
• Separator: przecinek (,) lub średnik (;)
• Liczby: używaj kropki jako separatora dziesiętnego
• Daty: YYYY-MM-DD

Możesz pobrać szablon CSV z dashboardu.`,
    category: FAQ_CATEGORIES.DATA_IMPORT,
    keywords: ['csv', 'przygotowanie', 'format', 'kolumny'],
  },
  {
    id: 'required-columns',
    question: 'Jakie kolumny są wymagane w pliku CSV?',
    answer: `Minimalne wymagane kolumny to:

1. **nazwa_inwestycji** - Nazwa inwestycji deweloperskiej
2. **adres_ulica** - Ulica lokalizacji
3. **adres_nr_domu** - Numer budynku
4. **adres_kod_pocztowy** - Kod pocztowy (XX-XXX)
5. **adres_miejscowosc** - Miasto
6. **numer_mieszkania** - Numer/oznaczenie mieszkania
7. **powierzchnia_uzytkowa** - W m² (liczba)
8. **liczba_pokoi** - Liczba pokoi (liczba)
9. **pietro** - Numer piętra (liczba lub "parter")
10. **cena_ofertowa** - Cena w PLN (liczba)
11. **data_aktualizacji** - Data w formacie YYYY-MM-DD

Wszystkie te pola są wymagane przez Ministerstwo Rozwoju.`,
    category: FAQ_CATEGORIES.DATA_IMPORT,
    relatedArticles: ['prepare-csv'],
    keywords: ['kolumny', 'wymagane', 'pola', 'ministerstwo'],
  },
  {
    id: 'fix-import-errors',
    question: 'Jak naprawić błędy importu CSV?',
    answer: `Najczęstsze błędy i rozwiązania:

**"Brakujące wymagane kolumny"**
→ Sprawdź nazwy kolumn (muszą być dokładnie takie jak w specyfikacji)
→ Usuń dodatkowe spacje w nagłówkach

**"Nieprawidłowy format daty"**
→ Użyj formatu YYYY-MM-DD (np. 2025-01-15)
→ Sprawdź czy wszystkie daty są poprawne

**"Nieprawidłowa wartość liczbowa"**
→ Użyj kropki zamiast przecinka (123.45, nie 123,45)
→ Usuń spacje i znaki walut

**"Nieprawidłowe kodowanie"**
→ Zapisz plik jako UTF-8
→ W Excel: Zapisz jako → CSV UTF-8

**"Duplikaty mieszkań"**
→ Sprawdź czy numery mieszkań są unikalne
→ Połącz z numerem budynku jeśli potrzeba

Po poprawieniu, spróbuj ponownie przesłać plik.`,
    category: FAQ_CATEGORIES.DATA_IMPORT,
    keywords: ['błędy', 'import', 'csv', 'problemy'],
  },
  {
    id: 'update-after-import',
    question: 'Czy mogę zaktualizować dane po imporcie?',
    answer: `Tak! Możesz zaktualizować dane na kilka sposobów:

**1. Edycja pojedynczej nieruchomości:**
• Kliknij na nieruchomość w tabeli
• Edytuj pola
• Kliknij "Zapisz"

**2. Bulk update (Pro/Enterprise):**
• Zaznacz wiele nieruchomości
• Wybierz "Zmień status" lub "Aktualizuj ceny"
• Wprowadź nowe wartości

**3. Re-import CSV:**
• Przygotuj zaktualizowany plik CSV
• Prześlij ponownie
• System zaktualizuje istniejące mieszkania (po numerze)

**4. API (Enterprise):**
• Użyj PUT /api/properties/{id}
• Aktualizuj programatically

Wszystkie zmiany są automatycznie synchronizowane z endpointami.`,
    category: FAQ_CATEGORIES.DATA_IMPORT,
    relatedArticles: ['bulk-operations', 'api-docs'],
    keywords: ['aktualizacja', 'edycja', 'zmiana', 'update'],
  },
  {
    id: 'max-file-size',
    question: 'Jaki jest maksymalny rozmiar pliku CSV?',
    answer: `Limity rozmiaru pliku zależą od planu:

**Free:** 10 MB (~2,000 mieszkań)
**Pro:** 50 MB (~10,000 mieszkań)
**Enterprise:** 200 MB (~40,000 mieszkań)

**Tips dla dużych plików:**

• Podziel duży plik na mniejsze części
• Importuj w batch'ach
• Usuń niepotrzebne kolumny przed importem
• Skompresuj plik (ZIP) - system automatycznie rozpakuje

**Co jeśli przekroczę limit?**

1. Upgrade do wyższego planu
2. Skontaktuj się z nami dla custom limitu
3. Użyj API dla programmatic import (Enterprise)

Dla bardzo dużych importów, skontaktuj się z supportem.`,
    category: FAQ_CATEGORIES.DATA_IMPORT,
    keywords: ['rozmiar', 'limit', 'plik', 'maksymalny'],
  },

  // Endpointy i API (5)
  {
    id: 'what-are-endpoints',
    question: 'Czym są endpointy XML, CSV i MD5?',
    answer: `Endpointy to publiczne URL-e, które udostępniają Twoje dane w formatach wymaganych przez Ministerstwo:

**XML Endpoint** (data.xml)
• Format zgodny ze schematem Ministerstwa
• Zawiera pełne dane strukturalne
• Używany przez system zbierający dane

**CSV Endpoint** (data.csv)
• Format tabeli z danymi
• Łatwy do weryfikacji w Excel
• Backup format

**MD5 Endpoint** (data.md5)
• Hash sum pliku XML
• Służy do weryfikacji integralności danych
• Automatycznie generowany

**Przykładowe URL:**
https://otoraport.pl/api/public/{twoj-client-id}/data.xml

Te URL-e podajesz w formularzu Ministerstwa.`,
    category: FAQ_CATEGORIES.ENDPOINTS,
    keywords: ['endpoint', 'xml', 'csv', 'md5', 'url'],
  },
  {
    id: 'find-endpoints',
    question: 'Jak znaleźć swoje unikalne URL endpointów?',
    answer: `Twoje endpointy znajdziesz w kilku miejscach:

**1. Dashboard - Sekcja "Endpointy"**
• Główna karta po zalogowaniu
• Kliknij "Skopiuj" obok każdego URL

**2. Ustawienia → API Configuration**
• Pełna lista wszystkich endpointów
• Możliwość regeneracji Client ID

**3. Email powitalny**
• Otrzymałeś email z linkami po rejestracji

**Format URL:**
\`\`\`
XML:  https://otoraport.pl/api/public/{client-id}/data.xml
CSV:  https://otoraport.pl/api/public/{client-id}/data.csv
MD5:  https://otoraport.pl/api/public/{client-id}/data.md5
\`\`\`

**Własna domena (Pro/Enterprise):**
\`\`\`
https://twoja-domena.pl/data.xml
\`\`\`

Endpointy są dostępne 24/7 bez uwierzytelniania.`,
    category: FAQ_CATEGORIES.ENDPOINTS,
    relatedArticles: ['what-are-endpoints', 'test-endpoints'],
    keywords: ['endpoint', 'url', 'znaleźć', 'gdzie'],
  },
  {
    id: 'test-endpoints',
    question: 'Jak przetestować czy endpointy działają?',
    answer: `Możesz przetestować endpointy na kilka sposobów:

**1. W przeglądarce:**
• Skopiuj URL endpoint XML
• Wklej w pasek adresu przeglądarki
• Powinieneś zobaczyć XML z danymi

**2. Używając Dashboard:**
• Kliknij "Testuj" obok endpoint URL
• System sprawdzi dostępność i format
• Pokaże status i ewentualne błędy

**3. Używając curl:**
\`\`\`bash
curl https://otoraport.pl/api/public/{client-id}/data.xml
\`\`\`

**Co sprawdzić:**
✓ Endpoint zwraca status 200 OK
✓ XML jest poprawnie sformatowany
✓ Dane są aktualne
✓ MD5 hash się zgadza

**Częstotliwość aktualizacji:**
Dane są synchronizowane w czasie rzeczywistym po każdej zmianie.`,
    category: FAQ_CATEGORIES.ENDPOINTS,
    keywords: ['test', 'endpoint', 'sprawdzenie', 'weryfikacja'],
  },
  {
    id: 'endpoint-errors',
    question: 'Co zrobić jeśli endpoint zwraca błąd?',
    answer: `Rozwiązywanie problemów z endpointami:

**Error 404 - Not Found**
• Sprawdź czy Client ID jest poprawny
• Zweryfikuj URL (bez literówek)
• Sprawdź czy konto jest aktywne

**Error 500 - Server Error**
• Problem po naszej stronie
• Spróbuj ponownie za chwilę
• Zgłoś do supportu jeśli się powtarza

**Error 403 - Forbidden**
• Konto może być zawieszone
• Sprawdź status subskrypcji
• Skontaktuj się z supportem

**Dane są puste lub stare**
• Sprawdź czy przesłałeś dane
• Poczekaj 1-2 minuty na synchronizację
• Wyczyść cache przeglądarki

**MD5 się nie zgadza**
• Poczekaj na pełną synchronizację
• Sprawdź endpoint XML najpierw
• MD5 jest generowany z XML

Jeśli problem się utrzymuje, skontaktuj się z supportem.`,
    category: FAQ_CATEGORIES.ENDPOINTS,
    relatedArticles: ['test-endpoints', 'contact-support'],
    keywords: ['błąd', 'error', 'endpoint', '404', '500'],
  },
  {
    id: 'update-frequency',
    question: 'Jak często dane są aktualizowane?',
    answer: `Częstotliwość aktualizacji danych:

**Real-time synchronizacja:**
• Każda zmiana w danych → automatyczna aktualizacja endpointów
• Czas synchronizacji: 1-2 minuty
• Brak potrzeby ręcznego odświeżania

**Po imporcie CSV:**
• Import → Walidacja → Aktualizacja endpointów
• Dla małych plików: ~1 minuta
• Dla dużych plików: ~5 minut

**Po edycji pojedynczej nieruchomości:**
• Natychmiastowa aktualizacja (< 30 sekund)

**Cache:**
• Endpointy są cache'owane przez 5 minut
• Force refresh: dodaj ?v=timestamp do URL
• Ministerstwo sprawdza dane raz dziennie

**Monitoring:**
• Dashboard pokazuje "Ostatnia aktualizacja"
• Otrzymasz email przy problemach z synchronizacją
• Status sync w czasie rzeczywistym

Dla krytycznych aktualizacji, użyj funkcji "Force Sync" w ustawieniach.`,
    category: FAQ_CATEGORIES.ENDPOINTS,
    keywords: ['aktualizacja', 'synchronizacja', 'częstotliwość', 'cache'],
  },

  // Ministerstwo i compliance (3)
  {
    id: 'report-to-ministry',
    question: 'Jak zgłosić dane do Ministerstwa Rozwoju?',
    answer: `Proces zgłaszania danych do Ministerstwa:

**Krok 1: Przygotuj dane**
• Prześlij dane nieruchomości do OTORAPORT
• Zweryfikuj poprawność w podglądzie
• Przetestuj endpointy

**Krok 2: Zarejestruj się na portalu dane.gov.pl**
• Wejdź na https://dane.gov.pl
• Utwórz konto dewelopera
• Zweryfikuj firmę

**Krok 3: Dodaj źródło danych**
• Zaloguj się na dane.gov.pl
• Przejdź do "Moje dane"
• Kliknij "Dodaj źródło danych"

**Krok 4: Podaj URL endpointów**
• XML: Twój endpoint URL z OTORAPORT
• Wybierz częstotliwość: automatyczna
• Zapisz konfigurację

**Krok 5: Weryfikacja**
• Ministerstwo sprawdzi dane (1-2 dni robocze)
• Otrzymasz email z potwierdzeniem
• Status "Aktywny" na portalu

Szczegółową instrukcję znajdziesz w dokumentach Ministerstwa.`,
    category: FAQ_CATEGORIES.MINISTRY,
    keywords: ['ministerstwo', 'zgłoszenie', 'dane.gov.pl', 'raportowanie'],
  },
  {
    id: 'legal-requirements',
    question: 'Jakie są wymagania prawne dla deweloperów?',
    answer: `Obowiązki deweloperów nieruchomości:

**Podstawa prawna:**
• Ustawa o ochronie praw nabywcy lokalu mieszkalnego
• Rozporządzenie Ministra Rozwoju

**Zakres danych:**
• Wszystkie nieruchomości oferowane do sprzedaży
• Ceny ofertowe mieszkań
• Parametry techniczne (powierzchnia, pokoje, piętro)
• Lokalizacja inwestycji

**Częstotliwość raportowania:**
• Aktualizacja w ciągu 7 dni od zmiany ceny
• Nowe mieszkania: zgłoszenie przy rozpoczęciu sprzedaży
• Sprzedane mieszkania: oznaczenie jako "sprzedane"

**Kary za niezgłoszenie:**
• Do 100,000 PLN kary
• Wstrzymanie sprzedaży
• Kontrole UOKiK

**OTORAPORT pomaga:**
• Automatyzuje cały proces
• Zapewnia zgodność z formatami
• Monitoring zmian
• Historia raportowania

Zawsze sprawdzaj aktualne przepisy na stronie Ministerstwa.`,
    category: FAQ_CATEGORIES.MINISTRY,
    keywords: ['prawo', 'wymagania', 'obowiązki', 'ustawa'],
  },
  {
    id: 'update-frequency-legal',
    question: 'Jak często muszę aktualizować dane w systemie?',
    answer: `Wymagania dotyczące aktualizacji:

**Zgodnie z prawem:**
• Nowe mieszkania: do 7 dni od rozpoczęcia sprzedaży
• Zmiana ceny: do 7 dni od zmiany
• Sprzedaż mieszkania: do 7 dni od transakcji
• Status budowy: przy istotnych zmianach

**Best practices:**
• Cotygodniowa aktualizacja cen
• Codzienne oznaczanie sprzedaży
• Miesięczna weryfikacja wszystkich danych
• Natychmiastowe usuwanie wycofanych ofert

**OTORAPORT automatyzacja:**
• Możesz podłączyć API (Enterprise)
• Automatyczny import z Twojego systemu CRM
• Alerty o brakujących aktualizacjach
• Bulk update dla wielu mieszkań naraz

**Monitoring compliance:**
• Dashboard pokazuje ostatnią aktualizację
• Email przypomnienia o aktualizacjach
• Raport compliance (Enterprise)

Regularne aktualizacje to klucz do compliance i uniknięcia kar.`,
    category: FAQ_CATEGORIES.MINISTRY,
    relatedArticles: ['report-to-ministry', 'legal-requirements'],
    keywords: ['aktualizacja', 'częstotliwość', 'obowiązek', 'prawo'],
  },

  // Subskrypcje i płatności (3)
  {
    id: 'free-trial',
    question: 'Jak działa okres próbny?',
    answer: `Szczegóły okresu próbnego:

**Darmowy trial:**
• 14 dni za darmo
• Pełny dostęp do funkcji Pro
• Bez karty kredytowej
• Bez zobowiązań

**Co możesz testować:**
• Import do 500 nieruchomości
• Własna subdomena
• Wszystkie endpointy
• Export danych
• Priorytetowy support

**Po zakończeniu trial:**
• Możesz upgrade do Pro (99 PLN/msc)
• Lub kontynuować na planie Free (do 50 mieszkań)
• Dane pozostają bezpieczne
• Brak automatycznej płatności

**Jak aktywować:**
• Zarejestruj się
• Wybierz "Start Free Trial"
• Zacznij używać od razu

**Przedłużenie trial:**
• Skontaktuj się z supportem
• Możliwe dla większych projektów
• Individualne ustalenia

Żadnych ukrytych kosztów - zawsze wiesz co płacisz.`,
    category: FAQ_CATEGORIES.BILLING,
    keywords: ['trial', 'próbny', 'darmowy', 'test'],
  },
  {
    id: 'payment-methods',
    question: 'Jakie metody płatności są akceptowane?',
    answer: `Akceptowane metody płatności:

**Karty płatnicze:**
• Visa
• Mastercard
• American Express
• Automatyczne odnowienie

**Przelewy bankowe:**
• Dla planów Enterprise
• Faktury VAT
• 14 dni na płatność

**Rozliczenia:**
• Płatność miesięczna lub roczna
• Rabat 20% przy płatności rocznej
• Faktury VAT automatycznie
• Historia płatności w panelu

**Bezpieczeństwo:**
• Płatności przez Stripe
• PCI DSS compliant
• Szyfrowanie SSL/TLS
• Dane karty nie są przechowywane u nas

**Waluta:**
• Wszystkie ceny w PLN
• VAT 23% (dla firm polskich)
• Możliwość płatności w EUR (Enterprise)

**Zmiana metody płatności:**
• Ustawienia → Płatności
• Zaktualizuj dane karty
• Zmiana natychmiastowa

Wszystkie transakcje są bezpieczne i szyfrowane.`,
    category: FAQ_CATEGORIES.BILLING,
    keywords: ['płatność', 'karta', 'przelew', 'faktura'],
  },
  {
    id: 'cancel-subscription',
    question: 'Jak anulować subskrypcję?',
    answer: `Proces anulowania subskrypcji:

**Krok 1: Decyzja**
• Przemyśl czy na pewno chcesz anulować
• Sprawdź czy nie lepiej zmienić plan na niższy
• Skontaktuj się z supportem jeśli masz wątpliwości

**Krok 2: Anulowanie**
• Ustawienia → Subskrypcja
• Kliknij "Anuluj subskrypcję"
• Podaj powód (pomaga nam się rozwijać)
• Potwierdź anulowanie

**Co się stanie:**
• Dostęp do funkcji płatnych do końca okresu rozliczeniowego
• Brak automatycznego odnowienia
• Dane pozostają zachowane przez 30 dni
• Możliwość reaktywacji w każdej chwili

**Po anulowaniu:**
• Automatyczny downgrade do planu Free
• Limit 50 nieruchomości
• Dane powyżej limitu archiwizowane
• Możliwość eksportu danych

**Zwrot pieniędzy:**
• 14 dni money-back guarantee
• Proporcjonalny zwrot przy rocznej płatności
• Skontaktuj się z supportem

**Reaktywacja:**
• Możliwa w każdej chwili
• Przywrócenie wszystkich danych
• Bez dodatkowych opłat

Chcemy, żebyś był zadowolony - skontaktuj się z nami przed anulowaniem!`,
    category: FAQ_CATEGORIES.BILLING,
    relatedArticles: ['subscription-plans', 'payment-methods'],
    keywords: ['anulowanie', 'rezygnacja', 'cancel', 'subskrypcja'],
  },

  // Techniczne (4+)
  {
    id: 'supported-formats',
    question: 'Jakie formaty plików są obsługiwane?',
    answer: `Obsługiwane formaty:

**Import:**
• CSV (przecinek lub średnik)
• Excel (.xlsx, .xls)
• XML (format ministerialny)
• JSON (przez API)

**Export:**
• XML (format Ministerstwa)
• CSV (export tabeli)
• Excel (.xlsx)
• PDF (raporty - Enterprise)
• JSON (przez API)

**Kodowanie:**
• UTF-8 (zalecane)
• UTF-8 BOM
• Windows-1250 (automatyczna konwersja)

**Limity:**
• Max rozmiar pliku: zależy od planu
• Max liczba wierszy: bez limitu (ale wpływa na plan)
• Max kolumn: 50

**Kompresja:**
• ZIP (automatyczne rozpakowanie)
• GZIP (dla API)

**Obrazy (Enterprise):**
• Logo: PNG, JPG, SVG
• Max 5MB

Nie widzisz swojego formatu? Skontaktuj się - możemy dodać wsparcie.`,
    category: FAQ_CATEGORIES.TECHNICAL,
    keywords: ['format', 'plik', 'csv', 'excel', 'xml'],
  },
  {
    id: 'custom-domain',
    question: 'Jak dodać własną domenę? (Enterprise)',
    answer: `Konfiguracja własnej domeny:

**Wymagania:**
• Plan Enterprise
• Własna domena (np. nieruchomosci.twojafirma.pl)
• Dostęp do DNS

**Krok 1: Dodaj domenę w OTORAPORT**
• Ustawienia → Custom Domain
• Wpisz swoją domenę
• Kliknij "Dodaj domenę"

**Krok 2: Skonfiguruj DNS**
Dodaj rekord CNAME u swojego providera DNS:
\`\`\`
Type:  CNAME
Name:  nieruchomosci (lub twoja subdomena)
Value: otoraport-proxy.vercel.app
TTL:   3600
\`\`\`

**Krok 3: Weryfikacja**
• Poczekaj 1-24h na propagację DNS
• OTORAPORT automatycznie zweryfikuje
• Otrzymasz email z potwierdzeniem

**Krok 4: SSL Certificate**
• Automatycznie generowany przez Let's Encrypt
• Odnawialny co 90 dni
• Zero konfiguracji

**Twoje endpointy:**
\`\`\`
https://twoja-domena.pl/data.xml
https://twoja-domena.pl/data.csv
https://twoja-domena.pl/data.md5
\`\`\`

**Troubleshooting:**
• Sprawdź konfigurację DNS (nslookup)
• Upewnij się że domena jest aktywna
• Skontaktuj się z supportem

Potrzebujesz pomocy? Nasz team technicznie przeprowadzi Cię przez proces.`,
    category: FAQ_CATEGORIES.TECHNICAL,
    keywords: ['domena', 'custom', 'dns', 'cname', 'enterprise'],
  },
  {
    id: 'subdomain-setup',
    question: 'Jak skonfigurować subdomenę? (Pro/Enterprise)',
    answer: `Konfiguracja subdomeny OTORAPORT:

**Dostępność:**
• Plan Pro lub Enterprise
• Unikalna subdomena otoraport.pl
• Natychmiastowa aktywacja

**Krok 1: Wybierz subdomenę**
• Ustawienia → Subdomain
• Wpisz preferowaną nazwę (np. "inpro")
• Sprawdź dostępność
• Zapisz

**Krok 2: Aktywacja**
• Automatyczna w ciągu 5 minut
• Otrzymasz email z potwierdzeniem
• Twoja subdomena: https://inpro.otoraport.pl

**Twoje endpointy:**
\`\`\`
https://inpro.otoraport.pl/data.xml
https://inpro.otoraport.pl/data.csv
https://inpro.otoraport.pl/data.md5
\`\`\`

**Branding (Enterprise):**
• Custom logo na podstronie
• Custom kolory
• Custom tekst powitalny

**Zasady nazewnictwa:**
• 3-30 znaków
• Tylko litery, cyfry, myślnik
• Bez polskich znaków
• Nie może być zajęta

**Zmiana subdomeny:**
• Możliwa w każdej chwili
• Stare URL przekierowuje przez 30 dni
• Zaktualizuj w Ministerstwie

Subdomena to profesjonalny sposób na prezentację danych Twojej firmy.`,
    category: FAQ_CATEGORIES.TECHNICAL,
    relatedArticles: ['custom-domain'],
    keywords: ['subdomena', 'url', 'branding', 'pro'],
  },
  {
    id: 'forgot-password',
    question: 'Co zrobić jeśli zapomniałem hasła?',
    answer: `Resetowanie hasła:

**Krok 1: Reset hasła**
• Wejdź na stronę logowania
• Kliknij "Zapomniałeś hasła?"
• Wpisz swój email
• Kliknij "Wyślij link resetujący"

**Krok 2: Email**
• Sprawdź swoją skrzynkę email
• Poszukaj emaila od OTORAPORT
• Sprawdź też folder SPAM
• Link ważny przez 1 godzinę

**Krok 3: Nowe hasło**
• Kliknij link w emailu
• Wpisz nowe hasło
• Potwierdź hasło
• Zaloguj się

**Wymagania hasła:**
• Minimum 8 znaków
• Przynajmniej 1 wielka litera
• Przynajmniej 1 cyfra
• Przynajmniej 1 znak specjalny

**Nie dostałeś emaila?**
• Sprawdź czy email jest poprawny
• Poczekaj 5 minut
• Sprawdź folder SPAM
• Spróbuj ponownie
• Skontaktuj się z supportem

**Zmiana hasła:**
• Możesz zmienić hasło w Ustawieniach
• Zalecamy zmianę co 90 dni
• Używaj unikalnych haseł

**2FA (wkrótce):**
• Dwuskładnikowe uwierzytelnianie
• Dodatkowa warstwa bezpieczeństwa

Bezpieczeństwo Twojego konta to priorytet.`,
    category: FAQ_CATEGORIES.TECHNICAL,
    keywords: ['hasło', 'reset', 'zapomniałem', 'login'],
  },
];

// Video Tutorials Data
export const VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    id: 'getting-started',
    title: 'Pierwsze kroki w OTORAPORT',
    description: 'Dowiedz się jak skonfigurować konto i rozpocząć pracę z systemem',
    duration: 5,
    summary: [
      'Rejestracja i weryfikacja konta',
      'Przegląd głównego dashboardu',
      'Podstawowe ustawienia profilu',
      'Wybór odpowiedniego planu subskrypcji',
    ],
    isComingSoon: true,
  },
  {
    id: 'csv-import',
    title: 'Import danych z pliku CSV',
    description: 'Kompletny przewodnik po przygotowaniu i przesłaniu danych nieruchomości',
    duration: 8,
    summary: [
      'Przygotowanie pliku CSV według specyfikacji',
      'Upload i automatyczna walidacja',
      'Rozwiązywanie typowych błędów importu',
      'Weryfikacja zaimportowanych danych',
    ],
    isComingSoon: true,
  },
  {
    id: 'endpoints-setup',
    title: 'Konfiguracja endpointów ministerialnych',
    description: 'Jak skonfigurować i przetestować endpointy XML, CSV i MD5',
    duration: 6,
    summary: [
      'Zrozumienie endpointów i ich roli',
      'Znalezienie swoich unikalnych URL',
      'Testowanie dostępności endpointów',
      'Zgłaszanie URL do Ministerstwa',
    ],
    isComingSoon: true,
  },
  {
    id: 'property-management',
    title: 'Zarządzanie nieruchomościami',
    description: 'Edycja, aktualizacja i organizacja danych o mieszkaniach',
    duration: 7,
    summary: [
      'Dodawanie nowych mieszkań ręcznie',
      'Edycja pojedynczych nieruchomości',
      'Aktualizacja cen i statusów',
      'Bulk operations dla wielu mieszkań',
    ],
    isComingSoon: true,
  },
  {
    id: 'custom-branding',
    title: 'Własna domena i branding',
    description: 'Personalizacja subdomeny, dodanie logo i custom kolorów',
    duration: 5,
    summary: [
      'Konfiguracja subdomeny otoraport.pl',
      'Upload logo firmy',
      'Dostosowanie kolorów brandingu',
      'Konfiguracja własnej domeny (Enterprise)',
    ],
    enterpriseOnly: true,
    isComingSoon: true,
  },
];

// API Documentation
export const API_ENDPOINTS: APIEndpoint[] = [
  {
    method: 'GET',
    path: '/api/properties',
    description: 'Pobierz listę wszystkich nieruchomości',
    authentication: true,
    parameters: [
      {
        name: 'page',
        type: 'number',
        required: false,
        description: 'Numer strony (domyślnie 1)',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Liczba wyników na stronę (domyślnie 50, max 100)',
      },
      {
        name: 'status',
        type: 'string',
        required: false,
        description: 'Filtruj po statusie: available, reserved, sold',
      },
      {
        name: 'investment',
        type: 'string',
        required: false,
        description: 'Filtruj po nazwie inwestycji',
      },
    ],
    responses: [
      {
        code: 200,
        description: 'Lista nieruchomości',
        example: `{
  "data": [
    {
      "id": "123",
      "investment_name": "Osiedle Parkowe",
      "apartment_number": "A1/12",
      "area": 65.5,
      "rooms": 3,
      "floor": 2,
      "price": 450000,
      "status": "available",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}`,
      },
    ],
    codeExamples: {
      curl: `curl -X GET "https://otoraport.pl/api/properties?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      javascript: `const response = await fetch('https://otoraport.pl/api/properties?page=1&limit=50', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
const data = await response.json();`,
      python: `import requests

response = requests.get(
    'https://otoraport.pl/api/properties',
    params={'page': 1, 'limit': 50},
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)
data = response.json()`,
    },
  },
  {
    method: 'POST',
    path: '/api/properties',
    description: 'Dodaj nową nieruchomość',
    authentication: true,
    requestBody: {
      schema: {
        investment_name: 'string (required)',
        address_street: 'string (required)',
        address_number: 'string (required)',
        address_postal_code: 'string (required)',
        address_city: 'string (required)',
        apartment_number: 'string (required)',
        area: 'number (required)',
        rooms: 'number (required)',
        floor: 'number (required)',
        price: 'number (required)',
        status: 'string (optional, default: available)',
      },
      example: `{
  "investment_name": "Osiedle Parkowe",
  "address_street": "Kwiatowa",
  "address_number": "15",
  "address_postal_code": "00-001",
  "address_city": "Warszawa",
  "apartment_number": "A1/12",
  "area": 65.5,
  "rooms": 3,
  "floor": 2,
  "price": 450000,
  "status": "available"
}`,
    },
    responses: [
      {
        code: 201,
        description: 'Nieruchomość utworzona pomyślnie',
        example: `{
  "id": "123",
  "message": "Property created successfully"
}`,
      },
      {
        code: 400,
        description: 'Błędne dane wejściowe',
        example: `{
  "error": "Validation error",
  "details": ["area must be a positive number"]
}`,
      },
    ],
    codeExamples: {
      curl: `curl -X POST "https://otoraport.pl/api/properties" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "investment_name": "Osiedle Parkowe",
    "apartment_number": "A1/12",
    "area": 65.5,
    "rooms": 3,
    "floor": 2,
    "price": 450000
  }'`,
      javascript: `const response = await fetch('https://otoraport.pl/api/properties', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    investment_name: "Osiedle Parkowe",
    apartment_number: "A1/12",
    area: 65.5,
    rooms: 3,
    floor: 2,
    price: 450000
  })
});`,
      python: `import requests

data = {
    'investment_name': 'Osiedle Parkowe',
    'apartment_number': 'A1/12',
    'area': 65.5,
    'rooms': 3,
    'floor': 2,
    'price': 450000
}

response = requests.post(
    'https://otoraport.pl/api/properties',
    json=data,
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)`,
    },
  },
  {
    method: 'PUT',
    path: '/api/properties/{id}',
    description: 'Zaktualizuj istniejącą nieruchomość',
    authentication: true,
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'ID nieruchomości do aktualizacji',
      },
    ],
    requestBody: {
      schema: {
        price: 'number (optional)',
        status: 'string (optional)',
        area: 'number (optional)',
        rooms: 'number (optional)',
        floor: 'number (optional)',
      },
      example: `{
  "price": 460000,
  "status": "reserved"
}`,
    },
    responses: [
      {
        code: 200,
        description: 'Nieruchomość zaktualizowana',
        example: `{
  "id": "123",
  "message": "Property updated successfully"
}`,
      },
      {
        code: 404,
        description: 'Nie znaleziono nieruchomości',
        example: `{
  "error": "Property not found"
}`,
      },
    ],
    codeExamples: {
      curl: `curl -X PUT "https://otoraport.pl/api/properties/123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"price": 460000, "status": "reserved"}'`,
      javascript: `const response = await fetch('https://otoraport.pl/api/properties/123', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    price: 460000,
    status: 'reserved'
  })
});`,
      python: `import requests

data = {'price': 460000, 'status': 'reserved'}
response = requests.put(
    'https://otoraport.pl/api/properties/123',
    json=data,
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)`,
    },
  },
  {
    method: 'DELETE',
    path: '/api/properties/{id}',
    description: 'Usuń nieruchomość',
    authentication: true,
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'ID nieruchomości do usunięcia',
      },
    ],
    responses: [
      {
        code: 200,
        description: 'Nieruchomość usunięta',
        example: `{
  "message": "Property deleted successfully"
}`,
      },
      {
        code: 404,
        description: 'Nie znaleziono nieruchomości',
        example: `{
  "error": "Property not found"
}`,
      },
    ],
    codeExamples: {
      curl: `curl -X DELETE "https://otoraport.pl/api/properties/123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      javascript: `const response = await fetch('https://otoraport.pl/api/properties/123', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});`,
      python: `import requests

response = requests.delete(
    'https://otoraport.pl/api/properties/123',
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)`,
    },
  },
  {
    method: 'GET',
    path: '/api/public/{client_id}/data.xml',
    description: 'Publiczny endpoint XML dla Ministerstwa (bez autoryzacji)',
    authentication: false,
    parameters: [
      {
        name: 'client_id',
        type: 'string',
        required: true,
        description: 'Twój unikalny Client ID',
      },
    ],
    responses: [
      {
        code: 200,
        description: 'XML z danymi nieruchomości',
        example: `<?xml version="1.0" encoding="UTF-8"?>
<mieszkania>
  <mieszkanie>
    <inwestycja>Osiedle Parkowe</inwestycja>
    <adres>
      <ulica>Kwiatowa</ulica>
      <numer>15</numer>
      <kod_pocztowy>00-001</kod_pocztowy>
      <miejscowosc>Warszawa</miejscowosc>
    </adres>
    <numer_mieszkania>A1/12</numer_mieszkania>
    <powierzchnia_uzytkowa>65.5</powierzchnia_uzytkowa>
    <liczba_pokoi>3</liczba_pokoi>
    <pietro>2</pietro>
    <cena_ofertowa>450000</cena_ofertowa>
    <data_aktualizacji>2025-01-15</data_aktualizacji>
  </mieszkanie>
</mieszkania>`,
      },
    ],
    codeExamples: {
      curl: `curl "https://otoraport.pl/api/public/YOUR_CLIENT_ID/data.xml"`,
      javascript: `const response = await fetch('https://otoraport.pl/api/public/YOUR_CLIENT_ID/data.xml');
const xml = await response.text();`,
      python: `import requests

response = requests.get('https://otoraport.pl/api/public/YOUR_CLIENT_ID/data.xml')
xml_data = response.text`,
    },
  },
];

// Troubleshooting Issues
export const TROUBLESHOOTING_ISSUES: TroubleshootingIssue[] = [
  {
    id: 'csv-import-fails',
    problem: 'Import pliku CSV kończy się błędem',
    causes: [
      'Nieprawidłowy format pliku lub kodowanie',
      'Brakujące wymagane kolumny',
      'Nieprawidłowe wartości w polach',
      'Plik uszkodzony lub zbyt duży',
    ],
    solutions: [
      'Sprawdź czy plik jest zapisany jako UTF-8',
      'Zweryfikuj nazwy kolumn (dokładnie jak w specyfikacji)',
      'Usuń polskie znaki z nagłówków',
      'Sprawdź czy wszystkie wymagane pola są wypełnione',
      'Użyj kropki zamiast przecinka dla liczb dziesiętnych',
      'Pobierz i użyj szablonu CSV z dashboardu',
      'Jeśli plik jest duży, podziel go na mniejsze części',
    ],
    relatedArticles: ['prepare-csv', 'fix-import-errors'],
  },
  {
    id: 'endpoint-404',
    problem: 'Endpoint zwraca błąd 404 Not Found',
    causes: [
      'Nieprawidłowy lub przestarzały Client ID',
      'Literówka w URL endpointu',
      'Konto nieaktywne lub zawieszone',
      'Nie przesłano jeszcze żadnych danych',
    ],
    solutions: [
      'Sprawdź Client ID w Ustawieniach → API Configuration',
      'Skopiuj URL bezpośrednio z dashboardu (nie wpisuj ręcznie)',
      'Zweryfikuj status konta i subskrypcji',
      'Prześlij przynajmniej jedną nieruchomość',
      'Spróbuj zregenerować Client ID w ustawieniach',
      'Poczekaj 2-3 minuty po pierwszym imporcie danych',
      'Skontaktuj się z supportem jeśli problem się utrzymuje',
    ],
    relatedArticles: ['find-endpoints', 'test-endpoints'],
  },
  {
    id: 'properties-not-showing',
    problem: 'Nieruchomości nie wyświetlają się na liście',
    causes: [
      'Aktywne filtry ukrywają nieruchomości',
      'Dane nie zostały jeszcze zsynchronizowane',
      'Problem z cache przeglądarki',
      'Import zakończył się błędem',
    ],
    solutions: [
      'Kliknij "Wyczyść filtry" nad tabelą',
      'Sprawdź czy import zakończył się sukcesem (powiadomienia)',
      'Odśwież stronę (Ctrl+F5 / Cmd+Shift+R)',
      'Wyloguj się i zaloguj ponownie',
      'Sprawdź historię importów w sekcji "Historia"',
      'Spróbuj w trybie incognito przeglądarki',
      'Sprawdź czy nie masz przekroczonego limitu planu',
    ],
    relatedArticles: ['csv-import', 'update-after-import'],
  },
  {
    id: 'login-problems',
    problem: 'Nie mogę się zalogować do konta',
    causes: [
      'Nieprawidłowe hasło',
      'Email nie został zweryfikowany',
      'Konto zostało zablokowane',
      'Problem z cache lub cookies',
    ],
    solutions: [
      'Użyj funkcji "Zapomniałem hasła" aby zresetować hasło',
      'Sprawdź email z linkiem weryfikacyjnym (także SPAM)',
      'Wyczyść cache i cookies przeglądarki',
      'Spróbuj w innej przeglądarce lub trybie incognito',
      'Sprawdź czy Caps Lock nie jest włączony',
      'Poczekaj 15 minut jeśli konto zostało tymczasowo zablokowane',
      'Skontaktuj się z supportem jeśli problem się utrzymuje',
    ],
    relatedArticles: ['forgot-password', 'contact-support'],
  },
  {
    id: 'payment-declined',
    problem: 'Płatność została odrzucona',
    causes: [
      'Niewystarczające środki na karcie',
      'Karta wygasła lub jest zablokowana',
      'Bank odrzucił transakcję',
      'Nieprawidłowe dane karty',
    ],
    solutions: [
      'Sprawdź saldo i limit karty',
      'Zweryfikuj datę ważności karty',
      'Skontaktuj się z bankiem aby odblokować płatności online',
      'Zaktualizuj dane karty w Ustawieniach → Płatności',
      'Spróbuj użyć innej karty',
      'Dla większych kwot rozważ przelew bankowy (Enterprise)',
      'Skontaktuj się z supportem dla alternatywnych metod płatności',
    ],
    relatedArticles: ['payment-methods', 'subscription-plans'],
  },
];

// Getting Started Steps
export const GETTING_STARTED_STEPS = [
  {
    number: 1,
    title: 'Zarejestruj się i zaloguj',
    description: 'Utwórz darmowe konto i zweryfikuj swój email. Otrzymasz 14 dni trial planu Pro.',
    icon: '🎯',
  },
  {
    number: 2,
    title: 'Uzupełnij dane firmy',
    description: 'Dodaj nazwę firmy, NIP i dane kontaktowe w ustawieniach profilu.',
    icon: '🏢',
  },
  {
    number: 3,
    title: 'Prześlij dane nieruchomości',
    description: 'Przygotuj plik CSV według specyfikacji i prześlij do systemu.',
    icon: '📊',
  },
  {
    number: 4,
    title: 'Zweryfikuj endpointy',
    description: 'Sprawdź czy endpointy XML, CSV i MD5 działają poprawnie.',
    icon: '✅',
  },
  {
    number: 5,
    title: 'Zgłoś dane do Ministerstwa',
    description: 'Podaj URL endpointów w portalu dane.gov.pl i poczekaj na weryfikację.',
    icon: '🚀',
  },
];
