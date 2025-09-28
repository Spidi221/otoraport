# 🚀 PLAN DZIAŁANIA - NAPRAWA OTORAPORT/CENYSYNC
**Data:** 25 września 2025
**Cel:** Przywrócenie pełnej funkcjonalności aplikacji w ciągu 1-3 godzin
**Status:** READY TO EXECUTE - Wszystkie kroki zdefiniowane

---

## 🎯 STRATEGIA NAPRAWY

**Podejście:** Krótkie, szybkie naprawy krytycznych błędów w logicznej kolejności
**Czas:** 3 fazy - 30 min + 1h + 1h = 2.5 godziny total
**Rezultat:** W pełni funkcjonalna aplikacja gotowa do testowania i użytkowania

---

# ⚡ FAZA 1: KRYTYCZNE NAPRAWY (30 MINUT)
**Cel:** Przywrócić podstawową funkcjonalność autoryzacji i uploadu

## 🔧 Krok 1.1: Stworzenie pliku .env.local (5 minut)

```bash
# W terminalu:
cd otoraport-app
touch .env.local
```

**Zawartość pliku .env.local:**
```env
# === SUPABASE CONFIGURATION ===
NEXT_PUBLIC_SUPABASE_URL=https://maichqozswcomegcsaqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTUwMjMsImV4cCI6MjA3MzE3MTAyM30.pFj72PPCCGZue4-M1hzhAjptuedJdY-qiS4gRWHAxVU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8

# === AUTHENTICATION ===
NEXTAUTH_URL=http://localhost:3006
NEXTAUTH_SECRET=otoraport_secret_2024_super_secure_key_123

# === ADMIN CONFIGURATION ===
ADMIN_EMAILS=admin@otoraport.pl,chudziszewski221@gmail.com,demo@cenysync.pl

# === EMAIL SERVICE ===
RESEND_API_KEY=re_NwTBLVR4_J7UKgGnHWcxCHHTMymVWgo5w
EMAIL_FROM=noreply@cenysync.pl

# === GOOGLE OAUTH (Temporary placeholders) ===
GOOGLE_CLIENT_ID=placeholder_will_add_real_later
GOOGLE_CLIENT_SECRET=placeholder_will_add_real_later

# === PAYMENTS (Temporary placeholders) ===
STRIPE_SECRET_KEY=placeholder_will_add_real_later
PRZELEWY24_MERCHANT_ID=placeholder_will_add_real_later

# === DEVELOPMENT ===
NODE_ENV=development
```

## 🔧 Krok 1.2: Naprawa cookie pattern w auth (15 minut)

**Plik:** `otoraport-app/src/lib/auth-supabase.ts`

**Znajdź linię 19-22:**
```typescript
// STARY KOD (do usunięcia):
const tokenMatch = cookieHeader.match(/sb-maichqozswcomegcsaqg-auth-token=([^;]+)/)
if (!tokenMatch) {
  return { success: false, error: 'No valid session cookie' }
}
```

**Zamień na:**
```typescript
// NOWY KOD (dynamiczny pattern):
const cookiePattern = /sb-[a-z0-9]+-auth-token=([^;]+)/
const tokenMatch = cookieHeader.match(cookiePattern)
if (!tokenMatch) {
  // Try alternative cookie patterns
  const altPattern = /supabase-auth-token=([^;]+)/
  const altMatch = cookieHeader.match(altPattern)
  if (!altMatch) {
    return { success: false, error: 'No valid session cookie found' }
  }
  const token = altMatch[1]
} else {
  const token = tokenMatch[1]
}
```

**Znajdź linię 25 i zamień:**
```typescript
// STARY KOD:
const token = tokenMatch[1]

// NOWY KOD (już zrobione powyżej - usuń tę linię)
```

## 🔧 Krok 1.3: Naprawa middleware.ts (10 minut)

**Plik:** `otoraport-app/src/middleware.ts`

**Znajdź linię 32:**
```typescript
// STARY KOD:
const accessToken = req.cookies.get('sb-maichqozswcomegcsaqg-auth-token')
```

**Zamień na:**
```typescript
// NOWY KOD (sprawdza różne cookie patterns):
let accessToken = req.cookies.get('sb-maichqozswcomegcsaqg-auth-token')
if (!accessToken) {
  // Try generic Supabase pattern
  const allCookies = req.cookies.getAll()
  accessToken = allCookies.find(cookie =>
    cookie.name.match(/sb-[a-z0-9]+-auth-token/)
  )
}
```

---

# ⚡ FAZA 2: STABILIZACJA SYSTEMU (1 GODZINA)
**Cel:** Usunąć konflikty autoryzacji i zapewnić spójność

## 🔧 Krok 2.1: Usunięcie NextAuth dependencies (20 minut)

**W package.json usuń:**
```json
"next-auth": "^4.24.11",
"@next-auth/supabase-adapter": "0.2.1"
```

**Uruchom:**
```bash
cd otoraport-app
npm uninstall next-auth @next-auth/supabase-adapter
npm install
```

## 🔧 Krok 2.2: Migracja header component (20 minut)

**Plik:** `otoraport-app/src/components/dashboard/header.tsx`

**Znajdź import NextAuth (linia ~5-10):**
```typescript
// USUŃ te importy:
import { useSession, signOut } from 'next-auth/react'
```

**Dodaj Supabase imports:**
```typescript
// DODAJ na początku:
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Zamień logikę sesji (znajdź ~line 80):**
```typescript
// STARY KOD NextAuth (usuń):
const { data: session } = useSession()
const user = session?.user

// NOWY KOD Supabase:
const [user, setUser] = useState<any>(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  const getUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }
  getUser()

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setUser(session?.user ?? null)
    }
  )

  return () => subscription.unsubscribe()
}, [])

if (loading) return <div>Loading...</div>
```

**Zamień logout function:**
```typescript
// STARY KOD:
onClick={() => signOut()}

// NOWY KOD:
onClick={async () => {
  await supabase.auth.signOut()
  window.location.href = '/auth/signin'
}}
```

## 🔧 Krok 2.3: Test podstawowych funkcji (20 minut)

```bash
# Uruchom aplikację:
cd otoraport-app
npm run dev

# Aplikacja powinna być dostępna na: http://localhost:3006
```

**Checklist testowy:**
1. ✅ **http://localhost:3006** - strona główna ładuje się
2. ✅ **http://localhost:3006/auth/signin** - można się zalogować Google
3. ✅ **Dashboard** - pokazuje correct user email (nie `email@example.com`)
4. ✅ **Upload** - próba uploadu nie zwraca "Unauthorized"
5. ✅ **Admin** - `chudziszewski221@gmail.com` może wejść w panel admina

---

# ⚡ FAZA 3: PEŁNA FUNKCJONALNOŚĆ (1 GODZINA)
**Cel:** Zapewnić wszystkie features są w pełni operational

## 🔧 Krok 3.1: Weryfikacja bazy danych (20 minut)

**Wejdź w Supabase Dashboard SQL Editor:**
```sql
-- Test 1: Sprawdź czy demo user istnieje
SELECT * FROM developers WHERE email = 'demo@cenysync.pl';

-- Test 2: Sprawdź czy admin user istnieje
SELECT * FROM developers WHERE email = 'chudziszewski221@gmail.com';

-- Test 3: Sprawdź strukturę tabeli properties
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;

-- Test 4: Sprawdź czy są sample properties
SELECT COUNT(*) as properties_count FROM properties;
```

**Jeśli brakuje demo users, dodaj:**
```sql
-- Dodaj demo user
INSERT INTO developers (
  email, name, company_name, client_id,
  subscription_plan, subscription_status
) VALUES (
  'demo@cenysync.pl', 'Demo User', 'Demo Company',
  'demo_client_123', 'pro', 'active'
) ON CONFLICT (email) DO NOTHING;

-- Dodaj admin user
INSERT INTO developers (
  email, name, company_name, client_id,
  subscription_plan, subscription_status
) VALUES (
  'chudziszewski221@gmail.com', 'Bartłomiej Chudziszewski', 'Test Company',
  'test_client_456', 'enterprise', 'active'
) ON CONFLICT (email) DO NOTHING;
```

## 🔧 Krok 3.2: Test ministry endpoints (15 minut)

```bash
# Test XML endpoint:
curl http://localhost:3006/api/public/demo_client_123/data.xml

# Test MD5 endpoint:
curl http://localhost:3006/api/public/demo_client_123/data.md5

# Expected: XML content i MD5 hash, nie błędy
```

## 🔧 Krok 3.3: Test file upload flow (15 minut)

1. **Login jako** `chudziszewski221@gmail.com`
2. **Idź do dashboard**
3. **Spróbuj upload** sample CSV file
4. **Sprawdź** czy process completes bez "Unauthorized" error
5. **Verify** że XML generation działa

## 🔧 Krok 3.4: Test admin panel (10 minut)

1. **Login jako** `chudziszewski221@gmail.com`
2. **Idź na** `/admin`
3. **Verify** że nie ma redirect do dashboard
4. **Sprawdź** admin functions są dostępne
5. **Test** admin capabilities

---

# 📋 EMERGENCY FIXES (Jeśli coś nadal nie działa)

## 🚨 Fix A: Cookie name completely wrong

Jeśli nadal masz cookie issues, sprawdź developer tools:
1. **F12 → Application → Cookies**
2. **Znajdź actual cookie name** dla Supabase
3. **Update** cookie pattern w auth-supabase.ts na exact match

## 🚨 Fix B: Database connection issues

```javascript
// Test database connection:
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'https://maichqozswcomegcsaqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTUwMjMsImV4cCI6MjA3MzE3MTAyM30.pFj72PPCCGZue4-M1hzhAjptuedJdY-qiS4gRWHAxVU'
)

// Run: node -e "above_code; supabase.from('developers').select('count').then(console.log)"
```

## 🚨 Fix C: Google OAuth redirect issues

Jeśli Google OAuth nie działa:
1. **Google Cloud Console** → Credentials
2. **Add** `http://localhost:3006/auth/callback` to authorized redirects
3. **Update** `.env.local` z real Google Client ID/Secret

---

# 🎯 SUCCESS CRITERIA

Po wykonaniu wszystkich kroków, aplikacja powinna:

✅ **Login Flow:**
- Google OAuth login działa bez błędów
- Dashboard pokazuje correct user information
- Session persists między page refreshes

✅ **File Upload:**
- CSV files można upload bez "Unauthorized" errors
- Upload trigger processing i XML generation
- User dostaje feedback o successful upload

✅ **Admin Access:**
- `chudziszewski221@gmail.com` może access admin panel
- Admin panel nie redirect do dashboard
- Admin functions są dostępne

✅ **Ministry Compliance:**
- XML endpoints zwracają valid XML content
- MD5 endpoints zwracają correct hashes
- Data complies z ministry requirements

✅ **Core Features:**
- Registration nowych users działa
- Dashboard analytics show correct data
- Email notifications są wysyłane
- Database operations work properly

---

# 📞 KONTAKT W RAZIE PROBLEMÓW

**Jeśli którykolwiek krok fails:**

1. **Sprawdź console errors** w browser developer tools
2. **Check terminal logs** dla Next.js errors
3. **Verify environment variables** są loaded properly
4. **Test database connection** separately
5. **Contact developer** z specific error messages

**Oczekiwany czas total:** 2.5 godziny
**Oczekiwany rezultat:** W pełni functional aplikacja ready dla production testing

---

# 🚀 POST-COMPLETION STEPS

Po successful naprawie:

1. **Full regression testing** wszystkich major features
2. **Update documentation** to reflect current state
3. **Security review** auth implementation
4. **Performance testing** z real data
5. **Prepare for production deployment**

**Aplikacja będzie gotowa do pełnego commercial use!**