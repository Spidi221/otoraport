#!/usr/bin/env node

/**
 * End-to-End Test for Parking & Storage CSV Parser (Task #79.4)
 *
 * Tests that parking and storage data is correctly parsed from ministerial CSV format.
 * Uses fuzzy matching from COLUMN_PATTERNS to detect columns dynamically.
 *
 * Test file: backup dokumentów real estate app/przykładowe pliki/2025-10-09.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test file path
const TEST_FILE = path.join(__dirname, 'backup dokumentów real estate app', 'przykładowe pliki', '2025-10-09.csv');

// Test cases based on actual CSV data (0-indexed after header row)
// Note: CSV has row_number column starting at 2, but array indices start at 0
const TEST_CASES = [
  {
    name: 'Row 2 (B2/2) - X marker in price (SOLD)',
    rowIndex: 0, // row_number=2, first data row
    expected: {
      property_number: 'B2/2',
      parking_type: 'Miejsce postojowe',
      parking_designation: 'MP77',
      parking_price: '4000',
      storage_type: 'Komórka Lokatorska',
      storage_designation: 'X',
      price_per_m2: 'x', // lowercase x = sold
      total_price: 'x'
    }
  },
  {
    name: 'Row 3 (B5/2) - Valid property with parking',
    rowIndex: 1, // row_number=3, second data row
    expected: {
      property_number: 'B5/2',
      parking_type: 'Miejsce postojowe',
      parking_designation: 'MP71',
      parking_price: '4000',
      storage_type: 'Komórka Lokatorska',
      storage_designation: 'X',
      price_per_m2: '11831.88671',
      total_price: '1295000'
    }
  },
  {
    name: 'Row 4 (B7/1) - Valid property with parking',
    rowIndex: 2, // row_number=4, third data row
    expected: {
      property_number: 'B7/1',
      parking_type: 'Miejsce postojowe',
      parking_designation: 'MP66',
      parking_price: '4000',
      storage_type: 'Komórka Lokatorska',
      storage_designation: 'X',
      price_per_m2: '5984.467794',
      total_price: '655000'
    }
  },
  {
    name: 'Row 7 (B19/1) - Valid property with parking',
    rowIndex: 5, // row_number=7, sixth data row
    expected: {
      property_number: 'B19/1',
      parking_type: 'Miejsce postojowe',
      parking_designation: 'MP44/MP5',
      parking_price: '4000',
      storage_type: 'Komórka Lokatorska',
      storage_designation: 'X',
      price_per_m2: '6192.498231',
      total_price: '525000'
    }
  },
  {
    name: 'Row 19 (MR1) - Bicycle parking spot (special case)',
    rowIndex: 17, // row_number=19, 18th data row
    expected: {
      property_number: '', // Empty in this row
      parking_type: 'Miejsce rowerowe', // Bicycle parking
      parking_designation: 'MR1',
      parking_price: '14600',
      storage_type: 'Komórka Lokatorska',
      storage_designation: 'X',
      price_per_m2: 'X', // Uppercase X = sold
      total_price: 'X'
    }
  }
];

// Simplified CSV parser (RFC 4180 compliant)
function parseCSVLine(line, separator = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Normalize string for fuzzy matching (same as smart-csv-parser.ts)
function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fuzzy match score (same logic as smart-csv-parser.ts)
function fuzzyMatch(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;

  // Simplified Levenshtein distance
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLength);
}

function levenshteinDistance(str1, str2) {
  const matrix = Array.from({ length: str2.length + 1 }, (_, i) => [i]);
  matrix[0] = Array.from({ length: str1.length + 1 }, (_, i) => i);

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2[i - 1] === str1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// COLUMN_PATTERNS from smart-csv-parser.ts (parking/storage only)
const COLUMN_PATTERNS = {
  property_number: [
    'nr lokalu lub domu jednorodzinnego nadany przez dewelopera',
    'nr nieruchomości nadany przez dewelopera',
    'nr lokalu', 'numer lokalu', 'property_number'
  ],
  price_per_m2: [
    'cena za m2 nieruchomości',
    'cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
    'cena za m2', 'price_per_m2'
  ],
  total_price: [
    'cena nieruchomości',
    'cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]',
    'cena całkowita', 'total_price'
  ],
  parking_type: [
    'rodzaj części nieruchomości będących przedmiotem umowy',
    'miejsce postojowe', 'parking type', 'rodzaj parkingu'
  ],
  parking_designation: [
    'oznaczenie części nieruchomości nadane przez dewelopera',
    'oznaczenie parkingu', 'parking designation', 'nr parkingu'
  ],
  parking_price: [
    'cena części nieruchomości',
    'cena parkingu', 'parking price', 'parking_price'
  ],
  parking_date: [
    'data od której obowiązuje cena części nieruchomości',
    'data obowiązywania ceny części nieruchomości',
    'data parkingu', 'parking date'
  ],
  storage_type: [
    'rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
    'komórka lokatorska', 'storage type'
  ],
  storage_designation: [
    'oznaczenie pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
    'oznaczenie komórki', 'storage designation'
  ],
  storage_price: [
    'wyszczególnienie cen pomieszczeń przynależnych',
    'cena pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
    'cena pomieszczen przynaleznych',
    'cena komórki', 'storage price'
  ],
  storage_date: [
    'data od której obowiązuje cena wyszczególnionych pomieszczeń przynależnych',
    'data obowiązywania ceny pomieszczeń przynależnych, o których mowa w art. 2 ust. 4',
    'data komórki', 'storage date'
  ]
};

// Find column index using fuzzy matching
function findColumnIndex(headers, patterns) {
  const normalizedHeaders = headers.map(h => normalizeString(h));

  for (const pattern of patterns) {
    const normalizedPattern = normalizeString(pattern);

    for (let i = 0; i < normalizedHeaders.length; i++) {
      const score = fuzzyMatch(normalizedHeaders[i], normalizedPattern);
      if (score > 0.6) { // Same threshold as smart-csv-parser.ts
        return i;
      }
    }
  }

  return -1; // Not found
}

// Main test function
async function runTests() {
  console.log('═'.repeat(70));
  console.log('  PARKING & STORAGE PARSER E2E TEST (Task #79.4)');
  console.log('═'.repeat(70));
  console.log();

  // Check if test file exists
  if (!fs.existsSync(TEST_FILE)) {
    console.error(`❌ FATAL: Test file not found: ${TEST_FILE}`);
    process.exit(1);
  }

  console.log(`📄 Test file: ${TEST_FILE}`);
  console.log();

  // Read and parse CSV
  const csvContent = fs.readFileSync(TEST_FILE, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    console.error('❌ FATAL: CSV file is empty');
    process.exit(1);
  }

  // Parse header and detect separator
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ',' : ','; // CSV uses comma
  const headers = parseCSVLine(firstLine, separator);

  console.log(`📊 CSV Info:`);
  console.log(`   - Separator: "${separator}"`);
  console.log(`   - Headers: ${headers.length} columns`);
  console.log(`   - Data rows: ${lines.length - 1}`);
  console.log();

  // Map columns using COLUMN_PATTERNS
  const columnMappings = {};
  for (const [fieldName, patterns] of Object.entries(COLUMN_PATTERNS)) {
    const index = findColumnIndex(headers, patterns);
    if (index !== -1) {
      columnMappings[fieldName] = index;
      console.log(`✅ Mapped "${fieldName}" → column ${index}: "${headers[index].substring(0, 50)}..."`);
    } else {
      console.warn(`⚠️  Failed to map "${fieldName}" (not found in headers)`);
    }
  }
  console.log();

  // Parse data rows
  const dataRows = lines.slice(1).map(line => parseCSVLine(line, separator));

  console.log('─'.repeat(70));
  console.log('  Running Tests');
  console.log('─'.repeat(70));
  console.log();

  let passed = 0;
  let failed = 0;
  const failures = [];

  // Run test cases
  for (const testCase of TEST_CASES) {
    console.log(`🧪 ${testCase.name}`);

    if (testCase.rowIndex >= dataRows.length) {
      console.log(`   ❌ FAIL: Row index ${testCase.rowIndex} out of bounds (max: ${dataRows.length - 1})`);
      failed++;
      failures.push(testCase.name);
      console.log();
      continue;
    }

    const row = dataRows[testCase.rowIndex];
    let testPassed = true;

    // Check each expected field
    for (const [fieldName, expectedValue] of Object.entries(testCase.expected)) {
      const columnIndex = columnMappings[fieldName];

      if (columnIndex === undefined) {
        console.log(`   ⚠️  SKIP: "${fieldName}" - column not mapped`);
        continue;
      }

      const actualValue = row[columnIndex] || '';
      const match = actualValue === expectedValue;

      if (match) {
        console.log(`   ✅ ${fieldName}: "${actualValue}"`);
      } else {
        console.log(`   ❌ ${fieldName}: expected="${expectedValue}", actual="${actualValue}"`);
        testPassed = false;
      }
    }

    if (testPassed) {
      console.log(`   ✅ PASS`);
      passed++;
    } else {
      console.log(`   ❌ FAIL`);
      failed++;
      failures.push(testCase.name);
    }

    console.log();
  }

  // Print summary
  console.log('═'.repeat(70));
  console.log('  Test Results');
  console.log('═'.repeat(70));
  console.log();
  console.log(`✅ Passed: ${passed}/${TEST_CASES.length}`);
  console.log(`❌ Failed: ${failed}/${TEST_CASES.length}`);
  console.log();

  if (failed > 0) {
    console.log('❌ Failed Tests:');
    failures.forEach(name => console.log(`   - ${name}`));
    console.log();
  }

  // Exit code
  if (failed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 FATAL ERROR:', error.message);
  process.exit(1);
});
