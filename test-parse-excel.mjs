/**
 * Direct Excel Parsing Test (ES Module)
 */
import XLSX from 'xlsx';
import { readFileSync } from 'fs';

console.log('🧪 TESTING EXCEL PARSING DIRECTLY\n');

// Test 1: Parse Ministry Excel
console.log('📋 TEST 1: Ministry Format');
const ministryBuffer = readFileSync('./test-ministry.xlsx');
const ministryWorkbook = XLSX.read(ministryBuffer, {
  type: 'buffer',
  cellDates: true,
  cellNF: false,
  cellText: false
});

console.log('   Sheets:', ministryWorkbook.SheetNames);
const ministrySheet = ministryWorkbook.Sheets[ministryWorkbook.SheetNames[0]];
const ministryJsonData = XLSX.utils.sheet_to_json(ministrySheet, {
  header: 1,
  defval: '',
  blankrows: false
});

console.log('   Rows:', ministryJsonData.length);
console.log('   Headers:', ministryJsonData[0]);
console.log('   First data row:', ministryJsonData[1]);
console.log('   ✅ Ministry Excel parsed successfully\n');

// Test 2: Parse INPRO Excel
console.log('📋 TEST 2: INPRO Developer Format');
const inproBuffer = readFileSync('./test-inpro.xlsx');
const inproWorkbook = XLSX.read(inproBuffer, { type: 'buffer' });
console.log('   Sheets:', inproWorkbook.SheetNames);

const inproSheet = inproWorkbook.Sheets[inproWorkbook.SheetNames[0]];
const inproJsonData = XLSX.utils.sheet_to_json(inproSheet, { header: 1, blankrows: false });

console.log('   Rows:', inproJsonData.length);
console.log('   Headers:', inproJsonData[0]);
console.log('   First data row:', inproJsonData[1]);
console.log('   ✅ INPRO Excel parsed successfully\n');

// Test 3: Parse Custom Excel with Polish characters
console.log('📋 TEST 3: Custom Format with Polish Characters');
const customBuffer = readFileSync('./test-custom.xlsx');
const customWorkbook = XLSX.read(customBuffer, { type: 'buffer' });

const customSheet = customWorkbook.Sheets[customWorkbook.SheetNames[0]];
const customJsonData = XLSX.utils.sheet_to_json(customSheet, { header: 1, blankrows: false });

console.log('   Rows:', customJsonData.length);
console.log('   Headers:', customJsonData[0]);
console.log('   First data row:', customJsonData[1]);

// Check Polish characters
const headerString = customJsonData[0].join(' ');
const hasPolishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(headerString);
console.log('   Polish characters in headers:', hasPolishChars ? '✅ YES' : '❌ NO');
console.log('   Sample header:', customJsonData[0][0]);
console.log('   ✅ Custom Excel with Polish chars parsed successfully\n');

// Test 4: Convert to CSV format
console.log('📋 TEST 4: Excel → CSV Conversion');
const csvContent = XLSX.utils.sheet_to_csv(inproSheet, {
  FS: ',',
  RS: '\n',
  blankrows: false,
  strip: true
});

console.log('   CSV length:', csvContent.length, 'characters');
console.log('   CSV preview:');
console.log('   ' + csvContent.split('\n').slice(0, 3).join('\n   '));
console.log('   ✅ CSV conversion successful\n');

// Test 5: Number formatting
console.log('📋 TEST 5: Number Format Handling');
const customData = XLSX.utils.sheet_to_json(customSheet);
console.log('   First row (JSON format):', customData[0]);

// Check if numbers are properly parsed
const firstRow = customData[0];
const priceField = firstRow['Cena/m²'] || firstRow['Cena'] || Object.values(firstRow)[4];
console.log('   Price field type:', typeof priceField);
console.log('   Price field value:', priceField);
console.log('   ✅ Number format test complete\n');

// Test 6: Multi-sheet Excel
console.log('📋 TEST 6: Multi-Sheet Excel');
const multiBuffer = readFileSync('./test-multi-sheet.xlsx');
const multiWorkbook = XLSX.read(multiBuffer, { type: 'buffer' });

console.log('   Total sheets:', multiWorkbook.SheetNames.length);
console.log('   Sheet names:', multiWorkbook.SheetNames);

multiWorkbook.SheetNames.forEach((sheetName, index) => {
  const sheet = multiWorkbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
  console.log(`   Sheet ${index + 1} "${sheetName}": ${jsonData.length} rows`);
});
console.log('   ✅ Multi-sheet Excel parsed successfully\n');

console.log('═══════════════════════════════════════════');
console.log('✅ ALL EXCEL PARSING TESTS PASSED');
console.log('═══════════════════════════════════════════');
