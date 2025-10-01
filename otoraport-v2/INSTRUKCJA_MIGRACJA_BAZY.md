# 📊 INSTRUKCJA MIGRACJI BAZY DANYCH SUPABASE

## 🎯 PROCES KROK PO KROKU

### **KROK 1: SPRAWDŹ OBECNĄ STRUKTURĘ** (5 min)

1. Zaloguj się do Supabase Dashboard:
   - URL: https://supabase.com/dashboard
   - Wybierz projekt: `maichqozswcomegcsaqg`

2. Otwórz **SQL Editor** (lewy panel)

3. Skopiuj i wykonaj zawartość pliku:
   ```
   KROK_1_SPRAWDZ_OBECNA_STRUKTURE.sql
   ```

4. **Skopiuj WSZYSTKIE wyniki** i wklej do czatu
   - To pokaże mi dokładnie co masz w bazie
   - Będę wiedział czy są jakieś dane do zachowania
   - Zobaczę czy są konflikty z nową strukturą

---

### **KROK 2: WYKONAJ MIGRACJĘ** (10 min)

⚠️ **UWAGA PRZED WYKONANIEM:**

**Czy masz WAŻNE dane w bazie?**
- ✅ **NIE** - możesz bezpiecznie wykonać KROK 2
- ❌ **TAK** - STOP! Najpierw wykonaj backup (patrz sekcja Backup poniżej)

**Wykonanie migracji:**

1. W **SQL Editor** skopiuj i wykonaj zawartość pliku:
   ```
   KROK_2_MIGRACJA_PELNA_STRUKTURA.sql
   ```

2. Kliknij **RUN** (lub Ctrl+Enter)

3. Poczekaj na wykonanie (może potrwać 10-30 sekund)

4. Sprawdź czy nie ma błędów:
   - ✅ **Brak błędów** - SUPER! Migracja zakończona
   - ❌ **Są błędy** - Skopiuj błędy i wklej do czatu

---

### **KROK 3: WERYFIKACJA** (5 min)

Sprawdź czy wszystko się utworzyło poprawnie:

```sql
-- Sprawdź tabele
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Sprawdź liczbę kolumn w properties (powinno być ~40+)
SELECT COUNT(*) as kolumn_w_properties
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'properties';

-- Sprawdź liczbę kolumn w developers (powinno być ~35+)
SELECT COUNT(*) as kolumn_w_developers
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'developers';
```

**Oczekiwane wyniki:**
- Tabele: `developers`, `properties`, `projects`, `payments`, `csv_generation_logs`
- Kolumny w `properties`: ~40-45
- Kolumny w `developers`: ~35-40

---

## 🔒 BACKUP DANYCH (jeśli masz ważne dane)

### Opcja A: Backup przez Supabase Dashboard

1. Przejdź do **Database** → **Backups**
2. Kliknij **Create backup**
3. Poczekaj na utworzenie backupu
4. Dopiero potem wykonaj KROK 2

### Opcja B: Export danych do CSV

```sql
-- Export developers
COPY developers TO '/tmp/developers_backup.csv' WITH CSV HEADER;

-- Export properties
COPY properties TO '/tmp/properties_backup.csv' WITH CSV HEADER;
```

Następnie pobierz te pliki przez Supabase Storage.

---

## 📋 CO ROBI MIGRACJA KROK 2?

### ✅ **TWORZY nowe tabele:**
1. **`developers`** - 35+ pól (wszystkie wymagania ministerstwa + Stripe)
2. **`properties`** - 40+ pól (wszystkie 58 pól ministerstwa są pokryte)
3. **`projects`** - dla multi-projekt feature
4. **`payments`** - integracja Stripe
5. **`csv_generation_logs`** - historia raportów

### 🔐 **USTAWIA bezpieczeństwo:**
- RLS (Row Level Security) na wszystkich tabelach
- Policies: users widzą tylko swoje dane
- Public access dla endpointów ministerstwa

### ⚡ **OPTYMALIZUJE wydajność:**
- 15+ indexes dla szybkich zapytań
- Full-text search indexes (pg_trgm)
- Composite indexes dla częstych zapytań

### 🤖 **DODAJE automatyzację:**
- Trigger `updated_at` (auto-update timestampu)
- Function `generate_client_id()` (auto-generowanie ID)
- Function `update_developer_urls()` (auto-generowanie URLi XML/CSV/MD5)

### ❌ **USUWA niepotrzebne tabele:**
- `uploaded_files` - już nie używane
- `analytics` - za złożone na start
- `notifications` - niepotrzebne
- `subscription_logs` - zastąpione przez payments

---

## 🆕 NOWE POLA W TABELACH

### **TABELA: developers**

**Ministerstwo wymaga (28 pól):**
```
✅ company_name, legal_form, krs_number, ceidg_number
✅ nip, regon, phone, email
✅ headquarters_* (8 pól adresu siedziby)
✅ sales_office_* (8 pól adresu lokalu sprzedaży)
✅ additional_sales_locations, contact_method, website
✅ additional_contact_info
```

**OTORAPORT dodaje:**
```
✅ subscription_plan, subscription_status, trial_ends_at
✅ stripe_customer_id, stripe_subscription_id
✅ xml_url, csv_url, md5_url (auto-generowane!)
```

### **TABELA: properties**

**Ministerstwo wymaga (58 pól - część z developers, część z properties):**

**Lokalizacja inwestycji (7 pól):**
```
✅ wojewodztwo, powiat, gmina, miejscowosc
✅ ulica, nr_budynku, kod_pocztowy
```

**Dane mieszkania (23 pola):**
```
✅ property_type, apartment_number, area
✅ price_per_m2, price_valid_from
✅ base_price, base_price_valid_from
✅ final_price, final_price_valid_from
✅ parking_* (4 pola)
✅ storage_* (4 pola)
✅ necessary_rights_* (4 pola)
✅ other_services_* (2 pola)
✅ prospectus_url
```

**OTORAPORT dodaje:**
```
✅ rooms, floor (opcjonalne)
✅ status (available/reserved/sold)
✅ project_id (dla multi-projekt)
```

---

## 🧪 TESTOWANIE PO MIGRACJI

### 1. Sprawdź czy RLS działa:

```sql
-- To powinno zwrócić 't' dla każdej tabeli
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 2. Sprawdź czy functions działają:

```sql
-- Test generowania client_id
SELECT generate_client_id();
-- Powinno zwrócić: dev_xxxxxxxxxxxx

-- Test ponownie - powinno być INNE!
SELECT generate_client_id();
```

### 3. Sprawdź indexes:

```sql
-- Powinno być 15+ indexes
SELECT
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

---

## 🚀 NASTĘPNE KROKI PO MIGRACJI

1. **Dodaj testowego developera:**
   ```sql
   INSERT INTO developers (
     user_id,
     client_id,
     company_name,
     nip,
     email
   ) VALUES (
     (SELECT id FROM auth.users LIMIT 1),
     generate_client_id(),
     'Test Developer Sp. z o.o.',
     '1234567890',
     'test@example.com'
   );
   ```

2. **Przetestuj endpointy API:**
   ```bash
   # Test Harvester XML
   curl https://otoraport.vercel.app/api/public/dev_xxxx/data.xml

   # Test CSV
   curl https://otoraport.vercel.app/api/public/dev_xxxx/data.csv

   # Test MD5
   curl https://otoraport.vercel.app/api/public/dev_xxxx/data.md5
   ```

3. **Zaktualizuj .env w Vercel:**
   ```
   NEXT_PUBLIC_APP_URL=https://otoraport.vercel.app
   ```

---

## ❓ FAQ

**Q: Czy mogę uruchomić KROK 2 wielokrotnie?**
A: TAK! SQL jest idempotentny - używa `CREATE IF NOT EXISTS`, `DROP IF EXISTS` itp.

**Q: Co jeśli mam już dane w bazie?**
A: Wykonaj BACKUP przed migracją (patrz sekcja Backup)

**Q: Czy stracę dane z auth.users?**
A: NIE! Tabela `auth.users` jest zarządzana przez Supabase Auth i nie jest dotykana

**Q: Co jeśli pojawią się błędy?**
A: Skopiuj pełny komunikat błędu i wklej do czatu - naprawię SQL

**Q: Jak dodać testowe dane?**
A: Odkomentuj sekcję SEED DATA w KROK 2 (na końcu pliku)

---

## 📞 POTRZEBUJESZ POMOCY?

1. Wykonaj KROK 1 i wklej wyniki do czatu
2. Jeśli KROK 2 daje błędy - wklej błędy do czatu
3. Mogę pomóc w:
   - Migracji istniejących danych
   - Dodaniu custom pól
   - Naprawieniu błędów

---

**Data utworzenia:** 01.10.2025
**Wersja:** 1.0
**Autor:** Claude Code - OTORAPORT V2 Migration
