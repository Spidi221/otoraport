import { NextRequest, NextResponse } from 'next/server'
import { generateCSVFile } from '@/lib/csv-generator'
import { createSampleData } from '@/lib/generators'
import { createAdminClient } from '@/lib/supabase/server'
import { validateClientId, applySecurityHeaders, checkRateLimit } from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    // SECURITY: Rate limiting for public endpoints
    const rateLimitResult = await checkRateLimit(request, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // Max 60 requests per minute per IP
    });

    if (!rateLimitResult.allowed) {
      const headers = applySecurityHeaders(new Headers({
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      }));

      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers }
      );
    }

    const { clientId } = await params

    // SECURITY: Validate client ID format using security library
    if (!validateClientId(clientId)) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: 'Invalid client ID format' }),
        { status: 400, headers }
      );
    }

    console.log(`Ministry CSV request for client: ${clientId}`)

    let data: any = null

    try {
      // Get developer by client_id
      const { data: developer, error: devError } = await createAdminClient()
        .from('developers')
        .select('*')
        .eq('client_id', clientId)
        .single()

      if (devError || !developer) {
        console.log('Developer not found, using sample data')
        data = createSampleData(clientId)
      } else {
        console.log(`🔍 CSV: Developer found: ${developer.id} (${developer.company_name})`)

        // Get projects (same query as XML generation)
        const { data: projects, error: projectsError } = await createAdminClient()
          .from('projects')
          .select('id, name, location, status, developer_id, created_at')
          .eq('developer_id', developer.id)
          .eq('status', 'active')

        console.log(`🔍 CSV: Found ${projects?.length || 0} projects`)
        if (projectsError) console.error('❌ CSV: Projects error:', projectsError)

        const validProjects = projects || []
        const projectIds = validProjects.map(p => p.id)
        console.log(`🔍 CSV: Project IDs:`, projectIds)

        // Get properties (EXACTLY same query as XML generation)
        const { data: rawProperties, error: propertiesError } = await createAdminClient()
          .from('properties')
          .select('id, project_id, raw_data, created_at, updated_at')
          .in('project_id', projectIds)

        console.log(`🔍 CSV: Found ${rawProperties?.length || 0} properties`)
        if (propertiesError) console.error('❌ CSV: Properties error:', propertiesError)

        // Extract properties from raw_data (same logic as multi-project-xml.ts)
        const allProperties = (rawProperties || []).map(prop => {
          const rawData = (prop.raw_data as any) || {}
          const data = rawData.raw_data || rawData

          // Helper function to get field from raw_data
          const getRawField = (field: string, aliases: string[] = [], convertToNumber: boolean = false): any => {
            for (const alias of [field, ...aliases]) {
              if (data[alias] !== undefined && data[alias] !== null && data[alias] !== '') {
                const value = data[alias]
                // FILTER SOLD: If value is "X" or "x", mark as SOLD
                if (typeof value === 'string' && value.trim().toLowerCase() === 'x') {
                  return 'SOLD'
                }
                if (convertToNumber && typeof value === 'string') {
                  const parsed = parseFloat(value.replace(',', '.'))
                  return isNaN(parsed) ? undefined : parsed
                }
                if (convertToNumber && typeof value === 'number') {
                  return value
                }
                return value
              }
            }
            // Fallback: check top-level rawData
            for (const alias of [field, ...aliases]) {
              if (rawData[alias] !== undefined && rawData[alias] !== null && rawData[alias] !== '') {
                const value = rawData[alias]
                if (typeof value === 'string' && value.trim().toLowerCase() === 'x') {
                  return 'SOLD'
                }
                if (convertToNumber && typeof value === 'string') {
                  const parsed = parseFloat(value.replace(',', '.'))
                  return isNaN(parsed) ? undefined : parsed
                }
                if (convertToNumber && typeof value === 'number') {
                  return value
                }
                return value
              }
            }
            return undefined
          }

          // MINISTRY CSV COLUMN NAMES (from official template)
          const MINISTRY_COLUMNS = {
            property_number: 'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera',
            price_per_m2: 'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
            total_price: 'Cena lokalu mieszkalnego lub domu jednorodzinnego [zł]',
            wojewodztwo: 'Województwo - Lokalizacja Inwestycji mieszkaniowej',
            powiat: 'Powiat - Lokalizacja Inwestycji mieszkaniowej',
            gmina: 'Gmina - Lokalizacja Inwestycji mieszkaniowej',
            miejscowosc: 'Miejscowość - Lokalizacja Inwestycji mieszkaniowej',
            ulica: 'Ulica - Lokalizacja Inwestycji mieszkaniowej',
            kod_pocztowy: 'Kod pocztowy - Lokalizacja Inwestycji mieszkaniowej',
          }

          return {
            id: prop.id,
            project_id: prop.project_id,
            apartment_number: getRawField('apartment_number', [
              MINISTRY_COLUMNS.property_number,
              'property_number', 'numer_lokalu'
            ]),
            property_type: getRawField('property_type', ['typ', 'type']),
            price_per_m2: getRawField('price_per_m2', [
              MINISTRY_COLUMNS.price_per_m2,
              'cena_za_m2'
            ], true),
            base_price: getRawField('base_price', [
              MINISTRY_COLUMNS.total_price,
              'total_price', 'cena'
            ], true),
            final_price: getRawField('final_price', ['cena_finalna'], true),
            wojewodztwo: getRawField('wojewodztwo', [MINISTRY_COLUMNS.wojewodztwo]),
            powiat: getRawField('powiat', [MINISTRY_COLUMNS.powiat]),
            gmina: getRawField('gmina', [MINISTRY_COLUMNS.gmina]),
            miejscowosc: getRawField('miejscowosc', [MINISTRY_COLUMNS.miejscowosc]),
            ulica: getRawField('ulica', [MINISTRY_COLUMNS.ulica]),
            kod_pocztowy: getRawField('kod_pocztowy', [MINISTRY_COLUMNS.kod_pocztowy]),
            numer_nieruchomosci: getRawField('numer_nieruchomosci', ['numer', 'nr']),
            miejsca_postojowe_nr: getRawField('miejsca_postojowe_nr', ['parking_nr']),
            miejsca_postojowe_ceny: getRawField('miejsca_postojowe_ceny', ['parking_price']),
            miejsca_postojowe_rodzaj: getRawField('miejsca_postojowe_rodzaj', ['parking_type']),
            komorki_lokatorskie_nr: getRawField('komorki_lokatorskie_nr', ['storage_nr']),
            komorki_lokatorskie_ceny: getRawField('komorki_lokatorskie_ceny', ['storage_price']),
            pomieszczenia_przynalezne: getRawField('pomieszczenia_przynalezne'),
            raw_data: prop.raw_data
          }
        })

        // FILTER SOLD PROPERTIES: Remove properties where price is "SOLD"
        const beforeFilterCount = allProperties.length
        const availableProperties = allProperties.filter(prop => {
          const isSold = prop.price_per_m2 === 'SOLD' || prop.base_price === 'SOLD' || prop.final_price === 'SOLD'
          if (isSold) {
            console.log(`🚫 CSV FILTERED: ${prop.apartment_number} (SOLD)`)
          }
          return !isSold
        })
        console.log(`✅ CSV FILTER: ${beforeFilterCount} total → ${availableProperties.length} available`)

        // Pass filtered properties to CSV generator
        data = {
          developer,
          projects: validProjects,
          properties: availableProperties,
          generatedAt: new Date()
        }
      }
    } catch (dbError) {
      console.log('❌ CSV: Database error:', dbError)
      data = createSampleData(clientId)
    }

    // Generate CSV according to ministry requirements (59 columns, semicolon separator)
    const csvContent = generateCSVFile(data)

    // SECURITY: Set appropriate headers for CSV response with security headers
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="Ceny-ofertowe-mieszkan-${clientId}-${new Date().toISOString().split('T')[0]}.csv"`,
      'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour with validation
      'X-Generated-At': new Date().toISOString(),
      'X-Format': 'csv',
      'X-Client-ID': clientId.substring(0, 8) + '****' // Partially hide client ID in response
    }))

    return new NextResponse(csvContent, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('CSV generation error:', error)

    // SECURITY: Apply security headers even to error responses
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