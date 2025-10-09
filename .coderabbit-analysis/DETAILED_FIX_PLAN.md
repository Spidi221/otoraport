# 🔧 OTO-RAPORT v2 - Szczegółowy Plan Naprawy

**Data:** 2025-10-07
**Status aplikacji:** Build ✅ | CSV Parser ✅ | Deployment ⚠️

---

## 📋 SPIS PROBLEMÓW

### 🔴 CRITICAL - Naprawić TERAZ (Phase 1)
1. **XML Auto-Refresh Date** - Compliance z Ministerstwem
2. **Properties Table** - Główna funkcja zarządzania mieszkaniami

### 🟡 HIGH - Ważne (Phase 2)
3. **Notifications System** - Brak strony powiadomień
4. **Settings Page** - Może nie działać poprawnie

### 🟢 ENHANCEMENT - Ulepszenia (Phase 3)
5. **Real-time Updates** - Auto-regeneracja po zmianie statusu
6. **Analytics Dashboard** - Statystyki i wykresy
7. **Email Notifications** - Powiadomienia email
8. **Multi-Project UI** - Zarządzanie wieloma projektami

---

## 🔴 PROBLEM #1: XML Auto-Refresh Date

### Co nie działa?
Data w XML nie odświeża się codziennie, choć Ministerstwo wymaga świeżej daty publikacji.

### Gdzie jest problem?
**Plik:** `src/app/api/public/[clientId]/data.xml/route.ts`

**Linie 8-9:**
```typescript
export const revalidate = 3600 // Cache na 1 godzinę
export const dynamic = 'force-static' // ❌ TO JEST PROBLEM
```

### Dlaczego to problem?
1. `force-static` - Next.js generuje XML RAZ podczas build i potem go cache'uje
2. `revalidate = 3600` - Nawet jak revalidate, to tylko co godzinę
3. **Ministerstwo wymaga:** Świeża data każdego dnia (Art. 19b)

### Jak naprawić? (5 minut)

#### Krok 1: Zmień tryb na dynamiczny
**PRZED:**
```typescript
export const revalidate = 3600
export const dynamic = 'force-static'
```

**PO:**
```typescript
export const dynamic = 'force-dynamic' // ✅ Każde żądanie = nowe XML
export const revalidate = 0 // ✅ Wyłącz cache
```

#### Krok 2: Sprawdź czy data się generuje
**Linia 30 w `src/lib/xml-generator.ts`:**
```typescript
const currentDate = new Date().toISOString().split('T')[0] // ✅ To działa
```

To JUŻ generuje świeżą datę - problem jest tylko w cache.

#### Krok 3: Zastosuj te same zmiany do innych endpointów
Sprawdź i napraw podobnie:
- `src/app/api/public/[clientId]/data.csv/route.ts`
- `src/app/api/public/[clientId]/data.md5/route.ts`

#### Krok 4: Przetestuj
```bash
# W terminalu:
curl http://localhost:3000/api/public/DEV123/data.xml | grep "dataDate"

# Czekaj 1 minutę i sprawdź ponownie - data powinna się zmienić
curl http://localhost:3000/api/public/DEV123/data.xml | grep "dataDate"
```

### Rezultat
✅ XML zawsze ma dzisiejszą datę
✅ Compliance z Ministerstwem
✅ Harvester dostaje świeże dane

---

## 🔴 PROBLEM #2: Properties Table

### Co nie działa?
Sekcja "mieszkania" na dole dashboardu - deweloperzy nie mogą zarządzać statusami.

### Gdzie może być problem?

#### Scenariusz A: API nie zwraca danych
**Plik:** `src/app/api/properties/route.ts`

**Test:**
```bash
# W przeglądarce zaloguj się, potem w konsoli:
fetch('/api/properties?page=1&limit=20')
  .then(r => r.json())
  .then(console.log)

# Powinieneś zobaczyć:
# { success: true, data: [...], pagination: {...} }
```

**Co sprawdzić:**
1. Czy `user` jest authenticated (linia 10-14)
2. Czy `developer` profile istnieje (linia 17-21)
3. Czy są jakieś projekty dla tego dewelopera (linia 34-40)
4. Czy properties mają `project_id` dopasowany do tych projektów

**Możliwe rozwiązania:**
```sql
-- Sprawdź w Supabase czy developer ma projekty:
SELECT * FROM projects WHERE developer_id = 'YOUR_DEV_ID';

-- Sprawdź czy properties mają dobry project_id:
SELECT project_id, COUNT(*)
FROM properties
WHERE project_id IN (SELECT id FROM projects WHERE developer_id = 'YOUR_DEV_ID')
GROUP BY project_id;
```

#### Scenariusz B: RLS Policy blokuje dostęp
**Możliwy problem:** Row Level Security w Supabase blokuje odczyt properties.

**Test w Supabase SQL Editor:**
```sql
-- Jako zalogowany user:
SELECT * FROM properties LIMIT 5;

-- Jeśli dostaniesz 0 rows mimo że dane są - to RLS problem
```

**Rozwiązanie:**
Dodaj RLS policy która pozwala deweloperom czytać swoje properties:

```sql
-- Polityka dla SELECT properties
CREATE POLICY "Developers can read their own properties"
ON properties FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects
    WHERE developer_id = auth.uid()
  )
);

-- Polityka dla UPDATE properties
CREATE POLICY "Developers can update their own properties"
ON properties FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM projects
    WHERE developer_id = auth.uid()
  )
);
```

#### Scenariusz C: Frontend nie renderuje
**Plik:** `src/components/dashboard/properties-table.tsx`

**Test w przeglądarce (Console):**
```javascript
// Zobacz czy są properties w state:
console.log(window.location.pathname) // Czy jesteś na /dashboard?
```

**Co sprawdzić:**
1. Linia 62-71: SWR fetcher - czy zwraca dane
2. Linia 73: `properties` array - czy jest pusty
3. Linia 75: Czy jest `error`
4. Console logs (linia 85-90) - szukaj w DevTools

**Możliwe błędy:**
```typescript
// PROBLEM: SWR może cache'ować pusty result
// ROZWIĄZANIE: Clear cache:
mutate() // Linia 214, 249
```

#### Scenariusz D: Bulk operations nie działają
**Endpointy istnieją:**
- `/api/properties/bulk-delete`
- `/api/properties/bulk-status`

**Test:**
```javascript
// W konsoli przeglądarki:
fetch('/api/properties/bulk-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    propertyIds: ['test-id'],
    newStatus: 'sold'
  })
}).then(r => r.json()).then(console.log)
```

### Kompletny Plan Debugowania

**Krok 1: Sprawdź czy API działa**
```bash
# Terminal 1: Uruchom dev server
npm run dev

# Terminal 2 lub przeglądarka console:
fetch('http://localhost:3000/api/properties?page=1&limit=5', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

**Oczekiwany result:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "property_number": "A1/1",
      "area": 45.5,
      "status": "available",
      ...
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 5,
    "totalPages": 20
  }
}
```

**Krok 2: Sprawdź RLS policies**
```sql
-- W Supabase SQL Editor:
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('properties', 'projects');
```

**Krok 3: Sprawdź czy dane w bazie są poprawne**
```sql
-- Sprawdź strukturę danych:
SELECT
  id,
  project_id,
  raw_data->>'property_number' as prop_num,
  raw_data->>'status' as status,
  created_at
FROM properties
LIMIT 5;

-- Sprawdź czy project_id istnieje:
SELECT p.id, p.project_id, pr.developer_id
FROM properties p
LEFT JOIN projects pr ON p.project_id = pr.id
LIMIT 5;
```

**Krok 4: Sprawdź Frontend**
Otwórz DevTools → Network → Filter: "properties"
- Czy request się wysyła?
- Jaki status code? (200, 401, 404, 500?)
- Jaka response?

**Krok 5: Sprawdź Console Logs**
Szukaj w Console:
- `🏠 PROPERTIES API: Getting user properties`
- `✅ PROPERTIES API: Found X properties`
- `❌ PROPERTIES API: Database error`

### Quick Fixes

#### Fix 1: Brak properties w bazie
```typescript
// Wgraj testowe dane przez upload CSV
// LUB dodaj ręcznie w Supabase:
INSERT INTO properties (project_id, raw_data)
SELECT
  (SELECT id FROM projects WHERE developer_id = auth.uid() LIMIT 1),
  '{
    "property_number": "TEST-001",
    "property_type": "mieszkanie",
    "area": 45.5,
    "total_price": 450000,
    "price_per_m2": 9890,
    "status": "available"
  }'::jsonb;
```

#### Fix 2: RLS blokuje
```sql
-- Tymczasowo wyłącz RLS dla testów:
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- Przetestuj czy teraz działa
-- Potem włącz z poprawnymi policies:
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
```

#### Fix 3: Frontend nie fetchuje
```typescript
// W src/components/dashboard/properties-table.tsx
// Dodaj debug na początku komponentu:
useEffect(() => {
  console.log('🔍 PropertiesTable mounted');
  console.log('📊 Current data:', data);
  console.log('❌ Current error:', error);
}, [data, error]);
```

---

## 🟡 PROBLEM #3: Notifications System

### Co trzeba stworzyć?
Kompletny system powiadomień.

### Plan implementacji (3-4h)

#### Krok 1: Baza danych (30 min)
**Stwórz tabelę w Supabase:**

```sql
-- Tabela notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'success', 'error', 'warning', 'info'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Index dla szybkiego query
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- System może tworzyć notyfikacje dla każdego
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);
```

#### Krok 2: API Endpoints (1h)

**Plik:** `src/app/api/notifications/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/notifications - Pobierz notifications
export async function GET(request: NextRequest) {
  const user = await getServerAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20')

  let query = createAdminClient()
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.eq('read', false)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

// PATCH /api/notifications - Mark as read
export async function PATCH(request: NextRequest) {
  const user = await getServerAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { notificationIds } = await request.json()

  const { error } = await createAdminClient()
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .in('id', notificationIds)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

**Plik:** `src/app/api/notifications/mark-all-read/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const user = await getServerAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await createAdminClient()
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

#### Krok 3: Helper Function (30 min)

**Plik:** `src/lib/notifications.ts`
```typescript
import { createAdminClient } from './supabase/server'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

export async function createNotification(params: CreateNotificationParams) {
  const { data, error } = await createAdminClient()
    .from('notifications')
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl,
      action_label: params.actionLabel,
      metadata: params.metadata || {}
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create notification:', error)
    return null
  }

  return data
}

// Helper functions for common notifications
export async function notifyUploadSuccess(userId: string, filename: string, count: number) {
  return createNotification({
    userId,
    type: 'success',
    title: 'Upload zakończony pomyślnie',
    message: `Plik ${filename} został przetworzony. Dodano ${count} nieruchomości.`,
    actionUrl: '/dashboard',
    actionLabel: 'Zobacz nieruchomości'
  })
}

export async function notifyUploadError(userId: string, filename: string, error: string) {
  return createNotification({
    userId,
    type: 'error',
    title: 'Błąd podczas uploadu',
    message: `Plik ${filename} nie mógł być przetworzony: ${error}`,
    actionUrl: '/dashboard',
    actionLabel: 'Spróbuj ponownie'
  })
}

export async function notifyMinistrySync(userId: string, success: boolean) {
  return createNotification({
    userId,
    type: success ? 'success' : 'error',
    title: success ? 'Synchronizacja z Ministerstwem' : 'Błąd synchronizacji',
    message: success
      ? 'Dane zostały pomyślnie zsynchronizowane z dane.gov.pl'
      : 'Wystąpił błąd podczas synchronizacji z Ministerstwem',
    actionUrl: '/dashboard/settings',
    actionLabel: 'Sprawdź ustawienia'
  })
}
```

#### Krok 4: Frontend Page (1.5h)

**Plik:** `src/app/notifications/page.tsx`
```typescript
'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json())

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  read: boolean
  action_url?: string
  action_label?: string
  created_at: string
}

export default function NotificationsPage() {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const { data, error, mutate } = useSWR<{ success: boolean; data: Notification[] }>(
    `/api/notifications${showUnreadOnly ? '?unread=true' : ''}`,
    fetcher
  )

  const notifications = data?.data || []
  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds })
      })
      mutate()
    } catch (error) {
      toast.error('Nie udało się oznaczyć jako przeczytane')
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include'
      })
      toast.success('Wszystkie powiadomienia oznaczone jako przeczytane')
      mutate()
    } catch (error) {
      toast.error('Wystąpił błąd')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Powiadomienia</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} nowe</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            {showUnreadOnly ? 'Pokaż wszystkie' : 'Tylko nieprzeczytane'}
          </Button>

          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Oznacz wszystkie
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-6 bg-red-50 text-red-800">
          Nie udało się pobrać powiadomień
        </Card>
      )}

      {notifications.length === 0 && (
        <Card className="p-12 text-center text-gray-500">
          <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">
            {showUnreadOnly
              ? 'Brak nieprzeczytanych powiadomień'
              : 'Nie masz jeszcze żadnych powiadomień'}
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {notifications.map(notification => (
          <Card
            key={notification.id}
            className={`p-4 transition-colors ${
              notification.read ? 'bg-gray-50' : 'bg-white border-l-4 border-l-blue-500'
            }`}
            onClick={() => !notification.read && markAsRead([notification.id])}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getTypeColor(notification.type)}>
                    {notification.type}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(notification.created_at).toLocaleString('pl-PL')}
                  </span>
                </div>

                <h3 className="font-semibold text-lg mb-1">
                  {notification.title}
                </h3>

                <p className="text-gray-700">
                  {notification.message}
                </p>

                {notification.action_url && (
                  <Link href={notification.action_url}>
                    <Button variant="link" className="mt-2 p-0 h-auto">
                      {notification.action_label || 'Zobacz więcej'}
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>

              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

#### Krok 5: Dodaj link w nawigacji (10 min)

**W pliku głównego layoutu/nagłówka dodaj:**
```typescript
<Link href="/notifications">
  <Button variant="ghost" size="icon" className="relative">
    <Bell className="w-5 h-5" />
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
        {unreadCount}
      </span>
    )}
  </Button>
</Link>
```

#### Krok 6: Integruj z Upload (20 min)

**W `src/app/api/upload/route.ts` po udanym uploada:**
```typescript
import { notifyUploadSuccess, notifyUploadError } from '@/lib/notifications'

// ... po udanym parsowaniu:
await notifyUploadSuccess(
  developer.id,
  file.name,
  parsedData.data.length
)

// ... w przypadku błędu:
await notifyUploadError(
  developer.id,
  file.name,
  error.message
)
```

---

## 🟡 PROBLEM #4: Settings Page

### Co sprawdzić?

#### Test 1: Czy strona się ładuje?
```bash
# W przeglądarce:
http://localhost:3000/dashboard/settings

# Sprawdź w DevTools Console czy są błędy
```

#### Test 2: Czy API działa?
Sprawdź czy endpoint `/api/user/profile` zwraca dane:
```javascript
fetch('/api/user/profile', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

#### Test 3: Czy formularz zapisuje zmiany?
Wypełnij formularz i wyślij - sprawdź Network tab czy request się wysyła.

### Możliwe problemy i rozwiązania:

**Problem:** Strona się nie ładuje (404/500)
**Rozwiązanie:** Sprawdź czy plik `src/app/dashboard/settings/page.tsx` istnieje

**Problem:** Formularz nie wysyła danych
**Rozwiązanie:** Sprawdź czy API endpoint działa i czy jest validation

**Problem:** Dane nie zapisują się
**Rozwiązanie:** Sprawdź RLS policies dla tabeli `developers`

---

## 🟢 ENHANCEMENT #1: Real-time Updates

### Jak zaimplementować?

#### Opcja A: Prosty polling (łatwe, 1h)
```typescript
// W properties-table.tsx:
useEffect(() => {
  const interval = setInterval(() => {
    mutate() // Refresh co 30 sekund
  }, 30000)

  return () => clearInterval(interval)
}, [mutate])
```

#### Opcja B: Supabase Realtime (zaawansowane, 3h)
```typescript
import { createClient } from '@/lib/supabase/client'

useEffect(() => {
  const supabase = createClient()

  const channel = supabase
    .channel('properties-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'properties'
      },
      (payload) => {
        console.log('Property changed:', payload)
        mutate() // Refresh data
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [mutate])
```

#### Opcja C: Webhook + regeneracja (najlepsze, 2h)

**1. Dodaj Supabase Function/Trigger:**
```sql
CREATE OR REPLACE FUNCTION trigger_file_regeneration()
RETURNS TRIGGER AS $$
BEGIN
  -- Wywołaj webhook do Next.js API
  PERFORM net.http_post(
    url := 'https://twoja-domena.com/api/regenerate-files',
    body := json_build_object(
      'developer_id', NEW.project_id,
      'action', TG_OP
    )::text,
    headers := '{"Content-Type": "application/json"}'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_property_status_change
AFTER INSERT OR UPDATE OF status ON properties
FOR EACH ROW
EXECUTE FUNCTION trigger_file_regeneration();
```

**2. API endpoint dla regeneracji:**
```typescript
// src/app/api/regenerate-files/route.ts
export async function POST(request: NextRequest) {
  const { developer_id } = await request.json()

  // Regeneruj XML/CSV/MD5
  await regenerateMinistryFiles(developer_id)

  return NextResponse.json({ success: true })
}
```

---

## 📊 Podsumowanie

### Priorytet wykonania:

#### Faza 1 (2-3h) - ZRÓB TO NAJPIERW
1. ✅ Fix XML Auto-Refresh (5 min)
2. ✅ Debug Properties Table (2h)
   - Test API
   - Sprawdź RLS
   - Fix frontend jeśli trzeba

#### Faza 2 (4-5h) - NASTĘPNE
3. ✅ Stwórz Notifications System (4h)
4. ✅ Napraw Settings Page (1h)

#### Faza 3 (8-12h) - PÓŹNIEJ
5. ✅ Real-time Updates (2h)
6. ✅ Analytics Dashboard (4h)
7. ✅ Email Notifications (3h)
8. ✅ Multi-Project UI (3h)

### Jak zacząć?

```bash
# 1. Najpierw napraw XML cache:
# Edytuj: src/app/api/public/[clientId]/data.xml/route.ts
# Zmień: force-static → force-dynamic

# 2. Przetestuj properties API:
npm run dev
# Potem w przeglądarce console:
fetch('/api/properties?page=1&limit=5', {credentials:'include'})
  .then(r=>r.json()).then(console.log)

# 3. Jeśli API działa ale frontend nie - debug properties-table.tsx
# 4. Jeśli API nie działa - sprawdź RLS policies w Supabase
```

### Potrzebujesz pomocy?

Mogę teraz:
1. **Wykonać Task #36** (XML fix) - zajmie 2 minuty
2. **Debug Properties Table** razem z Tobą step-by-step
3. **Zaimplementować całą Faze 1** (3h roboty)
4. **Pokazać więcej szczegółów** dla konkretnego problemu

Co wybierasz?
