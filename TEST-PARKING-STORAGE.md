# Parking & Storage Parser E2E Test

## Overview

This test validates that the CSV parser correctly extracts parking and storage data from ministerial format CSVs.

## Test File

**Location**: `backup dokumentów real estate app/przykładowe pliki/2025-10-09.csv`

**Format**: Ministerial Schema 1.13 (58+ columns)

**Test Data**: 21 properties with various parking/storage configurations

## Running the Test

```bash
# Run from project root
node test-parking-storage-parser.mjs
```

## What It Tests

### Column Mapping (Fuzzy Matching)

The test verifies that our parser correctly maps ministerial column names to internal field names:

- `property_number` → Column 37: "Nr lokalu lub domu jednorodzinnego nadany przez dewelopera"
- `parking_type` → Column 44: "Rodzaj części nieruchomości będących przedmiotem umowy"
- `parking_designation` → Column 45: "Oznaczenie części nieruchomości nadane przez dewelopera"
- `parking_price` → Column 46: "Cena części nieruchomości, będących przedmiotem umowy [zł]"
- `parking_date` → Column 47: "Data od której obowiązuje cena części nieruchomości, będących przedmiotem umowy"
- `storage_type` → Column 48: "Rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4"
- `storage_designation` → Column 49: "Oznaczenie pomieszczeń przynależnych, o których mowa w art. 2 ust. 4"
- `storage_price` → Column 50: "Wyszczególnienie cen pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy [zł]"
- `storage_date` → Column 51: "Data od której obowiązuje cena wyszczególnionych pomieszczeń przynależnych, o których mowa w art. 2 ust. 4"

### Test Cases

1. **Row 2 (B2/2)** - SOLD property with "x" marker in price fields
   - Parking: MP77, 4000 PLN
   - Storage: X (not included)

2. **Row 3 (B5/2)** - Available property with parking
   - Parking: MP71, 4000 PLN
   - Storage: X (not included)

3. **Row 4 (B7/1)** - Available property with parking
   - Parking: MP66, 4000 PLN
   - Storage: X (not included)

4. **Row 7 (B19/1)** - Available property with parking
   - Parking: MP44/MP5, 4000 PLN
   - Storage: X (not included)

5. **Row 19 (MR1)** - Bicycle parking spot (special case)
   - Parking: MR1 (Miejsce rowerowe), 14600 PLN
   - Storage: X (not included)
   - Price: X (sold)

## Expected Output

```text
══════════════════════════════════════════════════════════════════════
  PARKING & STORAGE PARSER E2E TEST (Task #79.4)
══════════════════════════════════════════════════════════════════════

📄 Test file: .../2025-10-09.csv

📊 CSV Info:
   - Separator: ","
   - Headers: 59 columns
   - Data rows: 21

✅ Mapped "property_number" → column 37
✅ Mapped "parking_type" → column 44
✅ Mapped "parking_designation" → column 45
✅ Mapped "parking_price" → column 46
✅ Mapped "storage_type" → column 48
✅ Mapped "storage_designation" → column 49

──────────────────────────────────────────────────────────────────────
  Running Tests
──────────────────────────────────────────────────────────────────────

🧪 Row 2 (B2/2) - X marker in price (SOLD)
   ✅ property_number: "B2/2"
   ✅ parking_type: "Miejsce postojowe"
   ✅ parking_designation: "MP77"
   ✅ parking_price: "4000"
   ✅ storage_type: "Komórka Lokatorska"
   ✅ storage_designation: "X"
   ✅ price_per_m2: "x"
   ✅ total_price: "x"
   ✅ PASS

... (4 more tests)

══════════════════════════════════════════════════════════════════════
  Test Results
══════════════════════════════════════════════════════════════════════

✅ Passed: 5/5
❌ Failed: 0/5

🎉 All tests passed!
```

## Key Validations

### 1. Fuzzy Column Matching

Uses the same `COLUMN_PATTERNS` and fuzzy matching logic as `smart-csv-parser.ts`:

- Normalizes Polish special characters (ł, ą, ć, ę, etc.)
- Matches with 60%+ confidence threshold
- Handles ministerial long column names

### 2. Data Extraction

- Correctly extracts parking type (e.g., "Miejsce postojowe", "Miejsce rowerowe")
- Correctly extracts parking designation (e.g., "MP71", "MR1")
- Correctly extracts parking price (4000, 14600)
- Correctly handles storage data (usually "X" = not included)

### 3. Edge Cases

- X markers in storage fields (not included)
- x/X markers in price fields (sold properties)
- Empty property numbers (parking-only rows)
- Multiple parking spots (e.g., "MP44/MP5")
- Special parking types (bicycle parking)

## Integration with Codebase

This test uses the EXACT same logic as:

- `/src/lib/smart-csv-parser.ts` - `COLUMN_PATTERNS` and fuzzy matching
- Ministry Schema 1.13 compliance (58 columns)

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

## Notes

- Test does NOT require database or server
- Pure CSV parsing test (local file read only)
- Can be run in CI/CD pipeline
- Fast execution (< 1 second)

## Related Files

- `/src/lib/smart-csv-parser.ts` - Main CSV parser implementation
- `/backup dokumentów real estate app/przykładowe pliki/2025-10-09.csv` - Test data
- `/.taskmaster/tasks/task-79.md` - Task specification
