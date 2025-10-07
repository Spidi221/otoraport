/**
 * PUBLIC CSV ENDPOINT - Ministry Compliance
 * URL: /api/public/{clientId}/data.csv
 * Returns: CSV file with 58 columns of property data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateClientId, applySecurityHeaders } from '@/lib/security'
import { rateLimit, publicRateLimit } from '@/lib/redis-rate-limit'
import type { Database } from '@/types/database'

type Developer = Database['public']['Tables']['developers']['Row']
type Property = Database['public']['Tables']['properties']['Row']

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

    // Get all properties for this developer (exclude sold properties)
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('*')
      .eq('developer_id', developer.id)
      .neq('status', 'sold') // Filter out sold properties from public exports
      .order('created_at', { ascending: false })

    if (propsError) {
      return new NextResponse('Error fetching properties', { status: 500 })
    }

    // Generate CSV with 58 ministry fields
    const csvContent = generateMinistryCSV(developer, properties || [])

    // Set headers with security and rate limit info
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `inline; filename="ceny-mieszkan-${clientId}-${new Date().toISOString().split('T')[0]}.csv"`,
      'Cache-Control': 'public, max-age=300, s-maxage=3600, must-revalidate', // Browser: 5min, CDN: 1h
      'X-Generated-At': new Date().toISOString(),
      'X-Schema-Version': '1.13',
      'X-Client-ID': clientId.substring(0, 8) + '****',
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
 * Generate CSV with all 58 ministry required fields
 */
function generateMinistryCSV(developer: Developer, properties: Property[]): string {
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
      // Lokalizacja inwestycji
      escapeCSV(property.wojewodztwo || ''),
      escapeCSV(property.powiat || ''),
      escapeCSV(property.gmina || ''),
      escapeCSV(property.miejscowosc || ''),
      escapeCSV(property.ulica || ''),
      escapeCSV(property.nr_budynku || ''),
      escapeCSV(property.kod_pocztowy || ''),
      // Dane mieszkania
      escapeCSV(property.property_type || 'mieszkanie'),
      escapeCSV(property.apartment_number),
      escapeCSV(property.price_per_m2?.toString() || ''),
      escapeCSV(property.price_valid_from || new Date().toISOString().split('T')[0]),
      escapeCSV(property.base_price?.toString() || ''),
      escapeCSV(property.base_price_valid_from || new Date().toISOString().split('T')[0]),
      escapeCSV(property.final_price?.toString() || ''),
      escapeCSV(property.final_price_valid_from || new Date().toISOString().split('T')[0]),
      escapeCSV(property.parking_type || ''),
      escapeCSV(property.parking_designation || ''),
      escapeCSV(property.parking_price?.toString() || ''),
      escapeCSV(property.parking_date || ''),
      escapeCSV(property.storage_type || ''),
      escapeCSV(property.storage_designation || ''),
      escapeCSV(property.storage_price?.toString() || ''),
      escapeCSV(property.storage_date || ''),
      escapeCSV(property.necessary_rights_type || ''),
      escapeCSV(property.necessary_rights_description || ''),
      escapeCSV(property.necessary_rights_price?.toString() || ''),
      escapeCSV(property.necessary_rights_date || ''),
      escapeCSV(property.other_services_type || ''),
      escapeCSV(property.other_services_price?.toString() || ''),
      escapeCSV(property.prospectus_url || developer.website || ''),
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
