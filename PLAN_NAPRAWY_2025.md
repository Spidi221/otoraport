# 🚀 OTORAPORT - Plan Naprawczy & Rozwoju

**Data utworzenia:** 29.09.2025
**Ostatnia aktualizacja:** 01.10.2025 18:30 🔥
**Health Score:** 7.2/10 ⚠️ **PARSOWANIE WYMAGA NAPRAWY**
**Status:** 🟡 **MINISTRY COMPLIANCE OK, DATA QUALITY ISSUES**

**🎯 PRIORYTET:** Naprawić błędy parsowania + dodać brakujący XML z danymi

---

## 📊 **AKTUALNY STAN APLIKACJI (01.10.2025 18:30)**

### ✅ **UKOŃCZONE DZISIAJ (FAZA GAMMA-DIAGNOSTICS)**

| Task | Status | Czas | Szczegóły |
|------|--------|------|-----------|
| **Upload widget text fix** | ✅ DONE | 5min | "CSV, XML" → "CSV, Excel (XLS, XLSX)" |
| **Cache invalidation after upload** | ✅ DONE | 10min | Added `revalidatePath()` after file save |
| **Ministry compliance analysis** | ✅ DONE | 30min | Zidentyfikowano brakujący data.xml |
| **Parser bugs analysis** | ✅ DONE | 20min | 4 krytyczne błędy wykryte |

**🎉 QUICK WINS:**
- Pliki teraz pokazują się po uploadzie (cache fix)
- Poprawiony tekst w widgecie uploadu
- Zidentyfikowane problemy z parserem

---

## 🚨 **KRYTYCZNE PROBLEMY ZNALEZIONE (01.10.2025)**

### ❌ **PROBLEM #1: BRAK MINISTERIALNEGO XML Z DANYMI**

**Status:** 🔴 **CRITICAL - Ministry Non-Compliant**

**Co mamy:**
```xml
<!-- ✅ Harvester XML - metadata dla dane.gov.pl -->
<ns2:datasets xmlns:ns2="urn:otwarte-dane:harvester:1.13">
  <dataset status="published">
    <extIdent>NFWU05...</extIdent>
    <url>https://.../data.csv</url>
  </dataset>
</ns2:datasets>
```

**Czego brakuje:**
```xml
<!-- ❌ Data XML - faktyczne ceny mieszkań -->
<dane_o_cenach_mieszkan xmlns="urn:otwarte-dane:mieszkania:1.13">
  <informacje_podstawowe>
    <data_publikacji>2025-10-01</data_publikacji>
    <dostawca_danych>
      <nazwa>Unnamed Company</nazwa>
      <nip>1234567890</nip>
    </dostawca_danych>
  </informacje_podstawowe>
  <oferty>
    <oferta>
      <nr_lokalu>B2/2</nr_lokalu>
      <powierzchnia_uzytkowa>109.45</powierzchnia_uzytkowa>
      <cena_za_m2>11831.89</cena_za_m2>
      <!-- ... 58 pól zgodnie ze schematem -->
    </oferta>
  </oferty>
</dane_o_cenach_mieszkan>
```

**Wymagane działania:**
1. Stworzyć `/src/lib/ministry-xml-generator.ts` (Schema 1.13)
2. Endpoint `/api/public/[clientId]/prices.xml` (faktyczne dane)
3. Generator musi używać 58 pól z wzorcowego CSV ministerstwa

**Czas:** 6-8h (nowy generator + endpoint + testy)

---

### ❌ **PROBLEM #2: INPRO Parser - Duplikaty Numerów**

**Status:** 🔴 **CRITICAL - Data Quality**

**Co pokazuje MD raport:**
```markdown
| Nr lokalu | Typ | Powierzchnia | Status |
|-----------|-----|--------------|--------|
| 0000306071 | Apartament | 33.06m² | 🟢 Dostępne |  ← BŁĄD
| 0000306071 | Apartament | 29.72m² | 🟢 Dostępne |  ← BŁĄD (ten sam!)
| 0000306071 | Mieszkanie | 38.09m² | 🟢 Dostępne |  ← BŁĄD
```

**Powinno być:**
```markdown
| A.1.1.1M | Apartament | 33.06m² | 🟢 Dostępne |  ← UNIKALNY
| A.1.1.2M | Apartament | 29.72m² | 🟢 Dostępne |  ← UNIKALNY
| A.2.1.1M | Mieszkanie | 38.09m² | 🟢 Dostępne |  ← UNIKALNY
```

**Root cause:** Parser wyciąga niewłaściwą kolumnę jako `property_number`

**Fix location:** `/src/lib/smart-csv-parser.ts` - INPRO format mapping

**Czas:** 2-3h (analiza + fix + testy)

---

### ❌ **PROBLEM #3: Status vs Cena - Parser Confusion**

**Status:** 🔴 **CRITICAL - Data Quality**

**Co pokazuje MD raport:**
```markdown
| Nr lokalu | Cena/m² | Cena całkowita | Status |
|-----------|---------|----------------|--------|
| B2/2 | Sprzedane | 1 zł | 🔴 Sprzedane |  ← "Sprzedane" to nie cena!
```

**Powinno być:**
```markdown
| B2/2 | N/A | N/A | 🔴 Sprzedane |  ← Status poprawny, ceny puste dla sprzedanych
```

**Root cause:** Parser nie rozpoznaje statusu "Sprzedane" jako status, tylko jako wartość ceny

**Fix location:** `/src/lib/smart-csv-parser.ts` - status detection logic

**Czas:** 1-2h

---

### ❌ **PROBLEM #4: INPRO Total Price = 0 zł**

**Status:** 🔴 **CRITICAL - Data Quality**

**Co pokazuje MD raport:**
```markdown
| Nr lokalu | Powierzchnia | Cena/m² | Cena całkowita |
|-----------|--------------|---------|----------------|
| 0000306071 | 33.06m² | 27 060 zł | 0 zł |  ← Powinno być 894 403 zł
| 0000306071 | 29.72m² | 28 290 zł | 0 zł |  ← Powinno być 840 583 zł
```

**Expected calculation:**
- 33.06m² × 27,060 zł/m² = 894,403 zł ❌ (pokazuje 0 zł)
- 29.72m² × 28,290 zł/m² = 840,583 zł ❌ (pokazuje 0 zł)

**Root cause:** Parser nie wyciąga `Cena nieruchomości` z INPRO formatu

**Fix location:** `/src/lib/smart-csv-parser.ts` - INPRO total_price mapping

**Czas:** 1-2h

---

### ⚠️ **PROBLEM #5: Sprzedane = 0m² powierzchni**

**Status:** 🟡 **MEDIUM - Data Display**

**Co pokazuje MD raport:**
```markdown
| Nr lokalu | Powierzchnia | Cena | Status |
|-----------|--------------|------|--------|
| N/A | 0m² | 0 zł | 🔴 Sprzedane |
```

**Możliwe przyczyny:**
1. Źródłowy CSV nie ma powierzchni dla sprzedanych (najbardziej prawdopodobne)
2. Parser usuwa te dane gdy widzi status "Sprzedane"
3. Problem z kalkulacją (jeśli cena całkowita / cena m² = 0/0)

**Fix location:** Sprawdzić oryginalne CSV + logic w parserze

**Czas:** 1h (diagnostyka + ewentualna naprawa)

---

## 🎯 **PLAN NAPRAWY - FAZA DELTA (PARSER FIXES)**

### 🚀 **EXECUTION STRATEGY**

**Goal:** Naprawić wszystkie błędy parsowania + dodać ministerialny XML
**Method:** 3 agenty równolegle (zero konfliktów plików)
**Timeline:** 10-14h (1.5 dnia roboczego)

---

### **Agent DELTA-1: Ministry Data XML Generator** ⏱️ 6-8h

**Priority:** 🔴 P0 (ministry compliance blocker)

**Task:** Stworzyć generator XML z faktycznymi danymi cenowymi (Schema 1.13)

**Files to create:**
- `/src/lib/ministry-xml-generator.ts` (nowy plik)
- `/src/app/api/public/[clientId]/prices.xml/route.ts` (nowy endpoint)

**Implementation:**
```typescript
// /src/lib/ministry-xml-generator.ts
export function generateMinistryDataXML(
  developer: Developer,
  properties: Property[]
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<dane_o_cenach_mieszkan xmlns="urn:otwarte-dane:mieszkania:1.13">
  <informacje_podstawowe>
    <data_publikacji>${new Date().toISOString().split('T')[0]}</data_publikacji>
    <dostawca_danych>
      <nazwa>${developer.company_name}</nazwa>
      <nip>${developer.nip}</nip>
      <email>${developer.email}</email>
      <!-- ... wszystkie pola dewelopera -->
    </dostawca_danych>
  </informacje_podstawowe>
  <oferty>
    ${properties.map(prop => `
    <oferta>
      <nr_lokalu>${prop.property_number}</nr_lokalu>
      <rodzaj_nieruchomości>${prop.property_type}</rodzaj_nieruchomości>
      <powierzchnia_uzytkowa>${prop.area}</powierzchnia_uzytkowa>
      <cena_za_m2>${prop.price_per_m2}</cena_za_m2>
      <cena_calkowita>${prop.total_price}</cena_calkowita>
      <wojewodztwo>${prop.wojewodztwo}</wojewodztwo>
      <powiat>${prop.powiat}</powiat>
      <gmina>${prop.gmina}</gmina>
      <!-- ... wszystkie 58 pól -->
    </oferta>
    `).join('')}
  </oferty>
</dane_o_cenach_mieszkan>`
}
```

**Dependencies:** NONE (nowy plik)

**Testing:**
```bash
curl http://localhost:3000/api/public/{clientId}/prices.xml
# Powinien zwrócić XML z pełnymi danymi mieszkań (nie metadata!)
```

---

### **Agent DELTA-2: INPRO Parser Fixes** ⏱️ 4-6h

**Priority:** 🔴 P0 (data quality blocker)

**Task:** Naprawić 3 błędy w INPRO parsing logic:
1. Duplikaty numerów mieszkań
2. Total price = 0 zł
3. Status vs cena confusion

**File:** `/src/lib/smart-csv-parser.ts` (existing)

**Implementation:**

```typescript
// FIX #1: Unikalne numery mieszkań
function parseINPROFormat(row: any) {
  return {
    // BEFORE (BŁĄD):
    // property_number: row['Id nieruchomości']  // zawsze to samo!

    // AFTER (POPRAWKA):
    property_number: row['Nr nieruchomości nadany przez dewelopera']  // unikalny!
  }
}

// FIX #2: Total price extraction
function parseINPROFormat(row: any) {
  return {
    // BEFORE (BŁĄD):
    // total_price: 0  // hardcoded!

    // AFTER (POPRAWKA):
    total_price: parseFloat(row['Cena nieruchomości']?.toString().replace(/[^0-9,.]/g, '')
      .replace(',', '.')) || 0
  }
}

// FIX #3: Status detection
function detectStatus(row: any): 'available' | 'sold' | 'reserved' {
  // Sprawdź kolumnę "Status" lub "Dostępność"
  const statusField = row['Status'] || row['Dostępność'] || row['status']

  if (/sprzeda/i.test(statusField)) return 'sold'
  if (/rezerwa/i.test(statusField)) return 'reserved'

  // Sprawdź czy cena = "X" (ministerialny sposób oznaczenia sprzedanego)
  if (row['Cena za m2 nieruchomości'] === 'X') return 'sold'

  return 'available'
}
```

**Dependencies:** NONE (tylko edycja istniejącego pliku)

**Testing:**
1. Upload pliku INPRO
2. Sprawdź czy:
   - Numery mieszkań są unikalne (A.1.1.1M, A.1.1.2M etc.)
   - Ceny całkowite != 0 zł
   - Status "Sprzedane" pokazuje się w kolumnie status, nie cena

---

### **Agent DELTA-3: Sold Properties Data Fix** ⏱️ 1-2h

**Priority:** 🟡 P1 (data display issue)

**Task:** Zdiagnozować i naprawić problem z 0m² dla sprzedanych mieszkań

**File:** `/src/lib/smart-csv-parser.ts` (existing)

**Investigation steps:**
1. Sprawdzić oryginalne CSV - czy sprzedane mają powierzchnię
2. Sprawdzić logic parsera - czy przypadkiem nie zeruje pól dla sprzedanych
3. Jeśli dane są w CSV - naprawić ekstrakcję
4. Jeśli brak w CSV - dodać placeholder "N/A" zamiast "0m²"

**Implementation (if data missing in source):**
```typescript
// Lepsze wyświetlanie brakujących danych
const displayArea = property.area > 0 ? `${property.area}m²` : 'Brak danych'
const displayPrice = property.total_price > 0 ? `${property.total_price} zł` : 'Brak danych'
```

**Dependencies:** NONE

**Testing:** Upload CSV, sprawdź czy sprzedane mają powierzchnię

---

## ⏸️ **CHECKPOINT DELTA - Quality Assurance**

**Before marking complete, verify:**

1. **Ministry Data XML:**
   - [ ] Endpoint `/api/public/{clientId}/prices.xml` działa
   - [ ] XML zawiera pełne dane mieszkań (nie metadata!)
   - [ ] Wszystkie 58 pól ministerstwa wypełnione
   - [ ] Walidacja względem Schema 1.13

2. **INPRO Parser:**
   - [ ] Numery mieszkań unikalne (np. A.1.1.1M, A.1.1.2M, nie duplikaty)
   - [ ] Ceny całkowite != 0 zł (kalkulacja surface × price_per_m2)
   - [ ] Status "Sprzedane" w kolumnie status, nie cena

3. **Data Quality:**
   - [ ] Sprzedane mieszkania pokazują powierzchnię (jeśli jest w źródle)
   - [ ] Brak wartości "0m²" i "0 zł" (chyba że faktycznie 0)

4. **Integration Test:**
   - [ ] Upload INPRO CSV → wszystkie dane poprawne
   - [ ] Upload ministerialny CSV → wszystkie dane poprawne
   - [ ] Download XML → pełny raport cenowy
   - [ ] MD report → statystyki poprawne

---

## 📊 **TIMELINE DELTA (Parallel Execution)**

```
DAY 1 (8h) - START: 01.10.2025 19:00
├─ 19:00-22:00 (3h)  → Agent DELTA-1: Ministry XML (część 1)
├─ 19:00-22:00 (3h)  → Agent DELTA-2: INPRO fixes (równolegle!)
└─ 22:00-23:00 (1h)  → Agent DELTA-3: Sold properties fix

DAY 2 (6h) - 02.10.2025
├─ 09:00-14:00 (5h)  → Agent DELTA-1: Ministry XML (część 2 + testy)
└─ 14:00-15:00 (1h)  → CHECKPOINT DELTA - comprehensive testing

TOTAL: 14h (z testami)
```

---

## 🎯 **SUCCESS CRITERIA - UPDATED**

### **Ministry Compliance:**
- ✅ Harvester XML (metadata) - **DONE**
- ❌ Data XML (prices) - **TODO (DELTA-1)**
- ✅ CSV endpoint (59 columns) - **DONE**
- ✅ MD report - **DONE** (minor data quality issues)
- ✅ MD5 checksum - **DONE**

### **Data Quality:**
- ❌ INPRO properties - **BROKEN** (duplikaty, 0 zł) → **DELTA-2**
- ✅ Ministry properties - **OK**
- ⚠️ Sold properties - **PARTIAL** (0m² issue) → **DELTA-3**

### **User Experience:**
- ✅ File upload - **FIXED TODAY** (cache revalidation)
- ✅ Upload widget text - **FIXED TODAY**
- ✅ Files showing after upload - **FIXED TODAY**
- ⚠️ Properties table - **PARTIAL** (shows incorrect data from bad parser)

---

## 📋 **FAZY ZROBIONE (Reference)**

### ✅ **FAZA 0: CRITICAL BUGS (30.09.2025) - COMPLETE**
- CSV Parser Duplikaty ✅
- MD Generator Raw Data ✅
- Dashboard Components ✅
- CSV Schema Ministry Columns ✅
- XML Generator Harvester ✅
- CSV Endpoint ✅

### ✅ **FAZA ALPHA (01.10.2025) - COMPLETE**
- ALPHA-1: File Deletion Cascade ✅
- ALPHA-2: Help UI Minimized ✅
- ALPHA-3: Dashboard Pagination ✅
- ALPHA-4: Project Name Extraction ✅

### ✅ **FAZA BETA (01.10.2025) - COMPLETE**
- BETA-1: Multi-format CSV Parser ✅
- BETA-2: Excel Support (.xlsx, .xls) ✅

### ✅ **FAZA GAMMA-DIAGNOSTICS (01.10.2025) - COMPLETE**
- Upload widget text fix ✅
- Cache invalidation ✅
- Ministry compliance analysis ✅
- Parser bugs identification ✅

---

## 🚀 **FAZY DO ZROBIENIA (Kolejność)**

### ⏳ **FAZA DELTA: Parser & XML Fixes** ← **CURRENT (01.10.2025)**
**Status:** 🔴 IN PLANNING
**ETA:** 14h (1.5 dnia)
**Agents:** 3 równolegle

**Taski:**
1. ❌ Ministry Data XML generator (6-8h)
2. ❌ INPRO parser fixes (4-6h)
3. ❌ Sold properties data fix (1-2h)

---

### ⏹️ **FAZA EPSILON: Charts Implementation** (Odłożone)
**Status:** ⚪ NOT STARTED
**ETA:** 6-8h
**Priority:** P2 (nice-to-have, not blocking)

**Taski:**
1. Price trend chart (Recharts)
2. Distribution pie charts
3. Status overview chart

**Reason for delay:** Wykresy są ważne, ale naprawienie błędów parsowania ma wyższy priorytet

---

## 📊 **OVERALL PROJECT STATUS**

| Component | Status | Score | Notes |
|-----------|--------|-------|-------|
| **Ministry Compliance** | ⚠️ PARTIAL | 80% | Brak data.xml (DELTA-1) |
| **CSV Parser** | ❌ BROKEN | 60% | INPRO błędy (DELTA-2) |
| **Data Quality** | ❌ POOR | 55% | Duplikaty, 0 zł (DELTA-2) |
| **File Upload** | ✅ WORKS | 95% | Cache fixed today |
| **User Experience** | ⚠️ OK | 75% | Pokazuje błędne dane |
| **Backend Infrastructure** | ✅ EXCELLENT | 95% | Solid foundation |
| **Security (RLS)** | ✅ GOOD | 90% | Working correctly |
| **OVERALL** | ⚠️ | **75%** | **Needs DELTA fixes** |

---

## 🎯 **IMMEDIATE NEXT STEPS (01.10.2025 Evening)**

### **Option A: Start DELTA Phase Tonight** ⭐ RECOMMENDED
**Pros:**
- Naprawimy krytyczne błędy parsowania
- Dodamy brakujący ministerialny XML
- Aplikacja będzie w pełni zgodna z ministerstwem

**Plan:**
```bash
# Tonight (3h)
19:00-22:00 → Launch DELTA-1 & DELTA-2 agents parallel
22:00-23:00 → Launch DELTA-3 agent

# Tomorrow (6h)
09:00-14:00 → Finish DELTA-1
14:00-15:00 → Comprehensive testing & commit
```

### **Option B: Commit Current Fixes & Continue Tomorrow**
**Pros:**
- Zapisujemy dzisiejsze naprawy (cache, upload widget)
- Zaczynamy DELTA rano ze świeżą głową

**Plan:**
```bash
# Tonight (30min)
→ Commit upload widget + cache fixes
→ Update this document

# Tomorrow morning
→ Start DELTA phase (fresh)
```

---

## 💾 **FILES CHANGED TODAY (01.10.2025)**

1. **`/src/components/dashboard/upload-widget.tsx`**
   - Line 124: Changed "CSV, XLSX lub XML" → "CSV, Excel (XLS, XLSX)"

2. **`/src/app/api/upload/route.ts`**
   - Line 2: Added `import { revalidatePath } from 'next/cache'`
   - Lines 167-171: Added cache revalidation after successful upload

3. **`PLAN_NAPRAWY_2025.md`** (this file)
   - Comprehensive update with:
     - Current status analysis
     - Ministry compliance gap analysis
     - Parser bugs identification
     - DELTA phase planning

---

## 📞 **FINAL RECOMMENDATION**

**Status:** 🟡 **75% Complete - Parser Fixes Required**

**Recommendation:**
> Execute FAZA DELTA (14h) before production deployment. Current bugs will cause:
> - Ministry rejection (missing data.xml)
> - User confusion (wrong property numbers, 0 zł prices)
> - Support tickets (data quality issues)

**Quick wins available:**
- Ministry XML generator: 6-8h
- INPRO parser fixes: 4-6h
- Data quality improvements: 1-2h

**After DELTA:**
- ✅ Full ministry compliance (100%)
- ✅ Accurate data parsing (100%)
- ✅ Production ready (90%)

---

*Last updated: 01.10.2025 18:30*
*Next update: After DELTA phase completion*
*Status: Ready for DELTA execution*
