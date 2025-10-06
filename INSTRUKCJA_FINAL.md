# 🚀 INSTRUKCJA: CZYSTY START - ONE CLICK SETUP

## ✅ CO ZROBI TEN SQL:

1. **USUWA** wszystkie stare tabele (developers, properties, projects, etc.)
2. **TWORZY** nową strukturę zgodną w 100% z ministerstwem
3. **DODAJE** wszystkie 58 pól wymaganych przez ministerstwo
4. **USTAWIA** RLS (security)
5. **DODAJE** indexes (performance)
6. **TWORZY** funkcje auto-generowania URLs

---

## 🎯 JAK WYKONAĆ:

### **KROK 1: Otwórz Supabase SQL Editor**

1. Zaloguj się do Supabase: https://supabase.com/dashboard
2. Wybierz projekt: `maichqozswcomegcsaqg`
3. Kliknij **SQL Editor** (lewy panel)

### **KROK 2: Wykonaj SQL**

1. Skopiuj **CAŁY** plik `FINAL_SETUP_CZYSTY_START.sql`
2. Wklej do SQL Editor
3. Kliknij **RUN** (lub Ctrl+Enter)
4. Poczekaj **10-20 sekund**

### **KROK 3: Sprawdź wyniki**

Na końcu SQL-a są 3 SELECT-y weryfikacyjne. Sprawdź:

**Tabele (powinno być 5):**
```
developers
properties
projects
payments
csv_generation_logs
```

**RLS (wszystkie TRUE):**
```
developers        | t
properties        | t
projects          | t
payments          | t
csv_generation_logs | t
```

**Indexes (powinno być 15+):**
```
developers  | 6
properties  | 8
projects    | 2
payments    | 3
csv_generation_logs | 2
```

---

## 👤 JAK DODAĆ SIEBIE JAKO PIERWSZEGO DEVELOPERA:

### **OPCJA A: Przez Aplikację (Zalecane)**

1. Uruchom aplikację: `npm run dev`
2. Idź do: http://localhost:3000/auth/signup
3. Zarejestruj się z emailem (np. `twoj@email.com`)
4. Aplikacja **automatycznie** utworzy profil developera!

### **OPCJA B: Ręcznie przez SQL**

```sql
-- UWAGA: Najpierw musisz się zarejestrować przez aplikację
-- żeby auth.users miał twój rekord!

-- Sprawdź swoje user_id
SELECT id, email FROM auth.users WHERE email = 'twoj@email.com';

-- Dodaj profil developera
INSERT INTO developers (
  user_id,
  client_id,
  company_name,
  legal_form,
  nip,
  email,
  phone,
  headquarters_voivodeship,
  headquarters_city,
  website,
  subscription_plan,
  subscription_status
) VALUES (
  'TWOJE-USER-ID-Z-POWYZSZEGO-SELECTA',  -- ZAMIEŃ NA PRAWDZIWE!
  generate_client_id(),                   -- Auto-generuje: dev_xxxxxxxxxxxx
  'Moja Firma Deweloperska',
  'Spółka z o.o.',
  '1234567890',                           -- Twój NIP
  'twoj@email.com',
  '+48 123 456 789',
  'mazowieckie',
  'Warszawa',
  'https://twoja-strona.pl',
  'trial',
  'active'
);

-- Sprawdź czy się utworzyło
SELECT
  client_id,
  company_name,
  email,
  xml_url,
  csv_url
FROM developers
WHERE email = 'twoj@email.com';
```

**URLs powinny być automatycznie wygenerowane!**
```
xml_url: https://otoraport.vercel.app/api/public/dev_xxxxxxxxxxxx/data.xml
csv_url: https://otoraport.vercel.app/api/public/dev_xxxxxxxxxxxx/data.csv
md5_url: https://otoraport.vercel.app/api/public/dev_xxxxxxxxxxxx/data.md5
```

---

## 🏠 JAK DODAĆ PRZYKŁADOWE MIESZKANIE:

```sql
-- Pobierz swoje developer_id
SELECT id, client_id, company_name
FROM developers
WHERE email = 'twoj@email.com';

-- Dodaj przykładowe mieszkanie
INSERT INTO properties (
  developer_id,
  wojewodztwo,
  powiat,
  gmina,
  miejscowosc,
  ulica,
  nr_budynku,
  kod_pocztowy,
  apartment_number,
  property_type,
  area,
  rooms,
  price_per_m2,
  base_price,
  final_price,
  status
) VALUES (
  'TWOJE-DEVELOPER-ID',  -- Z powyższego SELECT-a
  'mazowieckie',
  'warszawski',
  'Warszawa',
  'Warszawa',
  'Marszałkowska',
  '123',
  '00-001',
  'A1',                   -- Numer mieszkania
  'mieszkanie',
  50.00,                  -- 50 m2
  3,                      -- 3 pokoje
  15000.00,               -- 15 000 PLN/m2
  750000.00,              -- 50 * 15000 = 750 000 PLN
  780000.00,              -- Z dodatkami (parking etc.)
  'available'
);

-- Dodaj więcej mieszkań
INSERT INTO properties (
  developer_id, wojewodztwo, powiat, gmina, miejscowosc,
  apartment_number, property_type, area, rooms,
  price_per_m2, base_price, final_price
)
SELECT
  'TWOJE-DEVELOPER-ID',
  'mazowieckie', 'warszawski', 'Warszawa', 'Warszawa',
  'A' || n::text,          -- A2, A3, A4...
  'mieszkanie',
  45 + (n * 5),            -- Różne powierzchnie
  2 + (n % 3),             -- 2-4 pokoje
  14000 + (n * 100),       -- Różne ceny
  (45 + (n * 5)) * (14000 + (n * 100)),
  (45 + (n * 5)) * (14000 + (n * 100)) * 1.05
FROM generate_series(2, 10) AS n;

-- Sprawdź ile masz mieszkań
SELECT COUNT(*) FROM properties;
```

---

## 🧪 TESTOWANIE ENDPOINTÓW:

### **1. Test Harvester XML:**

```bash
# Zamień dev_xxxx na swój client_id
curl http://localhost:3000/api/public/dev_xxxxxxxxxxxx/data.xml
```

**Powinien zwrócić:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ns2:datasets xmlns:ns2="urn:otwarte-dane:harvester:1.13">
  <dataset status="published">
    <extIdent>dev_xxxxxxxxxxxx_xxxxx</extIdent>
    <resources>
      <resource>
        <url>http://localhost:3000/api/public/dev_xxxxxxxxxxxx/data.csv</url>
      </resource>
    </resources>
  </dataset>
</ns2:datasets>
```

### **2. Test CSV Data:**

```bash
curl http://localhost:3000/api/public/dev_xxxxxxxxxxxx/data.csv
```

**Powinien zwrócić:**
```csv
nazwa_dewelopera,forma_prawna,nip,...,nr_lokalu,cena_za_m2,...
Moja Firma Deweloperska,Spółka z o.o.,1234567890,...,A1,15000,...
```

### **3. Test MD5:**

```bash
curl http://localhost:3000/api/public/dev_xxxxxxxxxxxx/data.md5
```

**Powinien zwrócić:**
```
a1b2c3d4e5f6789012345678901234ab
```

### **4. Weryfikacja MD5:**

```bash
# Pobierz XML i oblicz MD5
curl -s http://localhost:3000/api/public/dev_xxxx/data.xml | md5

# Porównaj z endpointem MD5
curl -s http://localhost:3000/api/public/dev_xxxx/data.md5

# MUSZĄ BYĆ IDENTYCZNE!
```

---

## ✅ CHECKLIST:

- [ ] Wykonałem `FINAL_SETUP_CZYSTY_START.sql`
- [ ] Sprawdziłem że tabele się utworzyły (5 tabel)
- [ ] RLS jest włączony (wszystkie TRUE)
- [ ] Indexes są dodane (15+)
- [ ] Zarejestrowałem się w aplikacji
- [ ] Mam profil developera (sprawdziłem w SQL)
- [ ] URLs są auto-wygenerowane (xml_url, csv_url, md5_url)
- [ ] Dodałem przykładowe mieszkanie
- [ ] Przetestowałem endpoint XML (działa!)
- [ ] Przetestowałem endpoint CSV (działa!)
- [ ] Przetestowałem endpoint MD5 (działa!)
- [ ] MD5 się zgadza z XML-em

---

## 🎯 NASTĘPNE KROKI:

1. **Uruchom aplikację:**
   ```bash
   npm run dev
   ```

2. **Zaloguj się** do dashboardu

3. **Upload CSV** z mieszkaniami (lub dodaj ręcznie)

4. **Przetestuj pełny flow:**
   - Upload → Properties w bazie
   - Endpoint CSV → 58 kolumn
   - Endpoint XML → Harvester XML wskazujący na CSV
   - Endpoint MD5 → Hash XML-a

5. **Deploy na Vercel:**
   ```bash
   vercel --prod
   ```

6. **Zaktualizuj .env w Vercel:**
   ```
   NEXT_PUBLIC_APP_URL=https://otoraport.vercel.app
   ```

7. **Test produkcyjny:**
   ```bash
   curl https://otoraport.vercel.app/api/public/dev_xxxx/data.xml
   ```

---

## 📞 PROBLEMY?

**Błąd podczas wykonania SQL:**
- Skopiuj komunikat błędu
- Wyślij do czatu

**Nie mam user_id:**
- Najpierw zarejestruj się przez aplikację
- Potem sprawdź: `SELECT id FROM auth.users`

**URLs nie są generowane:**
- Sprawdź trigger: `SELECT * FROM pg_trigger WHERE tgname = 'update_developer_urls_trigger'`
- Uruchom ręcznie: `UPDATE developers SET client_id = client_id WHERE id = 'TWOJE-ID'`

**Endpointy nie działają:**
- Sprawdź czy serwer działa: `npm run dev`
- Sprawdź port: `localhost:3000` vs `localhost:3004`
- Sprawdź `.env.local` czy ma `NEXT_PUBLIC_APP_URL`

---

**Data:** 01.10.2025
**Status:** ✅ Gotowy do wykonania
**Czas wykonania:** ~5 minut
**Trudność:** ⭐ Łatwe (one-click)
