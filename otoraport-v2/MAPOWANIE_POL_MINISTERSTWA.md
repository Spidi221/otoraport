# 📊 MAPOWANIE 58 PÓL MINISTERSTWA → TABELE SUPABASE

## 🎯 OVERVIEW

Ministerstwo wymaga **58 pól w CSV**:
- **28 pól** - dane dewelopera → tabela `developers`
- **7 pól** - lokalizacja inwestycji → tabela `properties`
- **23 pola** - dane mieszkania → tabela `properties`

---

## 📋 TABELA: developers (28 pól ministerstwa)

### **Pola 1-8: Podstawowe dane dewelopera**

| # | Pole CSV (ministerstwo) | Kolumna Supabase | Typ | Wymagane |
|---|---|---|---|---|
| 1 | `nazwa_dewelopera` | `company_name` | VARCHAR(255) | ✅ TAK |
| 2 | `forma_prawna` | `legal_form` | VARCHAR(100) | ✅ TAK |
| 3 | `nr_krs` | `krs_number` | VARCHAR(50) | ❌ NIE |
| 4 | `nr_ceidg` | `ceidg_number` | VARCHAR(50) | ❌ NIE |
| 5 | `nip` | `nip` | VARCHAR(20) | ✅ TAK |
| 6 | `regon` | `regon` | VARCHAR(20) | ❌ NIE |
| 7 | `telefon` | `phone` | VARCHAR(50) | ❌ NIE |
| 8 | `email` | `email` | VARCHAR(255) | ✅ TAK |

### **Pola 9-16: Adres siedziby**

| # | Pole CSV | Kolumna Supabase | Typ |
|---|---|---|---|
| 9 | `wojewodztwo_siedziby` | `headquarters_voivodeship` | VARCHAR(50) |
| 10 | `powiat_siedziby` | `headquarters_county` | VARCHAR(50) |
| 11 | `gmina_siedziby` | `headquarters_municipality` | VARCHAR(100) |
| 12 | `miejscowosc_siedziby` | `headquarters_city` | VARCHAR(100) |
| 13 | `ulica_siedziby` | `headquarters_street` | VARCHAR(200) |
| 14 | `nr_budynku_siedziby` | `headquarters_building_number` | VARCHAR(20) |
| 15 | `nr_lokalu_siedziby` | `headquarters_apartment_number` | VARCHAR(20) |
| 16 | `kod_pocztowy_siedziby` | `headquarters_postal_code` | VARCHAR(10) |

### **Pola 17-24: Adres lokalu sprzedaży**

| # | Pole CSV | Kolumna Supabase | Typ |
|---|---|---|---|
| 17 | `wojewodztwo_lokalu_sprzedazy` | `sales_office_voivodeship` | VARCHAR(50) |
| 18 | `powiat_lokalu_sprzedazy` | `sales_office_county` | VARCHAR(50) |
| 19 | `gmina_lokalu_sprzedazy` | `sales_office_municipality` | VARCHAR(100) |
| 20 | `miejscowosc_lokalu_sprzedazy` | `sales_office_city` | VARCHAR(100) |
| 21 | `ulica_lokalu_sprzedazy` | `sales_office_street` | VARCHAR(200) |
| 22 | `nr_budynku_lokalu_sprzedazy` | `sales_office_building_number` | VARCHAR(20) |
| 23 | `nr_lokalu_sprzedazy` | `sales_office_apartment_number` | VARCHAR(20) |
| 24 | `kod_pocztowy_lokalu_sprzedazy` | `sales_office_postal_code` | VARCHAR(10) |

### **Pola 25-28: Dodatkowe dane kontaktowe**

| # | Pole CSV | Kolumna Supabase | Typ |
|---|---|---|---|
| 25 | `dodatkowe_lokalizacje_sprzedazy` | `additional_sales_locations` | TEXT |
| 26 | `sposob_kontaktu` | `contact_method` | VARCHAR(200) |
| 27 | `adres_strony_www` | `website` | VARCHAR(500) |
| 28 | `dodatkowe_informacje_kontaktowe` | `additional_contact_info` | TEXT |

---

## 🏢 TABELA: properties (30 pól ministerstwa)

### **Pola 29-35: Lokalizacja inwestycji**

| # | Pole CSV | Kolumna Supabase | Typ | Wymagane |
|---|---|---|---|---|
| 29 | `wojewodztwo_inwestycji` | `wojewodztwo` | VARCHAR(50) | ✅ TAK |
| 30 | `powiat_inwestycji` | `powiat` | VARCHAR(50) | ✅ TAK |
| 31 | `gmina_inwestycji` | `gmina` | VARCHAR(100) | ✅ TAK |
| 32 | `miejscowosc_inwestycji` | `miejscowosc` | VARCHAR(100) | ❌ NIE |
| 33 | `ulica_inwestycji` | `ulica` | VARCHAR(200) | ❌ NIE |
| 34 | `nr_budynku_inwestycji` | `nr_budynku` | VARCHAR(20) | ❌ NIE |
| 35 | `kod_pocztowy_inwestycji` | `kod_pocztowy` | VARCHAR(10) | ❌ NIE |

### **Pola 36-44: Podstawowe dane mieszkania**

| # | Pole CSV | Kolumna Supabase | Typ | Wymagane |
|---|---|---|---|---|
| 36 | `rodzaj_nieruchomosci` | `property_type` | VARCHAR(50) | ✅ TAK |
| 37 | `nr_lokalu` | `apartment_number` | VARCHAR(50) | ✅ TAK |
| 38 | `cena_za_m2` | `price_per_m2` | DECIMAL(10,2) | ✅ TAK |
| 39 | `data_obowiazywania_ceny_m2` | `price_valid_from` | DATE | ✅ TAK |
| 40 | `cena_bazowa` | `base_price` | DECIMAL(12,2) | ✅ TAK |
| 41 | `data_obowiazywania_ceny_bazowej` | `base_price_valid_from` | DATE | ✅ TAK |
| 42 | `cena_koncowa` | `final_price` | DECIMAL(12,2) | ✅ TAK |
| 43 | `data_obowiazywania_ceny_koncowej` | `final_price_valid_from` | DATE | ✅ TAK |

**UWAGA:** `area` (powierzchnia) NIE jest w wymaganiach ministerstwa! Ale jest pomocne do obliczeń.

### **Pola 44-47: Miejsca postojowe**

| # | Pole CSV | Kolumna Supabase | Typ |
|---|---|---|---|
| 44 | `miejsca_postojowe_rodzaj` | `parking_type` | VARCHAR(100) |
| 45 | `miejsca_postojowe_oznaczenie` | `parking_designation` | VARCHAR(100) |
| 46 | `miejsca_postojowe_cena` | `parking_price` | DECIMAL(10,2) |
| 47 | `miejsca_postojowe_data` | `parking_date` | DATE |

### **Pola 48-51: Pomieszczenia przynależne (piwnice, komórki)**

| # | Pole CSV | Kolumna Supabase | Typ |
|---|---|---|---|
| 48 | `pomieszczenia_przynalezne_rodzaj` | `storage_type` | VARCHAR(100) |
| 49 | `pomieszczenia_przynalezne_oznaczenie` | `storage_designation` | VARCHAR(100) |
| 50 | `pomieszczenia_przynalezne_cena` | `storage_price` | DECIMAL(10,2) |
| 51 | `pomieszczenia_przynalezne_data` | `storage_date` | DATE |

### **Pola 52-55: Prawa niezbędne do korzystania**

| # | Pole CSV | Kolumna Supabase | Typ |
|---|---|---|---|
| 52 | `prawa_niezbedne_rodzaj` | `necessary_rights_type` | VARCHAR(100) |
| 53 | `prawa_niezbedne_opis` | `necessary_rights_description` | TEXT |
| 54 | `prawa_niezbedne_cena` | `necessary_rights_price` | DECIMAL(10,2) |
| 55 | `prawa_niezbedne_data` | `necessary_rights_date` | DATE |

### **Pola 56-58: Inne świadczenia pieniężne**

| # | Pole CSV | Kolumna Supabase | Typ |
|---|---|---|---|
| 56 | `inne_swiadczenia_rodzaj` | `other_services_type` | VARCHAR(100) |
| 57 | `inne_swiadczenia_cena` | `other_services_price` | DECIMAL(10,2) |
| 58 | `adres_prospektu` | `prospectus_url` | VARCHAR(500) |

---

## 🔄 JAK DZIAŁA GENEROWANIE CSV?

### **Endpoint: `/api/public/{clientId}/data.csv`**

```typescript
// Dla KAŻDEGO property (mieszkania) generuje 1 wiersz CSV:

ROW = [
  // Pola 1-28: Dane dewelopera (z tabeli developers)
  developer.company_name,
  developer.legal_form,
  developer.krs_number,
  // ... wszystkie pola developers

  // Pola 29-35: Lokalizacja (z tabeli properties)
  property.wojewodztwo,
  property.powiat,
  property.gmina,
  // ...

  // Pola 36-58: Dane mieszkania (z tabeli properties)
  property.property_type,
  property.apartment_number,
  property.price_per_m2,
  // ...
]
```

### **Przykład CSV output:**

```csv
nazwa_dewelopera,forma_prawna,nip,...,wojewodztwo_inwestycji,...,nr_lokalu,cena_za_m2,...
INPRO S.A.,Spółka Akcyjna,1234567890,...,mazowieckie,...,A1,15000,...
INPRO S.A.,Spółka Akcyjna,1234567890,...,mazowieckie,...,A2,15500,...
INPRO S.A.,Spółka Akcyjna,1234567890,...,mazowieckie,...,B1,14800,...
```

**Każdy wiersz = jedno mieszkanie**
**Dane dewelopera powtarzają się w każdym wierszu!**

---

## ✅ WALIDACJA PÓL

### **WYMAGANE (nie mogą być NULL):**

**Z developers:**
- `company_name` ✅
- `nip` ✅ (min 10 znaków)
- `email` ✅ (format email)

**Z properties:**
- `wojewodztwo` ✅
- `powiat` ✅
- `gmina` ✅
- `apartment_number` ✅
- `price_per_m2` ✅ (> 0)
- `base_price` ✅ (> 0)
- `final_price` ✅ (>= base_price)
- `price_valid_from` ✅ (data)
- `base_price_valid_from` ✅ (data)
- `final_price_valid_from` ✅ (data)

### **OPCJONALNE (mogą być puste):**

Wszystkie pozostałe pola są opcjonalne. W CSV będą jako puste stringi `""`.

---

## 🧮 AUTOMATYCZNE OBLICZENIA

### **1. Client ID**
```sql
-- Automatycznie generowane przez function
client_id = generate_client_id()
-- Wynik: dev_a1b2c3d4e5f6
```

### **2. URLs (XML, CSV, MD5)**
```sql
-- Automatycznie przez trigger
xml_url = https://otoraport.vercel.app/api/public/{client_id}/data.xml
csv_url = https://otoraport.vercel.app/api/public/{client_id}/data.csv
md5_url = https://otoraport.vercel.app/api/public/{client_id}/data.md5
```

### **3. Updated At**
```sql
-- Automatycznie przy każdym UPDATE
updated_at = NOW()
```

---

## 📊 PRZYKŁAD KOMPLETNEGO REKORDU

### **Developer:**

```sql
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
  website
) VALUES (
  'user-uuid-here',
  generate_client_id(),
  'INPRO Sp. z o.o.',
  'Spółka z ograniczoną odpowiedzialnością',
  '1234567890',
  'kontakt@inpro.pl',
  '+48 22 123 4567',
  'mazowieckie',
  'Warszawa',
  'https://inpro.pl'
);
```

### **Property:**

```sql
INSERT INTO properties (
  developer_id,
  wojewodztwo,
  powiat,
  gmina,
  miejscowosc,
  apartment_number,
  property_type,
  area,
  price_per_m2,
  base_price,
  final_price
) VALUES (
  'developer-uuid-here',
  'mazowieckie',
  'warszawski',
  'Warszawa',
  'Warszawa',
  'A1',
  'mieszkanie',
  50.00,
  15000.00,
  750000.00, -- 50 * 15000
  780000.00  -- base_price + dodatki (parking, etc.)
);
```

### **Wygenerowany CSV (1 wiersz):**

```csv
INPRO Sp. z o.o.,Spółka z ograniczoną odpowiedzialnością,,,1234567890,,...
...,mazowieckie,warszawski,Warszawa,Warszawa,,,,mieszkanie,A1,15000.00,...
...,750000.00,...,780000.00,...
```

---

## 🎯 QUICK REFERENCE

**Chcesz dodać nowego developera?**
→ INSERT do `developers` (min: company_name, nip, email)

**Chcesz dodać mieszkanie?**
→ INSERT do `properties` (min: developer_id, wojewodztwo, powiat, gmina, apartment_number, ceny)

**Chcesz wygenerować CSV?**
→ GET `/api/public/{client_id}/data.csv`

**Chcesz Harvester XML?**
→ GET `/api/public/{client_id}/data.xml`

**Chcesz MD5 checksum?**
→ GET `/api/public/{client_id}/data.md5`

---

**Data:** 01.10.2025
**Wersja:** 1.0
**Status:** Zgodne ze schematem ministerstwa 1.13
