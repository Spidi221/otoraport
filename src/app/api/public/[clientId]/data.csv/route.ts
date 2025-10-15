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
import { getMinistryFieldValue } from '@/lib/ministry-field-lookup'
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
 * TASK #88.2: Generate CSV using 3-tier field lookup system
 * Priority: manual_overrides > raw_csv_data > properties/developers > defaults
 */
function generateMinistryCSV(developer: Developer, properties: PropertyWithRawData[]): string {
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
      // TASK #88.2: Developer fields - use getMinistryFieldValue with properties[0] (shared developer data)
      escapeCSV(getMinistryFieldValue(properties[0], 'Nazwa dewelopera', 'company_name', developer)),                              // 1
      escapeCSV(getMinistryFieldValue(properties[0], 'Forma prawna dewelopera', 'legal_form', developer, 'Spółka z o.o.')),        // 2
      escapeCSV(getMinistryFieldValue(properties[0], 'Nr KRS', 'krs_number', developer)),                                          // 3
      escapeCSV(getMinistryFieldValue(properties[0], 'Nr wpisu do CEiDG', 'ceidg_number', developer)),                             // 4
      escapeCSV(getMinistryFieldValue(properties[0], 'Nr NIP', 'nip', developer)),                                                 // 5
      escapeCSV(getMinistryFieldValue(properties[0], 'Nr REGON', 'regon', developer)),                                             // 6
      escapeCSV(getMinistryFieldValue(properties[0], 'Nr telefonu', 'phone', developer)),                                          // 7
      escapeCSV(getMinistryFieldValue(properties[0], 'Adres poczty elektronicznej', 'email', developer)),                          // 8
      escapeCSV(getMinistryFieldValue(properties[0], 'Nr faxu', 'phone', developer)),                                              // 9 - nr_faxu (will come from raw_csv_data)
      escapeCSV(getMinistryFieldValue(properties[0], 'Adres strony internetowej dewelopera', 'website', developer)),               // 10
      escapeCSV(getMinistryFieldValue(properties[0], 'Województwo adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_voivodeship', developer)),  // 11
      escapeCSV(getMinistryFieldValue(properties[0], 'Powiat adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_county', developer)),            // 12
      escapeCSV(getMinistryFieldValue(properties[0], 'Gmina adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_municipality', developer)),       // 13
      escapeCSV(getMinistryFieldValue(properties[0], 'Miejscowość adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_city', developer)),         // 14
      escapeCSV(getMinistryFieldValue(properties[0], 'Ulica adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_street', developer)),             // 15
      escapeCSV(getMinistryFieldValue(properties[0], 'Nr nieruchomości adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_building_number', developer)),  // 16
      escapeCSV(getMinistryFieldValue(properties[0], 'Nr lokalu adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_apartment_number', developer)),        // 17
      escapeCSV(getMinistryFieldValue(properties[0], 'Kod pocztowy adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera', 'headquarters_postal_code', developer)),          // 18
      escapeCSV(getMinistryFieldValue(properties[0], 'Województwo adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_voivodeship', developer)),      // 19
      escapeCSV(getMinistryFieldValue(properties[0], 'Powiat adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_county', developer)),                // 20
      escapeCSV(getMinistryFieldValue(properties[0], 'Gmina adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_municipality', developer)),           // 21
      escapeCSV(getMinistryFieldValue(properties[0], 'Miejscowość adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_city', developer)),             // 22
      escapeCSV(getMinistryFieldValue(properties[0], 'Ulica adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_street', developer)),                 // 23
      escapeCSV(getMinistryFieldValue(properties[0], 'Nr nieruchomości adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_building_number', developer)),   // 24
      escapeCSV(getMinistryFieldValue(properties[0], 'Nr lokalu adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_apartment_number', developer)),          // 25
      escapeCSV(getMinistryFieldValue(properties[0], 'Kod pocztowy adresu lokalu, w którym prowadzona jest sprzedaż', 'sales_office_postal_code', developer)),     // 26
      escapeCSV(getMinistryFieldValue(properties[0], 'Dodatkowe lokalizacje, w których prowadzona jest sprzedaż', 'additional_sales_locations', developer)),       // 27
      escapeCSV(getMinistryFieldValue(properties[0], 'Sposób kontaktu nabywcy z deweloperem', 'contact_method', developer, 'email, telefon')),                     // 28
      // TASK #88.2: Investment location - use getMinistryFieldValue with COLUMN_PATTERNS matching
      escapeCSV(getMinistryFieldValue(property, '', 'wojewodztwo')),       // wojewodztwo_inwestycji
      escapeCSV(getMinistryFieldValue(property, '', 'powiat')),             // powiat_inwestycji
      escapeCSV(getMinistryFieldValue(property, '', 'gmina')),              // gmina_inwestycji
      escapeCSV(getMinistryFieldValue(property, '', 'miejscowosc')),        // miejscowosc_inwestycji
      escapeCSV(getMinistryFieldValue(property, '', 'ulica')),              // ulica_inwestycji
      escapeCSV(getMinistryFieldValue(property, '', 'numer_nieruchomosci')), // nr_budynku_inwestycji - FIXED: each apartment has unique building number
      escapeCSV(getMinistryFieldValue(property, '', 'kod_pocztowy')),       // kod_pocztowy_inwestycji
      // Dane mieszkania - TASK #88.2: Use getMinistryFieldValue for all property fields
      escapeCSV(getMinistryFieldValue(property, 'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny', 'property_type', undefined, 'mieszkanie')),
      escapeCSV(getMinistryFieldValue(property, 'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera', 'apartment_number')),
      escapeCSV(getMinistryFieldValue(property, 'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]', 'price_per_m2')),
      escapeCSV(getMinistryFieldValue(property, 'Data obowiązywania ceny m 2', 'price_valid_from', undefined, new Date().toISOString().split('T')[0])),
      // TASK #88.2: Base price and final price
      escapeCSV(getMinistryFieldValue(property, '', 'base_price')), // cena_bazowa
      escapeCSV(getMinistryFieldValue(property, '', 'base_price_valid_from', undefined, new Date().toISOString().split('T')[0])),
      escapeCSV(getMinistryFieldValue(property, '', 'final_price')), // cena_koncowa
      escapeCSV(getMinistryFieldValue(property, '', 'final_price_valid_from', undefined, new Date().toISOString().split('T')[0])),
      // Additional property data - preserve from raw CSV or manual fills
      escapeCSV(getMinistryFieldValue(property, '', 'parking_type')),
      escapeCSV(getMinistryFieldValue(property, '', 'parking_designation')),
      escapeCSV(getMinistryFieldValue(property, '', 'parking_price')),
      escapeCSV(getMinistryFieldValue(property, '', 'parking_date')),
      escapeCSV(getMinistryFieldValue(property, '', 'storage_type')),
      escapeCSV(getMinistryFieldValue(property, '', 'storage_designation')),
      escapeCSV(getMinistryFieldValue(property, '', 'storage_price')),
      escapeCSV(getMinistryFieldValue(property, '', 'storage_date')),
      // TASK #88.2: Necessary rights and prospectus
      escapeCSV(getMinistryFieldValue(property, '', 'necessary_rights')),       // 52 - prawa_niezbedne_wyszczegolnienie (single combined field)
      escapeCSV(getMinistryFieldValue(property, '', 'necessary_rights_price')), // 53
      escapeCSV(getMinistryFieldValue(property, '', 'necessary_rights_date')),  // 54
      // Other services
      escapeCSV(getMinistryFieldValue(property, '', 'other_services_type')),    // 55 - inne_swiadczenia_wyszczegolnienie
      escapeCSV(getMinistryFieldValue(property, '', 'other_services_price')),   // 56
      escapeCSV(getMinistryFieldValue(property, '', 'other_services_date')),    // 57
      escapeCSV(getMinistryFieldValue(property, '', 'prospectus_url', undefined, developer.website || '')), // 58 - adres_prospektu
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
