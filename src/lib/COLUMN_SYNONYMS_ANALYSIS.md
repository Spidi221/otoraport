# Column Synonyms Analysis - Ministry Schema 1.13 Coverage

**Task**: #97.1 - Aggregate Column Name Variants from All Sources
**Date**: 2025-10-15
**Sources Analyzed**:
- TAMBUD CSV: `2025-10-09.csv` (ministerial format)
- ATAL CSV: `atal - Dane.csv` (developer format)
- INPRO CSV: `Ceny-ofertowe-mieszkan-dewelopera-inpro_s__a-2025-10-02.csv` (developer format)
- Ministry Schema: 1.13 (58 official columns)
- Current Parser: `smart-csv-parser.ts` (COLUMN_PATTERNS lines 148-751)

---

## 📋 EXECUTIVE SUMMARY

**Total Ministry Fields**: 58
**Fields Analyzed**: 58
**Fields with Full Coverage**: ~35 (60%)
**Fields with Missing Variants**: ~23 (40%)

**Key Findings**:
1. **TAMBUD uses exact ministry column names** (identical headers)
2. **ATAL uses abbreviated/truncated ministry names** (character limit issues)
3. **INPRO uses compact custom naming** (e.g., "Powierzchnia", "Piętro nieruchomości")
4. **Current COLUMN_PATTERNS has good coverage for property fields** but **missing many developer/location variants**

---

## 🏗️ SECTION 1: DEVELOPER INFO (Columns 1-28)

### Field 1: row_number (optional)

**Ministry Official**: "row_number" (not in Schema 1.13, but used by TAMBUD)
**TAMBUD**: "row_number"
**ATAL**: (not present)
**INPRO**: "Id nieruchomości"

**Current Synonyms in COLUMN_PATTERNS**: ❌ NOT PRESENT

**Missing Variants**:
- 'row_number'
- 'id nieruchomości'
- 'id nieruchomosci'
- 'row number'

---

### Field 2: developer_name

**Ministry Official**: "Nazwa dewelopera"
**TAMBUD**: "Nazwa dewelopera"
**ATAL**: "Nazwa dewelopera"
**INPRO**: "INPRO S. A." (value, not header - uses "Nazwa dewelopera")

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
developer_name: [
  'deweloper', 'nazwa dewelopera', 'developer', 'developer_name',
  'firma', 'nazwa_dewelopera',
  'nazwa dewelopera' // MINISTRY OFFICIAL
]
```

**Missing Variants**: ✅ None (well covered)

---

### Field 3: forma_prawna

**Ministry Official**: "Forma prawna dewelopera"
**TAMBUD**: "Forma prawna dewelopera"
**ATAL**: "Forma prawna dewelopera"
**INPRO**: "Forma prawna dewelopera" (implied - not in visible headers)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
forma_prawna: [
  'forma prawna', 'typ spółki', 'legal_form', 'forma_prawna',
  'rodzaj działalności', 'status prawny firmy',
  'forma prawna dewelopera' // MINISTRY OFFICIAL
]
```

**Missing Variants**: ✅ None (well covered)

---

### Field 4: nr_krs

**Ministry Official**: "Nr KRS"
**TAMBUD**: "Nr KRS"
**ATAL**: "Nr KRS"
**INPRO**: "Nr KRS"

**Current Synonyms in COLUMN_PATTERNS**: ❌ NOT PRESENT

**Missing Variants**:
- 'nr krs'
- 'krs'
- 'numer krs'
- 'nr_krs'
- 'krs_number'

---

### Field 5: nr_ceidg

**Ministry Official**: "Nr wpisu do CEiDG"
**TAMBUD**: "Nr wpisu do CEiDG"
**ATAL**: "Nr wpisu do CEiDG"
**INPRO**: "Nr wpisu do CEiDG"

**Current Synonyms in COLUMN_PATTERNS**: ❌ NOT PRESENT

**Missing Variants**:
- 'nr wpisu do ceidg'
- 'nr ceidg'
- 'ceidg'
- 'nr_ceidg'
- 'ceidg_number'
- 'nr wpisu do ceydg' (typo variant)

---

### Field 6: nip

**Ministry Official**: "Nr NIP"
**TAMBUD**: "Nr NIP"
**ATAL**: "Nr NIP"
**INPRO**: "Nr NIP"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
nip: [
  'nip', 'nr nip', 'numer nip', 'tax_id', 'vat_id', 'nr_nip',
  'nr nip' // MINISTRY OFFICIAL
]
```

**Missing Variants**: ✅ None (well covered)

---

### Field 7: regon

**Ministry Official**: "Nr REGON"
**TAMBUD**: "Nr REGON"
**ATAL**: "Nr REGON"
**INPRO**: "Nr REGON"

**Current Synonyms in COLUMN_PATTERNS**: ❌ NOT PRESENT

**Missing Variants**:
- 'nr regon'
- 'regon'
- 'numer regon'
- 'nr_regon'
- 'regon_number'

---

### Field 8: telefon

**Ministry Official**: "Nr telefonu"
**TAMBUD**: "Nr telefonu"
**ATAL**: "Nr telefonu"
**INPRO**: "Nr telefonu" (value: "+48 58 34 00 371")

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
phone: [
  'telefon', 'tel', 'phone', 'numer telefonu', 'kontakt',
  'tel.', 'telefon_kontaktowy', 'numer_telefonu'
]
```

**Missing Variants**:
- 'nr telefonu' (exact ministry match)

---

### Field 9: email

**Ministry Official**: "Adres poczty elektronicznej"
**TAMBUD**: "Adres poczty elektronicznej"
**ATAL**: "Adres poczty elektronicznej"
**INPRO**: "Adres poczty elektronicznej"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
email: [
  'email', 'e-mail', 'mail', 'adres email', 'contact_email',
  'email_kontaktowy', 'adres_email'
]
```

**Missing Variants**:
- 'adres poczty elektronicznej' (exact ministry match)

---

### Field 10: fax

**Ministry Official**: "Nr faxu"
**TAMBUD**: "Nr faxu"
**ATAL**: "Nr faxu"
**INPRO**: "Nr faxu"

**Current Synonyms in COLUMN_PATTERNS**: ❌ NOT PRESENT

**Missing Variants**:
- 'nr faxu'
- 'fax'
- 'numer faxu'
- 'nr_faxu'
- 'fax_number'

---

### Field 11: strona_internetowa

**Ministry Official**: "Adres strony internetowej dewelopera"
**TAMBUD**: "Adres strony internetowej dewelopera"
**ATAL**: "Adres strony internetowej dewelopera"
**INPRO**: "Adres strony internetowej dewelopera"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
strona_internetowa: [
  'strona internetowa', 'www', 'website', 'strona_internetowa',
  'adres www', 'portal'
]
```

**Missing Variants**:
- 'adres strony internetowej dewelopera' (exact ministry match)

---

### Fields 12-19: Developer HQ Address (Siedziba dewelopera)

**Ministry Official Columns**:
- Col 12: "Województwo adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera"
- Col 13: "Powiat adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera"
- Col 14: "Gmina adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera"
- Col 15: "Miejscowość adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera"
- Col 16: "Ulica adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera"
- Col 17: "Nr nieruchomości adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera"
- Col 18: "Nr lokalu adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera"
- Col 19: "Kod pocztowy adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera"

**TAMBUD/ATAL/INPRO**: All use exact ministry names

**Current Synonyms in COLUMN_PATTERNS**: ❌ NOT PRESENT (no _siedziby variants!)

**Missing Variants for ALL 8 fields**:
- 'województwo adresu siedziby' / 'wojewodztwo adresu siedziby'
- 'powiat adresu siedziby'
- 'gmina adresu siedziby'
- 'miejscowość adresu siedziby' / 'miejscowosc adresu siedziby'
- 'ulica adresu siedziby'
- 'nr nieruchomości adresu siedziby' / 'nr nieruchomosci adresu siedziby'
- 'nr lokalu adresu siedziby'
- 'kod pocztowy adresu siedziby'

**CRITICAL**: Parser currently only recognizes investment location fields, NOT developer HQ fields!

---

### Fields 20-27: Sales Office Address (Punkt sprzedaży)

**Ministry Official Columns**:
- Col 20: "Województwo adresu lokalu, w którym prowadzona jest sprzedaż"
- Col 21: "Powiat adresu lokalu, w którym prowadzona jest sprzedaż"
- Col 22: "Gmina adresu lokalu, w którym prowadzona jest sprzedaż"
- Col 23: "Miejscowość adresu lokalu, w którym prowadzona jest sprzedaż"
- Col 24: "Ulica adresu lokalu, w którym prowadzona jest sprzedaż"
- Col 25: "Nr nieruchomości adresu lokalu, w którym prowadzona jest sprzedaż"
- Col 26: "Nr lokalu adresu lokalu, w którym prowadzona jest sprzedaż"
- Col 27: "Kod pocztowy adresu lokalu, w którym prowadzona jest sprzedaż"

**TAMBUD/ATAL**: Use exact ministry names
**INPRO**: Not present in visible columns (likely empty/X values)

**Current Synonyms in COLUMN_PATTERNS**: ❌ NOT PRESENT (no sales office variants!)

**Missing Variants for ALL 8 fields**:
- 'województwo adresu lokalu w którym prowadzona jest sprzedaż'
- 'powiat adresu lokalu w którym prowadzona jest sprzedaż'
- 'gmina adresu lokalu w którym prowadzona jest sprzedaż'
- 'miejscowość adresu lokalu w którym prowadzona jest sprzedaż'
- 'ulica adresu lokalu w którym prowadzona jest sprzedaż'
- 'nr nieruchomości adresu lokalu w którym prowadzona jest sprzedaż'
- 'nr lokalu adresu lokalu w którym prowadzona jest sprzedaż'
- 'kod pocztowy adresu lokalu w którym prowadzona jest sprzedaż'

**CRITICAL**: Parser has NO recognition for sales office address!

---

### Field 28: dodatkowe_lokalizacje_sprzedazy

**Ministry Official**: "Dodatkowe lokalizacje, w których prowadzona jest sprzedaż"
**TAMBUD**: "Dodatkowe lokalizacje, w których prowadzona jest sprzedaż"
**ATAL**: "Dodatkowe lokalizacje, w których prowadzona jest sprzedaż"
**INPRO**: (not present)

**Current Synonyms in COLUMN_PATTERNS**: ❌ NOT PRESENT

**Missing Variants**:
- 'dodatkowe lokalizacje w których prowadzona jest sprzedaż'
- 'dodatkowe lokalizacje w ktorych prowadzona jest sprzedaz'
- 'dodatkowe_lokalizacje_sprzedazy'
- 'additional_sales_locations'
- 'inne punkty sprzedaży'

---

### Field 29: sposob_kontaktu

**Ministry Official**: "Sposób kontaktu nabywcy z deweloperem"
**TAMBUD**: "Sposób kontaktu nabywcy z deweloperem"
**ATAL**: "Sposób kontaktu nabywcy z deweloperem"
**INPRO**: (not present)

**Current Synonyms in COLUMN_PATTERNS**: ❌ NOT PRESENT

**Missing Variants**:
- 'sposób kontaktu nabywcy z deweloperem'
- 'sposob kontaktu nabywcy z deweloperem'
- 'sposob_kontaktu'
- 'contact_method'
- 'jak skontaktować się'

---

## 🏘️ SECTION 2: INVESTMENT LOCATION (Columns 30-36)

### Field 30: wojewodztwo_inwestycji

**Ministry Official**: "Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**TAMBUD**: "Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**ATAL**: "Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**INPRO**: "Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
wojewodztwo: [
  'województwo', 'wojewodztwo', 'voivodeship', 'region',
  'woj', 'woj.', 'province',
  'wojewodztwo_inwestycji', 'województwo_inwestycji', // SHORT NAMES
  'województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego' // OFFICIAL
]
```

**Missing Variants**: ✅ None (well covered)

---

### Field 31: powiat_inwestycji

**Ministry Official**: "Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**TAMBUD**: "Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**ATAL**: "Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**INPRO**: "Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
powiat: [
  'powiat', 'county', 'district', 'pow', 'pow.',
  'powiat_inwestycji', // SHORT NAME
  'powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego' // OFFICIAL
]
```

**Missing Variants**: ✅ None (well covered)

---

### Field 32: gmina_inwestycji

**Ministry Official**: "Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**TAMBUD**: "Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**ATAL**: "Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**INPRO**: "Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
gmina: [
  'gmina', 'municipality', 'commune', 'gm', 'gm.',
  'gmina_inwestycji', // SHORT NAME
  'gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego' // OFFICIAL
]
```

**Missing Variants**: ✅ None (well covered)

---

### Field 33: miejscowosc_inwestycji

**Ministry Official**: "Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**TAMBUD**: "Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**ATAL**: "Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**INPRO**: "Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
miejscowosc: [
  'miejscowość', 'miejscowosc', 'miasto', 'city', 'town',
  'locality', 'place',
  'miejscowosc_inwestycji', 'miejscowość_inwestycji', // SHORT NAMES
  'miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego' // OFFICIAL
]
```

**Missing Variants**: ✅ None (well covered)

---

### Field 34: ulica_inwestycji

**Ministry Official**: "Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**TAMBUD**: "Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**ATAL**: "Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**INPRO**: "Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
ulica: [
  'ulica', 'ul', 'ul.', 'street', 'adres', 'address',
  'ulica_inwestycji', // SHORT NAME
  'ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego' // OFFICIAL
]
```

**Missing Variants**: ✅ None (well covered)

---

### Field 35: nr_budynku_inwestycji

**Ministry Official**: "Nr nieruchomości lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**TAMBUD**: "Nr nieruchomości lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**ATAL**: "Nr nieruchomości lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**INPRO**: "Nr nieruchomości lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
numer_nieruchomosci: [
  'numer nieruchomości', 'nr nieruchomości', 'numer_nieruchomosci',
  'nr budynku', 'building_number', 'house_number',
  'nr_budynku_inwestycji' // SHORT NAME
]
```

**Missing Variants**:
- 'nr nieruchomości lokalizacji przedsięwzięcia deweloperskiego' (exact ministry match)

---

### Field 36: kod_pocztowy_inwestycji

**Ministry Official**: "Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**TAMBUD**: "Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**ATAL**: "Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"
**INPRO**: "Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
kod_pocztowy: [
  'kod pocztowy', 'kod_pocztowy', 'postal_code', 'zip_code',
  'zip', 'postal',
  'kod_pocztowy_inwestycji' // SHORT NAME
]
```

**Missing Variants**:
- 'kod pocztowy lokalizacji przedsięwzięcia deweloperskiego' (exact ministry match)

---

## 🏠 SECTION 3: PROPERTY DATA (Columns 37-43)

### Field 37: rodzaj_nieruchomosci

**Ministry Official**: "Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny"
**TAMBUD**: "Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny"
**ATAL**: "Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny"
**INPRO**: "Rodzaj nieruchomości: lokal mieszkalny dom jednorodzinny" (no commas)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
property_type: [
  'typ', 'typ lokalu', 'typ mieszkania', 'rodzaj', 'property_type',
  'type', 'kategoria', 'typ_lokalu', 'rodzaj_lokalu'
]
```

**Missing Variants**:
- 'rodzaj nieruchomości lokal mieszkalny dom jednorodzinny' (INPRO exact format)
- 'rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny' (MINISTRY exact with colon and comma)

---

### Field 38: property_number (apartment_number in DB)

**Ministry Official**: "Nr lokalu lub domu jednorodzinnego nadany przez dewelopera"
**TAMBUD**: "Nr lokalu lub domu jednorodzinnego nadany przez dewelopera"
**ATAL**: "Nr lokalu lub domu jednorodzinnego nadany przez dewelopera"
**INPRO**: "Nr nieruchomości nadany przez dewelopera"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
property_number: [
  'nr nieruchomości nadany przez dewelopera', // INPRO exact match
  'nr nieruchomosci nadany przez dewelopera',
  'nr lokalu lub domu jednorodzinnego nadany przez dewelopera', // MINISTRY OFFICIAL
  'oznaczenie lokalu nadane przez dewelopera',
  'nr lokalu', 'numer lokalu', 'nr mieszkania', 'numer mieszkania',
  'lokal', 'mieszkanie', 'property_number', 'apartment_number',
  'nr_lokalu', 'numer_lokalu', 'mieszkanie_nr',
  'nr' // fallback
]
```

**Missing Variants**: ✅ None (excellent coverage!)

---

### Field 39: cena_za_m2

**Ministry Official**: "Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]"
**TAMBUD**: "Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]"
**ATAL**: "Cena m2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego zł"
**INPRO**: "Cena za m2 nieruchomości"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
price_per_m2: [
  'cena za m2 nieruchomości', // INPRO exact
  'cena za m2 nieruchomosci',
  'cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]', // MINISTRY
  'cena metra kwadratowego powierzchni użytkowej',
  'cena za m²', 'cena za m2', 'cena m2', 'cena m²', 'cena/m2', 'cena/m²',
  'cena za m 2', 'cena m 2', 'cena/m 2',
  'price_per_m2', 'price_per_sqm', 'cena_za_m2', 'cena_m2', 'cena za metr'
]
```

**Missing Variants**:
- 'cena m2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego zł' (ATAL variant without "za")

---

### Field 40: data_obowiazywania_ceny_m2

**Ministry Official**: "Data od której cena obowiązuje cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego"
**TAMBUD**: "Data od której cena obowiązuje cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego"
**ATAL**: "Data od której cena obowiązuje cena m2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego"
**INPRO**: "Data od której obowiązuje cena za m2 nieruchomości"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
price_valid_from: [
  'data od', 'obowiązuje od', 'price_valid_from', 'valid_from',
  'cena od', 'od kiedy',
  'data od której cena obowiązuje cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego', // MINISTRY
  'data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3)',
  'data od której cena obowiązuje'
]
```

**Missing Variants**:
- 'data od której obowiązuje cena za m2 nieruchomości' (INPRO exact)

---

### Field 41: cena_bazowa

**Ministry Official**: "Cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]"
**TAMBUD**: "Cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]"
**ATAL**: "Cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni zł"
**INPRO**: "Cena nieruchomości"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
base_price: [
  'cena bazowa', 'cena_bazowa', 'base_price', 'cena podstawowa', 'cena_podstawowa',
  'cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]', // MINISTRY
  'cena będąca iloczynem powierzchni oraz metrażu'
]
```

**Missing Variants**:
- 'cena nieruchomości' (INPRO exact)

---

### Field 42: data_obowiazywania_ceny_bazowej

**Ministry Official**: "Data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni"
**TAMBUD**: (same as ministry)
**ATAL**: "Data od której obowiązuje cena lokalu miesz. lub domu jedn. będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz pow" (truncated!)
**INPRO**: "Data od której obowiązuje cena nieruchomości"

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
base_price_valid_from: [
  'data bazowa', 'data_bazowa', 'data ceny bazowej', 'data_ceny_bazowej', 'base_price_date',
  'data obowiązywania ceny lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni', // MINISTRY
  'data obowiazywania ceny bazowej'
]
```

**Missing Variants**:
- 'data od której obowiązuje cena lokalu miesz. lub domu jedn. będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz pow' (ATAL truncated)
- 'data od której obowiązuje cena nieruchomości' (INPRO exact)

---

### Field 43: cena_finalna

**Ministry Official**: "Cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3) [zł]"
**TAMBUD**: (same as ministry)
**ATAL**: "Cena lokalu miesz. lub domu jedno. uwzględniająca cenę lokalu stanowiącą iloczyn pow. oraz metrażu i innych skł. ceny" (abbreviated!)
**INPRO**: (not present - INPRO may not distinguish base vs final price)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
final_price: [
  'cena finalna', 'cena końcowa', 'cena ostateczna', 'cena_koncowa', 'final_price',
  'cena_finalna', 'cena_ostateczna',
  'cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3) [zł]', // MINISTRY
  'cena uwzględniająca wszystkie składowe'
]
```

**Missing Variants**:
- 'cena lokalu miesz. lub domu jedno. uwzględniająca cenę lokalu stanowiącą iloczyn pow. oraz metrażu i innych skł. ceny' (ATAL abbreviated)

---

### Field 44: data_obowiazywania_ceny_finalnej

**Ministry Official**: "Data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3)"
**TAMBUD**: (same as ministry)
**ATAL**: "Data od Cena lokalu miesz. lub domu jedno. uwzględniająca cenę lokalu stanowiącą iloczyn pow. oraz metrażu i innych skł. ceny" (TYPO: "Data od" instead of "Data od której"!)
**INPRO**: (not present)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
final_price_valid_from: [
  'data finalna', 'data_finalna', 'data ceny finalnej', 'data_ceny_finalnej', 'final_price_date',
  'data końcowa', 'data_koncowa',
  'data obowiązywania ceny lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3)', // MINISTRY
  'data obowiazywania ceny finalnej', 'data obowiazywania ceny koncowej'
]
```

**Missing Variants**:
- 'data od cena lokalu miesz. lub domu jedno. uwzględniająca cenę lokalu stanowiącą iloczyn pow. oraz metrażu i innych skł. ceny' (ATAL typo variant)

---

## 🚗 SECTION 4: PARKING/STORAGE (Columns 45-54)

### Field 45: parking_type

**Ministry Official**: "Rodzaj części nieruchomości będących przedmiotem umowy"
**TAMBUD**: "Rodzaj części nieruchomości będących przedmiotem umowy"
**ATAL**: "Rodzaj części nieruchomości będących przedmiotem umowy"
**INPRO**: (may use "Rodzaj nieruchomości" instead for parking - needs verification)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
parking_type: [
  'miejsce postojowe', 'parking type', 'rodzaj parkingu',
  'rodzaj części nieruchomości będących przedmiotem umowy', // MINISTRY OFFICIAL
  'rodzaj czesci nieruchomosci bedacych przedmiotem umowy'
]
```

**Missing Variants**: ✅ None (covered)

---

### Field 46: parking_designation

**Ministry Official**: "Oznaczenie części nieruchomości nadane przez dewelopera"
**TAMBUD**: "Oznaczenie części nieruchomości nadane przez dewelopera"
**ATAL**: "Oznaczenie części nieruchomości nadane przez dewelopera"
**INPRO**: (may be in custom format)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
parking_designation: [
  'oznaczenie parkingu', 'parking designation', 'nr parkingu',
  'oznaczenie części nieruchomości nadane przez dewelopera', // MINISTRY OFFICIAL
  'oznaczenie czesci nieruchomosci nadane przez dewelopera'
]
```

**Missing Variants**: ✅ None (covered)

---

### Field 47: parking_price

**Ministry Official**: "Cena części nieruchomości, będących przedmiotem umowy [zł]"
**TAMBUD**: "Cena części nieruchomości, będących przedmiotem umowy [zł]"
**ATAL**: "Cena części nieruchomości, będących przedmiotem umowy zł"
**INPRO**: (stored in main "Cena nieruchomości" column when row type is parking)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
parking_price: [
  'cena parkingu', 'cena garażu', 'parking price', 'parking_price',
  'cena_parkingu', 'cena_garazu', 'parking_cost',
  'cena przypisanego miejsca parkingowego / garażu [1]',
  'cena miejsca parkingowego garażu',
  'cena części nieruchomości', // MINISTRY OFFICIAL
  'cena czesci nieruchomosci'
]
```

**Missing Variants**: ✅ None (covered)

---

### Field 48: parking_date

**Ministry Official**: "Data od której obowiązuje cena części nieruchomości, będących przedmiotem umowy"
**TAMBUD**: "Data od której obowiązuje cena części nieruchomości, będących przedmiotem umowy"
**ATAL**: "Data od której obowiązuje cena części nieruchomości, będących przedmiotem umowy"
**INPRO**: (not present)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
parking_date: [
  'data parkingu', 'parking date',
  'data od której obowiązuje cena części nieruchomości', // MINISTRY OFFICIAL
  'data obowiązywania ceny części nieruchomości',
  'data obowiazywania ceny czesci nieruchomosci',
  'data od ktorej obowiazuje cena czesci nieruchomosci'
]
```

**Missing Variants**: ✅ None (covered)

---

### Fields 49-52: Storage (Pomieszczenia przynależne)

**Ministry Official Columns**:
- Col 49: "Rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali"
- Col 50: "Oznaczenie pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali"
- Col 51: "Wyszczególnienie cen pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali [zł]"
- Col 52: "Data od której obowiązuje cena wyszczególnionych pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali"

**TAMBUD/ATAL**: Use exact ministry names (identical)
**INPRO**: (not present in visible columns)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
storage_type: [
  'komórka lokatorska', 'storage type', 'rodzaj komórki',
  'rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4', // MINISTRY (partial)
  'rodzaj pomieszczen przynaleznych'
]

storage_designation: [
  'oznaczenie komórki', 'storage designation', 'nr komórki',
  'oznaczenie pomieszczeń przynależnych, o których mowa w art. 2 ust. 4', // MINISTRY (partial)
  'oznaczenie pomieszczen przynaleznych'
]

storage_price: [
  'cena komórki', 'storage price', 'koszt komórki',
  'wyszczególnienie cen pomieszczeń przynależnych', // MINISTRY (partial)
  'cena pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
  'cena pomieszczen przynaleznych',
  'wyszczegolnienie cen pomieszczen przynaleznych'
]

storage_date: [
  'data komórki', 'storage date',
  'data od której obowiązuje cena wyszczególnionych pomieszczeń przynależnych', // MINISTRY (partial)
  'data obowiązywania ceny pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
  'data obowiazywania ceny pomieszczen przynaleznych',
  'data od ktorej obowiazuje cena wyszczegolnionych pomieszczen przynaleznych'
]
```

**Missing Variants**: ⚠️ Partial coverage (full ministry text with "ustawy z dnia 24 czerwca 1994 r. o własności lokali" is NOT present)

**Add These Variants**:
- 'rodzaj pomieszczeń przynależnych o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali'
- 'oznaczenie pomieszczeń przynależnych o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali'
- 'wyszczególnienie cen pomieszczeń przynależnych o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali'
- 'data od której obowiązuje cena wyszczególnionych pomieszczeń przynależnych o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali'

---

### Fields 53-55: Necessary Rights (Prawa niezbędne)

**Ministry Official Columns**:
- Col 53: "Wyszczególnienie praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego"
- Col 54: "Wartość praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego [zł]"
- Col 55: "Data od której obowiązuje cena wartości praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego"

**TAMBUD/ATAL**: Use exact ministry names
**INPRO**: (not present in visible columns)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
necessary_rights: [
  'prawa niezbędne', 'prawa_niezbedne', 'prawa niezbedne wyszczególnienie', 'prawa_niezbedne_wyszczegolnienie',
  'necessary_rights', 'rights', 'udzial w gruncie', 'udział w gruncie',
  'wyszczególnienie praw niezbędnych do korzystania z nieruchomości wspólnych', // MINISTRY (wspólnych - WRONG!)
  'wyszczegolnienie praw niezbednych'
]

necessary_rights_price: [
  'prawa cena', 'prawa_niezbedne_cena', 'necessary_rights_price',
  'cena praw niezbędnych', // MINISTRY (partial)
  'cena praw niezbednych'
]

necessary_rights_date: [
  'prawa data', 'prawa_niezbedne_data', 'necessary_rights_date',
  'data obowiązywania ceny praw niezbędnych', // MINISTRY (partial)
  'data obowiazywania ceny praw niezbednych'
]
```

**Missing Variants**:
- 'wyszczególnienie praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego' (EXACT MINISTRY - currently says "nieruchomości wspólnych" which is WRONG!)
- 'wartość praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego' (full ministry text)
- 'data od której obowiązuje cena wartości praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego' (full ministry text)

**CRITICAL FIX NEEDED**: Replace "nieruchomości wspólnych" with "lokalu mieszkalnego lub domu jednorodzinnego"!

---

### Fields 56-58: Other Monetary Obligations (Inne świadczenia pieniężne)

**Ministry Official Columns**:
- Col 56: "Wyszczególnienie rodzajów innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność"
- Col 57: "Wartość innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność [zł]"
- Col 58: "Data od której obowiązuje cena wartości innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność"

**TAMBUD/ATAL**: Use exact ministry names (identical)
**INPRO**: Has "Inne świadczenia pieniężne" column (single column, not split into type/value/date)

**Current Synonyms in COLUMN_PATTERNS**: ❌ NOT PRESENT (no other_obligations fields!)

**Missing Variants for ALL 3 fields**:
- 'wyszczególnienie rodzajów innych świadczeń pieniężnych które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność'
- 'rodzaje innych świad. pienię. które nabywca zobo. jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność' (ATAL abbreviated)
- 'wartość innych świadczeń pieniężnych które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność'
- 'wartość innych świad. pienię. które nabywca zobo. jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność zł' (ATAL)
- 'data od której obowiązuje cena wartości innych świadczeń pieniężnych które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność'
- 'data od której obow. cena wartości innych świadczeń pieniężnych które nabywca zobo. jest spełnić na rzecz dewelopera' (ATAL abbreviated)
- 'inne świadczenia pieniężne' (INPRO simplified)

**CRITICAL**: Parser has NO recognition for other monetary obligations!

---

## 🌐 SECTION 5: PROSPECTUS (Column 59)

### Field 59: prospectus_url

**Ministry Official**: "Adres strony internetowej, pod którym dostępny jest prospekt informacyjny"
**TAMBUD**: "Adres strony internetowej, pod którym dostępny jest prospekt informacyjny"
**ATAL**: "Adres strony internetowej, pod którym dostępny jest prospekt informacyjny"
**INPRO**: "Adres strony internetowej pod którym dostępny jest prospekt informacyjny" (no commas)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
prospectus_url: [
  'adres prospektu', 'adres_prospektu', 'prospekt', 'prospectus',
  'prospectus_url', 'url prospektu', 'link do prospektu',
  'adres strony internetowej prospektu informacyjnego', // MINISTRY (partial)
  'adres prospektu informacyjnego'
]
```

**Missing Variants**:
- 'adres strony internetowej pod którym dostępny jest prospekt informacyjny' (EXACT MINISTRY with "pod którym")

---

## 📊 SECTION 6: ADDITIONAL INPRO FIELDS (Non-Ministry)

### Field: powierzchnia (area)

**INPRO**: "Powierzchnia" (explicit column!)
**TAMBUD/ATAL**: (not present - calculated from price/price_per_m2)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
area: [
  'powierzchnia', 'powierzchnia użytkowa', 'powierzchnia m²', 'powierzchnia m2',
  'area', 'size', 'metraż', 'pow', 'powierzchnia_uzytkowa', 'm2', 'm²'
]
```

**Missing Variants**: ✅ None (covered)

---

### Field: pietro (floor)

**INPRO**: "Piętro nieruchomości"
**TAMBUD/ATAL**: (not present in standard ministry format)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
kondygnacja: [
  'kondygnacja', 'piętro', 'pietro', 'floor', 'level',
  'poziom', 'kondygnacja_nr', 'nr_pietra'
]
```

**Missing Variants**:
- 'piętro nieruchomości' (INPRO exact)
- 'pietro nieruchomosci'

---

### Field: liczba_pokoi (rooms)

**INPRO**: "Liczba pokoi"
**TAMBUD/ATAL**: (not present in standard ministry format)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
liczba_pokoi: [
  'pokoje', 'liczba pokoi', 'rooms', 'liczba_pokoi', 'ilosc_pokoi',
  'nr pokoi', 'rooms_count', 'pokoi'
]
```

**Missing Variants**: ✅ None (covered)

---

### Field: stawka_vat

**INPRO**: "Stawka VAT (%)"
**TAMBUD/ATAL**: (not present)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
vat_rate: [
  'stawka VAT', 'VAT', 'vat_rate', 'tax_rate',
  'podatek', 'vat %'
]
```

**Missing Variants**:
- 'stawka vat (%)' (INPRO exact with parentheses)

---

### Field: waluta

**INPRO**: "Waluta"
**TAMBUD/ATAL**: (not explicitly present - assumed PLN)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
waluta: [
  'waluta', 'currency', 'PLN', 'EUR', 'USD',
  'w jakiej walucie', 'symbol waluty'
]
```

**Missing Variants**: ✅ None (covered)

---

### Field: nazwa_inwestycji

**INPRO**: "Nazwa inwestycji" (explicit column!)
**ATAL**: "Nazwa inwestycji" (present!)
**TAMBUD**: (not present)

**Current Synonyms in COLUMN_PATTERNS**:
```typescript
investment_name: [
  'inwestycja', 'nazwa inwestycji', 'project', 'investment',
  'investment_name', 'projekt', 'nazwa_inwestycji', 'osiedle'
]
```

**Missing Variants**: ✅ None (covered)

---

### Field: adres_strony_inwestycji

**INPRO**: "Adres strony internetowej inwestycji"
**ATAL**: "Adres strony przedsięwzięcia deweloperskiego/zadania inwestycyjnego"
**TAMBUD**: (not present)

**Current Synonyms in COLUMN_PATTERNS**: ❌ NOT PRESENT

**Missing Variants**:
- 'adres strony internetowej inwestycji'
- 'adres strony inwestycji'
- 'adres strony przedsięwzięcia deweloperskiego/zadania inwestycyjnego'
- 'adres strony przedsięwzięcia deweloperskiego zadania inwestycyjnego'
- 'investment_website'
- 'project_url'

---

## 🚨 CRITICAL GAPS IDENTIFIED

### 1. Developer HQ Address (8 fields) - MISSING ENTIRELY
**Impact**: High - Ministry requires these fields
**Affected CSVs**: TAMBUD, ATAL (use exact ministry names)
**Fix Required**: Add 8 new field mappings in COLUMN_PATTERNS

### 2. Sales Office Address (8 fields) - MISSING ENTIRELY
**Impact**: High - Ministry requires these fields
**Affected CSVs**: TAMBUD, ATAL (use exact ministry names)
**Fix Required**: Add 8 new field mappings in COLUMN_PATTERNS

### 3. Other Monetary Obligations (3 fields) - MISSING ENTIRELY
**Impact**: Medium - Ministry requires these fields
**Affected CSVs**: TAMBUD, ATAL (ministry names), INPRO (simplified "Inne świadczenia pieniężne")
**Fix Required**: Add 3 new field mappings in COLUMN_PATTERNS

### 4. Necessary Rights - WRONG TEXT!
**Impact**: High - Parser uses INCORRECT ministry text
**Current**: "wyszczególnienie praw niezbędnych do korzystania z nieruchomości wspólnych"
**Correct**: "wyszczególnienie praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego"
**Fix Required**: Replace incorrect pattern in necessary_rights

### 5. Missing Column Fields
**Impact**: Low-Medium
**Missing**: row_number, nr_krs, nr_ceidg, regon, nr_faxu, dodatkowe_lokalizacje_sprzedazy, sposob_kontaktu, adres_strony_inwestycji
**Fix Required**: Add patterns for these 8 fields

### 6. ATAL Truncated Headers
**Impact**: Low - Parser may miss ATAL's shortened headers
**Examples**:
- "Data od Cena lokalu miesz..." (missing "której")
- "Cena lokalu miesz. lub domu jedno..." (abbreviated)
**Fix Required**: Add truncated variants as fallbacks

---

## ✅ RECOMMENDATIONS FOR TASK #97.2

### Priority 1: Add Missing Critical Fields (28 fields)
1. Developer HQ address (8 fields)
2. Sales office address (8 fields)
3. Other monetary obligations (3 fields)
4. Fix necessary_rights text (1 field)
5. Add missing column fields (8 fields)

### Priority 2: Add ATAL Truncated Variants
Add abbreviated/truncated ministry names as fallback patterns

### Priority 3: Add INPRO Simplified Variants
Add INPRO's compact naming conventions where different from ministry

### Priority 4: Validation
After updates, test parser against all 3 CSV samples to ensure 100% field recognition

---

## 📈 COVERAGE STATISTICS

**Before Task #97**:
- Ministry fields covered: ~35/58 (60%)
- Developer fields covered: ~5/28 (18%)
- Property fields covered: ~30/30 (100%)

**After Task #97 (estimated)**:
- Ministry fields covered: 58/58 (100%)
- Developer fields covered: 28/28 (100%)
- Property fields covered: 30/30 (100%)

**Total new patterns to add**: ~150+ synonyms across 28 fields

---

**Document Created**: 2025-10-15
**Author**: Claude Code (Task Implementation Agent)
**Task**: #97.1 - Aggregate Column Name Variants from All Sources
**Next Step**: Task #97.2 - Update COLUMN_PATTERNS with all missing variants
