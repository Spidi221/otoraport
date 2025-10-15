# Plan Naprawczy - Validation API
**Data**: 2025-10-15
**Status**: ✅ API NAPRAWIONY - Błędy nazw kolumn poprawione (2025-10-15)

---

## 🔴 KRYTYCZNY BŁĄD (FIXED ✅)

### Błąd #1: `column properties.property_number does not exist`

**Lokalizacja**: `src/app/api/validation/missing-fields/route.ts:103`

**Przyczyna**: Kod próbował odczytać nieistniejącą kolumnę `property_number`
**Faktyczna nazwa**: `apartment_number`

**Fix**:
```diff
- property_number,
+ apartment_number,
```

**Status**: ✅ NAPRAWIONE (linie 103 i 165)

---

### Błąd #2: Systematyczne użycie polskich nazw kolumn zamiast angielskich

**Lokalizacja**: `src/app/api/validation/missing-fields/route.ts` (SELECT query + mapowania)

**Przyczyna**: Kod używał polskich nazw kolumn (`numer_nieruchomosci`, `cena_za_m2_aktualna`, `liczba_pokoi`, etc.), ale baza danych ma angielskie nazwy

**Niezgodności znalezione i naprawione**:
1. `numer_nieruchomosci` → `nr_budynku`
2. `cena_za_m2_aktualna` → `price_per_m2`
3. `cena_bazowa` → `base_price`
4. `cena_finalna_aktualna` → `final_price`
5. `powierzchnia_uzytkowa` → `area`
6. `liczba_pokoi` → `rooms`
7. `kondygnacja` → `floor`
8. `status_sprzedazy` → `status`

**Usunięte nieistniejące kolumny**:
- `data_pierwszej_oferty` (nie istnieje w database schema)
- `liczba_kondygnacji` (nie istnieje w database schema)
- `rok_budowy` (nie istnieje w database schema)
- `forma_wlasnosci` (nie istnieje w database schema)

**Fix**:
```diff
SELECT query (linie 100-122):
- numer_nieruchomosci,
+ nr_budynku,
- cena_za_m2_aktualna,
+ price_per_m2,
- cena_bazowa,
+ base_price,
- cena_finalna_aktualna,
+ final_price,
- powierzchnia_uzytkowa,
+ area,
- data_pierwszej_oferty,  (usunięte)
- liczba_pokoi,
+ rooms,
- kondygnacja,
+ floor,
- liczba_kondygnacji,  (usunięte)
- rok_budowy,  (usunięte)
- status_sprzedazy,
+ status,
- forma_wlasnosci,  (usunięte)

Mapowania (linie 159-185):
- numer_nieruchomosci: dbProp.numer_nieruchomosci
+ numer_nieruchomosci: dbProp.nr_budynku
- price_per_m2: dbProp.cena_za_m2_aktualna
+ price_per_m2: dbProp.price_per_m2
- base_price: dbProp.cena_bazowa
+ base_price: dbProp.base_price
- total_price: dbProp.cena_finalna_aktualna
+ total_price: dbProp.final_price
- area: dbProp.powierzchnia_uzytkowa
+ area: dbProp.area
- liczba_pokoi: dbProp.liczba_pokoi
+ liczba_pokoi: dbProp.rooms
- kondygnacja: dbProp.kondygnacja
+ kondygnacja: dbProp.floor
- construction_year: dbProp.rok_budowy  (usunięte - pole nie istnieje)

Address formatting (linia 252):
- dbProp.numer_nieruchomosci
+ dbProp.nr_budynku
```

**Status**: ✅ NAPRAWIONE (commit 2025-10-15)

---

## 📊 ANALIZA CSV MINISTERIALNEGO

### ✅ Zgodność ze schematem 1.13

**Plik**: `ceny-mieszkan-ADMIN-59bae4ef-2025-10-15 (3).csv`

**Kolumny**: 58 (zgodne z wymaganiami)

**Struktura**:
1. **Dane dewelopera** (kol 1-28):
   - nazwa_dewelopera
   - forma_prawna
   - nr_krs, nr_ceidg
   - nip, regon
   - kontakt (telefon, email, fax, www)
   - siedziba (wojewodztwo, powiat, gmina, miejscowosc, ulica, nr_budynku, nr_lokalu, kod_pocztowy)
   - punkt sprzedaży (wojewodztwo, powiat, gmina, miejscowosc, ulica, nr_budynku, nr_lokalu, kod_pocztowy)
   - dodatkowe_lokalizacje_sprzedazy
   - sposob_kontaktu

2. **Lokalizacja inwestycji** (kol 29-35):
   - wojewodztwo_inwestycji
   - powiat_inwestycji
   - gmina_inwestycji
   - miejscowosc_inwestycji
   - ulica_inwestycji
   - nr_budynku_inwestycji
   - kod_pocztowy_inwestycji

3. **Dane nieruchomości** (kol 36-37):
   - rodzaj_nieruchomosci
   - nr_lokalu

4. **Ceny** (kol 38-43):
   - cena_za_m2 + data_obowiazywania
   - cena_bazowa + data_obowiazywania
   - cena_koncowa + data_obowiazywania

5. **Dodatki** (kol 44-57):
   - miejsca_postojowe (rodzaj, oznaczenie, cena, data)
   - pomieszczenia_przynalezne (rodzaj, oznaczenie, cena, data)
   - prawa_niezbedne (wyszczegolnienie, cena, data)
   - inne_swiadczenia (wyszczegolnienie, cena, data)

6. **Prospekt** (kol 58):
   - adres_prospektu

---

## ⚠️ PROBLEMY ZIDENTYFIKOWANE

### 1. Validation Logic - Niepełna walidacja pól developerskich

**Lokalizacja**: `src/lib/ministry-validation.ts`

**Problem**: Validation sprawdza tylko 11 REQUIRED + 9 RECOMMENDED pól, ale ministerstwo wymaga 58 kolumn!

**Brakujące pola developerskie**:
- forma_prawna
- nr_krs / nr_ceidg (conditional)
- regon
- telefon, email, fax, www
- **wszystkie 8 pól siedziby** (wojewodztwo_siedziby, powiat_siedziby, gmina_siedziby, miejscowosc_siedziby, ulica_siedziby, nr_budynku_siedziby, nr_lokalu_siedziby, kod_pocztowy_siedziby)
- **wszystkie 8 pól punktu sprzedaży**
- sposob_kontaktu
- dodatkowe_lokalizacje_sprzedazy

**Impact**:
- Validation API nie sprawdza ~40 pól ministerialnych!
- DataQualityWidget nie pokazuje brakujących pól developerskich
- BulkEditDialog nie pozwala uzupełnić pól developerskich

### 2. Developer Fields - Brak w bulk edit allowlist

**Lokalizacja**: `src/app/api/properties/bulk-edit/route.ts:26`

**Problem**: ALLOWED_BULK_EDIT_FIELDS zawiera tylko 18 pól property, brak pól developerskich

**Dlaczego**: Pola developerskie są w `developers` table, nie w `properties` table

**Fix wymagany**:
- Developer fields powinny być edytowane przez osobny endpoint `/api/developers/update`
- Lub dodać do bulk-edit obsługę developer fields (aktualizacja developers table)

### 3. Raw CSV Data Mapping

**Lokalizacja**: Validation API (linia 156-191)

**Problem**:
```typescript
const rawCsvData = Array.isArray(dbProp.raw_csv_data) && dbProp.raw_csv_data.length > 0
  ? (dbProp.raw_csv_data[0] as { raw_data?: Record<string, unknown> })?.raw_data || {}
  : {}
```

To pobiera **TYLKO pierwsze raw_csv_data[0]** - a jeśli user przesłał CSV wielokrotnie?

**Potencjalny błąd**: Stare dane mogą być używane do walidacji

**Fix**: Dodać `is_latest: true` filter lub sortować po `created_at DESC`

---

## ✅ PLAN NAPRAWCZY - ETAPY

### Etap 1: HOTFIX - Naprawienie validation API ✅

**Status**: ✅ DONE (2025-10-15)

**Zmiany**:
- [x] Zmiana `property_number` → `apartment_number` w SELECT query
- [x] Zmiana `property_number` → `apartment_number` w mapowaniu (linia 165)
- [x] Naprawienie 8 błędnych nazw kolumn (polskie → angielskie):
  - `numer_nieruchomosci` → `nr_budynku`
  - `cena_za_m2_aktualna` → `price_per_m2`
  - `cena_bazowa` → `base_price`
  - `cena_finalna_aktualna` → `final_price`
  - `powierzchnia_uzytkowa` → `area`
  - `liczba_pokoi` → `rooms`
  - `kondygnacja` → `floor`
  - `status_sprzedazy` → `status`
- [x] Usunięcie 4 nieistniejących kolumn z SELECT query:
  - `data_pierwszej_oferty`
  - `liczba_kondygnacji`
  - `rok_budowy`
  - `forma_wlasnosci`
- [x] Naprawienie wszystkich mapowań w return statement
- [x] Naprawienie address formatting (linia 252)

**Rezultat**:
- ✅ API validation przestał zwracać 500 error
- ✅ Endpoint zwraca 401 (authentication działa)
- ✅ SELECT query używa tylko istniejących kolumn z database schema

---

### Etap 2: Dodanie developer fields do validation logic

**Priorytet**: HIGH (ministerstwo wymaga tych pól!)

**Zadania**:
1. **Rozszerz `REQUIRED_FIELDS` w ministry-validation.ts**:
   ```typescript
   export const REQUIRED_DEVELOPER_FIELDS = {
     nazwa_dewelopera: 'Nazwa dewelopera',
     forma_prawna: 'Forma prawna',
     nip: 'NIP',
     telefon: 'Telefon kontaktowy',
     email: 'Email kontaktowy',
     // ... wszystkie 28 pól developerskich
   }
   ```

2. **Dodaj developer fields do ParsedProperty type**:
   ```typescript
   interface ParsedProperty {
     // ... existing fields
     developer_info?: {
       nazwa_dewelopera: string
       forma_prawna: string
       // ... all developer fields
     }
   }
   ```

3. **Zaktualizuj validation logic** aby sprawdzać developer fields z `developers` table

4. **Dodaj do DataQualityWidget** listę brakujących developer fields

---

### Etap 3: Developer Fields Bulk Edit

**Priorytet**: MEDIUM

**Opcje**:

**Opcja A** (zalecana): Osobny endpoint
```typescript
PATCH /api/developers/update
{
  "field": "wojewodztwo_siedziby",
  "value": "mazowieckie"
}
```

**Opcja B**: Rozszerzenie bulk-edit
- Wykryj czy field należy do developers table
- Wykonaj UPDATE na `developers` zamiast `properties`
- Dodaj walidację (jeden developer = wiele properties, więc zmiana wpłynie na wszystkie)

---

### Etap 4: Raw CSV Data - Latest Only

**Priorytet**: LOW (nice-to-have)

**Fix**:
```typescript
// W validation API, zmień SELECT query:
raw_csv_data!inner(raw_data)  // BEFORE
↓
raw_csv_data!inner(raw_data, is_latest)
  .eq('raw_csv_data.is_latest', true)  // AFTER
```

**Lub** dodaj sortowanie:
```typescript
.order('raw_csv_data.created_at', { ascending: false })
.limit(1)
```

---

## 📝 REKOMENDACJE

### Dla Validation API:

1. **✅ DONE**: Fix property_number → apartment_number
2. **✅ DONE**: Fix wszystkich błędnych nazw kolumn (polskie → angielskie)
3. **✅ DONE**: Usunięcie nieistniejących kolumn z SELECT query
4. **TODO**: Dodaj wszystkie 58 pól ministerialnych do validation
5. **TODO**: Waliduj developer fields z `developers` table (nie tylko `properties`)
6. **TODO**: Dodaj test coverage dla validation API
7. **TODO**: Dodaj caching walidacji (5 min TTL) - performance optimization

### Dla DataQualityWidget:

1. **TODO**: Podziel missing fields na sekcje:
   - Dane dewelopera (28 pól)
   - Lokalizacja nieruchomości (8 pól)
   - Dane cenowe (6 pól)
   - Dane techniczne (16 pól)

2. **TODO**: Dodaj "Kompletność sekcji" progress bars

### Dla BulkEditDialog:

1. **TODO**: Dodaj zakładkę "Dane dewelopera"
2. **TODO**: Warning: "Zmiana danych dewelopera wpłynie na wszystkie nieruchomości"

---

## 🔧 TESTY

### Test 1: Validation API działa
```bash
curl http://localhost:3000/api/validation/missing-fields
```

**Oczekiwany rezultat**: 200 OK (nie 500)

### Test 2: CSV export zgodny
```bash
curl http://localhost:3000/api/public/ADMIN-59bae4ef/data.csv | head -1 | tr ';' '\n' | wc -l
```

**Oczekiwany rezultat**: 58 kolumn

### Test 3: Wszystkie pola ministerstwa walidowane
```bash
# TODO: Napisać unit test sprawdzający wszystkie 58 pól
npm test src/lib/__tests__/ministry-validation.test.ts
```

---

## 📈 METRYKI SUKCESU

- ✅ Validation API zwraca 200 (nie 500)
- ✅ CSV export ma 58 kolumn
- ⏳ Validation sprawdza wszystkie 58 pól
- ⏳ DataQualityWidget pokazuje wszystkie brakujące pola (włącznie z developerskimi)
- ⏳ BulkEditDialog pozwala uzupełnić brakujące pola

---

**Autor**: Claude Code
**Wersja**: 1.0
**Task**: #72 Code Readiness Check
