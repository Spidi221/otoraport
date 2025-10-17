# PRD: Inteligentny Parser CSV dla OTORAPORT
**Data**: 2025-10-15
**Wersja**: 1.0
**Priorytet**: KRYTYCZNY
**Autor**: Bartłomiej Chudzik & Claude Code

---

## 📋 Executive Summary

OTORAPORT musi obsługiwać **dowolne pliki CSV** od deweloperów nieruchomości i automatycznie mapować je na 58-kolumnowy format ministerialny (Schema 1.13). Obecny parser ma **krytyczne błędy** i **niepełne mapowanie synonimów**, co uniemożliwia poprawne przetwarzanie plików od INPRO, ATAL i innych deweloperów.

**Główny problem**: Deweloperzy używają różnych nazw kolumn (np. "Piętro nieruchomości" zamiast "Kondygnacja", "Powierzchnia" zamiast pełnej nazwy ministerialnej), a parser nie rozpoznaje wszystkich wariantów.

---

## 🎯 Cele Projektu

### Cel Biznesowy
Umożliwić deweloperom **jednorazowy upload dowolnego CSV** i automatyczne wygenerowanie pliku zgodnego z wymaganiami ministerstwa - bez manualnej edycji lub dopasowania formatu.

### Cele Techniczne
1. **100% rozpoznawanie pól ministerialnych** - system musi mapować wszystkie 58 kolumn
2. **Fuzzy matching z polskimi znakami** - poprawna obsługa ą, ć, ę, ł, ń, ó, ś, ź, ż
3. **Inteligentne wykrywanie synonimów** - rozpoznawanie różnych nazw tej samej kolumny
4. **Walidacja i feedback** - informowanie użytkownika o brakujących polach
5. **Manual data completion** - interfejs do ręcznego uzupełnienia brakujących danych

---

## 🔴 Problemy do Rozwiązania

### Problem #1: Bug w normalizeString (KRYTYCZNY)
**Lokalizacja**: `src/lib/smart-csv-parser.ts:1099`

**Błąd**:
```typescript
.replace(/[^\w\s]/g, '') // ❌ Usuwa polskie znaki: ę → e, ą → a, ć → c
```

**Impact**:
- "Piętro nieruchomości" → "Pitro nieruchomoci"
- Fuzzy matching nie działa dla pól z polskimi znakami
- ~30% kolumn nie jest rozpoznawanych

**Fix Required**:
```typescript
.replace(/[^a-z0-9\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/gi, '') // ✅ Zachowaj polskie znaki
```

---

### Problem #2: Brakujące synonimy dla formatów deweloperów

**Przykłady z prawdziwych plików**:

| Format | Kolumna w CSV | COLUMN_PATTERNS ma? | Status |
|--------|--------------|---------------------|--------|
| **INPRO** | "Piętro nieruchomości" | ❌ Tylko "piętro", "pietro" | BRAK |
| **INPRO** | "Cena za m2 nieruchomości" | ✅ TAK | OK |
| **INPRO** | "Powierzchnia" | ✅ TAK | OK |
| **INPRO** | "Rodzaj nieruchomości: lokal mieszkalny dom jednorodzinny" | ❌ Tylko "rodzaj" | BRAK |
| **ATAL** | "Cena m2 powierzchni użytkowej..." (skrócona) | ✅ TAK | OK |
| **ATAL** | "Data od Cena lokalu..." (bardzo skrócona) | ❌ BRAK | BRAK |
| **TAMBUD** | Pełne nazwy ministerialne (58 kolumn) | ✅ TAK | OK |

**Impact**:
- Pliki INPRO: ~15% kolumn nie rozpoznanych
- Pliki ATAL: ~10% kolumn nie rozpoznanych
- Missing fields nie są wykrywane przez validation

---

### Problem #3: Brak informacji o brakujących polach

**Obecny stan**:
- Validation API sprawdza tylko 20/58 pól
- DataQualityWidget nie pokazuje wszystkich brakujących pól developerskich
- User nie wie co musi uzupełnić ręcznie

**Required**:
- Walidacja wszystkich 58 pól ministerialnych
- Szczegółowa lista brakujących pól z sekcjami (Deweloper, Lokalizacja, Ceny, etc.)
- Priorytetyzacja: REQUIRED vs RECOMMENDED fields

---

### Problem #4: Brak interfejsu do ręcznego uzupełnienia

**Obecny stan**:
- BulkEditDialog pozwala edytować tylko 18 pól property
- Brak możliwości uzupełnienia pól developerskich (28 kolumn!)
- Brak guided workflow "krok po kroku"

**Required**:
- Wizard-style interface: "Uzupełnij brakujące pola (3/10 completed)"
- Sekcje: Dane dewelopera → Lokalizacja → Ceny → Dodatki
- Auto-save podczas wypełniania
- Walidacja formatów (NIP, REGON, kod pocztowy, etc.)

---

## 📊 Analiza Formatów CSV

### Format #1: TAMBUD (Ministerialny - 58 kolumn)
**Plik**: `backup dokumentów real estate app/przykładowe pliki/2025-10-09.csv`

**Cechy**:
- ✅ Pełne nazwy ministerialne (np. "Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]")
- ✅ Wszystkie 58 wymaganych kolumn
- ✅ Parser rozpoznaje 100%

**Przykładowe kolumny**:
```
Nazwa dewelopera, Forma prawna dewelopera, Nr KRS, Nr wpisu do CEiDG, Nr NIP, Nr REGON,
Nr telefonu, Adres poczty elektronicznej, Nr faxu, Adres strony internetowej dewelopera,
Województwo adresu siedziby/głównego miejsca wykonywania działalności...
```

---

### Format #2: ATAL (Lekko skrócony)
**Plik**: `backup dokumentów real estate app/przykładowe pliki/atal - Dane.csv`

**Cechy**:
- ⚠️ Skrócone nazwy kolumn (np. "Cena m2 powierzchni użytkowej..." zamiast pełnej nazwy)
- ⚠️ Brak spacji w niektórych miejscach ("m2" zamiast "m 2")
- ✅ Wszystkie dane są, tylko inaczej nazwane
- ⚠️ Parser rozpoznaje ~90%

**Przykładowe kolumny**:
```
Nazwa dewelopera, Forma prawna dewelopera, Nr KRS, Nr wpisu do CEiDG, Nr NIP, Nr REGON,
Cena m2 powierzchni użytkowej..., Data od której cena obowiązuje...
```

**Różnice vs ministerialny**:
- "Cena m2..." zamiast "Cena m 2..."
- Skrócone daty: "Data od której obowiązuje..." zamiast pełnej nazwy

---

### Format #3: INPRO (Własny format - najbardziej odmienny)
**Plik**: `backup dokumentów real estate app/przykładowe pliki/Ceny-ofertowe-mieszkan-dewelopera-inpro_s__a-2025-10-02.csv`

**Cechy**:
- ❌ Własne nazwy kolumn (np. "Powierzchnia", "Piętro nieruchomości", "Liczba pokoi")
- ❌ Brak wielu pól ministerialnych (muszą być uzupełnione ręcznie)
- ❌ Dodatkowe pola nie występujące w schemacie ministerialnym ("Id nieruchomości", "Nazwa inwestycji")
- ⚠️ Parser rozpoznaje tylko ~70%

**Przykładowe kolumny**:
```
Id nieruchomości, Nazwa dewelopera, Nr KRS, Nr wpisu do CEiDG, Nr NIP, Nr REGON,
Nazwa inwestycji, Adres strony internetowej inwestycji,
Powierzchnia, Piętro nieruchomości, Liczba pokoi, Stawka VAT (%),
Cena za m2 nieruchomości, Cena nieruchomości, Inne świadczenia pieniężne
```

**Różnice vs ministerialny**:
- "Powierzchnia" zamiast "Powierzchnia użytkowa lokalu mieszkalnego..."
- "Piętro nieruchomości" zamiast "Kondygnacja"
- "Liczba pokoi" zamiast pełnej nazwy ministerialnej (która nie istnieje w schemacie!)
- "Cena za m2 nieruchomości" zamiast "Cena m 2 powierzchni użytkowej..."

---

## 🎯 Wymagania Funkcjonalne

### FR-1: Inteligentny Parser CSV (Smart Column Mapping)

**User Story**:
> Jako deweloper chcę wgrać mój własny plik CSV (dowolnego formatu) i otrzymać automatyczne mapowanie na format ministerialny, żebym nie musiał manualnie dostosowywać nazw kolumn.

**Acceptance Criteria**:
1. Parser rozpoznaje **minimum 95% kolumn** z plików INPRO, ATAL, TAMBUD
2. Fuzzy matching działa z polskimi znakami (ą, ć, ę, ł, ń, ó, ś, ź, ż)
3. Threshold dla fuzzy matching: **0.6** (60% podobieństwa)
4. Parser zwraca:
   - `mappings`: Zmapowane kolumny (np. `{"price_per_m2": "Cena za m2 nieruchomości"}`)
   - `confidence`: Ogólny poziom pewności (0-100%)
   - `suggestions`: Alternatywne propozycje mapowania
   - `errors`: Lista niezmapowanych wymaganych pól

**Technical Requirements**:
- Fix `normalizeString()` - zachowanie polskich znaków
- Rozszerzenie `COLUMN_PATTERNS` o wszystkie warianty z INPRO i ATAL
- Levenshtein distance dla fuzzy matching
- Priority-based matching (exact > contains > fuzzy)

---

### FR-2: Rozszerzenie Synonimów (Extended Column Patterns)

**User Story**:
> Jako system chcę rozpoznawać wszystkie możliwe warianty nazw kolumn używane przez różnych deweloperów, żeby mapowanie było jak najbardziej dokładne.

**Acceptance Criteria**:
1. Każde pole ministerialne ma **minimum 5 synonimów**
2. Synonimy obejmują:
   - Pełną nazwę ministerialną (oficjalny schemat 1.13)
   - Skróconą nazwę ministerialną (ATAL)
   - Własną nazwę dewelopera (INPRO)
   - Angielskie nazwy (internacjonalizacja)
   - Polskie wersje bez znaków diakrytycznych
3. Priority order w `COLUMN_PATTERNS`:
   ```typescript
   [
     'INPRO exact match',     // Najwyższy priorytet - dokładne nazwy z INPRO
     'Ministry official',      // Pełne nazwy ministerialne
     'Ministry short',         // Skrócone nazwy (ATAL)
     'Generic Polish',         // Ogólne polskie nazwy
     'English equivalents',    // Angielskie odpowiedniki
     'Last resort fallbacks'   // Fallbacki (np. "nr", "cena")
   ]
   ```

**Przykłady do dodania**:
```typescript
kondygnacja: [
  // INPRO FORMAT (highest priority)
  'piętro nieruchomości', 'pietro nieruchomosci',
  // MINISTRY OFFICIAL
  'kondygnacja', 'numer kondygnacji',
  // GENERIC
  'piętro', 'pietro', 'floor', 'level', 'poziom'
],
property_type: [
  // INPRO FORMAT
  'rodzaj nieruchomości', 'rodzaj nieruchomosci',
  'rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny',
  // MINISTRY OFFICIAL
  'rodzaj nieruchomości: lokal mieszkalny dom jednorodzinny',
  // GENERIC
  'typ', 'typ lokalu', 'rodzaj', 'property_type', 'type'
]
```

---

### FR-3: Pełna Walidacja Ministerialnych Pól (58 Fields Validation)

**User Story**:
> Jako deweloper chcę wiedzieć które pola ministerialne brakują w moim CSV, żebym mógł je uzupełnić przed wysłaniem raportu do ministerstwa.

**Acceptance Criteria**:
1. Validation API sprawdza **wszystkie 58 pól** wymaganych przez ministerstwo
2. Pola podzielone na kategorie:
   - **REQUIRED (11 pól)**: wojewodztwo, powiat, gmina, miejscowosc, kod_pocztowy, price_per_m2, total_price, area, property_number, developer_name, nip
   - **RECOMMENDED (9 pól)**: ulica, numer_nieruchomosci, data_pierwszej_oferty, property_type, liczba_pokoi, kondygnacja, base_price, final_price, construction_year
   - **DEVELOPER DATA (28 pól)**: forma_prawna, nr_krs/nr_ceidg, regon, telefon, email, fax, www, siedziby (8 pól), punkt sprzedaży (8 pól), sposob_kontaktu, dodatkowe_lokalizacje
   - **OPTIONAL (10 pól)**: parking, storage, necessary_rights, prospectus, etc.
3. Response format:
   ```json
   {
     "summary": {
       "totalProperties": 100,
       "complianceScore": 78,
       "propertiesWithIssues": 22
     },
     "missingFieldsSummary": {
       "wojewodztwo": {"count": 0, "percentage": 0, "severity": "critical"},
       "forma_prawna": {"count": 100, "percentage": 100, "severity": "critical"},
       "telefon": {"count": 100, "percentage": 100, "severity": "info"}
     },
     "sections": {
       "developer": {"completed": 5, "total": 28, "percentage": 18},
       "location": {"completed": 7, "total": 8, "percentage": 88},
       "pricing": {"completed": 3, "total": 6, "percentage": 50}
     }
   }
   ```

**Technical Requirements**:
- Rozszerzenie `REQUIRED_FIELDS` i `RECOMMENDED_FIELDS` w `ministry-validation.ts`
- Dodanie `DEVELOPER_FIELDS` z wszystkimi 28 polami developerskimi
- Query do `developers` table dla pól developerskich (nie tylko `properties`)
- Sekcje: developer_info, location, pricing, technical_details

---

### FR-4: Data Quality Widget Enhancement

**User Story**:
> Jako deweloper chcę widzieć przejrzysty dashboard pokazujący kompletność moich danych ministerialnych podzielonych na kategorie, żebym wiedział które sekcje wymagają uzupełnienia.

**Acceptance Criteria**:
1. Widget pokazuje 4 sekcje z progress bars:
   - **Dane dewelopera** (28 pól): 18% complete ⚠️
   - **Lokalizacja nieruchomości** (8 pól): 88% complete ✅
   - **Dane cenowe** (6 pól): 50% complete ⚠️
   - **Dane techniczne** (16 pól): 25% complete ⚠️
2. Każda sekcja expandable - pokazuje listę brakujących pól
3. Kliknięcie w pole otwiera BulkEditDialog z pre-selected field
4. Kolory:
   - ✅ Green (90-100%): Kompletne
   - ⚠️ Yellow (50-89%): Wymaga uwagi
   - ❌ Red (0-49%): Krytyczne braki
5. Overall compliance score na górze (duży procent)

**Mockup**:
```
┌─────────────────────────────────────────┐
│   📊 Zgodność z Ministerstwa: 68%      │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 👔 Dane dewelopera          18% ❌      │
│    ▓▓▓░░░░░░░░░░░░░░░░░                │
│    Brakuje: 23/28 pól                   │
│    > Forma prawna                       │
│    > Nr KRS / CEiDG                     │
│    > REGON                              │
│    > Telefon kontaktowy                 │
│    ... (pokazuj 5, reszta w "Rozwiń")  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📍 Lokalizacja              88% ✅      │
│    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░                │
│    Brakuje: 1/8 pól                     │
│    > Numer nieruchomości                │
└─────────────────────────────────────────┘
```

---

### FR-5: Manual Data Completion Wizard

**User Story**:
> Jako deweloper chcę uzupełnić brakujące pola ministerialne w prostym wizard-style interfejsie, żebym nie musiał szukać każdego pola osobno w różnych miejscach.

**Acceptance Criteria**:
1. Wizard z 4 krokami:
   - **Krok 1: Dane dewelopera** (28 pól)
   - **Krok 2: Lokalizacja inwestycji** (8 pól)
   - **Krok 3: Ceny i daty** (6 pól)
   - **Krok 4: Dane dodatkowe** (16 pól)
2. Każdy krok:
   - Pokazuje tylko **brakujące pola** (nie wszystkie)
   - Auto-save co 3 sekundy (debounced)
   - Walidacja formatów w czasie rzeczywistym (NIP, REGON, kod pocztowy)
   - Progress bar: "Krok 2/4 - Lokalizacja (7/8 wypełnionych)"
3. Po zakończeniu wizard:
   - Automatyczne re-run validation API
   - Pokazanie nowego compliance score
   - Opcja: "Generuj CSV ministerialny" (jeśli 100% complete)
4. Możliwość zapisania "draft" i powrotu później

**Technical Requirements**:
- Multi-step form z React Hook Form
- Validation schema z Zod
- Auto-save do `developers` table (dla pól developerskich)
- Auto-save do `manual_overrides` JSONB (dla property-specific fields)
- API endpoint: `PATCH /api/developers/update` dla pól developerskich

---

### FR-6: Missing Fields Feedback na Upload

**User Story**:
> Jako deweloper chcę natychmiast po uploadzie CSV wiedzieć które pola są niekompletne, żebym mógł od razu uzupełnić brakujące dane.

**Acceptance Criteria**:
1. Po uploadzie CSV wyświetl modal:
   ```
   ✅ CSV wgrany pomyślnie!

   📊 Zmapowano 42/58 pól ministerialnych (72%)

   ⚠️ Brakuje 16 pól wymaganych przez ministerstwo:
   - Forma prawna dewelopera
   - Nr KRS lub CEiDG
   - REGON
   ... (pokaż top 5, reszta w "Zobacz wszystkie")

   [Uzupełnij teraz] [Zrobię to później]
   ```
2. Kliknięcie "Uzupełnij teraz" otwiera Manual Data Completion Wizard
3. Kliknięcie "Zrobię to później" zamyka modal, ale pokazuje notification badge na DataQualityWidget
4. Modal nie blokuje - user może kontynuować bez uzupełnienia

---

## 🔧 Wymagania Techniczne

### Tech Stack
- **Parser**: TypeScript with fuzzy string matching (Levenshtein distance)
- **Validation**: Zod schemas for all 58 ministry fields
- **Storage**:
  - `developers` table - developer fields (28 kolumn)
  - `properties` table - property fields (podstawowe)
  - `raw_csv_data` table - raw CSV data (source of truth)
  - `manual_overrides` JSONB - user-edited values
- **UI**: React + TailwindCSS + shadcn/ui
- **Forms**: React Hook Form + Zod validation

### API Endpoints Required
```typescript
GET  /api/validation/missing-fields?developerId={id}  // Existing - expand to 58 fields
POST /api/properties/upload                           // Existing - enhance feedback
PATCH /api/developers/update                          // NEW - update developer fields
GET  /api/developers/{id}/completion-status           // NEW - wizard progress tracking
```

### Database Schema Changes
**developers table** - add missing ministry fields:
```sql
ALTER TABLE developers ADD COLUMN IF NOT EXISTS forma_prawna VARCHAR(100);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS nr_krs VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS nr_ceidg VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS regon VARCHAR(14);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS telefon VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS fax VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS www VARCHAR(255);

-- Siedziba (8 pól)
ALTER TABLE developers ADD COLUMN IF NOT EXISTS wojewodztwo_siedziby VARCHAR(50);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS powiat_siedziby VARCHAR(100);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS gmina_siedziby VARCHAR(100);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS miejscowosc_siedziby VARCHAR(100);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS ulica_siedziby VARCHAR(200);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS nr_budynku_siedziby VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS nr_lokalu_siedziby VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS kod_pocztowy_siedziby VARCHAR(6);

-- Punkt sprzedaży (8 pól)
ALTER TABLE developers ADD COLUMN IF NOT EXISTS wojewodztwo_punktu_sprzedazy VARCHAR(50);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS powiat_punktu_sprzedazy VARCHAR(100);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS gmina_punktu_sprzedazy VARCHAR(100);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS miejscowosc_punktu_sprzedazy VARCHAR(100);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS ulica_punktu_sprzedazy VARCHAR(200);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS nr_budynku_punktu_sprzedazy VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS nr_lokalu_punktu_sprzedazy VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS kod_pocztowy_punktu_sprzedazy VARCHAR(6);

-- Pozostałe
ALTER TABLE developers ADD COLUMN IF NOT EXISTS dodatkowe_lokalizacje_sprzedazy TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS sposob_kontaktu TEXT;
```

### Performance Requirements
- Parser: < 2s dla pliku 1000 wierszy
- Validation API: < 3s dla 1000 properties
- Wizard auto-save: debounced 3s
- CSV generation: < 5s dla 1000 properties

---

## 📈 Metryki Sukcesu

### Quantitative Metrics
1. **Parser Accuracy**: ≥ 95% kolumn rozpoznanych (INPRO, ATAL, TAMBUD)
2. **Validation Coverage**: 100% (wszystkie 58 pól ministerialnych)
3. **User Completion Rate**: ≥ 70% userów uzupełnia brakujące pola po uploadzie
4. **Time to Complete**: ≤ 10 minut (od uploadu CSV do 100% compliance)
5. **Error Rate**: ≤ 5% błędnych mapowań kolumn

### Qualitative Metrics
1. User feedback: "Parser automatically recognized my custom CSV format"
2. Support tickets: -50% pytań o "jak dostosować CSV do formatu ministerialnego"
3. Ministry compliance: 100% zgodnośc eksportowanych CSV z Schema 1.13

---

## 🚀 Etapy Implementacji

### Etap 1: Parser Fixes & Enhancements (HIGH PRIORITY)
**Zadania**:
1. Fix `normalizeString()` - zachowanie polskich znaków
2. Rozszerzenie `COLUMN_PATTERNS` o synonimy INPRO i ATAL
3. Testy parsera na wszystkich 3 plikach przykładowych
4. Confidence scoring improvements

**Deliverables**:
- Parser rozpoznaje ≥ 95% kolumn z INPRO, ATAL, TAMBUD
- Unit testy dla fuzzy matching z polskimi znakami
- Integration testy na prawdziwych plikach CSV

**Timeline**: 2 dni

---

### Etap 2: Full 58-Field Validation (HIGH PRIORITY)
**Zadania**:
1. Rozszerzenie `REQUIRED_FIELDS` i `RECOMMENDED_FIELDS` w `ministry-validation.ts`
2. Dodanie `DEVELOPER_FIELDS` (28 kolumn)
3. Update Validation API - query do `developers` table
4. Sekcje walidacji: developer, location, pricing, technical

**Deliverables**:
- Validation API zwraca wszystkie 58 pól z kategoryzacją
- Response zawiera sekcje completion percentages
- API endpoint dokumentacja (Swagger/OpenAPI)

**Timeline**: 2 dni

---

### Etap 3: Data Quality Widget Enhancement (MEDIUM PRIORITY)
**Zadania**:
1. Redesign widget z 4 sekcjami + progress bars
2. Expandable sections z listami brakujących pól
3. Kolory: green/yellow/red według completion %
4. Link do BulkEditDialog z pre-selected field

**Deliverables**:
- Nowy UI component `EnhancedDataQualityWidget`
- Storybook stories dla różnych stanów (0%, 50%, 100%)
- Responsive design (mobile + desktop)

**Timeline**: 2 dni

---

### Etap 4: Manual Data Completion Wizard (MEDIUM PRIORITY)
**Zadania**:
1. Multi-step form z React Hook Form + Zod
2. Auto-save (debounced 3s) do `developers` i `manual_overrides`
3. Real-time validation (NIP checksum, REGON format, postal code)
4. API endpoint `PATCH /api/developers/update`
5. Progress tracking + draft save

**Deliverables**:
- Wizard component z 4 krokami
- API endpoint dla developer fields update
- Validation schemas (Zod) dla wszystkich 58 pól
- E2E test: upload CSV → complete wizard → 100% compliance

**Timeline**: 3 dni

---

### Etap 5: Upload Feedback Modal (LOW PRIORITY)
**Zadania**:
1. Modal po uploadzie z mapowania summary
2. "Uzupełnij teraz" button → otwiera Wizard
3. "Zrobię to później" → notification badge
4. Non-blocking modal (można zamknąć i kontynuować)

**Deliverables**:
- Modal component `UploadFeedbackModal`
- Integration z upload endpoint
- UX testing z 5 userami

**Timeline**: 1 dzień

---

### Etap 6: Testing & Documentation (LOW PRIORITY)
**Zadania**:
1. E2E testy dla 3 formatów CSV (TAMBUD, ATAL, INPRO)
2. Performance testing (1000+ wierszy CSV)
3. Dokumentacja API (Swagger)
4. User guide: "Jak przygotować CSV dla OTORAPORT"

**Deliverables**:
- Test coverage ≥ 80%
- API documentation
- User-facing docs (Notion/GitBook)
- Performance report

**Timeline**: 2 dni

---

## 📦 Deliverables Summary

### Code Deliverables
1. ✅ Fixed `smart-csv-parser.ts` (normalizeString + extended COLUMN_PATTERNS)
2. ✅ Enhanced `ministry-validation.ts` (58 fields validation)
3. ✅ Updated Validation API (`/api/validation/missing-fields`)
4. ✅ New API endpoint (`/api/developers/update`)
5. ✅ `EnhancedDataQualityWidget` component
6. ✅ `ManualDataCompletionWizard` component
7. ✅ `UploadFeedbackModal` component
8. ✅ Database migrations (developers table schema)
9. ✅ Zod validation schemas (all 58 fields)
10. ✅ E2E tests + unit tests

### Documentation Deliverables
1. API documentation (Swagger/OpenAPI)
2. User guide: "Supported CSV formats"
3. Developer guide: "How to extend COLUMN_PATTERNS"
4. Performance testing report
5. Test coverage report

---

## ⚠️ Risks & Mitigations

### Risk #1: False Positive Mappings (Medium Risk)
**Description**: Fuzzy matching może błędnie zmapować kolumnę (np. "Nr" może oznaczać "Nr lokalu" lub "Nr KRS")

**Mitigation**:
- Priority-based matching (exact match ma priorytet)
- Confidence threshold = 0.6 (odrzucaj match < 60%)
- User review screen: "Sprawdź automatyczne mapowania"
- Manual override możliwość

---

### Risk #2: Performance na Dużych Plikach (Low Risk)
**Description**: Parser może być wolny dla CSV z 5000+ wierszy

**Mitigation**:
- Streaming parser (nie ładuj całego pliku do pamięci)
- Web Worker dla parsingu w background
- Progress bar podczas uploadu
- Batch processing (po 500 wierszy)

---

### Risk #3: Niepełne Dane od Deweloperów (High Risk)
**Description**: Deweloper może nie mieć wszystkich 58 pól i nie chcieć ich uzupełniać

**Mitigation**:
- Wyraźna komunikacja: "Wymagane minimum 11 pól + zalecane 9"
- Możliwość wygenerowania CSV z brakującymi polami (ministerstwo może odrzucić)
- Warning przed exportem: "Brakuje 15 pól - raport może być niekompletny"
- Opcja: "Wygeneruj raport mimo braków" (na odpowiedzialność usera)

---

## 📚 References

### Dokumentacja Ministerialna
- Schema 1.13 (58 kolumn) - Instrukcja XML v1.0.5 (29.09.2025)
- Przewodnik automatycznego zasilania danych XML v1.02

### Przykładowe Pliki CSV
1. `backup dokumentów real estate app/przykładowe pliki/2025-10-09.csv` (TAMBUD - ministerialny)
2. `backup dokumentów real estate app/przykładowe pliki/atal - Dane.csv` (ATAL - skrócony)
3. `backup dokumentów real estate app/przykładowe pliki/Ceny-ofertowe-mieszkan-dewelopera-inpro_s__a-2025-10-02.csv` (INPRO - custom)

### Existing Code
- `src/lib/smart-csv-parser.ts` (parser + COLUMN_PATTERNS)
- `src/lib/ministry-validation.ts` (validation logic)
- `src/app/api/validation/missing-fields/route.ts` (Validation API)
- `src/types/database.ts` (Supabase types)

---

## ✅ Definition of Done

**Parser jest gotowy gdy**:
1. ✅ Rozpoznaje ≥ 95% kolumn z INPRO, ATAL, TAMBUD
2. ✅ Fuzzy matching działa z polskimi znakami
3. ✅ Unit testy przechodzą (coverage ≥ 80%)
4. ✅ Integration testy na prawdziwych plikach CSV pass

**Validation jest gotowa gdy**:
1. ✅ Sprawdza wszystkie 58 pól ministerialnych
2. ✅ Response podzielony na sekcje (developer, location, pricing, technical)
3. ✅ API dokumentacja gotowa (Swagger)
4. ✅ Performance < 3s dla 1000 properties

**Wizard jest gotowy gdy**:
1. ✅ 4 kroki działają (developer → location → pricing → technical)
2. ✅ Auto-save co 3s (debounced)
3. ✅ Validation w czasie rzeczywistym (NIP, REGON, postal code)
4. ✅ E2E test: upload → wizard → 100% compliance pass

**Widget jest gotowy gdy**:
1. ✅ 4 sekcje z progress bars
2. ✅ Expandable sections
3. ✅ Kolory: green/yellow/red
4. ✅ Responsive design (mobile + desktop)

---

**Całość projektu jest gotowa gdy**:
✅ Wszystkie 6 etapów ukończone
✅ E2E testy przechodzą
✅ Performance requirements spełnione
✅ Dokumentacja zakończona
✅ User acceptance testing (5 userów) positive feedback
