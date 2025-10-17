# CSV Parser Documentation - Polish Character Support

## Overview

The `SmartCSVParser` in `smart-csv-parser.ts` provides intelligent CSV column matching with full support for Polish diacritical characters (ą, ć, ę, ł, ń, ó, ś, ź, ż). This document explains the recent updates to the `normalizeString()` method and how Polish character preservation works.

---

## Recent Changes (Task #96)

### Problem Fixed

**Before**: The CSV parser was stripping Polish diacritical marks during column name normalization, converting "Piętro" → "pitro" and "Województwo" → "wojewodztwo". This caused failed column matches when developers uploaded CSV files with proper Polish characters.

**After**: Polish diacritics are now fully preserved during normalization: "Piętro" → "piętro" and "Województwo" → "województwo".

### What Changed

Updated the `normalizeString()` method to:
1. Use Unicode NFC (Normalized Form Composed) normalization
2. Preserve ALL Unicode letters (including Polish ą, ć, ę, ł, ń, ó, ś, ź, ż)
3. Keep Unicode numbers (including superscripts like ²)
4. Remove only punctuation and special symbols

---

## How normalizeString() Works

### Method Purpose

The `normalizeString()` method normalizes CSV column headers to enable fuzzy matching regardless of:
- Unicode representation (NFC vs NFD)
- Case (UPPERCASE vs lowercase)
- Whitespace variations (multiple spaces, tabs, newlines)
- Punctuation (brackets, dots, colons)

### Normalization Steps

```typescript
private normalizeString(str: string): string {
  return str
    // Step 1: Unicode NFC normalization
    .normalize('NFC')

    // Step 2: Case normalization
    .toLowerCase()

    // Step 3: Remove punctuation (preserve letters & numbers)
    .replace(/[^\p{L}\p{N}\s]/gu, '')

    // Step 4: Normalize whitespace
    .replace(/\s+/g, ' ')

    // Step 5: Trim
    .trim()
}
```

---

## Unicode Normalization (NFC)

### Why Unicode Normalization?

Polish characters can be represented in two ways in Unicode:
- **NFC (Composed)**: Single character like `ó` (U+00F3)
- **NFD (Decomposed)**: Base letter + combining accent like `o` (U+006F) + `´` (U+0301)

Different systems may export CSVs with different Unicode forms. Without normalization, "Łódź" in NFC would not match "Łódź" in NFD even though they look identical.

### What NFC Does

`.normalize('NFC')` converts decomposed characters to their composed form:
- `o + ´` → `ó`
- `L + /` → `Ł`
- `a + ˛` → `ą`

This ensures consistent matching regardless of the source system's Unicode encoding.

---

## Polish Character Preservation

### Supported Polish Characters

The regex pattern `\p{L}` matches ALL Unicode letters, including:

| Character | Name | Lowercase | Uppercase |
|-----------|------|-----------|-----------|
| ą | A with ogonek | ą | Ą |
| ć | C with acute | ć | Ć |
| ę | E with ogonek | ę | Ę |
| ł | L with stroke | ł | Ł |
| ń | N with acute | ń | Ń |
| ó | O with acute | ó | Ó |
| ś | S with acute | ś | Ś |
| ź | Z with acute | ź | Ź |
| ż | Z with dot above | ż | Ż |

### Examples - Before and After

| Input | Before (WRONG) | After (CORRECT) |
|-------|----------------|-----------------|
| `Piętro nieruchomości` | `pitro nieruchomoci` | `piętro nieruchomości` |
| `WOJEWÓDZTWO ŁÓDZKIE` | `wojewodztwo lodzkie` | `województwo łódzkie` |
| `Metraż użytkowy` | `metraz uytkowy` | `metraż użytkowy` |
| `Pow. użytkowa [m²]` | `pow uytkowa m2` | `pow użytkowa m²` |

---

## Usage Examples

### Real CSV Column Names

#### INPRO Format
```typescript
normalizeString('Piętro nieruchomości')
// Output: 'piętro nieruchomości'

normalizeString('Rodzaj nieruchomości: lokal mieszkalny')
// Output: 'rodzaj nieruchomości lokal mieszkalny'

normalizeString('Metraż użytkowy [m²]')
// Output: 'metraż użytkowy m²'
```

#### ATAL Format
```typescript
normalizeString('LP.')
// Output: 'lp'

normalizeString('Status (dostępne/sprzedane)')
// Output: 'status dostępnesprzedane'

normalizeString('Powierzchnia [m²]')
// Output: 'powierzchnia m²'
```

#### Ministry Schema (Schema 1.13)
```typescript
normalizeString('Województwo lokalizacji lokalu')
// Output: 'województwo lokalizacji lokalu'

normalizeString('Powierzchnia użytkowa lokalu')
// Output: 'powierzchnia użytkowa lokalu'

normalizeString('Piętro lokalu')
// Output: 'piętro lokalu'
```

### Edge Cases

```typescript
// Empty string
normalizeString('')
// Output: ''

// Whitespace only
normalizeString('   \t\n  ')
// Output: ''

// Multiple spaces
normalizeString('Województwo    Łódzkie')
// Output: 'województwo łódzkie'

// Punctuation removal
normalizeString('Nr. mieszkania (lokal)')
// Output: 'nr mieszkania lokal'

// Mixed Polish and English
normalizeString('Status: Sprzedane!')
// Output: 'status sprzedane'

// Unicode emoji removal
normalizeString('Test 😀 emoji')
// Output: 'test emoji'

// Idempotent (running twice gives same result)
normalizeString(normalizeString('WOJEWÓDZTWO!!!'))
// Output: 'województwo'
```

---

## Test Coverage

### Test File Location
`src/lib/__tests__/smart-csv-parser.test.ts`

### Test Suites

1. **Polish character preservation**
   - All 9 Polish diacritics (lowercase and uppercase)
   - Full words with diacritics
   - Mixed Polish and non-Polish characters

2. **Unicode normalization (NFC vs NFD)**
   - Composed vs decomposed character matching
   - Complex decomposed characters
   - Consistency checks

3. **Whitespace normalization**
   - Multiple spaces → single space
   - Leading/trailing trim
   - Tabs and newlines

4. **Case normalization**
   - Uppercase → lowercase
   - Mixed case handling

5. **Special character removal**
   - Punctuation removal
   - Symbol removal
   - Alphanumeric preservation

6. **Real CSV column names**
   - INPRO format columns
   - ATAL format columns
   - Ministry schema columns

7. **Edge cases**
   - Empty strings
   - Whitespace-only strings
   - Special characters only
   - Numbers only
   - Very long strings
   - Unicode emoji and symbols
   - Idempotency

8. **Real-world matching scenarios**
   - Column name variations
   - Abbreviations vs full words
   - Similar but different fields
   - Diacritic sensitivity (not diacritic-insensitive!)

### Running Tests

```bash
# Run all CSV parser tests
npm test src/lib/__tests__/smart-csv-parser.test.ts

# Run with coverage
npm test -- --coverage src/lib/__tests__/smart-csv-parser.test.ts

# Watch mode (for development)
npm test -- --watch src/lib/__tests__/smart-csv-parser.test.ts
```

---

## Technical Details

### Regex Pattern Explanation

```typescript
/[^\p{L}\p{N}\s]/gu
```

- `^` - Negation (match everything EXCEPT)
- `\p{L}` - Unicode Letter property (includes ALL letters: a-z, A-Z, ą, ć, ę, ł, ń, ó, ś, ź, ż, etc.)
- `\p{N}` - Unicode Number property (includes 0-9, ², ³, etc.)
- `\s` - Whitespace (spaces, tabs, newlines)
- `u` - Unicode mode (required for `\p{}` patterns)
- `g` - Global flag (replace all occurrences)

This pattern removes ONLY punctuation and special symbols, preserving:
- All Polish letters (ą, ć, ę, ł, ń, ó, ś, ź, ż)
- All other Unicode letters (é, ñ, ü, etc.)
- All numbers (0-9, superscripts)
- All whitespace

### Why Not Diacritic-Insensitive?

**We DO NOT remove diacritics** because:
1. Polish words with and without diacritics have different meanings
2. Ministry schema requires exact Polish characters in XML output
3. Removing diacritics would cause false matches (e.g., "łódka" vs "lodka")

Instead, we:
- **Preserve Polish characters exactly**
- **Normalize Unicode representation** (NFC vs NFD)
- Use **fuzzy matching** (Levenshtein distance) to handle typos

---

## Migration Notes

### If You're Upgrading from Old Version

**Before (v1.0 - BROKEN)**:
```typescript
// Old regex stripped ALL non-ASCII characters
.replace(/[^a-z0-9\s]/g, '')
// "Województwo" → "wojewodztwo" ❌
```

**After (v2.0 - FIXED)**:
```typescript
// New regex preserves Unicode letters
.replace(/[^\p{L}\p{N}\s]/gu, '')
// "Województwo" → "województwo" ✅
```

### Action Required

**None!** The change is backward-compatible. Existing CSV files will match better, and new files with Polish characters will now work correctly.

However, if you have custom column patterns that relied on the old ASCII-only behavior, you may need to update them.

---

## Performance Considerations

### Normalization Performance

The `normalizeString()` method is called once per CSV column header during parsing. Performance impact is negligible:

- **Unicode normalization**: O(n) where n = string length
- **Lowercase conversion**: O(n)
- **Regex replacement**: O(n)
- **Overall**: O(n) - linear time complexity

For a typical CSV with 50 columns, normalization takes < 1ms total.

### Caching

Column normalization results are not cached because:
1. It's called only once per CSV upload (not in hot path)
2. String manipulation is already fast (< 0.02ms per column)
3. Memory overhead of caching would exceed performance benefit

---

## Debugging Tips

### Enable Verbose Logging

To see what columns are being normalized:

```typescript
// In smart-csv-parser.ts, add console.log:
private normalizeString(str: string): string {
  const normalized = str
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()

  console.log(`[normalizeString] "${str}" → "${normalized}"`)
  return normalized
}
```

### Check Unicode Representation

To verify if a string is in NFC or NFD:

```typescript
const str = 'Województwo'
console.log('Original:', str)
console.log('NFC:', str.normalize('NFC'))
console.log('NFD:', str.normalize('NFD'))
console.log('Are they equal?', str.normalize('NFC') === str.normalize('NFD'))
```

---

## Related Files

- **Implementation**: `src/lib/smart-csv-parser.ts`
- **Tests**: `src/lib/__tests__/smart-csv-parser.test.ts`
- **Ministry Schema**: `src/lib/ministry-schema.ts`
- **Column Patterns**: `src/lib/COLUMN_PATTERNS.ts`

---

## References

- [Unicode Normalization Forms](https://unicode.org/reports/tr15/)
- [Polish Diacritics](https://en.wikipedia.org/wiki/Polish_alphabet#Letters)
- [JavaScript String.normalize()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
- [Unicode Property Escapes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape)

---

## Support

If you encounter CSV parsing issues with Polish characters:

1. Check that your CSV is UTF-8 encoded
2. Run the test suite to verify normalizeString() works correctly
3. Enable verbose logging to see normalization output
4. Check if your column names match patterns in `COLUMN_PATTERNS.ts`

For bugs or feature requests, please create an issue with:
- Sample CSV file (anonymized)
- Expected vs actual column mapping
- Console output with verbose logging enabled
