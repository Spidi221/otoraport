# 🔄 INSTRUKCJA: MIGRACJA Z ZACHOWANIEM DANYCH

## 📊 CO MAM W BAZIE (z KROK 1):

✅ **4 deweloperów** - zostanąTY zachowani
✅ **75 properties** - zostaną zachowane + rozbudowane
✅ **10 projektów** - zostaną zachowane
✅ **RLS włączony** - zostanie zachowany
✅ **Indexes** - zostaną uzupełnione

## ⚠️ CO ZOSTANIE ZMIENIONE:

### **Tabela `developers`:**
- ✅ ZACHOWANE: wszystkie istniejące dane
- ➕ DODANE: 20+ nowych pól ministerstwa
  - `headquarters_voivodeship, _county, _municipality...` (8 pól)
  - `sales_office_voivodeship, _county...` (8 pól)
  - `additional_sales_locations, contact_method, website...` (4 pola)
  - `stripe_customer_id, stripe_subscription_id`
  - `csv_url` (auto-generowany!)

### **Tabela `properties`:**
- ✅ ZACHOWANE: wszystkie 75 rekordów
- ✅ ZACHOWANE: `raw_data` JSONB (bez zmian)
- ➕ DODANE: 40+ nowych kolumn ministerstwa
- 🔄 MIGROWANE: dane z `raw_data` → nowe kolumny
  - `apartment_number, area, rooms` → z JSON
  - `wojewodztwo, powiat, gmina...` → z JSON
  - `price_per_m2, base_price, final_price` → z JSON

### **Tabela `projects`:**
- ✅ ZACHOWANE: wszystkie 10 projektów bez zmian

### **Tabele USUNIĘTE:**
- ❌ `file_uploads` (backup zostanie utworzony)
- ❌ `notification_logs` (backup zostanie utworzony)
- ❌ `uploaded_files` (backup zostanie utworzony)

### **Tabele NOWE:**
- ➕ `csv_generation_logs` - historia raportów

---

## 🚀 JAK WYKONAĆ KROK 3:

### **OPCJA A: Bezpieczna (ZALECANA)**

1. **Otwórz Supabase SQL Editor**

2. **Skopiuj i wykonaj KROK 3** (cały plik)

3. **Poczekaj 30-60 sekund** (migracja danych z JSON)

4. **Sprawdź wyniki** (na końcu SQL-a są SELECT-y)

### **OPCJA B: Test na kopii bazy (najbezpieczniejsza)**

1. W Supabase Dashboard → **Database** → **Backups**
2. Kliknij **Create backup**
3. Poczekaj na backup
4. Dopiero potem wykonaj KROK 3

---

## 🧪 CO SPRAWDZIĆ PO MIGRACJI:

### **1. Liczba rekordów (musi się zgadzać!):**

```sql
SELECT
  'developers' as table_name,
  COUNT(*) as count
FROM developers
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'projects', COUNT(*) FROM projects;
```

**Oczekiwane:**
- developers: **4**
- properties: **75**
- projects: **10**

### **2. Wypełnienie danych w properties:**

```sql
SELECT
  COUNT(*) FILTER (WHERE apartment_number IS NOT NULL) as z_numerem_mieszkania,
  COUNT(*) FILTER (WHERE wojewodztwo IS NOT NULL) as z_wojewodztwem,
  COUNT(*) FILTER (WHERE price_per_m2 > 0) as z_cena,
  COUNT(*) as total
FROM properties;
```

**Oczekiwane:**
- `z_numerem_mieszkania`: powinno być blisko 75
- `z_wojewodztwem`: powinno być blisko 75
- `z_cena`: zależy od tego co było w raw_data

### **3. URLs developerów:**

```sql
SELECT
  client_id,
  xml_url,
  csv_url,
  md5_url
FROM developers
LIMIT 3;
```

**Oczekiwane:**
- Wszystkie URLs powinny być wypełnione
- Format: `https://otoraport.vercel.app/api/public/{client_id}/data.xml`

### **4. Nowe kolumny w developers:**

```sql
SELECT
  company_name,
  headquarters_voivodeship,
  sales_office_city,
  contact_method,
  website
FROM developers
LIMIT 2;
```

**Oczekiwane:**
- Kolumny istnieją (mogą być NULL)

---

## 🔍 STRUKTURA raw_data (do sprawdzenia)

Przed migracją, sprawdź jak wygląda twój JSON w `raw_data`:

```sql
SELECT
  id,
  raw_data
FROM properties
LIMIT 1;
```

**Jeśli twój JSON ma inne klucze niż:**
- `apartment_number`, `area`, `rooms`
- `wojewodztwo`, `powiat`, `gmina`
- `price_per_m2`, `base_price`, `final_price`

**To musisz dostosować CZĘŚĆ 5 w KROK 3!**

Przykład JSON który zakładam:
```json
{
  "apartment_number": "A1",
  "area": 50.5,
  "rooms": 3,
  "wojewodztwo": "mazowieckie",
  "price_per_m2": 15000,
  "base_price": 757500,
  "final_price": 780000
}
```

Jeśli twój JSON ma inne nazwy pól - **DAJ ZNAĆ PRZED WYKONANIEM!**

---

## ⚠️ CO JEŚLI COŚ PÓJDZIE ŹLE?

### **Scenariusz 1: Błąd podczas wykonania**

1. Skopiuj **PEŁNY komunikat błędu**
2. Wklej do czatu
3. Naprawię SQL i dam nową wersję

### **Scenariusz 2: Dane zniknęły**

**NIE PANIKUJ!** Backup tables są utworzone:
- `developers_backup`
- `properties_backup`
- `projects_backup`

Przywrócenie:
```sql
-- Przywróć developers
TRUNCATE developers CASCADE;
INSERT INTO developers SELECT * FROM developers_backup;

-- Przywróć properties
TRUNCATE properties CASCADE;
INSERT INTO properties SELECT * FROM properties_backup;

-- Przywróć projects
TRUNCATE projects CASCADE;
INSERT INTO projects SELECT * FROM projects_backup;
```

### **Scenariusz 3: Migracja danych z JSON nie działa**

Sprawdź strukturę JSON:
```sql
SELECT raw_data FROM properties LIMIT 1;
```

Wyślij mi przykład - dostosuję kod migracji.

---

## 📋 CHECKLIST PRZED WYKONANIEM:

- [ ] Mam backup bazy (lub zaakceptowałem ryzyko)
- [ ] Sprawdziłem strukturę `raw_data` w properties
- [ ] Jestem w Supabase SQL Editor
- [ ] Mam skopiowany cały KROK_3 SQL
- [ ] Jestem gotów poczekać 30-60 sekund

## 📋 CHECKLIST PO WYKONANIU:

- [ ] Sprawdziłem liczby rekordów (4, 75, 10)
- [ ] Sprawdziłem wypełnienie danych w properties
- [ ] Sprawdziłem czy URLs są wygenerowane
- [ ] Sprawdziłem przykładowy property czy ma dane
- [ ] Usunąłem backup tables (opcjonalne, po weryfikacji)

---

## 🎯 NASTĘPNE KROKI:

Po pomyślnej migracji:

1. **Przetestuj endpoint CSV:**
```bash
curl https://otoraport.vercel.app/api/public/{client_id}/data.csv
```

2. **Przetestuj endpoint XML:**
```bash
curl https://otoraport.vercel.app/api/public/{client_id}/data.xml
```

3. **Dodaj brakujące dane ręcznie** (jeśli coś się nie zmigrowa łodowań)

4. **Usuń backup tables** (gdy wszystko działa):
```sql
DROP TABLE developers_backup;
DROP TABLE properties_backup;
DROP TABLE projects_backup;
```

---

## 📞 POTRZEBUJESZ POMOCY?

**PRZED wykonaniem KROK 3:**
- Pokaż mi przykład `raw_data` z properties
- Powiedz jeśli masz wątpliwości

**PO wykonaniu KROK 3:**
- Pokaż wyniki weryfikacji (SELECT-y z sekcji "Co sprawdzić")
- Jeśli są błędy - skopiuj komunikaty

---

**Data:** 01.10.2025
**Wersja:** 1.0 (dostosowana do twojej bazy)
**Status:** Gotowy do wykonania
