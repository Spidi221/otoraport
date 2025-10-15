/**
 * PUBLIC CSV ENDPOINT - Ministry Compliance
 * URL: /api/public/{clientId}/data.csv
 * Returns: CSV file with 59 columns of property data (Ministry Schema 1.13)
 *
 * TASK #83.2: Fixed missing developer fields (nr_faxu, adres_strony_www)
 * - Added nr_faxu at position 9 (empty by default, not in database)
 * - Moved adres_strony_www from position 27 to position 10
 * - Added inne_swiadczenia_data at position 57 (empty by default, not in database)
 * - Removed dodatkowe_informacje_kontaktowe (not in ministry schema)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateClientId, applySecurityHeaders } from '@/lib/security'
import { rateLimit, publicRateLimit, getCachedValue, setCachedValue, getMinistryCacheKey, MINISTRY_CACHE_TTL } from '@/lib/redis-rate-limit'
import { COLUMN_PATTERNS } from '@/lib/smart-csv-parser'
import type { Database } from '@/types/database'

type Developer = Database['public']['Tables']['developers']['Row']
type Property = Database['public']['Tables']['properties']['Row']

// TASK #81.9: Type for property with raw CSV data
interface PropertyWithRawData extends Property {
  raw_csv_data: Array<{
    raw_data: Record<string, unknown>
    is_latest: boolean
  }>
}

// Next.js Route Segment Config - Dynamic with ISR
export const revalidate = 300 // Revalidate every 5 minutes
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    // SECURITY: Rate limiting (60 requests per minute)
    const { response: rateLimitResponse, rateLimitInfo } = await rateLimit(request, publicRateLimit)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { clientId } = await params

    // SECURITY: Validate client ID
    if (!validateClientId(clientId)) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: 'Invalid client ID format' }),
        { status: 400, headers }
      );
    }

    // Try to get from Redis cache first
    const cacheKey = getMinistryCacheKey(clientId, 'csv');
    const cachedCsv = await getCachedValue<string>(cacheKey);

    if (cachedCsv) {
      console.log(`[Cache HIT] Serving CSV from Redis cache for client: ${clientId}`);

      const headers = applySecurityHeaders(new Headers({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `inline; filename="ceny-mieszkan-${clientId}-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'public, max-age=300, s-maxage=3600, must-revalidate',
        'X-Generated-At': new Date().toISOString(),
        'X-Schema-Version': '1.13',
        'X-Client-ID': clientId.substring(0, 8) + '****',
        'X-Cache': 'HIT',
        'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': rateLimitInfo.reset.toString()
      }));

      return new NextResponse(cachedCsv, { status: 200, headers });
    }

    console.log(`[Cache MISS] Generating fresh CSV for client: ${clientId}`);

    // Get developer data (using admin client to bypass RLS)
    const supabase = createAdminClient()
    const { data: developer, error: devError} = await supabase
      .from('developers')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()

    if (devError || !developer) {
      return new NextResponse('Developer not found', { status: 404 })
    }

    // TASK #86.1: DEBUG LOGGING - Before LEFT JOIN
    console.log(`[DEBUG #86.1] Before LEFT JOIN - Developer ID: ${developer.id}, Client ID: ${clientId}`)

    // TASK #81.9: Get all properties WITH raw_csv_data for preserving source data
    // Use LEFT JOIN to include manually added properties (without CSV)
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select(`
        *,
        raw_csv_data!left(
          raw_data,
          is_latest
        )
      `)
      .eq('developer_id', developer.id)
      .neq('status', 'sold') // Filter out sold properties from public exports
      .order('created_at', { ascending: false })

    if (propsError) {
      console.error('[CSV ERROR] Failed to fetch properties:', propsError)
      return new NextResponse(`Error fetching properties: ${propsError.message}`, { status: 500 })
    }

    // TASK #86.1: DEBUG LOGGING - After LEFT JOIN
    console.log(`[DEBUG #86.1] After LEFT JOIN - Found ${properties?.length || 0} properties`)
    if (properties && properties.length > 0) {
      const firstProp = properties[0]
      console.log(`[DEBUG #86.1] First property ID: ${firstProp.id}, Apartment: ${firstProp.apartment_number}`)
      console.log(`[DEBUG #86.1] First property has raw_csv_data:`, firstProp.raw_csv_data ? 'YES' : 'NO')
      if (firstProp.raw_csv_data) {
        console.log(`[DEBUG #86.1] raw_csv_data array length:`, Array.isArray(firstProp.raw_csv_data) ? firstProp.raw_csv_data.length : 'NOT AN ARRAY')
        if (Array.isArray(firstProp.raw_csv_data) && firstProp.raw_csv_data.length > 0) {
          const firstRaw = firstProp.raw_csv_data[0]
          console.log(`[DEBUG #86.1] First raw_csv_data entry:`, {
            has_raw_data: !!firstRaw.raw_data,
            is_latest: firstRaw.is_latest,
            raw_data_keys_count: firstRaw.raw_data ? Object.keys(firstRaw.raw_data).length : 0,
            sample_keys: firstRaw.raw_data ? Object.keys(firstRaw.raw_data).slice(0, 5) : []
          })
        }
      }
    } else {
      console.log(`[DEBUG #86.1] No properties found for developer ${developer.id}`)
    }

    // TASK #81.9: Filter to only latest raw_csv_data version (if exists)
    const propertiesWithLatestRaw = (properties || []).map(prop => {
      if (Array.isArray(prop.raw_csv_data) && prop.raw_csv_data.length > 0) {
        // Find latest version
        const latestRaw = prop.raw_csv_data.find(r => r.is_latest === true) || prop.raw_csv_data[0]
        return {
          ...prop,
          raw_csv_data: [latestRaw]
        }
      }
      return prop
    })

    // TASK #86.1: DEBUG LOGGING - After filtering to latest
    const propsWithRaw = propertiesWithLatestRaw.filter(p => p.raw_csv_data && p.raw_csv_data.length > 0)
    console.log(`[DEBUG #86.1] After is_latest filter - ${propsWithRaw.length}/${propertiesWithLatestRaw.length} properties have raw_csv_data`)
    if (propsWithRaw.length > 0 && propsWithRaw[0].raw_csv_data?.[0]?.raw_data) {
      const sampleKeys = Object.keys(propsWithRaw[0].raw_csv_data[0].raw_data).slice(0, 10)
      console.log(`[DEBUG #86.1] Sample raw_data keys from first property:`, sampleKeys)
    }

    // Generate CSV with 59 ministry fields (preserving raw CSV data)
    const csvContent = generateMinistryCSV(developer, propertiesWithLatestRaw)

    // Cache the generated CSV for 5 minutes
    await setCachedValue(cacheKey, csvContent, MINISTRY_CACHE_TTL);
    console.log(`[Cache SET] Cached CSV for client: ${clientId} (TTL: ${MINISTRY_CACHE_TTL}s)`);

    // Set headers with security and rate limit info
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `inline; filename="ceny-mieszkan-${clientId}-${new Date().toISOString().split('T')[0]}.csv"`,
      'Cache-Control': 'public, max-age=300, s-maxage=3600, must-revalidate', // Browser: 5min, CDN: 1h
      'X-Generated-At': new Date().toISOString(),
      'X-Schema-Version': '1.13',
      'X-Client-ID': clientId.substring(0, 8) + '****',
      'X-Cache': 'MISS',
      // Rate limit headers
      'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
      'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
      'X-RateLimit-Reset': rateLimitInfo.reset.toString()
    }))

    return new NextResponse(csvContent, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('CSV generation error:', error)

    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error generating CSV',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers }
    )
  }
}

/**
 * TASK #81.9: Generate CSV preserving raw CSV data as primary source
 * Priority: raw_csv_data > properties (manual fills) > developer (auto-import) > defaults
 */
function generateMinistryCSV(developer: Developer, properties: PropertyWithRawData[]): string {
  // Mapping: Ministry CSV column name → internal field name
  const FIELD_MAPPING: Record<string, string> = {
    'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'wojewodztwo',
    'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'powiat',
    'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'gmina',
    'Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'miejscowosc',
    'Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'ulica',
    'Nr budynku lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'nr_budynku',
    'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego': 'kod_pocztowy',
    'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny': 'property_type',
    'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera': 'apartment_number',
    'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]': 'price_per_m2',
    'Data obowiązywania ceny m 2': 'price_valid_from',
    'Cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]': 'final_price',
    'Data obowiązywania ceny lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni': 'final_price_valid_from',
  }

  /**
   * Normalize string for column name matching (same as SmartCSVParser)
   */
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/ł/g, 'l')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  /**
   * TASK #85.1: Get developer field value with priority: raw CSV > developer table > default
   * Uses first property's raw_csv_data (developer fields are same across all properties from one CSV)
   */
  let debugLoggedOnce = false // TASK #86.1: Flag to log only once
  const getDeveloperFieldValue = (ministryFieldName: string, developerFieldName: keyof Developer, defaultValue: string = ''): string => {
    // Get first property's raw_csv_data (developer fields are same for all properties)
    const firstProperty = properties[0]
    const rawData = firstProperty?.raw_csv_data?.[0]?.raw_data || {}

    // TASK #86.1: DEBUG LOGGING - First call only
    if (!debugLoggedOnce) {
      debugLoggedOnce = true
      console.log(`[DEBUG #86.1] getDeveloperFieldValue - First call`)
      console.log(`[DEBUG #86.1] - firstProperty exists:`, !!firstProperty)
      console.log(`[DEBUG #86.1] - firstProperty.raw_csv_data exists:`, !!firstProperty?.raw_csv_data)
      console.log(`[DEBUG #86.1] - raw_csv_data is array:`, Array.isArray(firstProperty?.raw_csv_data))
      console.log(`[DEBUG #86.1] - rawData keys count:`, Object.keys(rawData).length)
      console.log(`[DEBUG #86.1] - rawData sample keys:`, Object.keys(rawData).slice(0, 10))
      console.log(`[DEBUG #86.1] - Looking for ministry field: "${ministryFieldName}"`)
      console.log(`[DEBUG #86.1] - Field exists in rawData:`, ministryFieldName in rawData)
      if (ministryFieldName in rawData) {
        console.log(`[DEBUG #86.1] - Field value:`, rawData[ministryFieldName])
      }
    }

    // 1. Try raw CSV data (PRIMARY SOURCE)
    if (ministryFieldName) {
      const rawValue = rawData[ministryFieldName]
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        return String(rawValue)
      }
    }

    // 2. Try developer table (FALLBACK)
    const devValue = developer[developerFieldName]
    if (devValue !== undefined && devValue !== null && devValue !== '') {
      return String(devValue)
    }

    // 3. Return default
    return defaultValue
  }

  /**
   * Get field value with priority: raw CSV > property table > default
   * ENHANCED: If ministryFieldName is empty, search through COLUMN_PATTERNS variations
   */
  const getFieldValue = (property: PropertyWithRawData, ministryFieldName: string, internalFieldName: string, defaultValue: string = ''): string => {
    const rawData = property.raw_csv_data?.[0]?.raw_data || {}

    // 1. Try raw CSV data (PRIMARY SOURCE)
    if (ministryFieldName) {
      // Direct match with provided ministry field name
      const rawValue = rawData[ministryFieldName]
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        return String(rawValue)
      }
    } else if (internalFieldName && COLUMN_PATTERNS[internalFieldName as keyof typeof COLUMN_PATTERNS]) {
      // No ministry field name provided - search through COLUMN_PATTERNS variations
      const patterns = COLUMN_PATTERNS[internalFieldName as keyof typeof COLUMN_PATTERNS]

      // Try exact match first (case-sensitive)
      for (const pattern of patterns) {
        if (rawData[pattern] !== undefined && rawData[pattern] !== null && rawData[pattern] !== '') {
          return String(rawData[pattern])
        }
      }

      // Try normalized match (case-insensitive, diacritic-insensitive)
      const normalizedPatterns = patterns.map(p => normalizeString(p))
      const rawDataKeys = Object.keys(rawData)

      for (let i = 0; i < patterns.length; i++) {
        const normalizedPattern = normalizedPatterns[i]

        for (const key of rawDataKeys) {
          if (normalizeString(key) === normalizedPattern) {
            const rawValue = rawData[key]
            if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
              return String(rawValue)
            }
          }
        }
      }
    }

    // 2. Try properties table (MANUAL FILLS)
    const propertyValue = property[internalFieldName as keyof Property]
    if (propertyValue !== undefined && propertyValue !== null && propertyValue !== '') {
      return String(propertyValue)
    }

    // 3. Return default
    return defaultValue
  }
  // CSV Header (59 kolumn według wymagań ministerstwa - Ministry Schema 1.13)
  const headers = [
    // Dane dewelopera (1-27) - FIXED: Added nr_faxu at position 9, moved adres_strony_www to position 10
    'nazwa_dewelopera',           // 1
    'forma_prawna',               // 2
    'nr_krs',                     // 3
    'nr_ceidg',                   // 4
    'nip',                        // 5
    'regon',                      // 6
    'telefon',                    // 7
    'email',                      // 8
    'nr_faxu',                    // 9 - ADDED (missing from database, exported as empty)
    'adres_strony_www',           // 10 - MOVED from position 27
    'wojewodztwo_siedziby',       // 11
    'powiat_siedziby',            // 12
    'gmina_siedziby',             // 13
    'miejscowosc_siedziby',       // 14
    'ulica_siedziby',             // 15
    'nr_budynku_siedziby',        // 16
    'nr_lokalu_siedziby',         // 17
    'kod_pocztowy_siedziby',      // 18
    'wojewodztwo_lokalu_sprzedazy', // 19
    'powiat_lokalu_sprzedazy',    // 20
    'gmina_lokalu_sprzedazy',     // 21
    'miejscowosc_lokalu_sprzedazy', // 22
    'ulica_lokalu_sprzedazy',     // 23
    'nr_budynku_lokalu_sprzedazy', // 24
    'nr_lokalu_sprzedazy',        // 25
    'kod_pocztowy_lokalu_sprzedazy', // 26
    'dodatkowe_lokalizacje_sprzedazy', // 27
    'sposob_kontaktu',            // 28 - REMOVED 'dodatkowe_informacje_kontaktowe' (not in ministry schema)
    // Lokalizacja inwestycji (29-35)
    'wojewodztwo_inwestycji',
    'powiat_inwestycji',
    'gmina_inwestycji',
    'miejscowosc_inwestycji',
    'ulica_inwestycji',
    'nr_budynku_inwestycji',
    'kod_pocztowy_inwestycji',
    // Dane mieszkania (36-58)
    'rodzaj_nieruchomosci',
    'nr_lokalu',
    'cena_za_m2',
    'data_obowiazywania_ceny_m2',
    'cena_bazowa',
    'data_obowiazywania_ceny_bazowej',
    'cena_koncowa',
    'data_obowiazywania_ceny_koncowej',
    'miejsca_postojowe_rodzaj',
    'miejsca_postojowe_oznaczenie',
    'miejsca_postojowe_cena',
    'miejsca_postojowe_data',
    'pomieszczenia_przynalezne_rodzaj',
    'pomieszczenia_przynalezne_oznaczenie',
    'pomieszczenia_przynalezne_cena',
    'pomieszczenia_przynalezne_data',
    'prawa_niezbedne_wyszczegolnienie',  // 52 - FIXED: Combined rodzaj + opis into wyszczególnienie
    'prawa_niezbedne_cena',              // 53
    'prawa_niezbedne_data',              // 54
    'inne_swiadczenia_wyszczegolnienie', // 55 - FIXED: Renamed from rodzaj to wyszczególnienie
    'inne_swiadczenia_cena',             // 56
    'inne_swiadczenia_data',             // 57
    'adres_prospektu',                   // 58
  ]

  const rows = properties.map((property) => {
    return [
      // TASK #86.2: Developer fields - use FULL ministerial column names from uploaded CSV
      escapeCSV(getDeveloperFieldValue('Nazwa dewelopera', 'company_name')),                              // 1
      escapeCSV(getDeveloperFieldValue('Forma prawna dewelopera', 'legal_form', 'Spółka z o.o.')),        // 2
      escapeCSV(getDeveloperFieldValue('Nr KRS', 'krs_number')),                                          // 3
      escapeCSV(getDeveloperFieldValue('Nr wpisu do CEiDG', 'ceidg_number')),                             // 4
      escapeCSV(getDeveloperFieldValue('Nr NIP', 'nip')),                                                 // 5
      escapeCSV(getDeveloperFieldValue('Nr REGON', 'regon')),                                             // 6
      escapeCSV(getDeveloperFieldValue('Nr telefonu', 'phone')),                                          // 7
      escapeCSV(getDeveloperFieldValue('Adres poczty elektronicznej', 'email')),                          // 8
      escapeCSV(getDeveloperFieldValue('Nr faxu', 'phone')),                                              // 9 - nr_faxu (will come from raw_csv_data)
      escapeCSV(getDeveloperFieldValue('Adres strony internetowej dewelopera', 'website')),               // 10
      escapeCSV(getDeveloperFieldValue('Województwo adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_voivodeship')),  // 11
      escapeCSV(getDeveloperFieldValue('Powiat adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_county')),            // 12
      escapeCSV(getDeveloperFieldValue('Gmina adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_municipality')),       // 13
      escapeCSV(getDeveloperFieldValue('Miejscowość adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_city')),         // 14
      escapeCSV(getDeveloperFieldValue('Ulica adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_street')),             // 15
      escapeCSV(getDeveloperFieldValue('Nr nieruchomości adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_building_number')),  // 16
      escapeCSV(getDeveloperFieldValue('Nr lokalu adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_apartment_number')),        // 17
      escapeCSV(getDeveloperFieldValue('Kod pocztowy adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_postal_code')),          // 18
      escapeCSV(getDeveloperFieldValue('Województwo adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_voivodeship')),      // 19
      escapeCSV(getDeveloperFieldValue('Powiat adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_county')),                // 20
      escapeCSV(getDeveloperFieldValue('Gmina adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_municipality')),           // 21
      escapeCSV(getDeveloperFieldValue('Miejscowość adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_city')),             // 22
      escapeCSV(getDeveloperFieldValue('Ulica adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_street')),                 // 23
      escapeCSV(getDeveloperFieldValue('Nr nieruchomości adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_building_number')),   // 24
      escapeCSV(getDeveloperFieldValue('Nr lokalu adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_apartment_number')),          // 25
      escapeCSV(getDeveloperFieldValue('Kod pocztowy adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_postal_code')),     // 26
      escapeCSV(getDeveloperFieldValue('Dodatkowe lokalizacje, w których prowadzona jest sprzedaż', 'additional_sales_locations')),       // 27
      escapeCSV(getDeveloperFieldValue('Sposób kontaktu nabywcy z deweloperem', 'contact_method', 'email, telefon')),                     // 28
      // TASK #85.2: Investment location - use COLUMN_PATTERNS to match short CSV column names
      escapeCSV(getFieldValue(property, '', 'wojewodztwo')),       // wojewodztwo_inwestycji
      escapeCSV(getFieldValue(property, '', 'powiat')),             // powiat_inwestycji
      escapeCSV(getFieldValue(property, '', 'gmina')),              // gmina_inwestycji
      escapeCSV(getFieldValue(property, '', 'miejscowosc')),        // miejscowosc_inwestycji
      escapeCSV(getFieldValue(property, '', 'ulica')),              // ulica_inwestycji
      escapeCSV(getFieldValue(property, '', 'numer_nieruchomosci')), // nr_budynku_inwestycji - FIXED: each apartment has unique building number
      escapeCSV(getFieldValue(property, '', 'kod_pocztowy')),       // kod_pocztowy_inwestycji
      // Dane mieszkania - TASK #81.9: Preserve raw CSV data
      escapeCSV(getFieldValue(property, 'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny', 'property_type', 'mieszkanie')),
      escapeCSV(getFieldValue(property, 'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera', 'apartment_number')),
      escapeCSV(getFieldValue(property, 'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]', 'price_per_m2')),
      escapeCSV(getFieldValue(property, 'Data obowiązywania ceny m 2', 'price_valid_from', new Date().toISOString().split('T')[0])),
      // TASK #85.3: Base price and final price - use COLUMN_PATTERNS to match cena_bazowa and cena_koncowa
      escapeCSV(getFieldValue(property, '', 'base_price')), // cena_bazowa
      escapeCSV(getFieldValue(property, '', 'base_price_valid_from', new Date().toISOString().split('T')[0])),
      escapeCSV(getFieldValue(property, '', 'final_price')), // cena_koncowa - FIXED: now reads from raw CSV
      escapeCSV(getFieldValue(property, '', 'final_price_valid_from', new Date().toISOString().split('T')[0])),
      // Additional property data - preserve from raw CSV or manual fills
      escapeCSV(getFieldValue(property, '', 'parking_type')),
      escapeCSV(getFieldValue(property, '', 'parking_designation')),
      escapeCSV(getFieldValue(property, '', 'parking_price')),
      escapeCSV(getFieldValue(property, '', 'parking_date')),
      escapeCSV(getFieldValue(property, '', 'storage_type')),
      escapeCSV(getFieldValue(property, '', 'storage_designation')),
      escapeCSV(getFieldValue(property, '', 'storage_price')),
      escapeCSV(getFieldValue(property, '', 'storage_date')),
      // TASK #85.4 & #85.5: Necessary rights and prospectus - use COLUMN_PATTERNS
      escapeCSV(getFieldValue(property, '', 'necessary_rights')),       // 52 - prawa_niezbedne_wyszczegolnienie (single combined field)
      escapeCSV(getFieldValue(property, '', 'necessary_rights_price')), // 53
      escapeCSV(getFieldValue(property, '', 'necessary_rights_date')),  // 54
      // Other services
      escapeCSV(getFieldValue(property, '', 'other_services_type')),    // 55 - inne_swiadczenia_wyszczegolnienie
      escapeCSV(getFieldValue(property, '', 'other_services_price')),   // 56
      escapeCSV(getFieldValue(property, '', 'other_services_date')),    // 57
      escapeCSV(getFieldValue(property, '', 'prospectus_url', developer.website || '')), // 58 - adres_prospektu
    ].join(';')  // TASK #83.3: Changed separator from comma to semicolon (Ministry requirement)
  })

  return [headers.join(';'), ...rows].join('\n')  // TASK #83.3: Changed separator to semicolon
}

/**
 * Escape CSV special characters (TASK #83.3: Updated for semicolon separator)
 * Escapes semicolons, quotes, and newlines according to RFC 4180
 */
function escapeCSV(value: string | null | undefined): string {
  if (!value) return ''
  const str = value.toString()
  // Escape if contains semicolon, quote, or newline
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
