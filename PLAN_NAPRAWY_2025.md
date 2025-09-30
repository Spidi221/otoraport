# 🚀 OTORAPORT - Plan Naprawczy & Rozwoju

**Data utworzenia:** 29.09.2025
**Ostatnia aktualizacja:** 30.09.2025 15:42
**Health Score:** 5.5/10 → Target: 8.5/10
**Status:** 🔴 CRITICAL - CSV parser błędny, dashboard nie działa

---

## 📋 **WYMAGANIA MINISTERSTWA - Kluczowe Punkty**

**Data przeczytania dokumentacji:** 30.09.2025 15:30
**Źródło:** `/backup dokumentów real estate app/` - oficjalne dokumenty ministerstwa

### 🏛️ **XML Harvester Schema (urn:otwarte-dane:harvester:1.13)**

**UWAGA KRYTYCZNA:** XML dla dane.gov.pl to **METADATA o zbiorze danych**, NIE dane o nieruchomościach!

**Wymagana struktura:**
```xml
<?xml version='1.0' encoding='UTF-8'?>
<ns2:datasets xmlns:ns2="urn:otwarte-dane:harvester:1.13">
  <dataset status="published">  <!-- MUSI być "published" -->
    <extIdent>36_znakowy_id_dewelopera_abcde</extIdent>
    <title>
      <polish>Ceny ofertowe mieszkań dewelopera {nazwa} w {2025} r.</polish>
      <english>Offer prices of apartments...</english>
    </title>
    <updateFrequency>daily</updateFrequency>  <!-- MUSI być "daily" -->
    <categories><category>ECON</category></categories>  <!-- Economy -->
    <resources>
      <resource status="published">
        <url>https://strona-dewelopera.com/Ceny-YYYY-MM-DD.csv</url>
        <availability>local</availability>  <!-- Plik pobierany do repozytorium -->
        <dataDate>YYYY-MM-DD</dataDate>  <!-- ISO-8601 format -->
        <specialSigns><specialSign>X</specialSign></specialSigns>
        <hasDynamicData>false</hasDynamicData>  <!-- MUSI być false -->
        <hasHighValueData>true</hasHighValueData>  <!-- MUSI być true -->
        <hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>
        <hasResearchData>false</hasResearchData>
        <containsProtectedData>false</containsProtectedData>
      </resource>
    </resources>
  </dataset>
</ns2:datasets>
```

### 📊 **CSV Schema - 59 Kolumn**

**KRYTYCZNE:** Nazwy kolumn są DŁUGIE, po polsku i specyficzne!

**Przykłady wymaganych nazw kolumn:**
- ❌ BŁĄD: `"area"`, `"powierzchnia"`, `"metraz"`
- ✅ POPRAWNIE: `"Powierzchnia użytkowa lokalu mieszkalnego lub powierzchnia domu jednorodzinnego [m2]"`

**Pełna lista kluczowych kolumn:**
```
"Nr lokalu lub domu jednorodzinnego nadany przez dewelopera"
"Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]"
"Cena lokalu mieszkalnego lub domu jednorodzinnego [zł]"
"Powierzchnia użytkowa lokalu mieszkalnego lub powierzchnia domu jednorodzinnego [m2]"
"Województwo - Lokalizacja Inwestycji mieszkaniowej"
"Liczba pokoi w lokalu mieszkalnym lub domu jednorodzinnym"
"Nr przypisanego miejsca parkingowego / garażu [1]"
"Cena przypisanego miejsca parkingowego / garażu [1]"
```

### 🔤 **Special Sign "X"**

**Znaczenie:** "X" w CSV = "niemożliwe lub bezsensowne do wypełnienia"

**Obsługa w kodzie:**
```typescript
if (typeof value === 'string' && value.trim().toLowerCase() === 'x') {
  return 'SOLD' // lub null, zależnie od kontekstu
}
```

### ✅ **Compliance Checklist dla Kodu**

- [x] XML używa namespace `urn:otwarte-dane:harvester:1.13`
- [x] `status="published"` na dataset i resource
- [x] `updateFrequency="daily"`
- [x] `categories` zawiera `ECON`
- [x] `hasDynamicData=false`, `hasHighValueData=true`
- [x] Special sign "X" obsłużony jako SOLD/N/A
- [ ] CSV parser mapuje na POPRAWNE kolumny (❌ **OBECNIE BŁĘDNE** - P0 CRITICAL)

---

## 🔴 **FAZA 0: CRITICAL EMERGENCY FIXES (Dzień 1 - CURRENT)**

### ✅ 0.1 CSV Parser - Duplikaty (COMPLETED)
**Status:** ✅ NAPRAWIONE 29.09.2025
**Problem:** Linia 835 sprawdzała `.length` na obiekcie + duplikaty przy re-upload
**Fix:** `Object.keys(property.raw_data).length > 0` + DELETE przed INSERT
**Impact:** 4/21 → 21/21 rekordów, brak duplikatów

### ⚠️ 0.2 MD Generator - Ekstrakcja Raw_Data (PARTIALLY FIXED)
**Status:** ⚠️ PARTIALLY FIXED 30.09.2025 15:00
**Problem początkowy:** `data.md` pokazywał 21 lokali z cenami = 0 zł

**✅ CO ZOSTAŁO NAPRAWIONE:**
1. Dodano `extractFromRawData()` function w `/src/lib/md-generator.ts`
2. Dodano `MINISTRY_COLUMNS` z pełnymi nazwami kolumn ministerstwa
3. Dodano `getRawField()` helper z fallbackiem do nested raw_data
4. Dodano obsługę special sign "X" (konwersja na SOLD)
5. Public MD endpoint fix: import + SELECT raw_data
6. Regenerate files API fix: SELECT raw_data explicitly

**❌ POZOSTAŁY PROBLEM:**
MD nadal pokazuje **0 nieruchomości** zamiast 14-28. Główna przyczyna: **CSV parser mapuje kolumny błędnie** (patrz 0.5)

**Priorytet:** P0 CRITICAL
**Czas:** 1-2h (częściowo wykonane)

### 🔴 0.5 CSV Parser - Błędne Mapowanie Kolumn **← ABSOLUTNY PRIORYTET**
**Status:** ❌ CRITICAL BUG IDENTIFIED 30.09.2025 15:40
**Priorytet:** **P0 CRITICAL** - To jest **główna przyczyna** wszystkich problemów z danymi!

**Problem:**
Upload API (`/src/app/api/upload/route.ts`) mapuje kolumny CSV na **NIEPOPRAWNE** pola ministerstwa.

**Dowód błędnego mapowania:**
```javascript
// ❌ OBECNIE W KODZIE (BŁĘDNE):
const FIELD_MAPPING = {
  "area": "Powiat adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera"
  // ^ To jest POWIAT (county), nie powierzchnia (area)!
}

// ✅ POWINNO BYĆ (zgodnie z dokumentacją ministerstwa):
const FIELD_MAPPING = {
  "area": "Powierzchnia użytkowa lokalu mieszkalnego lub powierzchnia domu jednorodzinnego [m2]",
  "property_number": "Nr lokalu lub domu jednorodzinnego nadany przez dewelopera",
  "price_per_m2": "Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]",
  "total_price": "Cena lokalu mieszkalnego lub domu jednorodzinnego [zł]",
  "rooms": "Liczba pokoi w lokalu mieszkalnym lub domu jednorodzinnym",
  "parking_nr": "Nr przypisanego miejsca parkingowego / garażu [1]",
  "parking_price": "Cena przypisanego miejsca parkingowego / garażu [1]"
}
```

**Konsekwencja:**
1. CSV parser zapisuje do `raw_data.area` wartość `"wejherowski"` (nazwa powiatu)
2. MD generator: `parseFloat("wejherowski")` → `NaN` → `0`
3. Filtr: `validProperties.filter(p => p.area > 0)` → usuwa WSZYSTKO
4. **Wynik:** MD pokazuje 0 nieruchomości mimo 21 w bazie

**Impact:**
- ❌ MD generator pokazuje 0 properties (powinno być 14-28)
- ❌ Properties table na dashboardzie pusty
- ❌ XML generator prawdopodobnie też niepoprawny
- ❌ Dane ministerstwa NIEZGODNE z przepisami

**Rozwiązanie:**
1. Znaleźć `FIELD_MAPPING` w `/src/app/api/upload/route.ts`
2. Zamienić na **PEŁNE nazwy kolumn z dokumentacji ministerstwa**
3. Użyć `MINISTRY_COLUMNS` z `/src/lib/md-generator.ts` jako źródła prawdy
4. Cleanup bazy + re-upload CSV

**Priorytet:** **P0 CRITICAL**
**Czas:** 30min-1h
**Impact:** Całkowita naprawa generowania danych ministerstwa

### 🔴 0.3 Dashboard - Uploaded Files Component
**Status:** ❌ BROKEN
**Problem:** Dashboard pokazuje "Brak przesłanych plików" mimo że API zwraca dane (200 OK)

**Diagnosis:** API `/api/files/list` działa, problem w komponencie frontendowym.

**Rozwiązanie:**
```bash
grep -r "Brak przesłanych plików" src/
grep -r "Uploadowane Pliki" src/
# Dodaj console.log(files) w komponencie
# Sprawdź mapping/transformation logic
```

**Priorytet:** P0 CRITICAL
**Czas:** 30min-1h

### 🔴 0.4 Dashboard - Properties Table
**Status:** ❌ BROKEN
**Problem:** "Nie udało się pobrać danych" mimo że API zwraca 21 properties (200 OK)

**Diagnosis:** API działa, problem w parsowaniu response lub typach danych.

**Priorytet:** P0 CRITICAL
**Czas:** 1h

### 🔐 0.6 Logout Button
**File:** `src/components/dashboard/header.tsx:229`
**Problem:** Undefined `supabase` variable

**Fix:**
```typescript
import { createClient } from '@/lib/supabase/client'

onClick={async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/auth/signin'
}}
```

**Priorytet:** P0
**Estimate:** 15min

### 🔧 0.7 Analytics Page Error
**File:** `src/app/analytics/page.tsx`
**Error:** `supabaseAdmin is not defined`

**Fix:**
```typescript
import { createAdminClient } from '@/lib/supabase/server'
```

**Priorytet:** P0
**Estimate:** 15min

---

## 🔒 **FAZA 1: SECURITY CRITICAL (30min)**

### 🔴 1.1 Enable RLS na `developers` table
**Status:** ❌ DISABLED (Supabase alerts pokazują ERROR)

**Rozwiązanie:**
```sql
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
```

**Priorytet:** P0 SECURITY
**Czas:** 5min

### 🔴 1.2 Enable RLS na `uploaded_files` table
**Status:** ❌ NO RLS AT ALL

**Rozwiązanie:**
```sql
-- Enable RLS
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can access own uploaded files"
ON uploaded_files FOR ALL
USING (developer_id IN (
  SELECT id FROM developers WHERE user_id = auth.uid()
));

-- Service role bypass
CREATE POLICY "Service role full access to uploaded_files"
ON uploaded_files FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

**Priorytet:** P0 SECURITY
**Czas:** 10min

### 1.3 Move Admin Check Server-Side
**Problem:** `ADMIN_EMAILS` exposed in client code

**Solution:**
```typescript
// middleware.ts
if (pathname.startsWith('/admin')) {
  const user = await getUser()
  const isAdmin = ADMIN_EMAILS.includes(user.email)
  if (!isAdmin) return NextResponse.redirect('/dashboard')
}
```

**Priorytet:** P1
**Estimate:** 2h

### 1.4 Rate Limiting on Upload
**Package:** `@upstash/ratelimit`

**Implementation:**
```typescript
const ratelimit = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, '1 m')
})

const { success } = await ratelimit.limit(user.id)
if (!success) return NextResponse.json({ error: 'Too many requests' }, 429)
```

**Priorytet:** P2
**Estimate:** 2-3h

### 1.5 Input Validation & Sanitization
**Package:** `zod`

**Example:**
```typescript
import { z } from 'zod'

const PropertySchema = z.object({
  property_number: z.string().max(50),
  area: z.number().positive().max(10000),
  price_per_m2: z.number().positive()
})

const validated = PropertySchema.parse(property)
```

**Priorytet:** P2
**Estimate:** 4-5h

---

## 🏗️ **FAZA 2: CORE FEATURES (Tydzień 1) - HIGH**

### 2.1 File Management Interface
**New Component:** `src/components/dashboard/file-manager.tsx`

**Features:**
- Lista uploadowanych plików (z `uploaded_files` table)
- Status procesowania (success/error/pending)
- Akcje: Download, Re-process, Delete
- Filtrowanie po dacie i statusie

**New API Routes:**
- `GET /api/uploads` - lista plików
- `DELETE /api/uploads/[id]` - usuń plik + properties
- `POST /api/uploads/[id]/reprocess` - przetwórz ponownie

**Priorytet:** P1
**Estimate:** 6-8h

### 2.2 Notification System
**Page:** `src/app/dashboard/notifications/page.tsx` (CREATE)

**Database:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'success'|'error'|'warning'|'info'
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priorytet:** P1
**Estimate:** 4-6h

### 2.3 Error Handling & Toast System
**Package:** `npm install react-hot-toast`

**Implementation:**
```typescript
import toast from 'react-hot-toast'

try {
  await uploadFile(file)
  toast.success('Plik przesłany! 15 nieruchomości dodanych')
} catch (error) {
  toast.error('Błąd w wierszu 12: brak kolumny "cena"', {
    action: {
      label: 'Zobacz raport',
      onClick: () => downloadErrorReport()
    }
  })
}
```

**Priorytet:** P1
**Estimate:** 3-4h

### 2.4 Auto-Refresh After Upload
**Solution:** Use SWR/React Query:
```typescript
import useSWR from 'swr'

const { data, mutate } = useSWR('/api/properties', fetcher)

onUploadSuccess={() => {
  mutate() // Revalidate data
  toast.success('Dane odświeżone!')
}}
```

**Priorytet:** P1
**Estimate:** 2h

---

## 📈 **FAZA 3: UX IMPROVEMENTS (Tydzień 2) - MEDIUM**

### 3.1 Empty States
**Design Pattern:**
```typescript
<div className="flex flex-col items-center py-12">
  <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
    <Upload className="w-10 h-10 text-blue-600" />
  </div>
  <h3 className="text-lg font-semibold mb-2">
    Rozpocznij od przesłania cennika
  </h3>
  <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
    Przeciągnij plik CSV lub Excel...
  </p>
  <Button>Wybierz plik</Button>
</div>
```

**Priorytet:** P2
**Estimate:** 2-3h

### 3.2 Loading States & Skeletons
**Package:** shadcn/ui Skeleton component

**Priorytet:** P2
**Estimate:** 2h

### 3.3 Mobile Responsive Table
**Solution:** Card view dla <768px

**Priorytet:** P2
**Estimate:** 3-4h

### 3.4 Breadcrumb Navigation
**Component:** `src/components/ui/breadcrumbs.tsx` (CREATE)

**Priorytet:** P2
**Estimate:** 2h

---

## 📊 **FAZA 4: DATA VISUALIZATION (Tydzień 2-3) - MEDIUM**

### 4.1 Real Charts Implementation
**Package:** `npm install recharts`

**Charts to Build:**
1. Price Trend Chart - cena/m² over time
2. Property Distribution - pie chart by type
3. Status Overview - available/reserved/sold

**Priorytet:** P2
**Estimate:** 6-8h

### 4.2 Interactive Data Table
**Package:** `@tanstack/react-table`

**Features:**
- Sorting (click column headers)
- Filtering (status, type, price range)
- Search (property number, address)
- Export to CSV/Excel

**Priorytet:** P2
**Estimate:** 8-10h

---

## ⚡ **FAZA 5: PERFORMANCE (Tydzień 3) - OPTIMIZATION**

### 5.1 API Pagination
**Implementation:**
```typescript
const page = parseInt(searchParams.get('page') || '1')
const limit = 50

const { data, error, count } = await supabase
  .from('properties')
  .select('*', { count: 'exact' })
  .range((page - 1) * limit, page * limit - 1)

return {
  data,
  pagination: {
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit)
  }
}
```

**Priorytet:** P1 (dla 100+ properties)
**Estimate:** 3-4h

### 5.2 Convert to Server Components
**Before:**
```tsx
'use client'
export default function Dashboard() {
  const [data, setData] = useState()
  useEffect(() => {
    fetch('/api/properties').then(...)
  }, [])
}
```

**After:**
```tsx
export default async function Dashboard() {
  const properties = await getProperties()
  return <PropertiesTable properties={properties} />
}
```

**Priorytet:** P2
**Estimate:** 4-6h

### 5.3 Caching Public XML Endpoints
**File:** `src/app/api/public/[clientId]/data.xml/route.ts`

**Add:**
```typescript
export const revalidate = 3600 // 1 hour cache
```

**Priorytet:** P1
**Estimate:** 15min

---

## 🧹 **FAZA 6: TECHNICAL DEBT (Tydzień 4) - CLEANUP**

### 6.1 Delete Unused API Routes
**Target:** Reduce from 91 to ~40 routes

**Routes to Delete:**
- All `test-*` routes
- All `demo-*` routes
- All `mock-*` routes
- `debug-*` endpoints

**Priorytet:** P2
**Estimate:** 2-3h

### 6.2 Consolidate Auth Systems
**Delete:**
- `src/lib/supabase-single.ts`
- `src/providers/supabase-provider.tsx.DISABLED`

**Priorytet:** P2
**Estimate:** 3-4h

### 6.3 TypeScript Types Generation
**Command:**
```bash
npx supabase gen types typescript --project-id maichqozswcomegcsaqg > src/types/supabase.ts
```

**Priorytet:** P2
**Estimate:** 1h

### 6.4 Fix Duplicate Indexes
**Problem:** Supabase pokazuje duplicate indexes

**Rozwiązanie:**
```sql
DROP INDEX IF EXISTS developers_client_id_idx;
DROP INDEX IF EXISTS developers_email_idx;
DROP INDEX IF EXISTS developers_user_id_idx;
```

**Priorytet:** P2
**Czas:** 5min

### 6.5 Optimize RLS Policies
**Problem:** `projects` table ma 3 overlapping policies

**Rozwiązanie:**
```sql
DROP POLICY "Service role can do everything on projects" ON projects;
```

**Priorytet:** P2
**Czas:** 15min

---

## 🚀 **EXECUTION ORDER - ZAKTUALIZOWANY (30.09.2025 15:42)**

### ✅ COMPLETED (29-30.09.2025):
1. ✅ CSV parser bug fix - duplikaty
2. ✅ Przeczytanie dokumentacji ministerstwa
3. ✅ MD Generator data extraction logic
4. ✅ Public MD endpoint fix
5. ✅ Regenerate files API fix
6. ✅ Root cause identified - CSV parser mapping

### 🔴 IMMEDIATE NEXT (Hour 1 - CRITICAL):
1. **0.5** CSV Parser fix (30min-1h) **← ABSOLUTNY PRIORYTET**
   - Fix: `FIELD_MAPPING` w `/src/app/api/upload/route.ts`
   - Test: Re-upload CSV, verify `raw_data.area` is numeric
2. **Database cleanup + re-upload** (10min)
3. **Verify MD generator** (5min) - Should show 14-28 properties

### Hour 2 (DASHBOARD + SECURITY):
4. **0.3** Dashboard files component (30min)
5. **0.4** Dashboard properties table (30min)
6. **0.6** Logout button (15min)
7. **0.7** Analytics page error (15min)
8. **1.1** Enable RLS developers (5min)
9. **1.2** Enable RLS uploaded_files (10min)

### Week 1 (CORE FEATURES):
- [ ] File management UI (6-8h)
- [ ] Notification system (4-6h)
- [ ] Error toasts (3-4h)
- [ ] Auto-refresh after upload (2h)

### Week 2 (UX & PERFORMANCE):
- [ ] Empty states (2-3h)
- [ ] Loading skeletons (2h)
- [ ] Mobile responsive table (3-4h)
- [ ] Real charts (6-8h)
- [ ] API pagination (3-4h)

### Week 3 (SECURITY & OPTIMIZATION):
- [ ] Admin check server-side (2h)
- [ ] Rate limiting (2-3h)
- [ ] Input validation (4-5h)
- [ ] XML endpoint caching (15min)
- [ ] Server Components migration (4-6h)

### Week 4 (POLISH & CLEANUP):
- [ ] Delete unused routes (2-3h)
- [ ] Consolidate auth (3-4h)
- [ ] TypeScript types (1h)
- [ ] Fix duplicate indexes (5min)
- [ ] Optimize RLS policies (15min)
- [ ] E2E tests (Playwright)
- [ ] Documentation update

---

## 📞 **IMMEDIATE NEXT STEPS**

```bash
# 🔴 PRIORYTET #1: Fix CSV Parser (MUST DO FIRST)
nano /Users/bartlomiejchudzik/Documents/Agencja\ AI/Real\ Estate\ App/src/app/api/upload/route.ts
# Task: Znaleźć FIELD_MAPPING i zamienić na pełne nazwy kolumn ministerstwa

# Po naprawie parsera:
# 1. Cleanup bazy danych
# 2. Re-upload CSV z poprawnymi mapowaniami
# 3. Sprawdzić logi MD generatora
# 4. Verify: MD powinien pokazać 14-28 properties (nie 0)

# 2. Fix dashboard components
grep -r "Brak przesłanych plików" src/
grep -r "Nie udało się pobrać danych" src/

# 3. Enable RLS in Supabase
# Go to Supabase Dashboard → Database → Tables
# → developers → Click shield icon → Enable RLS
# → uploaded_files → Same

# 4. Final Test
# Upload CSV → Check logs → Check MD → Check dashboard
```

---

## 📝 **PODSUMOWANIE WYKONANEJ PRACY (30.09.2025)**

### ✅ Ukończone:
1. **Dokumentacja ministerstwa** - przeczytane wszystkie PDFs, XMLs, CSV schema
2. **MD Generator** - dodano `extractFromRawData()`, `MINISTRY_COLUMNS`, obsługę "X"
3. **Public MD endpoint** - fix import + SELECT raw_data
4. **Regenerate files API** - SELECT raw_data explicitly
5. **Root cause identified** - CSV parser mapuje kolumny błędnie
6. **Plan naprawy** - zaktualizowany o wymagania ministerstwa i wykonane prace

### 🆕 **NOWE PRACE (30.09.2025 16:00-17:00)**

#### ✅ 1. MD Generator Fallback Fix (16:00)
**Problem:** MD generator ignorował top-level `raw_data.area` (obliczony przez parser)
**Przyczyna:** getRawField() sprawdzał TYLKO `raw_data.raw_data["Ministry Column"]`
**Rozwiązanie:** Dodano fallback w `/src/lib/md-generator.ts`:
```typescript
// 1. First check nested: raw_data.raw_data["Long Ministry Column Name"]
// 2. Then check top-level: raw_data.area (CSV parser calculated fields)
```

**Test przed:**
```javascript
property.area // undefined from nested
parseFloat(undefined) // NaN → 0
filter(p => p.area > 0) // removes ALL properties
```

**Test po:**
```javascript
property.area // 109.45 from top-level fallback ✅
parseFloat(109.45) // 109.45
filter(p => p.area > 0) // PASSES ✅
```

**Impact:** MD generator może teraz czytać zarówno CSV ministry columns jak i parser calculated fields

**Status:** ✅ COMPLETED

#### ✅ 2. CSV Parser Ministry Columns (16:30)
**Plik:** `/src/lib/smart-csv-parser.ts` (1285 lines)
**Zmiany:** 3 edity dodające długie nazwy kolumn ministerstwa do COLUMN_PATTERNS

**Edit 1 - Area (linie 170-177):**
```typescript
area: [
  'powierzchnia', 'powierzchnia użytkowa', // stare
  // MINISTRY OFFICIAL NAMES:
  'powierzchnia użytkowa lokalu mieszkalnego lub powierzchnia domu jednorodzinnego [m2]',
  'powierzchnia lokalu mieszkalnego lub domu jednorodzinnego'
],
```

**Edit 2 - Liczba pokoi (linie 200-205):**
```typescript
liczba_pokoi: [
  'pokoje', 'liczba pokoi', // stare
  // MINISTRY OFFICIAL NAMES:
  'liczba pokoi w lokalu mieszkalnym lub domu jednorodzinnym'
],
```

**Edit 3 - Parking (linie 280-305):**
```typescript
parking_space: [
  'parking', 'miejsce parkingowe', // stare
  // MINISTRY OFFICIAL NAMES:
  'nr przypisanego miejsca parkingowego / garażu [1]',
],
parking_price: [
  'cena parkingu', // stare
  // MINISTRY OFFICIAL NAMES:
  'cena przypisanego miejsca parkingowego / garażu [1]',
],
```

**Impact:** Parser teraz rozpoznaje oficjalne długie nazwy kolumn z ministerstwa
**Status:** ✅ COMPLETED

#### ✅ 3. Code Cleanliness Audit (17:00)
**Plik:** `/CLEANUP_PLAN.md` (CREATED)

**Znaleziono:**
- ❌ `otoraport-app/` - 77 plików duplikat całego projektu
- ❌ `OTORAPORT/` - drugi duplikat
- ❌ 10 debug scripts - `cleanup-demo-user.js`, `db-inspector.js`, `debug-*.js`, `test-raw-data.js`
- ❌ 6+ SQL files - `emergency-*.sql`, `fix-*.sql`
- ❌ 7 markdown docs - stare wersje `claude 2.md`, `CLAUDE 4.md`, `debugging_report.md`
- ❌ 4+ CSV logs - Supabase performance logs
- ⚠️ `middleware.ts` w root - powinno być w `src/`

**Plan cleanup:**
```bash
rm -rf otoraport-app/ OTORAPORT/
rm cleanup-demo-user.js db-inspector.js debug-*.js test-raw-data.js
rm database-setup.sql emergency-*.sql fix-*.sql
rm "claude 2.md" "CLAUDE 4.md" debugging_report.md
rm "Supabase Performance"*.csv supabase-*.csv.csv
rm sample_test_data.csv package-update-stripe.json
mv middleware.ts src/middleware.ts
```

**Zachować:**
- ✅ CLAUDE.md
- ✅ dokumenty/
- ✅ backup dokumentów real estate app/
- ✅ src/
- ✅ Standard config files

**Status:** ✅ PLAN READY, AWAITING EXECUTION

### 🔴 Następny krok:
1. **Git commit backup** - zabezpieczyć obecny stan
2. **Execute cleanup** - usunąć śmieci według CLEANUP_PLAN.md
3. **Test app** - sprawdzić czy działa po cleanup
4. **Debug MD endpoint** - z czystą kartą

---

## 🎯 **SUCCESS METRICS**

**Before:**
- Health Score: 4.5/10
- CSV Import: 19% (4/21) → ✅ Fixed to 100%
- MD showing: 0 properties → ❌ Still broken
- API Routes: 91 (15,985 LOC)
- Load Time: 5-10s
- Bugs: 7 critical, 10 high

**Target (After 3 weeks):**
- Health Score: 8.5/10
- CSV Import: 100% ✅
- MD showing: 14-28 properties ✅
- API Routes: 40-50 (8,000 LOC)
- Load Time: <2s
- Bugs: 0 critical, 2 high

**Key Metrics:**
- Upload success rate: 95%+
- XML validation: 100% ministry compliance
- User satisfaction: 4.5/5 stars
- Ministry compliance: 100% (58/58 fields)

---

## 🚀 **QUICK WINS**

1. ✅ **CSV Parser Fix** (15min) - DONE (duplikaty)
2. **CSV Parser Mapping** (30min-1h) - **← DO THIS NEXT**
3. **Logout Button** (15min) - Easy, critical
4. **Analytics Error** (15min) - One line fix
5. **XML Caching** (15min) - Huge performance gain
6. **Error Toasts** (2h) - Better UX immediately

---

**Priority:** 🔴 **CSV PARSER MAPPING FIX = ABSOLUTE PRIORITY**
**Estimated completion:** 3-4h remaining work
**Next review:** After CSV parser fix and database cleanup

*Last updated: 30.09.2025 15:42*