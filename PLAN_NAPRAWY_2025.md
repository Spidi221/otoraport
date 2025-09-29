# 🚀 OTORAPORT - Plan Naprawy & Rozwoju (Wrzesień 2025)

**Data utworzenia:** 29.09.2025
**Autor:** Claude Code (comprehensive audit)
**Health Score:** 4.5/10 → Target: 8.5/10

---

## 📊 Executive Summary

Aplikacja ma **solidne fundamenty** (Next.js 15, Supabase SSR, ministry compliance) ale cierpi na:
- 🔴 **CRITICAL:** 80% data loss w CSV importie (NAPRAWIONE ✅)
- 🔴 **CRITICAL:** XML generation czyta z pustych kolumn
- 🟠 **HIGH:** Brak logout, file management, error handling
- 🟡 **MEDIUM:** 91 API routes (15,985 LOC), performance issues

**Czas naprawy:** 2-3 tygodnie dla 90% funkcjonalności

---

## 🎯 FAZA 1: IMMEDIATE FIXES (Dzień 1-2) - CRITICAL

### ✅ 1.1 CSV Parser Bug (DONE)
**Status:** NAPRAWIONE 29.09.2025
**Problem:** Linia 835 sprawdzała `.length` na obiekcie zamiast tablicy
**Fix:** `Object.keys(property.raw_data).length > 0`
**Impact:** 4/21 → 21/21 rekordów importowanych

### 🔧 1.2 XML Generation Fix (IN PROGRESS)
**Problem:** `/src/lib/multi-project-xml.ts` czyta z strukturalnych kolumn, ale dane są w `raw_data` JSONB
**Locations:**
- `src/lib/multi-project-xml.ts:200-300`
- `src/app/api/xml/generate/route.ts`

**Solution A (Quick):** Czytaj z `raw_data`:
```typescript
// W multi-project-xml.ts - getData() function
const { data: properties } = await supabase
  .from('properties')
  .select('id, project_id, raw_data, created_at')
  .in('project_id', projectIds)

// Extract fields from raw_data
const transformedProperties = properties.map(p => ({
  property_number: p.raw_data.property_number,
  area: p.raw_data.area,
  price_per_m2: p.raw_data.price_per_m2,
  // ... all 58 fields
}))
```

**Solution B (Proper - long term):**
Napraw upload route żeby zapisywał do strukturalnych kolumn zamiast tylko `raw_data`

**Priority:** P0 (blokuje ministry compliance)
**Estimate:** 2-3h

### 🔐 1.3 Logout Button
**File:** `src/components/dashboard/header.tsx:229`
**Problem:** Undefined `supabase` variable

**Fix:**
```typescript
import { createClient } from '@/lib/supabase/client'

// W onClick:
onClick={async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/auth/signin'
}}
```

**Priority:** P0
**Estimate:** 15min

### 🔧 1.4 Analytics Page Error
**File:** `src/app/analytics/page.tsx`
**Error:** `supabaseAdmin is not defined`

**Fix:** Import missing supabase client:
```typescript
import { createAdminClient } from '@/lib/supabase/server'
```

**Priority:** P0
**Estimate:** 15min

---

## 🏗️ FAZA 2: CORE FEATURES (Tydzień 1) - HIGH

### 2.1 File Management Interface
**New Component:** `src/components/dashboard/file-manager.tsx`

**Features:**
- Lista uploadowanych plików (z tabeli `uploaded_files`)
- Status procesowania (success/error/pending)
- Akcje: Download, Re-process, Delete
- Filtrowanie po dacie i statusie

**UI Mockup:**
```
┌─────────────────────────────────────────────────┐
│ Przesłane pliki                   [Upload New] │
├─────────────────────────────────────────────────┤
│ 📄 cennik_2025_09.csv       156 properties     │
│    ✅ Processed • 2h ago                        │
│    [View] [Download] [Delete]                   │
├─────────────────────────────────────────────────┤
│ 📄 mieszkania.xlsx          89 properties      │
│    ⚠️ 3 errors • Yesterday                     │
│    [View Errors] [Fix & Retry]                  │
└─────────────────────────────────────────────────┘
```

**New API Routes:**
- `GET /api/uploads` - lista plików
- `DELETE /api/uploads/[id]` - usuń plik + powiązane properties
- `POST /api/uploads/[id]/reprocess` - przetwórz ponownie

**Priority:** P1
**Estimate:** 6-8h

### 2.2 Notification System
**Page:** `src/app/dashboard/notifications/page.tsx` (CREATE)

**Features:**
- Lista wszystkich powiadomień (upload success, errors, XML ready)
- Mark as read functionality
- Dismiss notifications
- Link back to dashboard

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

**Priority:** P1
**Estimate:** 4-6h

### 2.3 Error Handling & Toast System
**Package:** `npm install react-hot-toast`

**Implementation:**
- Wrap app w `<Toaster />` provider
- Dodaj error handling do wszystkich API calls
- Show detailed errors (nie tylko "Failed to parse file")

**Example:**
```typescript
// W upload-widget.tsx
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

**Priority:** P1
**Estimate:** 3-4h

### 2.4 Auto-Refresh After Upload
**Files:**
- `src/components/dashboard/upload-widget.tsx`
- `src/app/dashboard/page.tsx`

**Solution:** Use SWR/React Query dla data fetching:
```typescript
import useSWR from 'swr'

// W dashboard
const { data, mutate } = useSWR('/api/properties', fetcher)

// Po upload success
onUploadSuccess={() => {
  mutate() // Revalidate data
  toast.success('Dane odświeżone!')
}}
```

**Priority:** P1
**Estimate:** 2h

---

## 📈 FAZA 3: UX IMPROVEMENTS (Tydzień 2) - MEDIUM

### 3.1 Empty States
**Files:** All components that show lists

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

**Priority:** P2
**Estimate:** 2-3h

### 3.2 Loading States & Skeletons
**Package:** shadcn/ui Skeleton component

**Implement for:**
- Properties table loading
- Dashboard stats loading
- Upload processing

**Priority:** P2
**Estimate:** 2h

### 3.3 Mobile Responsive Table
**File:** `src/components/dashboard/properties-table.tsx`

**Solution:** Card view dla <768px:
```typescript
{isMobile ? (
  <div className="space-y-3">
    {properties.map(p => (
      <Card key={p.id}>
        <CardHeader>
          <CardTitle>{p.property_number}</CardTitle>
          <Badge>{p.status}</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Powierzchnia: {p.area}m²</div>
            <div>Cena: {p.total_price} zł</div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  <Table>{/* Desktop view */}</Table>
)}
```

**Priority:** P2
**Estimate:** 3-4h

### 3.4 Breadcrumb Navigation
**Component:** `src/components/ui/breadcrumbs.tsx` (CREATE)

**Usage:**
```tsx
<Breadcrumbs>
  <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/dashboard/properties">Nieruchomości</BreadcrumbItem>
  <BreadcrumbItem>Edycja</BreadcrumbItem>
</Breadcrumbs>
```

**Priority:** P2
**Estimate:** 2h

---

## 📊 FAZA 4: DATA VISUALIZATION (Tydzień 2-3) - MEDIUM

### 4.1 Real Charts Implementation
**Package:** `npm install recharts`

**Charts to Build:**
1. **Price Trend Chart** - cena/m² over time
2. **Property Distribution** - pie chart by type
3. **Status Overview** - available/reserved/sold

**File:** `src/components/dashboard/charts-section.tsx`

**Example:**
```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

<LineChart data={priceData}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="avgPricePerM2" stroke="#3B82F6" />
</LineChart>
```

**Priority:** P2
**Estimate:** 6-8h

### 4.2 Interactive Data Table
**Features:**
- Sorting (click column headers)
- Filtering (status, type, price range)
- Search (property number, address)
- Export to CSV/Excel

**Package:** `@tanstack/react-table`

**Priority:** P2
**Estimate:** 8-10h

---

## ⚡ FAZA 5: PERFORMANCE (Tydzień 3) - OPTIMIZATION

### 5.1 API Pagination
**Files:**
- `src/app/api/properties/route.ts`
- `src/components/dashboard/properties-table.tsx`

**Implementation:**
```typescript
// Backend
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

**Priority:** P1 (dla 100+ properties)
**Estimate:** 3-4h

### 5.2 Convert to Server Components
**Files:**
- `src/app/dashboard/page.tsx` - remove 'use client'
- Fetch data server-side with `await`
- Pass as props to client components

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

**Priority:** P2
**Estimate:** 4-6h

### 5.3 Caching Public XML Endpoints
**File:** `src/app/api/public/[clientId]/data.xml/route.ts`

**Add:**
```typescript
export const revalidate = 3600 // 1 hour cache
```

**Priority:** P1
**Estimate:** 15min

---

## 🔐 FAZA 6: SECURITY (Week 3) - IMPORTANT

### 6.1 Move Admin Check Server-Side
**Problem:** `ADMIN_EMAILS` exposed in client code

**Solution:**
```typescript
// middleware.ts
if (pathname.startsWith('/admin')) {
  const user = await getUser()
  const isAdmin = ADMIN_EMAILS.includes(user.email)
  if (!isAdmin) return NextResponse.redirect('/dashboard')
}

// Return only boolean to client
const response = { isAdmin: true } // Don't expose emails
```

**Priority:** P1
**Estimate:** 2h

### 6.2 Rate Limiting on Upload
**Package:** `@upstash/ratelimit`

**Implementation:**
```typescript
// In /api/upload
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, '1 m')
})

const { success } = await ratelimit.limit(user.id)
if (!success) return NextResponse.json({ error: 'Too many requests' }, 429)
```

**Priority:** P2
**Estimate:** 2-3h

### 6.3 Input Validation & Sanitization
**Package:** `zod` for schema validation

**Example:**
```typescript
import { z } from 'zod'

const PropertySchema = z.object({
  property_number: z.string().max(50),
  area: z.number().positive().max(10000),
  price_per_m2: z.number().positive()
})

// Validate before insert
const validated = PropertySchema.parse(property)
```

**Priority:** P2
**Estimate:** 4-5h

---

## 🧹 FAZA 7: TECHNICAL DEBT (Week 4) - CLEANUP

### 7.1 Delete Unused API Routes
**Target:** Reduce from 91 to ~40 routes

**Routes to Delete:**
- All `test-*` routes
- All `demo-*` routes
- All `mock-*` routes
- `debug-*` endpoints

**Command:**
```bash
# Find all test routes
find src/app/api -name "*test*" -o -name "*demo*" -o -name "*mock*"

# Review and delete
rm -rf src/app/api/test-*
rm -rf src/app/api/demo-*
```

**Priority:** P2
**Estimate:** 2-3h

### 7.2 Consolidate Auth Systems
**Problem:** 3 separate auth implementations

**Solution:** Single pattern:
- Server Components: `import { createClient } from '@/lib/supabase/server'`
- Client Components: `import { createClient } from '@/lib/supabase/client'`
- API Routes: `import { createAdminClient } from '@/lib/supabase/server'`

**Delete:**
- `src/lib/supabase-single.ts`
- `src/providers/supabase-provider.tsx.DISABLED`

**Priority:** P2
**Estimate:** 3-4h

### 7.3 TypeScript Types Generation
**Command:**
```bash
npx supabase gen types typescript --project-id maichqozswcomegcsaqg > src/types/supabase.ts
```

**Update imports:**
```typescript
import { Database } from '@/types/supabase'
```

**Priority:** P2
**Estimate:** 1h

---

## 📋 IMPLEMENTATION CHECKLIST

### Week 1 (Critical Fixes)
- [x] CSV parser bug fix (DONE ✅)
- [ ] XML generation fix
- [ ] Logout button
- [ ] Analytics page error
- [ ] File management UI
- [ ] Notification system
- [ ] Error toasts
- [ ] Auto-refresh after upload

### Week 2 (UX & Performance)
- [ ] Empty states
- [ ] Loading skeletons
- [ ] Mobile responsive table
- [ ] Breadcrumb navigation
- [ ] Real charts (Recharts)
- [ ] Interactive table (sorting/filtering)
- [ ] API pagination
- [ ] Server Components migration

### Week 3 (Security & Optimization)
- [ ] Admin check server-side
- [ ] Rate limiting
- [ ] Input validation (Zod)
- [ ] XML endpoint caching
- [ ] Delete unused routes
- [ ] Consolidate auth
- [ ] TypeScript types generation

### Week 4 (Polish & Testing)
- [ ] E2E tests (Playwright)
- [ ] Error boundary components
- [ ] Performance monitoring
- [ ] SEO optimization
- [ ] Documentation update
- [ ] Production deployment

---

## 🎯 SUCCESS METRICS

**Before:**
- Health Score: 4.5/10
- CSV Import: 19% (4/21)
- API Routes: 91 (15,985 LOC)
- Load Time: 5-10s
- Bugs: 5 critical, 10 high

**Target (After 3 weeks):**
- Health Score: 8.5/10
- CSV Import: 100% (21/21) ✅
- API Routes: 40-50 (8,000 LOC)
- Load Time: <2s
- Bugs: 0 critical, 2 high

**Key Metrics to Track:**
- Upload success rate: target 95%+
- XML validation pass rate: target 100%
- User satisfaction: target 4.5/5 stars
- Ministry compliance: 100% (58/58 fields)

---

## 🚀 QUICK WINS (Do First)

1. ✅ **CSV Parser Fix** (15min) - DONE
2. **Logout Button** (15min) - Easy, critical
3. **Analytics Error** (15min) - One line fix
4. **XML Caching** (15min) - Huge performance gain
5. **Error Toasts** (2h) - Better UX immediately

**Total:** 3-4h for 5 major improvements

---

## 📞 SUPPORT & RESOURCES

**Documentation:**
- Next.js 15: https://nextjs.org/docs
- Supabase SSR: https://supabase.com/docs/guides/auth/server-side
- Ministry Schema 1.13: CLAUDE.md lines 48-79

**Community:**
- GitHub Issues: https://github.com/Spidi221/otoraport/issues
- Slack: #otoraport-dev (if exists)

**Tools:**
- Claude Code: Agent-based development
- Cursor/GitHub Copilot: AI pair programming
- Playwright: E2E testing

---

**Last Updated:** 29.09.2025
**Next Review:** 06.10.2025 (Week 1 checkpoint)