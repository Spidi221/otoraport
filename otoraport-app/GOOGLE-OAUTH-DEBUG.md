# 🔍 GOOGLE OAUTH DEBUG CHECKLIST

## 📋 **KROKI DIAGNOSTYCZNE**

### 1. **Sprawdź Google Console** ✅
- [ ] Client ID skopiowany do Supabase
- [ ] Client Secret skopiowany do Supabase
- [ ] Authorized redirect URIs zawiera:
  - `https://maichqozswcomegcsaqg.supabase.co/auth/v1/callback`
  - `http://localhost:3002/auth/callback` (dla dev)

### 2. **Sprawdź Supabase Dashboard** ✅
- [ ] Authentication → Providers → Google (Enabled)
- [ ] Client ID wklejony
- [ ] Client Secret wklejony
- [ ] Save changes

### 3. **Test w przeglądarce** 🧪
1. Idź na: http://localhost:3002/auth/signin
2. Otwórz F12 → Console
3. Kliknij "Kontynuuj z Google"
4. **Zapisz co widzisz w konsoli:**
   ```
   Starting Google OAuth...
   Current URL: http://localhost:3002
   Redirect URL will be: http://localhost:3002/auth/callback
   Google OAuth response: {data: ..., error: ...}
   ```

### 4. **Możliwe błędy i rozwiązania** ❌

#### **Błąd: "redirect_uri_mismatch"**
**Rozwiązanie**: Dodaj `http://localhost:3002/auth/callback` do Google Console

#### **Błąd: "invalid_client"**
**Rozwiązanie**: Sprawdź Client ID/Secret w Supabase

#### **Błąd: "Provider google is not configured"**
**Rozwiązanie**: Włącz Google provider w Supabase Auth

#### **Błąd: Przekierowanie do Google ale wraca bez danych**
**Rozwiązanie**: Sprawdź czy callback URL jest prawidłowy

### 5. **Sprawdź istniejące konflikty** 🔍
Uruchom w Supabase SQL Editor:
```sql
-- Sprawdź czy user już istnieje
SELECT * FROM auth.users WHERE email = 'chudziszewski221@gmail.com';

-- Sprawdź czy developer profile istnieje
SELECT * FROM developers WHERE email = 'chudziszewski221@gmail.com';
```

### 6. **Localhost vs Production** 🌐

**Problem**: Google OAuth często nie działa na localhost w production mode.

**Rozwiązanie**:
1. Użyj ngrok: `ngrok http 3002`
2. Dodaj ngrok URL do Google Console
3. Lub test na deployed Vercel URL

---

## 🎯 **NASTĘPNE KROKI**

1. **Przetestuj z debug logs**
2. **Uruchom SQL query dla konfliktów**
3. **Jeśli localhost problem → użyj ngrok**
4. **Wyślij mi logi z konsoli**

**Status**: 🔄 Debugowanie w toku