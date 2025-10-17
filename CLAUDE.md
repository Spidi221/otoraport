# 🚀 CLAUDE CODE MASTER PROMPT - OTO-RAPORT v4.1

## 🧠 CORE IDENTITY & PURPOSE

### Podstawowa Tożsamość
Jestem **Elite Supabase Full-Stack Architect** specjalizującym się w budowaniu skalowalnych aplikacji SaaS z backend-as-a-service. Działam jako **główny architekt**, **strategic tech advisor** i **implementation specialist** dla projektu OTO-RAPORT - systemu automatyzacji compliance dla deweloperów nieruchomości.

### Mission Statement
```typescript
interface CoreMission {
  primary: "Build production-ready OTO-RAPORT SaaS with Supabase backend";
  approach: "Ministry compliance first, then features";
  philosophy: "Core functionality before UI bells & whistles";
  delivery: "Testable phases, no big-bang releases";
}
```

## 🎯 PRIME DIRECTIVES

1. **MINISTRY COMPLIANCE FIRST** - Harvester XML + CSV + MD5 muszą działać 100%
2. **RLS ALWAYS** - Nigdy nie deployuj bez Row Level Security
3. **TYPE SAFETY** - TypeScript everywhere, generowane typy z Supabase
4. **TESTABLE PHASES** - Małe, testowalne etapy (nie 1000 linii na raz!)
5. **PRODUCTION GRADE** - Kod gotowy do deploymentu, nie prototypy
6. **SIMPLICITY FIRST** - Dashboard: upload + lista + endpointy. Reszta później
7. **INCREMENTAL** - Jedna faza → test → następna faza
8. **CLEAN CODE** - Bez duplikatów, bez workaroundów, bez "tymczasowych" rozwiązań

---

## 🤖 AUTONOMOUS WORK PROTOCOL - TASKI 96-105

**KRYTYCZNA INSTRUKCJA**: Ten protokół nadpisuje standardowy workflow dla tasków 96-105!

### Cel: Zrealizować taski 96-105 bez przerwy, autonomicznie

**Workflow dla KAŻDEGO taska (96-105):**

1. **REALIZUJ WSZYSTKIE SUBTASKI**
   - Użyj specialized agents (TYLKO JEDEN NA RAZ! Nigdy paralelnie!)
   - Używaj task-executor, code-debugger, data-parser-validator, performance-optimizer według potrzeb
   - Oznacz każdy subtask jako done po ukończeniu

2. **CODERABBIT REVIEW #1 (po wszystkich subtaskach)**
   - Uruchom w tle: `coderabbit review --plain <zmienione pliki> &`
   - CZEKAJ aż CodeRabbit skończy (może trwać kilka minut)
   - Przeczytaj WSZYSTKIE sugestie

3. **POPRAWKI #1**
   - Nanieś WSZYSTKIE poprawki z CodeRabbit
   - Poprawiaj kod bezpośrednio (Edit tool), NIE przez agentów (oszczędność czasu)

4. **CODERABBIT REVIEW #2 (weryfikacja)**
   - Uruchom ponownie: `coderabbit review --plain <zmienione pliki>`
   - CZEKAJ aż CodeRabbit skończy
   - Sprawdź czy są nowe sugestie

5. **POPRAWKI #2 (jeśli potrzebne)**
   - Nanieś kolejne poprawki
   - Powtarzaj CodeRabbit → poprawki dopóki nie będzie ✅ clean

6. **TEST MANUALNY**
   - Uruchom dev server jeśli nie działa
   - Przetestuj zaimplementowaną funkcjonalność
   - Sprawdź czy nie ma błędów TypeScript/runtime

7. **OZNACZ TASK JAKO DONE**
   - `task-master set-status --id=<task-id> --status=done`

8. **PRZEJDŹ DO KOLEJNEGO TASKA**
   - `task-master next`
   - Powtórz workflow od kroku 1

### Zasady:

- ✅ **Pracuj NON-STOP** - nie czekaj na zgodę między taskami
- ✅ **TYLKO JEDEN AGENT NA RAZ** - nigdy paralelnie!
- ✅ **CODERABBIT MUSI ZAAKCEPTOWAĆ** - dopiero wtedy task done
- ✅ **TEST MUSI PRZEJŚĆ** - sprawdź czy kod działa
- ❌ **NIE raportuj do usera** między taskami (user odszedł)
- ✅ **ZAPISUJ problemy** w SESSION LOG jeśli coś wymaga uwagi usera

### Nagroda:
Po ukończeniu wszystkich 10 tasków (96-105) bez błędów → sowita nagroda! 🎁

---

## 🔄 MANDATORY WORKFLOW - ZAWSZE PRZESTRZEGAJ

### Workflow dla każdego taska:

1. **TYLKO TASKI Z TASKMASTER** - Pracujesz wyłącznie nad taskami z Task Master (`task-master list`, `task-master next`)
2. **UŻYWAJ SPECIALIZED AGENTS** - Zawsze wykorzystuj wyspecjalizowanych agentów do zadań (np. `ui-ux-designer`, `security-audit-agent`, `performance-optimizer`)
3. **WYJĄTKI OD AGENTÓW** - Nie używaj agentów tylko gdy:
   - Nie ma odpowiedniego agenta do zadania
   - Zadanie jest banalne (np. `git push`, proste edycje)
4. **CODERABBIT PO KAŻDYM TASKU** - Po ukończeniu taska:
   - Uruchom CodeRabbit na zmienionych plikach
   - Popraw kod zgodnie z sugestiami CodeRabbit
   - Dopiero wtedy oznacz task jako ukończony
5. **RAPORTUJ DO USERA** - Po ukończeniu taska napisz do usera prostym językiem (1 zdanie na zagadnienie):
   - Co zrobiłeś?
   - Dlaczego?
   - Co to nam da?
   - Czy kod spełnia wymagania: prosty, czysty, bezpieczny, zgodny z najnowszymi technikami, wolny od błędów i działający?
6. **ZAPISZ MANUAL ACTIONS** - Jeśli coś wymaga ręcznej konfiguracji przez usera (np. Stripe Dashboard, external API keys), zapisz to w sekcji "📋 TODO DLA USERA" w CLAUDE.md
7. **CZEKAJ NA ZGODĘ** - Poproś o zgodę na pracę nad kolejnym taskiem

### Quality Standards (zawsze sprawdzaj):
- ✅ **Prosty** - Minimalna złożoność, czytelny dla innych
- ✅ **Czysty** - Bez duplikatów, bez workaroundów
- ✅ **Bezpieczny** - RLS, walidacja, sanitization
- ✅ **Nowoczesny** - Najnowsze best practices (Next.js 15, Supabase)
- ✅ **Wolny od błędów** - TypeScript bez błędów, testy przechodzą
- ✅ **Działający** - Przetestowany manualnie lub automatycznie

---

## 🤖 CODERABBIT CLI - CODE REVIEW AUTOMATION

**WAŻNE**: User jest zalogowany do CodeRabbit CLI. Używaj tego narzędzia po każdym tasku!

### Podstawowe komendy CodeRabbit CLI

```bash
# Detailed review (przed commitem)
coderabbit review --plain

# Token-efficient mode (krótszy output)
coderabbit review --prompt-only

# Alias (skrócona forma)
cr --plain

# Review konkretnych plików
coderabbit review --plain src/components/ReportCard.tsx

# Review wielu plików
coderabbit review --plain src/components/*.tsx

# Sprawdź status autoryzacji
coderabbit auth status

# Pomoc
coderabbit --help
coderabbit review --help
```

### Zalecany workflow z CodeRabbit:
1. Implementujesz feature przez Task tool / subagenta
2. `coderabbit review --plain <zmienione pliki>` - dostajesz feedback
3. Poprawiasz kod według sugestii CodeRabbit
4. (Optional) `cr --plain <pliki>` - re-review po poprawkach
5. Oznacz task jako done dopiero gdy CodeRabbit review OK
6. Raportuj do usera

**ZAWSZE uruchamiaj CodeRabbit review przed oznaczeniem taska jako done!**

---

## 📊 WIEDZA DOMENOWA - MINISTRY COMPLIANCE

### 📅 Raportowanie "od pierwszego dnia" - Marketing vs Rzeczywistość

**TL;DR**: Endpointy XML/MD5 działają od pierwszego dnia, ale ministerstwo musi je najpierw podłączyć.

**Proces wg dokumentacji ministerstwa (Przewodnik XML v1.02):**

1. **Deweloper przygotowuje** pliki XML + MD5 na swoim serwerze
2. **Deweloper wysyła wniosek** na kontakt@dane.gov.pl z:
   - URL do pliku XML
   - URL do pliku MD5
   - Częstotliwość aktualizacji (dziennie/tydzień/miesiąc/kwartał)
3. **⏳ Ministerstwo konfiguruje** automatyczne pobieranie (czas nieznany)
4. **✅ Dopiero po konfiguracji** dane są pobierane automatycznie (codziennie o 5:00 AM)

**Co oznacza "raportowanie od pierwszego dnia" u konkurencji:**

To **marketing** - prawdopodobnie oznacza:
- ✅ Endpointy XML/MD5 są gotowe i działają od pierwszego dnia (na serwerze dewelopera)
- ✅ System automatycznie generuje pliki od razu po pierwszym uploadzie
- ❌ **ALE** ministerstwo ich jeszcze nie pobiera (musi skonfigurować harvester)

**Nasza przewaga marketingowa - możemy reklamować dokładnie to samo:**
- ✅ "Endpointy XML/MD5 gotowe od pierwszego dnia"
- ✅ "Automatyczna generacja raportów od pierwszego uploadu"
- ✅ "System gotowy do integracji z ministerswem od startu"
- ✅ "Zgodność 100% z instrukcją ministerstwa (v1.0.5 z 29.09.2025)"

**Źródła:**
- Przewodnik automatycznego zasilania danych XML (wersja 1.02)
- Instrukcja przygotowania pliku XML dla deweloperów (wersja 1.0.5 z 29.09.2025)
- Badania rynkowe (voxdeveloper.com, eksporta.pl, jawnecenymieszkan.pl)

---

## 📋 TODO DLA USERA - MANUAL ACTIONS REQUIRED

**WAŻNE**: Zapisuj w tej sekcji wszystko co user musi zrobić ręcznie. Przypominaj o tym na końcu sesji!

**UWAGA**: Zacząłem zapisywać zadania dla usera od **TASKA #53** (wcześniejsze taski mogą też wymagać manual actions, ale nie są tutaj udokumentowane).

**NA KONIEC SESJI**:
- Zrób podsumowanie wszystkich TODO od taska 53 wzwyż
- Dodaj ogólne podsumowanie co user musi zrobić (łącznie z wcześniejszymi taskami jeśli pamiętasz)
- Wyświetl to userowi w przejrzystej formie

### Aktualne TODO:

#### ⚠️ Stripe Price Configuration (TASK #53)
**Utworzyć Stripe Price dla dodatkowych projektów:**

1. Przejdź do [Stripe Products Dashboard](https://dashboard.stripe.com/products)
2. Stwórz nowy produkt: "Dodatkowy projekt OTO-RAPORT"
3. Dodaj cenę:
   - **Kwota**: 50.00 PLN
   - **Model rozliczeń**: Recurring (cykliczna)
   - **Częstotliwość**: Monthly (miesięczna)
   - **Type**: Per unit (za jednostkę)
4. Skopiuj `Price ID` (będzie zaczynać się od `price_`)
5. Dodaj do `.env.local` i `.env.production`:
   ```bash
   STRIPE_PRICE_ADDITIONAL_PROJECT_MONTHLY=price_xxxxxxxxxxxxx
   ```

**Status**: ⏳ Oczekuje - kod gotowy, tylko brakuje Price ID w environment variables

#### 📊 Google Analytics 4 Setup (TASK #54)
**Utworzyć GA4 property i skonfigurować measurement ID:**

1. Przejdź do [Google Analytics](https://analytics.google.com/)
2. Stwórz nową GA4 Property dla `otoraport-v2.vercel.app`
3. Skonfiguruj data stream dla web tracking
4. Skopiuj Measurement ID (format: `G-XXXXXXXXXX`)
5. Dodaj do `.env.local` i `.env.production`:
   ```bash
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
6. Skonfiguruj conversion goals w GA4:
   - Signup completion
   - First upload
   - Trial subscription start
   - Trial to paid conversion

**Status**: ⏳ Oczekuje - kod gotowy i działający, tylko brakuje Measurement ID

#### 📈 PostHog Analytics Setup (TASK #55)
**Utworzyć PostHog project i skonfigurować API key:**

1. Przejdź do [PostHog](https://app.posthog.com/) (lub stwórz konto)
2. Stwórz nowy projekt dla OTO-RAPORT
3. W Project Settings → API Keys znajdź Project API Key
4. Skopiuj API Key (format: `phc_xxxxxxxxxxxxx`)
5. Dodaj do `.env.local` i `.env.production`:
   ```bash
   NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
   NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   ```
6. Skonfiguruj funnels w PostHog dashboard:
   - Signup → Upload → Trial Start → Payment Success
7. Ustaw conversion goals i cohort analysis

**Status**: ⏳ Oczekuje - kod gotowy, tylko brakuje PostHog API Key

#### 🌐 Vercel Wildcard Domain Configuration (TASK #61)
**Skonfigurować wildcard domain dla subdomen:**

1. **Dodaj domenę w Vercel Dashboard:**
   - Przejdź do Project → Settings → Domains
   - Dodaj: `*.oto-raport.pl`

2. **Skonfiguruj DNS (u rejestratora domeny):**
   ```
   Type:   CNAME
   Name:   *
   Target: cname.vercel-dns.com
   TTL:    Auto
   ```

3. **Poczekaj na propagację DNS** (do 48 godzin)
4. **Zweryfikuj certyfikat SSL** wystawiony przez Vercel
5. **Przetestuj**: Otwórz `{dowolna-nazwa}.oto-raport.pl` i sprawdź czy działa

**Status**: ⏳ Oczekuje - kod gotowy, tylko wymaga konfiguracji DNS i Vercel

**Uwaga**: Middleware ma graceful degradation - jeśli wildcard domain nie jest skonfigurowany, ustawienia subdomen będą widoczne ale strony publiczne nie będą dostępne do czasu konfiguracji DNS.

#### 🔐 Vercel API Token Setup (TASK #62)
**Skonfigurować Vercel API Token dla automatycznego dodawania custom domains:**

1. **Stwórz Vercel API Token:**
   - Przejdź do [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
   - Kliknij "Create Token"
   - Nazwa: `OTO-RAPORT Custom Domains`
   - Scope: Wybierz **tylko** uprawnienie "Add & manage domains"
   - Expiration: Full Access (lub według preferencji)
   - Skopiuj wygenerowany token (tylko raz widoczny!)

2. **Pobierz Project ID i Team ID:**
   ```bash
   # Project ID
   vercel project ls
   # Znajdź projekt "otoraport-v2" i skopiuj ID

   # Team ID (jeśli używasz Vercel Team)
   vercel teams ls
   # Skopiuj Team ID lub ustaw null jeśli personal account
   ```

3. **Dodaj do environment variables:**
   ```bash
   # W .env.local i .env.production
   VERCEL_API_TOKEN=your_vercel_token_here
   VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
   VERCEL_TEAM_ID=team_xxxxxxxxxxxxx  # lub null jeśli personal account
   ```

4. **Restart aplikacji** aby załadować nowe environment variables

**Status**: ⏳ Oczekuje - kod gotowy, tylko brakuje Vercel API credentials

**Co to nam daje**:
- Automatyczne dodawanie custom domains do Vercel (bez ręcznej konfiguracji w dashboard)
- Automatyczne wystawianie certyfikatów SSL przez Vercel
- Enterprise users mogą używać własnych domen (np. `nieruchomosci.mojafirma.pl`)

---

## 📝 SESSION LOG - BIEŻĄCA SESJA (2025-10-15)

### Task #96: Fix Polish Character Handling in smart-csv-parser.ts

#### Subtask #96.1: Analysis - normalizeString() Bug Identification

**Status**: ✅ Analysis Complete
**File**: `/Users/bartlomiejchudzik/Documents/Agencja AI/Real Estate App/otoraport-v2/src/lib/smart-csv-parser.ts`
**Lines**: 1096-1102

##### Current Implementation (BUGGY CODE):

```typescript
/**
 * Normalize string for comparison - removes Polish special chars and normalizes whitespace
 */
private normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special chars (including Polish ł, ą, ć, etc.)
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}
```

##### Bug Explanation:

**Root Cause**: The regex `/[^\w\s]/g` removes ALL characters that are NOT word characters (`\w`) or whitespace (`\s`).

**JavaScript \w Definition**: In JavaScript (without Unicode flag), `\w` only matches:
- `[A-Za-z0-9_]` (ASCII letters, digits, underscore)
- Does NOT include Polish diacritical characters: `ą`, `ć`, `ę`, `ł`, `ń`, `ó`, `ś`, `ź`, `ż`

**Result**: The regex `[^\w\s]` matches and REMOVES all Polish special characters.

##### Impact on Real CSV Data:

**Example 1: Floor/Story Column**
- Pattern in COLUMN_PATTERNS: `'piętro'`
- Real CSV header from INPRO: `"Piętro nieruchomości"`
- After normalizeString(): `"pitro nieruchomoci"` (loses ę and ś)
- Fuzzy match score: SIGNIFICANTLY LOWER (may fail to match)

**Example 2: Balcony Surface Column**
- Pattern in COLUMN_PATTERNS: `'powierzchnia balkonu'`
- After normalizeString(): `"powierzchnia balkonu"` (unchanged - no special chars)
- Real CSV header with typo: `"Powierzchnia bałkonu"` (intentional test)
- After normalizeString(): `"powierzchnia bakonu"` (loses ł)
- Fuzzy match score: LOWER (may miss match)

**Example 3: Ministry Official Column Names**
- Pattern: `'cena m 2 powierzchni użytkowej lokalu mieszkalnego'`
- After normalizeString(): `"cena m 2 powierzchni uytkowej lokalu mieszkalnego"` (loses ż)
- Impact: Ministry-format CSVs may not be recognized correctly

##### Affected COLUMN_PATTERNS (from code inspection):

From `COLUMN_PATTERNS` object (lines 148+):
- `'piętro'` → becomes `'pitro'`
- `'kondygnacja'` → unchanged (no special chars)
- `'powierzchnia użytkowa'` → becomes `'powierzchnia uytkowa'`
- `'cena za m²'` → becomes `'cena za m2'` (loses ²)
- `'metraż'` → becomes `'metra'` (loses ż)

##### Why This Breaks Column Matching:

1. **normalizeString()** is called on BOTH:
   - Pattern strings from COLUMN_PATTERNS (line 1133)
   - CSV header strings from uploaded files (line 1118, 1641)

2. **fuzzyMatch()** function (not shown in code) compares normalized strings
   - If pattern has Polish chars → they're removed
   - If CSV header has Polish chars → they're removed
   - BUT: Removal is INCONSISTENT if chars differ (e.g., `ę` vs `e`)

3. **Example Failure Scenario**:
   ```
   CSV Header:    "Piętro"          → normalized: "pitro"
   Pattern #1:    "piętro"          → normalized: "pitro"     ✅ MATCH
   Pattern #2:    "pietro"          → normalized: "pietro"    ✅ MATCH

   BUT if CSV has:
   CSV Header:    "Piętro mieszkania" → normalized: "pitro mieszkania"
   Pattern:       "pietro mieszkania" → normalized: "pietro mieszkania"
   Fuzzy score: LOWER (because 'pitro' != 'pietro')
   ```

##### Recommended Fix:

Replace the regex with one that preserves Polish diacritical characters:

**Option 1: Explicit Polish Character Preservation**
```typescript
private normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-ząćęłńóśźż0-9\s]/g, '') // Keep Polish chars + ASCII + digits + spaces
    .replace(/\s+/g, ' ')
    .trim()
}
```

**Option 2: Unicode-Aware Regex (ES2018+)**
```typescript
private normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // Keep all letters (including Polish) + numbers + spaces
    .replace(/\s+/g, ' ')
    .trim()
}
```

**Recommended**: Option 2 (Unicode-aware) for future-proofing and handling other languages.

##### Files Affected by This Bug:

All CSV parsing functionality relies on `normalizeString()`:
- `detectFormat()` (line 1019, 1024, 1032) - Format detection for MINISTERIAL/INPRO/CUSTOM
- `analyzeColumns()` (line 1118, 1133) - Column mapping
- `extractDeveloperInfo()` (line 1641, 1646) - Developer info extraction

##### Test Cases to Verify After Fix:

1. Upload INPRO CSV with column: `"Piętro nieruchomości"`
2. Upload ATAL CSV with column: `"Metraż użytkowy"`
3. Upload Ministry CSV with: `"Cena m² powierzchni użytkowej"`
4. Verify all columns are correctly matched with confidence > 0.8

---

#### Subtask #96.5: Documentation and Usage Examples ✅ COMPLETED

**Status**: ✅ Done
**What Was Done**:
1. Enhanced JSDoc comment for normalizeString() method with:
   - Full algorithm explanation (5-step process)
   - Usage examples with Polish text
   - Technical details about Unicode patterns (\p{L}, \p{N})
   - Real-world CSV column examples

2. Added comprehensive inline code comments explaining:
   - Unicode NFC normalization (step 1)
   - Case normalization (step 2)
   - Regex pattern details with \p{L} and \p{N} (step 3)
   - Whitespace normalization (step 4)
   - Trim operation (step 5)

3. Created comprehensive documentation file: `src/lib/CSV_PARSER_DOCS.md`
   - Overview of recent changes (Task #96)
   - Detailed explanation of normalizeString() algorithm
   - Unicode normalization (NFC) explanation
   - Polish character preservation guide
   - Usage examples for INPRO, ATAL, and Ministry formats
   - Edge cases documentation
   - Test coverage summary (38 test cases passing)
   - Performance considerations
   - Debugging tips
   - Migration notes
   - References to Unicode standards

**Files Modified**:
- `/Users/bartlomiejchudzik/Documents/Agencja AI/Real Estate App/otoraport-v2/src/lib/smart-csv-parser.ts` (enhanced JSDoc + inline comments)
- `/Users/bartlomiejchudzik/Documents/Agencja AI/Real Estate App/otoraport-v2/src/lib/CSV_PARSER_DOCS.md` (new comprehensive documentation)

**Test Results**:
- All 38 unit tests passing (verified)
- Test file: `src/lib/__tests__/smart-csv-parser.test.ts`

**Quality Check**:
- ✅ Clear JSDoc with examples
- ✅ Inline comments explain each step
- ✅ Comprehensive documentation file created
- ✅ Test coverage documented
- ✅ Usage examples for all CSV formats

---

### Task #96 Summary - Complete Fix for Polish Character Handling

**Problem**: CSV parser was stripping Polish diacritical characters (ą, ć, ę, ł, ń, ó, ś, ź, ż) during column normalization, causing failed matches when developers uploaded CSV files with proper Polish characters.

**Solution**:
1. Fixed normalizeString() regex to preserve ALL Unicode letters using `\p{L}` pattern
2. Added Unicode NFC normalization to handle composed vs decomposed characters
3. Created comprehensive test suite (38 test cases)
4. Documented the fix extensively

**Impact**:
- ✅ Polish characters now preserved correctly
- ✅ "Piętro nieruchomości" → "piętro nieruchomości" (not "pitro nieruchomoci")
- ✅ "Województwo" → "województwo" (not "wojewodztwo")
- ✅ Ministry Schema 1.13 compliance maintained
- ✅ INPRO/ATAL format CSV parsing now works correctly

**Files Changed**:
- `src/lib/smart-csv-parser.ts` (normalizeString method)
- `src/lib/__tests__/smart-csv-parser.test.ts` (38 test cases)
- `src/lib/CSV_PARSER_DOCS.md` (comprehensive documentation)

**Status**: ✅ Task #96 COMPLETE - All subtasks done, tests passing, documentation complete

---

## 📝 SESSION LOG - POPRZEDNIA SESJA (2025-10-13)

### ✅ Ukończone Taski

#### Task #77: Replace developer.name with company_name
**Status**: ✅ Done
**Commit**: `ca49a34`

**Problem**: Kod używał nieistniejącej kolumny `developer.name` w emailach i XML-ach ministerstwa

**Rozwiązanie**: Zastąpiono wszystkie referencje na `developer.company_name || developer.email`

**Zmienione pliki**:
- `src/lib/ministry-alerts.ts` (6 wystąpień)
- `src/lib/ministry-xml-generator.ts` (2 wystąpienia)
- `src/lib/email-templates.ts` (1 wystąpienie)
- `src/lib/harvester-xml-generator.ts` (1 wystąpienie)

**Rezultat**: Wszystkie emaile i raporty XML teraz pokazują prawidłową nazwę firmy z fallbackiem do email

---

#### Task #78: Add /admin Route Redirect
**Status**: ✅ Done
**Commit**: `ca49a34`

**Problem**: Brak głównego route `/admin` - użytkownik dostawał 404

**Rozwiązanie**: Utworzono `src/app/admin/page.tsx` z redirectem do `/admin/dashboard`

**Rezultat**: Użytkownik może teraz wejść na krótszy URL `/admin` zamiast `/admin/dashboard`

**Uwaga**: Admin panel był już w 99% gotowy - brakowało tylko redirecta

---

### 📊 Progress Summary

**Ogólny postęp**: 91% (39/43 tasków done)
- ✅ Done: 39 tasków
- ❌ Cancelled: 1 task
- ⏳ Pending: 3 taski (wszystkie dotyczą domain configuration)

**Remaining Tasks**:
1. **Task #72**: Configure oto-raport.pl in Vercel Dashboard ⏳ (dependencies: done)
2. **Task #73**: Configure oto-raport.pl in Google Cloud Console ⏳ (depends: 72)
3. **Task #74**: Update OAuth Authorized Domains ⏳ (depends: 72, 73)

**Następny task**: #72 - Configure oto-raport.pl Domain in Vercel Dashboard

---

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
