# 🚨 KRITYCZNE PROBLEMY AUTH - DIAGNOSIS

## 📋 **GŁÓWNY PROBLEM**
Aplikacja ma **DWIE SYSTEMY AUTH jednocześnie** które się gryzą:

1. **NextAuth** (stary system) - używany w `/components/dashboard/header.tsx`
2. **Supabase Auth** (nowy system) - używany w `/app/dashboard/page.tsx`

## 🔍 **SYMPTOMY**
- ✅ Logowanie przez Supabase działa (`/auth/signin`)
- ❌ Dashboard header pokazuje `email@example.com` (NextAuth fallback)
- ❌ Upload files daje "Unauthorized" (NextAuth session nie istnieje)
- ❌ Przyciski ustawień nie działają (błędne dane user)

## 📁 **PLIKI Z PROBLEMAMI**

### NextAuth (DO USUNIĘCIA):
- `/src/lib/auth.ts` - Cała konfiguracja NextAuth
- `/src/components/dashboard/header.tsx:14` - `useSession` from NextAuth
- `/src/app/api/upload/route.ts` - Pewnie używa `getServerSession`
- Wszystkie `/src/app/api/**` które używają `getServerSession`

### Supabase Auth (GOOD):
- `/src/lib/supabase.ts` - Client konfiguracja ✅
- `/src/app/auth/signin/page.tsx` - Supabase auth ✅
- `/src/app/dashboard/page.tsx` - Supabase user check ✅

## 🎯 **PLAN NAPRAWY**

### 1. USUŃ NextAuth (PRIORITY 1)
```bash
npm uninstall next-auth @auth/supabase-adapter
```

### 2. ZAMIEŃ header.tsx na Supabase
```typescript
// ZAMIAST: useSession from NextAuth
// UŻYJ: supabase.auth.getUser()
```

### 3. NAPRAW API endpoints
Wszystkie API które używają `getServerSession` zmienić na:
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### 4. SKONFIGURUJ Google OAuth w Supabase Dashboard
- Dashboard → Authentication → Providers → Google
- Dodaj prawdziwe Google Client ID/Secret

## 📝 **DANE UŻYTKOWNIKA**
- Email: `chudziszewski221@gmail.com`
- Chce logować przez Google OAuth
- Ma dostęp jako developer "rolbestcompany123"

## ⚡ **SZYBKA NAPRAWA**
1. Napraw header.tsx (użyj Supabase)
2. Napraw upload API (użyj Supabase)
3. Test: Zaloguj przez Google → Sprawdź czy upload działa

---
**Zapisane: 2025-01-20 8:00 - Bartek issue reportowane przez usera**