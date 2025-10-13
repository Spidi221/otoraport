/**
 * Ministry CSV Generator - Schema 59 Columns
 * Generates CSV file according to Polish Ministry requirements
 * Based on official template: 2025-09-11.csv
 *
 * CRITICAL: Separator is semicolon (;) not comma (,)
 * CRITICAL: Special sign "X" or "x" means "not applicable"
 */

export interface CSVGeneratorOptions {
  properties: any[]
  developer: {
    id: string
    company_name: string
    legal_form?: string
    krs?: string
    ceidg?: string
    nip: string
    regon?: string
    phone?: string
    email: string
    fax?: string
    website_url?: string
    // Developer address fields
    wojewodztwo?: string
    powiat?: string
    gmina?: string
    miejscowosc?: string
    ulica?: string
    nr_budynku?: string
    nr_lokalu?: string
    kod_pocztowy?: string
    [key: string]: any
  }
  projects: any[]
}

/**
 * Generate Ministry-compliant CSV file
 * Returns CSV string with 59 columns, semicolon separator
 */
export function generateCSVFile(options: CSVGeneratorOptions): string {
  const { properties, developer } = options

  // Ministry CSV column names (EXACT as in official template)
  const headers = [
    'row_number',
    'Nazwa dewelopera',
    'Forma prawna dewelopera',
    'Nr KRS',
    'Nr wpisu do CEiDG',
    'Nr NIP',
    'Nr REGON',
    'Nr telefonu',
    'Adres poczty elektronicznej',
    'Nr faxu',
    'Adres strony internetowej dewelopera',
    'Województwo adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'Powiat adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera ',
    'Gmina adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'Miejscowość adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'Ulica adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'Nr nieruchomości adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'Nr lokalu adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'Kod pocztowy adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera',
    'Województwo adresu lokalu, w którym prowadzona jest sprzedaż',
    'Powiat adresu lokalu, w którym prowadzona jest sprzedaż',
    'Gmina adresu lokalu, w którym prowadzona jest sprzedaż',
    'Miejscowość adresu lokalu, w którym prowadzona jest sprzedaż',
    'Ulica adresu lokalu, w którym prowadzona jest sprzedaż',
    'Nr nieruchomości adresu lokalu, w którym prowadzona jest sprzedaż',
    'Nr lokalu adresu lokalu, w którym prowadzona jest sprzedaż',
    'Kod pocztowy adresu lokalu, w którym prowadzona jest sprzedaż',
    'Dodatkowe lokalizacje, w których prowadzona jest sprzedaż',
    'Sposób kontaktu nabywcy z deweloperem',
    'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'Nr nieruchomości lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
    'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny ',
    'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera',
    'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
    'Data od której cena obowiązuje cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego',
    'Cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]',
    'Data od której cena obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni',
    'Cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3) [zł]',
    'Data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3)',
    'Rodzaj części nieruchomości będących przedmiotem umowy',
    'Oznaczenie części nieruchomości nadane przez dewelopera',
    'Cena części nieruchomości, będących przedmiotem umowy [zł]',
    'Data od której obowiązuje cena części nieruchomości, będących przedmiotem umowy',
    'Rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali',
    'Oznaczenie pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali',
    'Wyszczególnienie cen pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali [zł]',
    'Data od której obowiązuje cena wyszczególnionych pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali',
    'Wyszczególnienie praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego',
    'Wartość praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego [zł]',
    'Data od której obowiązuje cena wartości praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego',
    'Wyszczególnienie rodzajów innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność',
    'Wartość innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność [zł]',
    'Data od której obowiązuje cena wartości innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność',
    'Adres strony internetowej, pod którym dostępny jest prospekt informacyjny'
  ]

  // Build CSV rows
  const csvRows: string[] = []

  // Header row
  csvRows.push(headers.join(';'))

  // Data rows
  properties.forEach((property, index) => {
    const row = buildCSVRow(property, developer, index + 2) // Start from row 2 (row 1 is header)
    csvRows.push(row)
  })

  return csvRows.join('\n')
}

/**
 * Build single CSV row (59 columns)
 */
function buildCSVRow(property: any, developer: any, rowNumber: number): string {
  const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Helper: Extract field from property raw_data or top-level
  const getField = (field: string, fallback: any = 'x'): string => {
    // Check if property has raw_data
    const rawData = property.raw_data || property
    const nestedData = rawData.raw_data || rawData

    // Try to find field in nested data first
    if (nestedData[field] !== undefined && nestedData[field] !== null && nestedData[field] !== '') {
      const value = nestedData[field]
      // If value is "SOLD" or status marker, return "x" (not applicable)
      if (typeof value === 'string' && (value === 'SOLD' || value.toLowerCase() === 'x')) {
        return 'x'
      }
      return String(value)
    }

    // Try top-level property fields
    if (property[field] !== undefined && property[field] !== null && property[field] !== '') {
      const value = property[field]
      if (typeof value === 'string' && (value === 'SOLD' || value.toLowerCase() === 'x')) {
        return 'x'
      }
      return String(value)
    }

    return String(fallback)
  }

  // Helper: Format number for CSV (decimal with comma if needed)
  const formatNumber = (value: any): string => {
    if (value === null || value === undefined || value === 'x' || value === 'X' || value === 'SOLD') {
      return 'x'
    }
    if (typeof value === 'number') {
      return value.toString().replace('.', ',') // Polish format uses comma
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      if (!isNaN(parsed)) {
        return parsed.toString().replace('.', ',')
      }
    }
    return 'x'
  }

  // Build row array (59 columns)
  const columns = [
    rowNumber.toString(), // Column 1: row_number

    // Developer info (columns 2-11)
    developer.company_name || 'x',
    developer.legal_form || developer.forma_prawna || 'Spółka z ograniczoną odpowiedzialnością',
    developer.krs || 'x',
    developer.ceidg || 'x',
    developer.nip || 'x',
    developer.regon || 'x',
    developer.phone || 'x',
    developer.email || 'x',
    developer.fax || 'x',
    developer.website_url || developer.strona_internetowa || 'x',

    // Developer headquarters address (columns 12-18)
    developer.wojewodztwo || 'x',
    developer.powiat || 'x',
    developer.gmina || 'x',
    developer.miejscowosc || 'x',
    developer.ulica || 'x',
    developer.nr_budynku || 'x',
    developer.nr_lokalu || 'x',
    developer.kod_pocztowy || 'x',

    // Sales office address (columns 19-27) - usually same as headquarters
    developer.wojewodztwo || 'x',
    developer.powiat || 'x',
    developer.gmina || 'x',
    developer.miejscowosc || 'x',
    developer.ulica || 'x',
    developer.nr_budynku || 'x',
    developer.nr_lokalu || 'x',
    developer.kod_pocztowy || 'x',
    'x', // Additional sales locations
    'siedziba/mail/telefon', // Contact methods

    // Project location (columns 30-36)
    getField('wojewodztwo'),
    getField('powiat'),
    getField('gmina'),
    getField('miejscowosc'),
    getField('ulica'),
    getField('numer_nieruchomosci'),
    getField('kod_pocztowy'),

    // Property details (columns 37-43)
    getField('property_type', 'Lokal mieszkalny'), // Column 37
    getField('apartment_number'), // Column 38: Property number
    formatNumber(property.price_per_m2), // Column 39: Price per m2
    currentDate, // Column 40: Price valid from
    formatNumber(property.base_price || property.final_price), // Column 41: Total price (base)
    currentDate, // Column 42: Total price valid from
    formatNumber(property.final_price || property.base_price), // Column 43: Final price (with extras)
    currentDate, // Column 44: Final price valid from

    // Property parts (columns 45-48) - usually parking spot
    getField('miejsca_postojowe_rodzaj', 'Miejsce postojowe'),
    getField('miejsca_postojowe_nr', 'x'),
    formatNumber(getField('miejsca_postojowe_ceny', 'x')),
    currentDate,

    // Storage rooms (columns 49-52)
    'Komórka Lokatorska',
    getField('komorki_lokatorskie_nr', 'X'),
    getField('komorki_lokatorskie_ceny', 'X'),
    'X',

    // Additional rights and fees (columns 53-58)
    getField('pomieszczenia_przynalezne', 'x'),
    'X', // Value of rights
    'X', // Date
    'X', // Other payments description
    'X', // Other payments value
    'X', // Other payments date

    // Prospectus URL (column 59)
    developer.website_url || developer.strona_internetowa || 'x'
  ]

  // Escape and join columns with semicolon
  return columns.map(escapeCSV).join(';')
}

/**
 * Escape CSV field (handle quotes and special characters)
 */
function escapeCSV(field: string): string {
  if (field === null || field === undefined) {
    return 'x'
  }

  const str = String(field)

  // If field contains semicolon, comma, quote, or newline, wrap in quotes
  if (str.includes(';') || str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"` // Escape quotes by doubling them
  }

  return str
}

/**
 * Validate CSV compliance with ministry requirements
 */
export function validateCSV(csvContent: string): {
  valid: boolean
  errors: string[]
  warnings: string[]
  rowCount: number
} {
  const errors: string[] = []
  const warnings: string[] = []

  const lines = csvContent.split('\n')
  const rowCount = lines.length - 1 // Exclude header

  // Check header
  if (lines.length < 2) {
    errors.push('CSV must have header + at least 1 data row')
  }

  const header = lines[0]
  const expectedColumns = 59

  const headerColumns = header.split(';').length
  if (headerColumns !== expectedColumns) {
    errors.push(`Expected ${expectedColumns} columns, found ${headerColumns}`)
  }

  // Check separator
  if (!header.includes(';')) {
    errors.push('CSV must use semicolon (;) as separator')
  }

  // Check for required fields in header
  const requiredFields = [
    'Nazwa dewelopera',
    'Nr NIP',
    'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera',
    'Cena m 2 powierzchni użytkowej'
  ]

  requiredFields.forEach(field => {
    if (!header.includes(field)) {
      errors.push(`Missing required field: ${field}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rowCount
  }
}