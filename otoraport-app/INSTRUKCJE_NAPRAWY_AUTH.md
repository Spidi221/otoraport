# 🔴 INSTRUKCJE NAPRAWY AUTORYZACJI - KRYTYCZNE!

## PROBLEM: "Invalid API key" 
Twoje klucze Supabase są nieprawidłowe lub przestarzałe.

## CO MUSISZ ZROBIĆ TERAZ (TY):

### 1. **Wejdź do Supabase Dashboard:**
```
https://supabase.com/dashboard/project/maichqozswcomegcsaqg/settings/api
```

### 2. **Skopiuj NOWE klucze:**
- **Project URL**: `https://maichqozswcomegcsaqg.supabase.co`
- **anon (public) key**: Skopiuj ten długi klucz zaczynający się od `eyJ...`
- **service_role (secret) key**: Skopiuj ten drugi klucz

### 3. **Zaktualizuj .env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://maichqozswcomegcsaqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[WKLEJ ANON KEY TUTAJ]
SUPABASE_SERVICE_ROLE_KEY=[WKLEJ SERVICE ROLE KEY TUTAJ]
```

### 4. **Zaktualizuj Vercel Environment Variables:**
```
https://vercel.com/[twoje-konto]/otoraport-app/settings/environment-variables
```
Zaktualizuj te same 3 zmienne co w .env.local

### 5. **Sprawdź ustawienia Auth w Supabase:**
```
Authentication → Settings → Auth:
- Site URL: https://otoraport.vercel.app
- Redirect URLs: https://otoraport.vercel.app/auth/callback
```

### 6. **WYŁĄCZ Email Confirmation (tymczasowo):**
```
Authentication → Settings → Auth → Email Auth:
- [ ] Enable email confirmations - ODZNACZ TO!
```

## CO JA ZROBIŁEM:
- ✅ Naprawiłem supabase.ts (używa teraz anon key zamiast service key)
- ✅ Naprawiłem callback handling
- ✅ Dodałem lepsze error handling

## RESTART APLIKACJI:
Po zaktualizowaniu kluczy:
1. Zatrzymaj aplikację (Ctrl+C)
2. npm run dev
3. Testuj rejestrację

## TESTUJ:
1. Email signup: https://otoraport.vercel.app/auth/signup
2. Google OAuth: Kliknij "Kontynuuj z Google"

**TO MUSI DZIAŁAĆ PO ZAKTUALIZOWANIU KLUCZY!**