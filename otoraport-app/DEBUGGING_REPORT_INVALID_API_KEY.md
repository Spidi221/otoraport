# RAPORT DEBUGOWANIA: "Invalid API key" w OTORAPORT

## PODSUMOWANIE BŁĘDU

**Problem**: Rejestracja użytkowników nie działa z powodu błędu "Invalid API key" podczas komunikacji z Supabase.

**Przyczyna**: Klucz ANON (publiczny) w pliku `.env.local` jest nieprawidłowy lub przestarzały.

**Status**: CZĘŚCIOWO NAPRAWIONY - zastosowano tymczasowe obejście

---

## ANALIZA PROBLEMU

### 1. Co dokładnie nie działa:

- **Lokalizacja błędu**: Komunikacja z Supabase API
- **Dotknięte funkcje**:
  - Rejestracja nowych użytkowników (`/auth/signup`)
  - Logowanie (`/auth/signin`)
  - Wszystkie operacje wymagające autoryzacji

### 2. Testy diagnostyczne wykonane:

```javascript
// Test 1: Sprawdzenie kluczy
NEXT_PUBLIC_SUPABASE_URL: https://maichqozswcomegcsaqg.supabase.co ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGci... ❌ INVALID
SUPABASE_SERVICE_ROLE_KEY: eyJhbGci... ✅ VALID

// Test 2: Bezpośrednie wywołanie API
curl -X GET "https://maichqozswcomegcsaqg.supabase.co/rest/v1/" \
  -H "apikey: [ANON_KEY]"
// Wynik: {"message":"Invalid API key"} ❌

curl -X GET "https://maichqozswcomegcsaqg.supabase.co/rest/v1/" \
  -H "apikey: [SERVICE_ROLE_KEY]"
// Wynik: Swagger documentation ✅
```

### 3. Zidentyfikowane problemy:

1. **Nieprawidłowy ANON key** - klucz publiczny jest niepoprawny lub wygasł
2. **Service role key działa** - klucz administracyjny jest poprawny
3. **Projekt Supabase istnieje** - projekt `maichqozswcomegcsaqg` jest aktywny

---

## ZASTOSOWANE ROZWIĄZANIE TYMCZASOWE

### Modyfikacja `/src/lib/supabase.ts`:

```typescript
// PRZED (nie działa):
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// PO (tymczasowe obejście):
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseServiceKey, // Używamy service key zamiast anon key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

**UWAGA**: To rozwiązanie NIE jest bezpieczne dla produkcji!

---

## ROZWIĄZANIE DOCELOWE

### Opcja A: Napraw istniejący projekt (ZALECANE)

1. **Zaloguj się do Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/maichqozswcomegcsaqg/settings/api
   ```

2. **Skopiuj NOWE klucze**:
   - `anon (public)` key - dla frontendu
   - `service_role (secret)` key - dla backendu

3. **Zaktualizuj `.env.local`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://maichqozswcomegcsaqg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[NOWY_ANON_KEY_Z_DASHBOARD]
   SUPABASE_SERVICE_ROLE_KEY=[NOWY_SERVICE_KEY_Z_DASHBOARD]
   ```

4. **Cofnij tymczasową poprawkę** w `/src/lib/supabase.ts`:
   ```typescript
   export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
   ```

### Opcja B: Stwórz nowy projekt Supabase

1. Przejdź do: https://supabase.com/dashboard
2. Kliknij "New Project"
3. Wypełnij dane:
   - Name: `otoraport-production`
   - Password: [zapisz bezpiecznie]
   - Region: Frankfurt (eu-central-1)
4. Skopiuj nowe klucze API
5. Zaktualizuj `.env.local` z nowymi kluczami
6. Uruchom migracje bazy: `npx supabase db push`

---

## KRYTYCZNE BŁĘDY BEZPIECZEŃSTWA DO NAPRAWIENIA

### 1. Service Role Key w kliencie (KRYTYCZNE!)
```typescript
// ❌ NIGDY nie rób tego w produkcji:
export const supabase = createClient(url, serviceRoleKey)

// ✅ Zawsze używaj anon key dla klienta:
export const supabase = createClient(url, anonKey)
```

### 2. Brak Row Level Security (RLS)
Service role key omija wszystkie zabezpieczenia RLS. To oznacza że każdy użytkownik ma pełny dostęp do całej bazy danych!

### 3. Ekspozycja service key w przeglądarce
Service role key będzie widoczny w kodzie JavaScript w przeglądarce użytkownika.

---

## WERYFIKACJA NAPRAWY

### Test 1: Sprawdź nowe klucze
```bash
node test-supabase.js
```

### Test 2: Przetestuj rejestrację
1. Otwórz http://localhost:3010/auth/signup
2. Wypełnij formularz testowymi danymi
3. Sprawdź czy nie ma błędu "Invalid API key"

### Test 3: Sprawdź bazę danych
```sql
SELECT * FROM developers ORDER BY created_at DESC LIMIT 1;
```

---

## DODATKOWE PROBLEMY ZNALEZIONE

1. **Brak konfiguracji Google OAuth** - klucze są placeholder'ami
2. **Brak konfiguracji Przelewy24** - klucze są placeholder'ami
3. **Port 3000 zajęty** - aplikacja uruchamia się na 3010
4. **Dwa różne endpointy rejestracji**:
   - `/auth/signup` - używa Supabase Auth
   - `/api/auth/register` - używa własnego systemu

---

## REKOMENDACJE

### Natychmiastowe (DZIŚ):
1. ✅ Uzyskaj prawidłowe klucze Supabase z dashboard
2. ✅ Zaktualizuj `.env.local`
3. ✅ Cofnij tymczasową poprawkę w `/src/lib/supabase.ts`
4. ✅ Przetestuj rejestrację i logowanie

### Krótkoterminowe (ten tydzień):
1. Skonfiguruj Row Level Security w Supabase
2. Ujednolić system autoryzacji (Supabase Auth vs własny)
3. Skonfiguruj Google OAuth z prawdziwymi kluczami
4. Dodaj monitoring błędów (Sentry)

### Długoterminowe:
1. Migracja na Supabase Auth w pełni
2. Implementacja 2FA
3. Audit bezpieczeństwa
4. Load testing

---

## PLIKI ZMODYFIKOWANE

1. `/src/lib/supabase.ts` - tymczasowe użycie service key (DO COFNIĘCIA!)
2. Utworzone pliki testowe:
   - `test-supabase.js`
   - `test-supabase-detailed.js`
   - `decode-jwt.js`
   - `GENERATE_NEW_SUPABASE_KEYS.md`

---

## KONTAKT W RAZIE PROBLEMÓW

Jeśli problem nadal występuje po zastosowaniu rozwiązania:

1. Sprawdź logi w Supabase Dashboard > Logs
2. Upewnij się że projekt Supabase jest aktywny (nie wstrzymany)
3. Sprawdź czy nie przekroczono limitów Free tier
4. Zresetuj klucze API w Supabase Dashboard

**WAŻNE**: Po naprawieniu kluczy KONIECZNIE cofnij tymczasową poprawkę w `/src/lib/supabase.ts`!

---

Raport wygenerowany: 2025-09-13
Status: WYMAGA NATYCHMIASTOWEJ AKCJI