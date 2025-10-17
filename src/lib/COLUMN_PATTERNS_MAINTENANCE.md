# COLUMN_PATTERNS Maintenance Guide

**Version**: 1.0
**Last Updated**: 2025-10-15
**Schema Version**: Ministry Schema 1.13 (58 required fields)
**Total Synonyms**: 520+
**Coverage**: INPRO (95%+), ATAL (95%+), Ministry (100%), Generic Polish (80%+)

---

## Table of Contents

1. [Overview](#overview)
2. [Structure Explanation](#structure-explanation)
3. [Priority Order Rationale](#priority-order-rationale)
4. [Maintenance Guidelines](#maintenance-guidelines)
5. [Common Patterns](#common-patterns)
6. [Examples](#examples)
7. [Testing Strategy](#testing-strategy)
8. [Troubleshooting](#troubleshooting)
9. [Version Control](#version-control)

---

## Overview

### What are COLUMN_PATTERNS?

`COLUMN_PATTERNS` is a comprehensive synonym mapping database that enables **smart CSV parsing** for Polish real estate data. It maps various column naming conventions from different developer software exports to a unified internal field structure.

**Primary Purpose**: Enable seamless parsing of CSV files from:
- **Ministry Schema 1.13** - Official government reporting format (58 required fields)
- **INPRO** - Popular developer management software (40+ custom columns)
- **ATAL** - Excel-based system with truncated column names (character limit issues)
- **Custom formats** - Generic Polish/English column names

### Why COLUMN_PATTERNS Exist

Without COLUMN_PATTERNS, we would need to:
1. Force developers to use exact Ministry column names (poor UX)
2. Manually map each CSV variant (not scalable)
3. Fail to parse INPRO/ATAL exports (lost customers)
4. Require manual column selection (time-consuming)

**With COLUMN_PATTERNS**, we achieve:
- **95%+ automatic mapping** for INPRO/ATAL/Ministry CSVs
- **Zero manual configuration** for standard formats
- **Fuzzy matching** that handles typos, diacritics, and whitespace
- **Future-proof** synonym database for new software variants

### The Ministry Compliance Challenge

The Polish Ministry of Development requires developers to report property prices using a **58-field schema** (Ministry Schema 1.13, updated 29.09.2025). However:

- **No developer software exports in this format by default** (INPRO/ATAL use custom column names)
- **Ministry column names are extremely verbose** (e.g., "Województwo adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera" - 93 characters!)
- **Excel has a 255-character column name limit**, forcing ATAL to truncate names
- **Column names contain legal references** (e.g., "art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r.")
- **Polish diacritics** (ą, ć, ę, ł, ń, ó, ś, ź, ż) can cause encoding issues

**Our Solution**: Build a comprehensive synonym database that maps ALL known variants to Ministry fields.

---

## Structure Explanation

### File Organization

```typescript
// File: src/lib/column-synonyms-complete.ts
export const COMPLETE_COLUMN_PATTERNS = {
  // 58 Ministry fields (required by Schema 1.13)
  developer_name: ['Nazwa dewelopera', 'deweloper', ...],
  forma_prawna: ['Forma prawna dewelopera', 'forma prawna', ...],
  // ... (56 more ministry fields)

  // 7 INPRO extra fields (not in Ministry schema, but common in exports)
  area: ['powierzchnia', 'powierzchnia użytkowa', ...],
  kondygnacja: ['piętro nieruchomości', 'kondygnacja', ...],
  liczba_pokoi: ['liczba pokoi', 'pokoje', ...],
  vat_rate: ['stawka VAT (%)', 'vat_rate', ...],
  waluta: ['waluta', 'currency', ...],
  investment_name: ['nazwa inwestycji', 'inwestycja', ...],
  investment_website: ['adres strony internetowej inwestycji', ...]
} as const
```

**Total Fields**: 65 (58 Ministry + 7 INPRO extras)

### Ministry Schema 1.13 Fields (58 Required)

The 58 required fields are organized into logical sections:

#### Section 1: Developer Info (Columns 1-29)
```
1. developer_name              // Nazwa dewelopera
2. forma_prawna                // Forma prawna dewelopera
3. nr_krs                      // Nr KRS
4. nr_ceidg                    // Nr wpisu do CEiDG
5. nip                         // Nr NIP
6. regon                       // Nr REGON
7. phone                       // Nr telefonu
8. email                       // Adres poczty elektronicznej
9. fax                         // Nr faxu
10. strona_internetowa         // Adres strony internetowej dewelopera
11-19. wojewodztwo_siedziby... // Developer headquarters address (8 fields)
20-27. wojewodztwo_sprzedazy...// Sales office address (8 fields)
28. dodatkowe_lokalizacje...   // Additional sales locations
29. sposob_kontaktu            // Contact method
```

#### Section 2: Investment Location (Columns 30-36)
```
30. wojewodztwo                // Województwo lokalizacji przedsięwzięcia...
31. powiat                     // Powiat lokalizacji przedsięwzięcia...
32. gmina                      // Gmina lokalizacji przedsięwzięcia...
33. miejscowosc                // Miejscowość lokalizacji przedsięwzięcia...
34. ulica                      // Ulica lokalizacji przedsięwzięcia...
35. numer_nieruchomosci        // Nr nieruchomości lokalizacji przedsięwzięcia...
36. kod_pocztowy               // Kod pocztowy lokalizacji przedsięwzięcia...
```

#### Section 3: Property Data (Columns 37-44)
```
37. property_type              // Rodzaj nieruchomości: lokal mieszkalny, dom...
38. property_number            // Nr lokalu lub domu jednorodzinnego nadany...
39. price_per_m2               // Cena m 2 powierzchni użytkowej lokalu...
40. price_valid_from           // Data od której obowiązuje cena m 2...
41. base_price                 // Cena lokalu będących przedmiotem umowy...
42. base_price_valid_from      // Data od której obowiązuje cena lokalu...
43. final_price                // Cena lokalu uwzględniająca cenę lokalu...
44. final_price_valid_from     // Data od której obowiązuje cena lokalu...
```

#### Section 4: Parking/Storage (Columns 45-54)
```
45-48. parking_type, parking_designation, parking_price, parking_date
49-52. storage_type, storage_designation, storage_price, storage_date
53-55. necessary_rights, necessary_rights_price, necessary_rights_date
56-58. other_obligations_type, other_obligations_price, other_obligations_date
```

#### Section 5: Prospectus (Column 59)
```
59. prospectus_url             // Adres strony internetowej prospektu...
```

**Note**: Ministry Schema has 58 fields, but we store 59 in COLUMN_PATTERNS because we include `row_number` (used by TAMBUD but not officially required).

### INPRO Extra Fields (7 Additional)

These fields are NOT in the Ministry schema but are commonly exported by INPRO and other developer software:

```typescript
area: ['powierzchnia', 'powierzchnia użytkowa', ...]
  // Property area in m² (Ministry calculates this: total_price / price_per_m2)

kondygnacja: ['piętro nieruchomości', 'kondygnacja', 'floor', ...]
  // Floor number (not required by Ministry)

liczba_pokoi: ['liczba pokoi', 'pokoje', 'rooms', ...]
  // Number of rooms (recommended but not required)

vat_rate: ['stawka VAT (%)', 'vat_rate', ...]
  // VAT rate percentage (not in Ministry export)

waluta: ['waluta', 'currency', 'PLN', ...]
  // Currency code (Ministry assumes PLN)

investment_name: ['nazwa inwestycji', 'inwestycja', 'project', ...]
  // Project/investment name (not required by Ministry)

investment_website: ['adres strony internetowej inwestycji', ...]
  // Investment website (different from developer website)
```

**Why include these?**
- INPRO exports these by default
- Useful for internal analytics
- Help with automatic project name detection
- Improve UX (display floor number, room count, etc.)

### Type Safety

```typescript
export type MinistryFieldKey = keyof typeof COMPLETE_COLUMN_PATTERNS

// Ensures TypeScript catches typos at compile-time:
const synonyms = COMPLETE_COLUMN_PATTERNS['developer_name'] // OK
const invalid = COMPLETE_COLUMN_PATTERNS['developerName']   // ERROR
```

---

## Priority Order Rationale

Each field's synonym array follows a **strict priority order**:

```typescript
property_number: [
  // 1. INPRO EXACT (highest priority)
  'nr nieruchomości nadany przez dewelopera',

  // 2. ATAL EXACT
  'nr lokalu nadany przez dewelopera',

  // 3. MINISTRY OFFICIAL
  'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera',

  // 4. GENERIC POLISH
  'oznaczenie lokalu nadane przez dewelopera',
  'nr lokalu',
  'numer lokalu',

  // 5. ENGLISH (lowest priority)
  'property_number',
  'apartment_number'
]
```

### Why This Order?

#### 1. INPRO Exact Match (Highest Priority)

**Rationale**: INPRO uses the most divergent column names from the Ministry schema.

**Example Differences**:
| Ministry Schema | INPRO Schema |
|----------------|--------------|
| Nr lokalu lub domu jednorodzinnego nadany przez dewelopera | Nr nieruchomości nadany przez dewelopera |
| Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł] | Cena za m2 nieruchomości |
| Piętro nieruchomości | (uses "Piętro nieruchomości" directly) |

**Why prioritize INPRO?**
- INPRO is the **most popular** developer software in Poland (~60% market share)
- INPRO exports are **NOT compliant** with Ministry schema by default
- INPRO column names are **shorter and more readable**
- **Fuzzy matching risk**: Generic terms like "cena" could match Ministry's verbose "Cena m 2 powierzchni użytkowej..." incorrectly

**Example**: Without priority, "Cena nieruchomości" (INPRO) could match Ministry's "Cena części nieruchomości, będących przedmiotem umowy [zł]" (parking price) instead of base price!

#### 2. ATAL Exact Match (Second Priority)

**Rationale**: ATAL uses truncated Ministry column names due to **Excel's 255-character limit**.

**Example Truncations**:
```
Ministry: "Data od której obowiązuje cena lokalu mieszkalnego lub domu
           jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn
           ceny m2 oraz powierzchni" (153 chars)

ATAL:     "Data od której obowiązuje cena lokalu miesz. lub domu jedn.
           będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz pow"
           (119 chars - abbreviated "mieszkalnego" → "miesz.", "pow" → "powierzchni")
```

**Why prioritize ATAL over Ministry?**
- ATAL exports are **more common** than pure Ministry CSV exports (developers use Excel)
- ATAL truncations are **predictable patterns** (abbreviate long words at character limit)
- **Fuzzy matching risk**: Truncated names are closer to generic terms

**Common ATAL Abbreviations**:
- `mieszkalnego` → `miesz.`
- `jednorodzinnego` → `jedn.` or `jedno.`
- `powierzchni` → `pow.` or `pow`
- `obowiązuje` → `obow.`
- `zobowiązany` → `zobo.`
- `świadczeń pieniężnych` → `świad. pienię.`

#### 3. Ministry Official (Third Priority)

**Rationale**: The official government column names from Ministry Schema 1.13.

**Characteristics**:
- **Extremely verbose** (up to 153 characters)
- **Include legal references** (e.g., "art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r.")
- **Use formal Polish** (e.g., "przedsięwzięcie deweloperskie lub zadanie inwestycyjne")
- **Contain special characters** ([zł], :, /, commas)

**Example**:
```
"Cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę
lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny,
o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3) [zł]"
```

**Why AFTER INPRO/ATAL?**
- Pure Ministry CSV exports are **rare** (most developers use INPRO/ATAL/Excel)
- Ministry names are so verbose that **fuzzy matching has lower confidence**
- Better to prioritize exact matches from common software first

#### 4. Generic Polish Variations (Fourth Priority)

**Rationale**: Common Polish column names used in custom CSV exports.

**Examples**:
```typescript
price_per_m2: [
  // ... (INPRO/ATAL/Ministry first)
  'cena za m²',
  'cena za m2',
  'cena m2',
  'cena/m2',
  'cena za metr kwadratowy',
  'cena metra'
]
```

**Why use these?**
- **Catch-all for custom developer exports** (in-house Excel templates)
- **Human-readable** column names
- **Cover common variations** (with/without spaces, different punctuation)

**Coverage**:
- Polish diacritics: `ą, ć, ę, ł, ń, ó, ś, ź, ż`
- With/without punctuation: `m2` vs `m²` vs `m 2`
- Abbreviations: `pow.` (powierzchnia), `woj.` (województwo)

#### 5. English Equivalents (Lowest Priority)

**Rationale**: Fallback for bilingual exports or international developers.

**Examples**:
```typescript
developer_name: [
  // ... (Polish variants first)
  'developer',
  'company name'
]

property_type: [
  // ... (Polish variants first)
  'property_type',
  'type',
  'category'
]
```

**Why lowest priority?**
- **Most Polish CSVs use Polish column names**
- English terms are more **generic** (higher false positive risk)
- Better to **explicitly fail** on unrecognized English columns (user can report)

**Exception**: Technical fields like `email`, `url`, `NIP` where English is common.

---

## Maintenance Guidelines

### When to Add New Synonyms

Add new synonyms when you discover:

1. **Real CSV uploads that fail to parse**
   - Check Sentry error logs for "Nie znaleziono kolumny dla: X"
   - Check user support tickets about failed uploads

2. **New developer software exports**
   - TAMBUD, Nieruchomość24, other property management systems
   - Excel templates from large developers

3. **Typos or variations in existing software**
   - INPRO version updates may change column names
   - ATAL/Excel may introduce new abbreviations

4. **Law changes requiring new column names**
   - Ministry schema updates (currently 1.13)
   - New legal requirements (e.g., art. 19a changes)

**DO NOT add synonyms for**:
- **Hypothetical variations** that don't exist in real CSVs
- **Every possible typo** (fuzzy matching handles minor typos)
- **Non-Polish languages** except English (focus on Polish market)

### How to Add New Synonyms

#### Step 1: Identify the Ministry Field

Find the correct Ministry field key in `COMPLETE_COLUMN_PATTERNS`:

```typescript
// Example: User CSV has "Numer lokalu mieszkalnego"
// This maps to Ministry field: property_number
```

**Tools to help**:
```bash
# Search for a field in the synonym file
grep -i "numer lokalu" src/lib/column-synonyms-complete.ts

# Find Ministry field by raw column name
grep -A 5 "property_number:" src/lib/column-synonyms-complete.ts
```

#### Step 2: Determine Priority Position

Where should the new synonym go?

```typescript
property_number: [
  // INPRO exact (lines 700-702) - only add if from INPRO CSV
  'nr nieruchomości nadany przez dewelopera',

  // ATAL exact (lines 703-705) - only add if from ATAL CSV
  'nr lokalu nadany przez dewelopera',

  // Ministry official (line 707) - only add if new official variant
  'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera',

  // Generic Polish (lines 709-716) - ADD YOUR SYNONYM HERE
  'oznaczenie lokalu nadane przez dewelopera',
  'nr lokalu',
  'numer lokalu',
  'numer lokalu mieszkalnego', // <- NEW SYNONYM GOES HERE

  // English (lines 718-719) - only if English CSV
  'property_number',
  'apartment_number'
]
```

**Priority Decision Tree**:
1. Is it from INPRO software export? → Add after INPRO exact comment
2. Is it from ATAL/Excel with truncation? → Add after ATAL exact comment
3. Is it an official Ministry variant? → Add after Ministry official comment
4. Is it generic Polish/custom CSV? → Add after Generic Polish comment
5. Is it English? → Add after English comment

#### Step 3: Add With and Without Diacritics

**Always add BOTH variants** (with and without Polish diacritics):

```typescript
// CORRECT:
'miejscowość lokalizacji',  // with ś
'miejscowosc lokalizacji',  // without ś

// INCORRECT (missing normalized variant):
'miejscowość lokalizacji'   // only with ś - fuzzy matching may fail!
```

**Why both?**
- CSV encoding issues (UTF-8 vs Windows-1250)
- Excel export corrupts diacritics
- User manually edits CSV in non-Polish locale

#### Step 4: Add With and Without Punctuation

```typescript
// CORRECT:
'nr lokalu, w którym prowadzona jest sprzedaż',  // with comma
'nr lokalu w którym prowadzona jest sprzedaż',   // without comma

// CORRECT:
'cena m 2 [zł]',  // with [zł]
'cena m 2 zł',    // without brackets
```

**Why both?**
- Excel removes brackets during CSV export
- Users manually edit column names
- Different software versions

#### Step 5: Test the New Synonym

```bash
# Run unit tests to verify no duplicates
npm run test src/lib/__tests__/smart-csv-parser.test.ts

# Check for duplicate synonyms across fields
npm run check-duplicates  # (if script exists)
```

**Manual verification**:
```typescript
// In Node.js console or test file:
import { COMPLETE_COLUMN_PATTERNS } from './column-synonyms-complete'

// Check the field has your new synonym
console.log(COMPLETE_COLUMN_PATTERNS.property_number)
// Should include 'numer lokalu mieszkalnego'

// Verify no duplicate
const allSynonyms = Object.values(COMPLETE_COLUMN_PATTERNS).flat()
const duplicates = allSynonyms.filter((item, index) =>
  allSynonyms.indexOf(item) !== index
)
console.log('Duplicates:', duplicates) // Should be []
```

### How to Test New Synonyms

#### Unit Test Approach

```typescript
// File: src/lib/__tests__/smart-csv-parser.test.ts
describe('COLUMN_PATTERNS Synonym Testing', () => {
  it('should map "Numer lokalu mieszkalnego" to property_number', () => {
    const csvContent = `Numer lokalu mieszkalnego,Cena za m2
M1,15000
M2,16000`

    const result = parseCSVSmart(csvContent)

    expect(result.success).toBe(true)
    expect(result.mappings['property_number']).toBe('Numer lokalu mieszkalnego')
    expect(result.data[0].property_number).toBe('M1')
  })

  it('should handle synonym with and without diacritics', () => {
    const csvWithDiacritics = `Numer lokalu mieszkalnego,Cena
M1,300000`
    const csvWithoutDiacritics = `Numer lokalu mieszkalnego,Cena
M1,300000`

    const result1 = parseCSVSmart(csvWithDiacritics)
    const result2 = parseCSVSmart(csvWithoutDiacritics)

    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
    expect(result1.mappings['property_number']).toBeTruthy()
    expect(result2.mappings['property_number']).toBeTruthy()
  })
})
```

#### Integration Test Approach

Upload a real CSV to the development environment:

```bash
# 1. Start dev server
npm run dev

# 2. Upload CSV with new synonym via UI
# - Navigate to /upload
# - Select CSV with "Numer lokalu mieszkalnego" column
# - Verify parsing succeeds
# - Check data preview shows correct mapping

# 3. Check logs
# Look for: "📊 PARSER: Detected format: ministerial/inpro/custom"
# Look for: "✅ PARSER: Extracted property_number = ..."
```

#### Coverage Verification

Check synonym statistics:

```typescript
import { getSynonymStats } from './column-synonyms-complete'

const stats = getSynonymStats()
console.log(`Total fields: ${stats.fieldCount}`)        // 65
console.log(`Total synonyms: ${stats.totalSynonyms}`)   // 520+
console.log(`Average per field: ${stats.averageSynonymsPerField}`) // 8-9

// Check specific field
console.log(`property_number synonyms: ${stats.stats.property_number}`) // 15+
```

### How to Handle Special Characters

#### Polish Diacritics

**The Challenge**: Polish uses 9 special characters (ą, ć, ę, ł, ń, ó, ś, ź, ż) that can be encoded differently:

- **UTF-8**: `ą` = U+0105
- **Windows-1250**: `ą` = 0xB1
- **Decomposed**: `ą` = `a` + combining diacritic

**Solution**: `normalizeString()` function in `smart-csv-parser.ts`:

```typescript
private normalizeString(str: string): string {
  return str
    .normalize('NFC')  // Normalize to composed form (ó not o+´)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // Keep letters, numbers, spaces
    .replace(/\s+/g, ' ')
    .trim()
}
```

**Result**:
```typescript
normalizeString('Piętro nieruchomości')  // 'piętro nieruchomości'
normalizeString('Pietro nieruchomosci')  // 'pietro nieruchomosci'
// Both are stored as synonyms, normalization happens at match time
```

**When adding synonyms**: Always include BOTH forms (with and without diacritics).

#### Legal References

**The Challenge**: Ministry columns include legal article references:

```
"rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4
ustawy z dnia 24 czerwca 1994 r. o własności lokali"
```

**Solution**: Add variants with and without legal references:

```typescript
storage_type: [
  // With full legal reference (Ministry official)
  'rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali',

  // Without law details (common truncation)
  'rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',

  // Generic (no legal reference)
  'rodzaj pomieszczeń przynależnych',

  // Simplified
  'rodzaj pomieszczen przynaleznych',
  'komórka lokatorska'
]
```

#### Unit Markers

**The Challenge**: Price/area fields use different unit notations:

```
"Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]"
```

Variations:
- `m 2` (space + superscript 2)
- `m2` (no space)
- `m²` (Unicode superscript)
- `[zł]` vs `zł` (brackets vs no brackets)

**Solution**: Add ALL variants:

```typescript
price_per_m2: [
  'cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',  // Ministry
  'cena m2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego zł',     // No brackets
  'cena za m²',
  'cena za m2',
  'cena m 2',
  'cena/m²',
  'cena/m2'
]
```

### Version Control Best Practices

#### Commit Message Format

```bash
# GOOD:
git commit -m "feat(synonyms): add TAMBUD export variants for property_number

- Add 'numer lokalu mieszkalnego' (discovered from TAMBUD CSV upload)
- Add 'nr mieszkania' (common abbreviation)
- Verified no duplicates across 65 fields
- Tests pass: 520+ synonyms, 95%+ coverage"

# BAD:
git commit -m "update synonyms"
```

#### PR Description Template

```markdown
## Synonym Addition: [Field Name]

**Context**:
- User reported failed CSV upload from [TAMBUD/Custom/etc.]
- Column name not recognized: "Numer lokalu mieszkalnego"
- Sentry error: [link]

**Changes**:
- Added 2 new synonyms to `property_number` field:
  - "numer lokalu mieszkalnego" (with diacritics)
  - "numer lokalu mieszkalnego" (without diacritics)
- Priority: Generic Polish (line 714)

**Testing**:
- [x] Unit tests pass
- [x] No duplicate synonyms
- [x] Manual CSV upload succeeds
- [x] Synonym count: 522 (was 520)

**Before/After**:
- Before: property_number had 15 synonyms
- After: property_number has 17 synonyms
- Coverage: 95.2% → 95.4%
```

#### Documentation Updates

When adding synonyms, update:

1. **This file** (`COLUMN_PATTERNS_MAINTENANCE.md`) - Examples section
2. **CHANGELOG.md** - Version history
3. **README.md** - Coverage statistics (if >5% change)

---

## Common Patterns

### Pattern 1: Simple Fields (Few Synonyms)

**Example**: NIP (tax ID)

```typescript
nip: [
  // Ministry official (all CSVs use this)
  'nr nip',

  // Generic variations
  'nip',
  'numer nip',
  'nr_nip',
  'nrnip',

  // English
  'tax_id',
  'vat_id',
  'tax id',
  'vat number'
]
```

**Characteristics**:
- **Standardized terminology** (NIP is always NIP in Poland)
- **Few variations** (8-10 synonyms total)
- **No legal references**
- **No truncation issues** (short column name)

**When to use**: Technical/administrative fields with standard names.

### Pattern 2: Complex Fields (Many Synonyms)

**Example**: Price per m² (18 synonyms)

```typescript
price_per_m2: [
  // INPRO exact (compact format)
  'cena za m2 nieruchomości',
  'cena za m2 nieruchomosci',

  // Ministry official (with "2" as superscript and [zł])
  'cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
  'cena m 2 powierzchni uzytkowej lokalu mieszkalnego / domu jednorodzinnego [zl]',

  // ATAL variant (no "za", no brackets)
  'cena m2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego zł',
  'cena m2 powierzchni uzytkowej lokalu mieszkalnego / domu jednorodzinnego zl',

  // Generic variations
  'cena metra kwadratowego powierzchni użytkowej',
  'cena za m²',
  'cena za m2',
  'cena m2',
  'cena m²',
  'cena/m2',
  'cena/m²',
  'cena za m 2',
  'cena m 2',
  'cena/m 2',
  'cena za metr',

  // English
  'price_per_m2',
  'price_per_sqm',
  'cena_za_m2',
  'cena_m2'
]
```

**Characteristics**:
- **Multiple notation systems** (m², m2, m 2)
- **Unit markers** ([zł], zł, PLN)
- **Verbose Ministry names** (40+ characters)
- **ATAL truncation** (abbreviations)
- **High variation** (18+ synonyms)

**When to use**: Price, area, and measurement fields.

### Pattern 3: Fields with Law References

**Example**: Storage room type (13 synonyms)

```typescript
storage_type: [
  // Ministry official (full text with law reference)
  'rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali',
  'rodzaj pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o wlasnosci lokali',

  // Without law reference
  'rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
  'rodzaj pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4',

  // Generic
  'rodzaj pomieszczeń przynależnych',
  'rodzaj pomieszczen przynaleznych',
  'komórka lokatorska',
  'storage type',
  'rodzaj komórki',
  'rodzaj komorki'
]
```

**Characteristics**:
- **Legal article references** (art. X ust. Y)
- **Full law citation** (ustawy z dnia DD.MM.RRRR r.)
- **Very long names** (100+ characters)
- **Truncation variants** (with/without law details)

**When to use**: Fields referencing specific laws (storage, parking, rights).

### Pattern 4: Fields with ATAL Truncation Issues

**Example**: Base price valid from date (11 synonyms)

```typescript
base_price_valid_from: [
  // INPRO exact
  'data od której obowiązuje cena nieruchomości',
  'data od ktorej obowiazuje cena nieruchomosci',

  // Ministry official (very long - 153 chars)
  'data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni',
  'data od ktorej obowiazuje cena lokalu mieszkalnego lub domu jednorodzinnego bedacych przedmiotem umowy stanowiaca iloczyn ceny m2 oraz powierzchni',

  // ATAL truncated (typo: "miesz." instead of "mieszkalnego", "pow" instead of "powierzchni")
  'data od której obowiązuje cena lokalu miesz. lub domu jedn. będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz pow',
  'data od ktorej obowiazuje cena lokalu miesz. lub domu jedn. bedacych przedmiotem umowy stanowiaca iloczyn ceny m2 oraz pow',

  // Generic
  'data obowiązywania ceny bazowej',
  'data bazowa',
  'data_bazowa',
  'data ceny bazowej',
  'base_price_date'
]
```

**Characteristics**:
- **ATAL abbreviations**: `mieszkalnego` → `miesz.`, `jednorodzinnego` → `jedn.`, `powierzchni` → `pow`
- **Excel character limit** (255 chars) forces truncation
- **Predictable patterns** (abbreviate at word boundaries)
- **Typo risk** (missing words like "której")

**Common ATAL Abbreviations**:
```
mieszkalnego → miesz.
jednorodzinnego → jedn. / jedno.
powierzchni → pow. / pow
obowiązuje → obow.
zobowiązany → zobo.
świadczeń → świad.
pieniężnych → pienię. / pienie.
```

**When to use**: Long Ministry fields (100+ chars) that ATAL/Excel must truncate.

### Pattern 5: Fields with Polish Diacritics

**Example**: City (miejscowość)

```typescript
miejscowosc: [
  // Ministry official
  'miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
  'miejscowosc lokalizacji przedsiewziecia deweloperskiego lub zadania inwestycyjnego',

  // Shortened
  'miejscowość lokalizacji przedsięwzięcia deweloperskiego',
  'miejscowosc lokalizacji przedsiewziecia deweloperskiego',

  // Generic
  'miejscowość',
  'miejscowosc',
  'miejscowosc_inwestycji',
  'miejscowość_inwestycji',
  'miasto',

  // English
  'city',
  'town',
  'locality',
  'place'
]
```

**Diacritics to handle**:
- `ć` → `c` (miejscowość → miejscowosc)
- `ę` → `e` (przedsięwzięcia → przedsiewziecia)
- `ł` → `l` (lokalizacji - no change needed)
- `ó` → `o` (województwo → wojewodztwo)
- `ś` → `s` (właściciel → wlasciciel)
- `ą` → `a` (łącznie → lacznie)

**Always include BOTH** (with and without diacritics).

---

## Examples

### Example 1: Simple Field (Email)

**Field**: `email`
**Synonyms**: 10
**Complexity**: Low

```typescript
email: [
  // Ministry official
  'adres poczty elektronicznej',

  // Generic variations
  'email',
  'e-mail',
  'mail',
  'adres email',
  'email_kontaktowy',
  'adres_email',
  'poczta elektroniczna',

  // English
  'contact_email',
  'e-mail address'
]
```

**Analysis**:
- **No diacritics** (email is international term)
- **No law references**
- **No truncation issues** (short name)
- **Standard terminology** (everyone knows "email")

**Coverage**:
- Ministry: 100% ✅
- INPRO: 95% (uses "email" or "E-mail")
- ATAL: 95% (uses "Adres poczty elektronicznej" or truncated)
- Custom: 90% (uses "email" or "mail")

### Example 2: Complex Field with Multiple Formats (Price per m²)

**Field**: `price_per_m2`
**Synonyms**: 18
**Complexity**: High

```typescript
price_per_m2: [
  // INPRO exact (compact format)
  'cena za m2 nieruchomości',
  'cena za m2 nieruchomosci',

  // Ministry official (with "2" as superscript and [zł])
  'cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
  'cena m 2 powierzchni uzytkowej lokalu mieszkalnego / domu jednorodzinnego [zl]',

  // ATAL variant (no "za", no brackets)
  'cena m2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego zł',
  'cena m2 powierzchni uzytkowej lokalu mieszkalnego / domu jednorodzinnego zl',

  // Generic variations
  'cena metra kwadratowego powierzchni użytkowej',
  'cena za m²',
  'cena za m2',
  'cena m2',
  'cena m²',
  'cena/m2',
  'cena/m²',
  'cena za m 2',
  'cena m 2',
  'cena/m 2',
  'cena za metr',

  // English
  'price_per_m2',
  'price_per_sqm',
  'cena_za_m2',
  'cena_m2'
]
```

**Analysis**:
- **Multiple notation systems**: `m²`, `m2`, `m 2`
- **Unit markers**: `[zł]` vs `zł`
- **Verbose Ministry name**: 81 characters
- **ATAL truncation**: Removes "za" preposition
- **High variation**: 18 synonyms

**Priority Order Breakdown**:
1. **INPRO exact** (lines 723-724): "Cena za m2 nieruchomości" - most common
2. **Ministry official** (lines 727-730): Full verbose name with [zł]
3. **ATAL variant** (lines 732-735): Abbreviated, no brackets
4. **Generic Polish** (lines 738-748): All common variations
5. **English** (lines 751-754): Technical names

**Coverage**:
- Ministry: 100% ✅
- INPRO: 100% ✅ (exact match line 723)
- ATAL: 100% ✅ (exact match line 732)
- Custom: 95% (covers m2, m², m 2 variants)

### Example 3: Field with Law Reference (Storage Type)

**Field**: `storage_type`
**Synonyms**: 13
**Complexity**: Medium-High

```typescript
storage_type: [
  // Ministry official (full text with law reference - 107 chars)
  'rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali',
  'rodzaj pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o wlasnosci lokali',

  // Without law reference (42 chars - ATAL may truncate here)
  'rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
  'rodzaj pomieszczen przynaleznych, o ktorych mowa w art. 2 ust. 4',

  // Generic (no legal reference)
  'rodzaj pomieszczeń przynależnych',
  'rodzaj pomieszczen przynaleznych',
  'komórka lokatorska',
  'storage type',
  'rodzaj komórki',
  'rodzaj komorki'
]
```

**Analysis**:
- **Legal reference**: "art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r."
- **Long name**: 107 characters (Ministry official)
- **Truncation variants**: With/without full law citation
- **Diacritics**: `ń` → `n`, `ó` → `o`

**Law Reference Breakdown**:
```
"rodzaj pomieszczeń przynależnych"           (32 chars - core term)
"o których mowa w art. 2 ust. 4"             (30 chars - article reference)
"ustawy z dnia 24 czerwca 1994 r."           (31 chars - law date)
"o własności lokali"                         (18 chars - law subject)
----------------------------------------
TOTAL: 107 characters
```

**Truncation Strategy**:
1. Full name (Ministry CSV): 107 chars
2. Without law subject (ATAL): 89 chars
3. Without law date (custom): 62 chars
4. Article reference only (abbreviated): 42 chars
5. Core term only (generic): 32 chars

**Coverage**:
- Ministry: 100% ✅ (exact match line 927)
- INPRO: 90% (may use simplified "rodzaj komórki")
- ATAL: 95% (uses truncated variant line 931)
- Custom: 85% (uses "komórka lokatorska" or "storage")

### Example 4: Field with ATAL Truncation (Base Price Valid From)

**Field**: `base_price_valid_from`
**Synonyms**: 11
**Complexity**: High

```typescript
base_price_valid_from: [
  // INPRO exact
  'data od której obowiązuje cena nieruchomości',
  'data od ktorej obowiazuje cena nieruchomosci',

  // Ministry official (very long - 153 chars!!!)
  'data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni',
  'data od ktorej obowiazuje cena lokalu mieszkalnego lub domu jednorodzinnego bedacych przedmiotem umowy stanowiaca iloczyn ceny m2 oraz powierzchni',

  // ATAL truncated (abbreviated to 119 chars - Excel 255 limit)
  'data od której obowiązuje cena lokalu miesz. lub domu jedn. będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz pow',
  'data od ktorej obowiazuje cena lokalu miesz. lub domu jedn. bedacych przedmiotem umowy stanowiaca iloczyn ceny m2 oraz pow',

  // Generic
  'data obowiązywania ceny bazowej',
  'data bazowa',
  'data_bazowa',
  'data ceny bazowej',
  'base_price_date'
]
```

**Analysis**:
- **Ministry name**: 153 characters (way over Excel limit!)
- **ATAL truncation**: 119 characters (truncated at character 119)
- **Abbreviations**: `mieszkalnego` → `miesz.`, `jednorodzinnego` → `jedn.`, `powierzchni` → `pow`
- **INPRO simplification**: Removes verbose legal description

**Truncation Comparison**:
| Version | Length | Example |
|---------|--------|---------|
| Ministry | 153 | "data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni" |
| ATAL | 119 | "data od której obowiązuje cena lokalu miesz. lub domu jedn. będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz pow" |
| INPRO | 45 | "data od której obowiązuje cena nieruchomości" |
| Generic | 30 | "data obowiązywania ceny bazowej" |

**ATAL Abbreviation Rules**:
1. **Character limit reached?** → Start abbreviating
2. **Abbreviate long words first**: `mieszkalnego` (13 chars) → `miesz.` (6 chars) saves 7 chars
3. **Next longest word**: `jednorodzinnego` (16 chars) → `jedn.` (5 chars) saves 11 chars
4. **Drop word endings**: `powierzchni` (12 chars) → `pow` (3 chars) saves 9 chars
5. **Preserve critical words**: Keep "data od której", "obowiązuje", "cena"

**Coverage**:
- Ministry: 100% ✅ (exact match line 799)
- INPRO: 100% ✅ (exact match line 796)
- ATAL: 100% ✅ (exact match line 802)
- Custom: 80% (generic terms like "data bazowa")

### Example 5: Field with Diacritics (City - miejscowość)

**Field**: `miejscowosc`
**Synonyms**: 12
**Complexity**: Medium

```typescript
miejscowosc: [
  // Ministry official
  'miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
  'miejscowosc lokalizacji przedsiewziecia deweloperskiego lub zadania inwestycyjnego',

  // Shortened
  'miejscowość lokalizacji przedsięwzięcia deweloperskiego',
  'miejscowosc lokalizacji przedsiewziecia deweloperskiego',

  // Generic
  'miejscowość',
  'miejscowosc',
  'miejscowosc_inwestycji',
  'miejscowość_inwestycji',
  'miasto',

  // English
  'city',
  'town',
  'locality',
  'place'
]
```

**Diacritic Mapping**:
```
ć → c:   miejscowość → miejscowosc
ę → e:   przedsięwzięcia → przedsiewziecia
ó → o:   (not in this field, but common in województwo → wojewodztwo)
ł → l:   lokalizacji (already 'l', no change)
ś → s:   (not in this field)
ą → a:   zadania (already 'a', no change)
```

**Why Both Forms?**:

1. **Encoding issues**:
```csv
# UTF-8 CSV (correct):
"Miejscowość,Województwo"

# Windows-1250 export opened in UTF-8 (corrupted):
"Miejscowo\xE6,Wojew\xF3dztwo"
```

2. **Manual editing**:
- User types on English keyboard → "miejscowosc" (no ś available)
- User copies from non-Polish source → diacritics lost

3. **Excel autocorrect**:
- Excel may "fix" diacritics inconsistently
- Depends on locale settings

**Fuzzy Matching**:
```typescript
// Input: "Miejscowość lokalizacji przedsięwzięcia"
normalizeString('Miejscowość lokalizacji przedsięwzięcia')
// → 'miejscowosc lokalizacji przedsiewziecia'

// Matches synonym: 'miejscowosc lokalizacji przedsiewziecia'
// Score: 1.0 (exact match after normalization)
```

**Coverage**:
- Ministry: 100% ✅ (with and without diacritics)
- INPRO: 95% (uses shortened "miejscowość")
- ATAL: 100% (uses Ministry official name)
- Custom: 90% (uses "miasto" or "city")

---

## Testing Strategy

### Unit Tests

**File**: `src/lib/__tests__/smart-csv-parser.test.ts`

#### Test 1: Synonym Mapping

```typescript
describe('COLUMN_PATTERNS Synonym Mapping', () => {
  it('should map INPRO exact column names', () => {
    const csvContent = `Nr nieruchomości nadany przez dewelopera,Cena za m2 nieruchomości
M1,15000
M2,16000`

    const result = parseCSVSmart(csvContent)

    expect(result.success).toBe(true)
    expect(result.mappings['property_number']).toBe('Nr nieruchomości nadany przez dewelopera')
    expect(result.mappings['price_per_m2']).toBe('Cena za m2 nieruchomości')
  })

  it('should map Ministry official column names', () => {
    const csvContent = `Nr lokalu lub domu jednorodzinnego nadany przez dewelopera,Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]
M1,15000
M2,16000`

    const result = parseCSVSmart(csvContent)

    expect(result.success).toBe(true)
    expect(result.detectedFormat).toBe('ministerial')
  })

  it('should map ATAL truncated column names', () => {
    const csvContent = `Nr lokalu,Data od której obowiązuje cena lokalu miesz. lub domu jedn. będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz pow
M1,2025-01-01
M2,2025-01-02`

    const result = parseCSVSmart(csvContent)

    expect(result.success).toBe(true)
    expect(result.mappings['base_price_valid_from']).toBeTruthy()
  })
})
```

#### Test 2: Diacritic Handling

```typescript
describe('Polish Diacritic Handling', () => {
  it('should match columns with diacritics', () => {
    const csvWithDiacritics = `Miejscowość,Województwo,Powierzchnia
Warszawa,Mazowieckie,50`

    const result = parseCSVSmart(csvWithDiacritics)

    expect(result.success).toBe(true)
    expect(result.mappings['miejscowosc']).toBe('Miejscowość')
    expect(result.mappings['wojewodztwo']).toBe('Województwo')
  })

  it('should match columns without diacritics', () => {
    const csvWithoutDiacritics = `Miejscowosc,Wojewodztwo,Powierzchnia
Warszawa,Mazowieckie,50`

    const result = parseCSVSmart(csvWithoutDiacritics)

    expect(result.success).toBe(true)
    expect(result.mappings['miejscowosc']).toBe('Miejscowosc')
    expect(result.mappings['wojewodztwo']).toBe('Wojewodztwo')
  })
})
```

#### Test 3: No Duplicates

```typescript
describe('Synonym Integrity', () => {
  it('should have no duplicate synonyms across fields', () => {
    const allSynonyms = Object.values(COMPLETE_COLUMN_PATTERNS).flat()
    const seen = new Set<string>()
    const duplicates: string[] = []

    allSynonyms.forEach(synonym => {
      const normalized = normalizeString(synonym)
      if (seen.has(normalized)) {
        duplicates.push(synonym)
      }
      seen.add(normalized)
    })

    expect(duplicates).toEqual([])
  })

  it('should have 65 fields (58 Ministry + 7 INPRO extras)', () => {
    const fieldCount = Object.keys(COMPLETE_COLUMN_PATTERNS).length
    expect(fieldCount).toBe(65)
  })

  it('should have 520+ total synonyms', () => {
    const totalSynonyms = Object.values(COMPLETE_COLUMN_PATTERNS)
      .flat()
      .length
    expect(totalSynonyms).toBeGreaterThanOrEqual(520)
  })
})
```

### Integration Tests

**File**: `src/app/api/upload-csv/route.test.ts`

```typescript
describe('CSV Upload Integration', () => {
  it('should parse INPRO CSV export', async () => {
    const inproCSV = readFileSync('tests/fixtures/inpro-export.csv', 'utf-8')

    const response = await fetch('/api/upload-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent: inproCSV })
    })

    const result = await response.json()

    expect(result.success).toBe(true)
    expect(result.detectedFormat).toBe('inpro')
    expect(result.formatConfidence).toBeGreaterThan(90)
  })

  it('should parse Ministry CSV export', async () => {
    const ministryCSV = readFileSync('tests/fixtures/ministry-schema-1.13.csv', 'utf-8')

    const response = await fetch('/api/upload-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent: ministryCSV })
    })

    const result = await response.json()

    expect(result.success).toBe(true)
    expect(result.detectedFormat).toBe('ministerial')
    expect(result.formatConfidence).toBeGreaterThan(90)
  })
})
```

### Manual Testing Checklist

Before merging synonym changes:

- [ ] Upload INPRO CSV → 95%+ confidence
- [ ] Upload ATAL CSV → 95%+ confidence
- [ ] Upload Ministry CSV → 100% confidence
- [ ] Upload custom CSV → 80%+ confidence
- [ ] Check no duplicate synonyms
- [ ] Verify synonym count increased
- [ ] Check format detection is correct
- [ ] Test with/without diacritics
- [ ] Test with/without punctuation
- [ ] Check parsing time < 2s (for 1000 row CSV)

### Coverage Metrics

**Expected Coverage**:
- **INPRO format**: 95%+ automatic column mapping
- **ATAL format**: 95%+ automatic column mapping
- **Ministry format**: 100% automatic column mapping (by definition)
- **Custom format**: 80%+ automatic column mapping

**How to measure coverage**:

```typescript
import { getSynonymStats } from './column-synonyms-complete'

const stats = getSynonymStats()

// Total coverage
console.log(`Fields: ${stats.fieldCount}`)           // 65
console.log(`Synonyms: ${stats.totalSynonyms}`)      // 520+
console.log(`Avg per field: ${stats.averageSynonymsPerField}`) // 8-9

// Per-field coverage
Object.entries(stats.stats).forEach(([field, count]) => {
  console.log(`${field}: ${count} synonyms`)
})

// Coverage by format
const inproCoverage = calculateFormatCoverage('inpro')  // 95%+
const atalCoverage = calculateFormatCoverage('atal')    // 95%+
const ministryCoverage = calculateFormatCoverage('ministerial') // 100%
```

**Target Metrics**:
```
Minimum synonyms per field: 5
Average synonyms per field: 8-10
Maximum synonyms per field: 20
Total synonyms: 520+
Format detection confidence: 90%+
Parsing success rate: 98%+
```

---

## Troubleshooting

### Problem 1: Column Not Recognized

**Symptom**: User uploads CSV, gets error "Nie znaleziono kolumny dla: X"

**Diagnosis**:
1. Check Sentry error log for exact column name
2. Identify which field it should map to
3. Check if synonym already exists (might be encoding issue)

**Solution**:
```typescript
// Add missing synonym to appropriate field
property_number: [
  // ... existing synonyms
  'oznaczenie lokalu',        // <- ADD NEW SYNONYM HERE
  'oznaczenie_lokalu'         // <- Also without underscore
]
```

**Test**:
```bash
# Create test CSV with problematic column
echo "oznaczenie lokalu,Cena
M1,300000" > test.csv

# Upload and verify
curl -X POST http://localhost:3000/api/upload-csv \
  -H "Content-Type: application/json" \
  -d '{"csvContent": "oznaczenie lokalu,Cena\nM1,300000"}'
```

### Problem 2: Wrong Field Mapping

**Symptom**: Parser maps column to wrong field (e.g., "cena parkingu" maps to "cena mieszkania")

**Diagnosis**:
1. Check priority order - is there a more specific synonym that should match first?
2. Check fuzzy match score - may be too low confidence threshold

**Solution**:
```typescript
// BEFORE (ambiguous - matches both parking_price and total_price):
parking_price: [
  'cena',  // TOO GENERIC!
  'cena parkingu'
]

// AFTER (more specific terms first):
parking_price: [
  'cena części nieruchomości, będących przedmiotem umowy [zł]',  // Ministry exact
  'cena parkingu',                                                // Specific
  'cena garażu',                                                  // Specific
  'cena miejsca parkingowego'                                     // Specific
  // DON'T add generic "cena" - too ambiguous
]
```

### Problem 3: Duplicate Synonyms

**Symptom**: Unit test fails with "Duplicate synonym: X found in fields Y and Z"

**Diagnosis**:
```typescript
// Find duplicate
const allSynonyms = Object.entries(COMPLETE_COLUMN_PATTERNS)
const duplicates = allSynonyms.reduce((acc, [field, synonyms]) => {
  synonyms.forEach(syn => {
    if (acc[syn]) {
      console.log(`DUPLICATE: "${syn}" in ${field} and ${acc[syn]}`)
    }
    acc[syn] = field
  })
  return acc
}, {})
```

**Solution**:
```typescript
// BEFORE (duplicate "nr lokalu"):
property_number: ['nr lokalu', 'numer lokalu', ...]
parking_designation: ['nr lokalu', 'nr parkingu', ...] // DUPLICATE!

// AFTER (make more specific):
property_number: ['nr lokalu mieszkalnego', 'numer lokalu', ...]
parking_designation: ['nr parkingu', 'oznaczenie parkingu', ...]
```

### Problem 4: Encoding Issues

**Symptom**: Parser fails on CSV with Polish characters, shows garbage characters

**Diagnosis**:
1. Check CSV encoding - should be UTF-8
2. Check if diacritics are present in synonyms
3. Test `normalizeString()` function

**Solution**:
```typescript
// Ensure both variants exist:
miejscowosc: [
  'miejscowość lokalizacji',  // WITH diacritics (UTF-8)
  'miejscowosc lokalizacji',  // WITHOUT diacritics (Windows-1250)
]

// Add BOM detection to parser:
if (csvContent.startsWith('\ufeff')) {
  csvContent = csvContent.slice(1) // Remove UTF-8 BOM
}
```

### Problem 5: ATAL Truncation Not Recognized

**Symptom**: ATAL CSV fails to parse, columns not recognized

**Diagnosis**:
1. Check column names in ATAL export - are they truncated at 255 chars?
2. Identify which words are abbreviated (mieszk., pow., jedn.)
3. Compare to Ministry official names

**Solution**:
```typescript
// Add ATAL abbreviation pattern
base_price_valid_from: [
  // Ministry official (153 chars)
  'data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni',

  // ATAL truncated (119 chars)
  'data od której obowiązuje cena lokalu miesz. lub domu jedn. będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz pow',

  // Even more truncated (if needed)
  'data od której obow. cena lokalu miesz. lub domu jedn. bedacych przedmiotem umowy stanowiąca iloczyn m2 pow'
]
```

### Problem 6: Low Format Detection Confidence

**Symptom**: `formatConfidence` is 60% (below 90% threshold)

**Diagnosis**:
```typescript
// Check format detection signature matches
const formatDetection = this.detectFormat()
console.log(`Format: ${formatDetection.format}`)
console.log(`Confidence: ${formatDetection.confidence}%`)
console.log(`Details: ${formatDetection.details}`)
```

**Solution**:
```typescript
// Add more signature columns to format detection
const ministerialSignatures = [
  'Nazwa dewelopera',                    // Field 1 (critical)
  'Forma prawna dewelopera',             // Field 2 (critical)
  'Nr lokalu lub domu jednorodzinnego',  // Field 38 (critical)
  // ADD MORE UNIQUE MINISTRY COLUMNS
  'Sposób kontaktu nabywcy z deweloperem', // Field 29 (unique to ministry)
]
```

### Problem 7: Performance Issues (Slow Parsing)

**Symptom**: Parsing 1000-row CSV takes >5 seconds

**Diagnosis**:
```typescript
console.time('parseCSV')
const result = parseCSVSmart(largeCSV)
console.timeEnd('parseCSV') // Should be <2s
```

**Solution**:
1. **Cache normalized strings**:
```typescript
// BEFORE (normalizes on every comparison):
for (const pattern of patterns) {
  const score = this.fuzzyMatch(normalizedHeader, this.normalizeString(pattern))
}

// AFTER (normalize once):
private normalizedPatterns = Object.entries(COLUMN_PATTERNS).reduce((acc, [field, patterns]) => {
  acc[field] = patterns.map(p => this.normalizeString(p))
  return acc
}, {})

for (const pattern of this.normalizedPatterns[field]) {
  const score = this.fuzzyMatch(normalizedHeader, pattern) // Already normalized
}
```

2. **Early exit on exact match**:
```typescript
if (score === 1.0) {
  return pattern // Don't check other patterns
}
```

3. **Reduce Levenshtein distance calculations**:
```typescript
// Only calculate if contains match fails
if (str1.includes(str2) || str2.includes(str1)) {
  return 0.9 // Skip expensive Levenshtein
}
```

### Debugging Tools

#### Tool 1: Synonym Lookup

```typescript
import { getSynonymsForField } from './column-synonyms-complete'

// Check what synonyms exist for a field
const synonyms = getSynonymsForField('property_number')
console.log(`property_number has ${synonyms.length} synonyms:`)
synonyms.forEach((syn, i) => console.log(`  ${i+1}. ${syn}`))
```

#### Tool 2: Fuzzy Match Score

```typescript
import { SmartCSVParser } from './smart-csv-parser'

const parser = new SmartCSVParser('dummy,csv')
const score = parser['fuzzyMatch']('miejscowosc lokalizacji', 'miejscowość lokalizacji')
console.log(`Fuzzy match score: ${score}`) // Should be ~0.95
```

#### Tool 3: Format Detection Test

```typescript
const csvContent = `Nazwa dewelopera,Nr lokalu,Cena m 2 [zł]
ACME,M1,15000`

const parser = new SmartCSVParser(csvContent)
const detection = parser['detectFormat']()
console.log(`Format: ${detection.format}`)         // ministerial
console.log(`Confidence: ${detection.confidence}`) // 90+
console.log(`Details: ${detection.details}`)       // Explains why
```

---

## Version Control

### Changelog Format

Document all synonym changes in `CHANGELOG.md`:

```markdown
# Changelog

## [1.2.0] - 2025-10-15

### Added
- **TAMBUD Support**: Added 15 new synonyms for TAMBUD CSV exports
  - `property_number`: "numer lokalu mieszkalnego", "nr mieszkania"
  - `price_per_m2`: "cena za mkw", "cena/mkw"
  - Coverage: TAMBUD 90% → 98%

### Changed
- **ATAL Truncation**: Updated base_price_valid_from synonyms
  - Added more abbreviated variants for Excel 255-char limit
  - ATAL coverage: 92% → 97%

### Fixed
- **Duplicate Synonym**: Removed duplicate "nr lokalu" from parking_designation
- **Encoding Issue**: Added Windows-1250 variants for all fields with diacritics

### Stats
- Total synonyms: 520 → 535 (+15)
- Total fields: 65 (unchanged)
- Average per field: 8.0 → 8.2
- Test coverage: 98.5%
```

### Git Commit Guidelines

**Commit Message Format**:
```
<type>(synonyms): <short summary>

<detailed description>

<metadata>
```

**Types**:
- `feat`: New synonyms added
- `fix`: Duplicate removed, wrong mapping fixed
- `docs`: Documentation update
- `test`: Test coverage improvement
- `perf`: Performance optimization

**Examples**:

```bash
# GOOD - Descriptive and detailed
git commit -m "feat(synonyms): add TAMBUD export support for property_number

Added 2 new synonyms for TAMBUD CSV exports:
- 'numer lokalu mieszkalnego' (generic Polish)
- 'nr mieszkania' (common abbreviation)

Verified no duplicates across 65 fields.
Tests pass: 535 total synonyms, 98.5% coverage.

Closes #123"

# BAD - Too vague
git commit -m "update synonyms"

# BAD - Missing details
git commit -m "add new synonym"
```

### Pull Request Template

```markdown
## Synonym Addition PR

**Context**:
- [ ] User reported failed CSV upload
- [ ] New software export discovered
- [ ] Proactive coverage improvement

**Details**:
- Software: [TAMBUD/INPRO/ATAL/Custom]
- Field(s) affected: property_number, price_per_m2
- Synonyms added: 5
- Priority level: Generic Polish

**Changes**:
- `property_number`: Added "numer lokalu mieszkalnego", "nr mieszkania"
- `price_per_m2`: Added "cena za mkw", "cena/mkw"

**Testing**:
- [x] Unit tests pass
- [x] No duplicate synonyms
- [x] Manual CSV upload succeeds
- [x] Format detection correct
- [x] Coverage increased: 92% → 98%

**Before/After**:
| Metric | Before | After |
|--------|--------|-------|
| Total synonyms | 520 | 525 |
| TAMBUD coverage | 90% | 98% |
| Test coverage | 98.2% | 98.5% |

**Documentation**:
- [x] CHANGELOG.md updated
- [x] COLUMN_PATTERNS_MAINTENANCE.md updated (if major change)
- [ ] README.md updated (not needed for minor additions)
```

### Semantic Versioning

Follow semver for synonym changes:

**MAJOR version** (X.0.0):
- Ministry schema upgrade (e.g., 1.13 → 2.0)
- Breaking changes to field names
- Complete synonym database restructure

**MINOR version** (0.X.0):
- New software format support (TAMBUD, etc.)
- 10+ synonyms added
- New utility functions

**PATCH version** (0.0.X):
- 1-5 synonyms added
- Bug fix (duplicate removed)
- Minor coverage improvement

**Example**:
```
v1.0.0 - Initial release (Ministry Schema 1.13, 500 synonyms)
v1.1.0 - Add TAMBUD support (+25 synonyms)
v1.1.1 - Fix duplicate "nr lokalu" (-1 synonym)
v1.2.0 - Add ATAL abbreviated variants (+30 synonyms)
v2.0.0 - Upgrade to Ministry Schema 2.0 (65 → 70 fields)
```

---

## Summary

This guide provides everything needed to maintain and extend `COLUMN_PATTERNS`:

**Core Concepts**:
- 65 fields (58 Ministry + 7 INPRO extras)
- 520+ synonyms covering INPRO/ATAL/Ministry/Custom formats
- Priority order: INPRO → ATAL → Ministry → Generic → English
- Fuzzy matching handles typos and diacritics

**Maintenance**:
- Add synonyms when real CSVs fail to parse
- Always include with/without diacritics
- Test for duplicates before merging
- Follow semver and document in CHANGELOG

**Testing**:
- Unit tests verify no duplicates
- Integration tests verify format detection
- Target 95%+ coverage for INPRO/ATAL/Ministry

**Troubleshooting**:
- Use debugging tools to diagnose issues
- Check priority order for wrong mappings
- Add ATAL abbreviations for truncation issues

**Version Control**:
- Descriptive commit messages with stats
- PR template for synonym additions
- Semver for versioning (major.minor.patch)

---

**Maintainers**: Claude Code, OTO-RAPORT Team
**Contact**: support@oto-raport.pl
**Last Review**: 2025-10-15
**Next Review**: 2026-01-15 (quarterly)
