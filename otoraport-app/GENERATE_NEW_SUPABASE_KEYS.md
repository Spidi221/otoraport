# FIX dla błędu "Invalid API key"

## Problem
Anon key w .env.local jest nieprawidłowy i powoduje błąd "Invalid API key" podczas rejestracji.

## Rozwiązanie tymczasowe (już zastosowane)
Używamy service role key zamiast anon key w `src/lib/supabase.ts`. To działa, ale NIE jest bezpieczne dla produkcji.

## Rozwiązanie właściwe - WYKONAJ TE KROKI:

### Opcja A: Napraw istniejący projekt Supabase

1. Zaloguj się do Supabase Dashboard:
   https://supabase.com/dashboard

2. Przejdź do projektu `maichqozswcomegcsaqg`:
   https://supabase.com/dashboard/project/maichqozswcomegcsaqg/settings/api

3. Skopiuj NOWE klucze:
   - **anon (public) key** - to jest klucz publiczny dla frontendu
   - **service_role (secret) key** - to jest klucz prywatny dla backendu

4. Zaktualizuj `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://maichqozswcomegcsaqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SKOPIUJ ANON KEY Z DASHBOARD]
SUPABASE_SERVICE_ROLE_KEY=[SKOPIUJ SERVICE ROLE KEY Z DASHBOARD]
```

### Opcja B: Stwórz nowy projekt Supabase (zalecane)

1. Przejdź do: https://supabase.com/dashboard

2. Kliknij "New Project"

3. Wypełnij:
   - Name: `otoraport-production`
   - Database Password: [zapisz bezpiecznie]
   - Region: Frankfurt (eu-central-1)
   - Plan: Free tier

4. Po utworzeniu projektu, przejdź do Settings > API

5. Skopiuj klucze i zaktualizuj `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[NOWY-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[NOWY ANON KEY]
SUPABASE_SERVICE_ROLE_KEY=[NOWY SERVICE ROLE KEY]
```

6. Uruchom migracje bazy danych:
```bash
cd /Users/bartlomiejchudzik/Documents/Agencja\ AI/Real\ Estate\ App/otoraport-app
npx supabase db push
```

## Po zaktualizowaniu kluczy:

1. Cofnij tymczasową poprawkę w `src/lib/supabase.ts`:
   - Zmień z powrotem na używanie `supabaseAnonKey` zamiast `supabaseServiceKey`

2. Zrestartuj aplikację:
```bash
npm run dev
```

3. Przetestuj rejestrację na http://localhost:3010/auth/register

## WAŻNE UWAGI BEZPIECZEŃSTWA:

- **NIGDY** nie używaj service role key w kliencie (frontend)
- Service role key ma pełny dostęp do bazy danych i omija wszystkie RLS (Row Level Security)
- Anon key jest bezpieczny do użycia w frontendzie i respektuje RLS

## Vercel Environment Variables

Po naprawieniu lokalnie, zaktualizuj też zmienne środowiskowe na Vercel:
1. https://vercel.com/dashboard/project/[twój-projekt]/settings/environment-variables
2. Zaktualizuj wszystkie 3 klucze Supabase
3. Redeploy aplikację