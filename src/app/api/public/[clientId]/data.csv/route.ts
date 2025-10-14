/**
 * PUBLIC CSV ENDPOINT - Ministry Compliance
 * URL: /api/public/{clientId}/data.csv
 * Returns: CSV file with 58 columns of property data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateClientId, applySecurityHeaders } from '@/lib/security'
import { rateLimit, publicRateLimit, getCachedValue, setCachedValue, getMinistryCacheKey, MINISTRY_CACHE_TTL } from '@/lib/redis-rate-limit'
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
      return new NextResponse('Error fetching properties', { status: 500 })
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

    // Generate CSV with 58 ministry fields (preserving raw CSV data)
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
   * Get field value with priority: raw CSV > property table > default
   */
  const getFieldValue = (property: PropertyWithRawData, ministryFieldName: string, internalFieldName: string, defaultValue: string = ''): string => {
    // 1. Try raw CSV data (PRIMARY SOURCE) - only if ministry field name provided
    if (ministryFieldName) {
      const rawData = property.raw_csv_data?.[0]?.raw_data || {}
      const rawValue = rawData[ministryFieldName]
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        return String(rawValue)
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
  // CSV Header (58 kolumn według wymagań ministerstwa)
  const headers = [
    // Dane dewelopera (1-28)
    'nazwa_dewelopera',
    'forma_prawna',
    'nr_krs',
    'nr_ceidg',
    'nip',
    'regon',
    'telefon',
    'email',
    'wojewodztwo_siedziby',
    'powiat_siedziby',
    'gmina_siedziby',
    'miejscowosc_siedziby',
    'ulica_siedziby',
    'nr_budynku_siedziby',
    'nr_lokalu_siedziby',
    'kod_pocztowy_siedziby',
    'wojewodztwo_lokalu_sprzedazy',
    'powiat_lokalu_sprzedazy',
    'gmina_lokalu_sprzedazy',
    'miejscowosc_lokalu_sprzedazy',
    'ulica_lokalu_sprzedazy',
    'nr_budynku_lokalu_sprzedazy',
    'nr_lokalu_sprzedazy',
    'kod_pocztowy_lokalu_sprzedazy',
    'dodatkowe_lokalizacje_sprzedazy',
    'sposob_kontaktu',
    'adres_strony_www',
    'dodatkowe_informacje_kontaktowe',
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
    'prawa_niezbedne_rodzaj',
    'prawa_niezbedne_opis',
    'prawa_niezbedne_cena',
    'prawa_niezbedne_data',
    'inne_swiadczenia_rodzaj',
    'inne_swiadczenia_cena',
    'adres_prospektu',
  ]

  const rows = properties.map((property) => {
    return [
      // Dane dewelopera
      escapeCSV(developer.company_name || ''),
      escapeCSV(developer.legal_form || 'Spółka z o.o.'),
      escapeCSV(developer.krs_number || ''),
      escapeCSV(developer.ceidg_number || ''),
      escapeCSV(developer.nip || ''),
      escapeCSV(developer.regon || ''),
      escapeCSV(developer.phone || ''),
      escapeCSV(developer.email),
      escapeCSV(developer.headquarters_voivodeship || ''),
      escapeCSV(developer.headquarters_county || ''),
      escapeCSV(developer.headquarters_municipality || ''),
      escapeCSV(developer.headquarters_city || ''),
      escapeCSV(developer.headquarters_street || ''),
      escapeCSV(developer.headquarters_building_number || ''),
      escapeCSV(developer.headquarters_apartment_number || ''),
      escapeCSV(developer.headquarters_postal_code || ''),
      escapeCSV(developer.sales_office_voivodeship || ''),
      escapeCSV(developer.sales_office_county || ''),
      escapeCSV(developer.sales_office_municipality || ''),
      escapeCSV(developer.sales_office_city || ''),
      escapeCSV(developer.sales_office_street || ''),
      escapeCSV(developer.sales_office_building_number || ''),
      escapeCSV(developer.sales_office_apartment_number || ''),
      escapeCSV(developer.sales_office_postal_code || ''),
      escapeCSV(developer.additional_sales_locations || ''),
      escapeCSV(developer.contact_method || 'email, telefon'),
      escapeCSV(developer.website || ''),
      escapeCSV(developer.additional_contact_info || ''),
      // Lokalizacja inwestycji - TASK #81.9: Preserve raw CSV data
      escapeCSV(getFieldValue(property, 'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', 'wojewodztwo')),
      escapeCSV(getFieldValue(property, 'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', 'powiat')),
      escapeCSV(getFieldValue(property, 'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', 'gmina')),
      escapeCSV(getFieldValue(property, 'Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', 'miejscowosc')),
      escapeCSV(getFieldValue(property, 'Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', 'ulica')),
      escapeCSV(getFieldValue(property, 'Nr budynku lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', 'nr_budynku')),
      escapeCSV(getFieldValue(property, 'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', 'kod_pocztowy')),
      // Dane mieszkania - TASK #81.9: Preserve raw CSV data
      escapeCSV(getFieldValue(property, 'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny', 'property_type', 'mieszkanie')),
      escapeCSV(getFieldValue(property, 'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera', 'apartment_number')),
      escapeCSV(getFieldValue(property, 'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]', 'price_per_m2')),
      escapeCSV(getFieldValue(property, 'Data obowiązywania ceny m 2', 'price_valid_from', new Date().toISOString().split('T')[0])),
      escapeCSV(getFieldValue(property, '', 'base_price')), // base_price - not in ministry schema, manual fill only
      escapeCSV(getFieldValue(property, '', 'base_price_valid_from', new Date().toISOString().split('T')[0])),
      escapeCSV(getFieldValue(property, 'Cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]', 'final_price')),
      escapeCSV(getFieldValue(property, 'Data obowiązywania ceny lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni', 'final_price_valid_from', new Date().toISOString().split('T')[0])),
      // Additional property data - preserve from raw CSV or manual fills
      escapeCSV(getFieldValue(property, '', 'parking_type')),
      escapeCSV(getFieldValue(property, '', 'parking_designation')),
      escapeCSV(getFieldValue(property, '', 'parking_price')),
      escapeCSV(getFieldValue(property, '', 'parking_date')),
      escapeCSV(getFieldValue(property, '', 'storage_type')),
      escapeCSV(getFieldValue(property, '', 'storage_designation')),
      escapeCSV(getFieldValue(property, '', 'storage_price')),
      escapeCSV(getFieldValue(property, '', 'storage_date')),
      escapeCSV(getFieldValue(property, '', 'necessary_rights_type')),
      escapeCSV(getFieldValue(property, '', 'necessary_rights_description')),
      escapeCSV(getFieldValue(property, '', 'necessary_rights_price')),
      escapeCSV(getFieldValue(property, '', 'necessary_rights_date')),
      escapeCSV(getFieldValue(property, '', 'other_services_type')),
      escapeCSV(getFieldValue(property, '', 'other_services_price')),
      escapeCSV(getFieldValue(property, '', 'prospectus_url', developer.website || '')),
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string | null | undefined): string {
  if (!value) return ''
  const str = value.toString()
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
