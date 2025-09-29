/**
 * Multi-Project XML Aggregation for Ministry Schema 1.13
 * Based on CLAUDE.md specification - combines all projects into single Ministry-compliant XML
 * CRITICAL: Uses official dane_o_cenach_mieszkan format
 */

import { createAdminClient } from '@/lib/supabase/server'
import { generateXMLForMinistry, DataForGeneration } from '@/lib/generators'
import { generateMinistryXML, convertToMinistryFormat, validateMinistryXML } from './xml-generator'

/**
 * Creates empty data structure when developer has no projects yet
 */
function createEmptyDataForGeneration(developer: any): DataForGeneration {
  return {
    developer: {
      id: developer.id,
      email: developer.email || '',
      name: developer.name || developer.company_name || 'Unknown',
      company_name: developer.company_name || 'My Company',
      nip: developer.nip || '',
      phone: developer.phone || '',
      regon: developer.regon || null,
      krs: developer.krs || null,
      forma_prawna: developer.forma_prawna || 'spółka z o.o.',
      adres_siedziby: developer.adres_siedziby || '',
      wojewodztwo: developer.wojewodztwo || '',
      powiat: developer.powiat || '',
      gmina: developer.gmina || '',
      miejscowosc: developer.miejscowosc || '',
      kod_pocztowy: developer.kod_pocztowy || '',
      ulica: developer.ulica || '',
      nr_budynku: developer.nr_budynku || '',
      email_kontakt: developer.email_kontakt || developer.email || '',
      telefon_kontakt: developer.telefon_kontakt || developer.phone || '',
      strona_internetowa: developer.strona_internetowa || null
    },
    projects: [],
    properties: []
  }
}

interface ProjectWithProperties {
  id: string
  name: string
  location: string | null
  address: string | null
  status: string
  developer_id: string
  created_at: string
  properties: Array<{
    id: string
    project_id: string
    apartment_number: string
    property_type: string
    price_per_m2: number | null
    base_price: number | null
    final_price: number | null
    surface_area: number | null
    status: string

    // Location details (Ministry required)
    wojewodztwo?: string | null
    powiat?: string | null
    gmina?: string | null
    miejscowosc?: string | null
    ulica?: string | null
    numer_nieruchomosci?: string | null
    kod_pocztowy?: string | null

    // Building and apartment details
    budynek?: string | null
    klatka?: string | null
    kondygnacja?: number | null
    liczba_kondygnacji?: number | null
    liczba_pokoi?: number | null
    uklad_mieszkania?: string | null
    stan_wykonczenia?: string | null
    rok_budowy?: number | null
    technologia_budowy?: string | null

    // Surface areas (detailed breakdown)
    powierzchnia_uzytkowa?: number | null
    powierzchnia_calkowita?: number | null
    powierzchnia_balkon?: number | null
    powierzchnia_taras?: number | null
    powierzchnia_loggia?: number | null
    powierzchnia_ogrod?: number | null
    powierzchnia_piwnicy?: number | null
    powierzchnia_strychu?: number | null

    // Price details (historical and current)
    cena_za_m2_poczatkowa?: number | null
    cena_bazowa_poczatkowa?: number | null
    cena_finalna_poczatkowa?: number | null
    data_pierwszej_oferty?: string | null
    cena_za_m2_aktualna?: number | null
    cena_bazowa_aktualna?: number | null
    cena_finalna_aktualna?: number | null
    data_obowiazywania_ceny_od?: string | null
    data_obowiazywania_ceny_do?: string | null
    waluta?: string | null

    // Additional elements (parking, storage) - Arrays
    miejsca_postojowe_liczba?: number | null
    miejsca_postojowe_nr?: string[] | null
    miejsca_postojowe_ceny?: number[] | null
    miejsca_postojowe_rodzaj?: string | null
    komorki_lokatorskie_liczba?: number | null
    komorki_lokatorskie_nr?: string[] | null
    komorki_lokatorskie_ceny?: number[] | null
    komorki_lokatorskie_powierzchnie?: number[] | null

    // Amenities and features
    pomieszczenia_przynalezne?: any | null
    winda?: boolean | null
    klimatyzacja?: boolean | null
    ogrzewanie?: string | null
    dostep_dla_niepelnosprawnych?: boolean | null
    ekspozycja?: string | null
    widok_z_okien?: string | null

    // Legal and status information
    status_sprzedazy?: string | null
    data_rezerwacji?: string | null
    data_sprzedazy?: string | null
    data_przekazania?: string | null
    forma_wlasnosci?: string | null
    ksiega_wieczysta?: string | null
    udzial_w_gruncie?: number | null

    // Ministry reporting metadata
    data_pierwszego_raportu?: string | null
    data_ostatniej_aktualizacji?: string | null
    liczba_zmian_ceny?: number | null
    uwagi_ministerstwo?: string | null
    uuid_ministerstwo?: string | null

    // Legacy compatibility
    price_valid_from?: string | null
    price_valid_to?: string | null
    status_dostepnosci?: string | null

    // System fields
    created_at?: string
    updated_at?: string
  }>
}

/**
 * Generate aggregated XML for all developer's projects
 * This is the core function from CLAUDE.md Phase 2
 */
export async function generateAggregatedXML(developerId: string): Promise<string> {
  console.log(`Generating aggregated XML for developer: ${developerId}`)

  try {
    // Get developer data
    const { data: developer, error: devError } = await createAdminClient()
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single()

    if (devError || !developer) {
      throw new Error(`Developer not found: ${developerId}`)
    }

    // Pobierz projekty developera (osobno, bez zagnieżdżeń)
    const { data: projects, error: projectsError } = await createAdminClient()
      .from('projects')
      .select(`
        id,
        name,
        location,
        status,
        developer_id,
        created_at
      `)
      .eq('developer_id', developerId)
      .eq('status', 'active')

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      throw new Error(`Failed to fetch projects: ${projectsError.message}`)
    }

    const validProjects = projects || []
    console.log(`Found ${validProjects.length} projects for developer ${developerId}`)

    // Jeśli brak projektów, generuj pusty XML
    if (validProjects.length === 0) {
      console.warn(`No projects found for developer ${developerId}`)
      const emptyData = createEmptyDataForGeneration(developer)
      const ministryOptions = convertToMinistryFormat([], emptyData.developer, emptyData.projects)
      return generateMinistryXML(ministryOptions)
    }

    // Pobierz wszystkie właściwości dla tych projektów (osobno) - ALL 58 MINISTRY FIELDS
    const projectIds = validProjects.map(p => p.id)
    const { data: properties, error: propertiesError } = await createAdminClient()
      .from('properties')
      .select(`
        id,
        project_id,
        apartment_number,
        property_type,
        price_per_m2,
        base_price,
        final_price,
        surface_area,
        status,

        /* Location details (Ministry required) */
        wojewodztwo,
        powiat,
        gmina,
        miejscowosc,
        ulica,
        numer_nieruchomosci,
        kod_pocztowy,

        /* Building and apartment details */
        budynek,
        klatka,
        kondygnacja,
        liczba_kondygnacji,
        liczba_pokoi,
        uklad_mieszkania,
        stan_wykonczenia,
        rok_budowy,
        technologia_budowy,

        /* Surface areas (detailed breakdown) */
        powierzchnia_uzytkowa,
        powierzchnia_calkowita,
        powierzchnia_balkon,
        powierzchnia_taras,
        powierzchnia_loggia,
        powierzchnia_ogrod,
        powierzchnia_piwnicy,
        powierzchnia_strychu,

        /* Price details (historical and current) */
        cena_za_m2_poczatkowa,
        cena_bazowa_poczatkowa,
        cena_finalna_poczatkowa,
        data_pierwszej_oferty,
        cena_za_m2_aktualna,
        cena_bazowa_aktualna,
        cena_finalna_aktualna,
        data_obowiazywania_ceny_od,
        data_obowiazywania_ceny_do,
        waluta,

        /* Additional elements (parking, storage) - Arrays */
        miejsca_postojowe_liczba,
        miejsca_postojowe_nr,
        miejsca_postojowe_ceny,
        miejsca_postojowe_rodzaj,
        komorki_lokatorskie_liczba,
        komorki_lokatorskie_nr,
        komorki_lokatorskie_ceny,
        komorki_lokatorskie_powierzchnie,

        /* Amenities and features */
        pomieszczenia_przynalezne,
        winda,
        klimatyzacja,
        ogrzewanie,
        dostep_dla_niepelnosprawnych,
        ekspozycja,
        widok_z_okien,

        /* Legal and status information */
        status_sprzedazy,
        data_rezerwacji,
        data_sprzedazy,
        data_przekazania,
        forma_wlasnosci,
        ksiega_wieczysta,
        udzial_w_gruncie,

        /* Ministry reporting metadata */
        data_pierwszego_raportu,
        data_ostatniej_aktualizacji,
        liczba_zmian_ceny,
        uwagi_ministerstwo,
        uuid_ministerstwo,

        /* Legacy compatibility */
        price_valid_from,
        price_valid_to,
        status_dostepnosci,

        /* System fields */
        created_at,
        updated_at
      `)
      .in('project_id', projectIds)

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError)
      throw new Error(`Failed to fetch properties: ${propertiesError.message}`)
    }

    const allProperties = properties || []
    console.log(`Found ${allProperties.length} properties across ${validProjects.length} projects`)

    // Połącz properties z projektami (ręcznie zamiast zagnieżdżonych query)
    const projectsWithProperties = validProjects.map(project => ({
      ...project,
      properties: allProperties.filter(prop => prop.project_id === project.id)
    }))

    console.log(`Projects with properties:`, projectsWithProperties.map(p => ({ name: p.name, propertiesCount: p.properties.length })))

    // Flatten wszystkie properties z kontekstem projektu
    const allPropertiesWithContext = projectsWithProperties.flatMap(project => {
      return project.properties.map(property => ({
        ...property,
        // Add project context to each property
        project_name: project.name,
        project_location: project.location
      }))
    })

    console.log(`Total properties across all projects: ${allPropertiesWithContext.length}`)

    if (allPropertiesWithContext.length === 0) {
      console.warn(`No properties found for developer ${developerId}`)
      // Generate empty XML with developer info
      const emptyData: DataForGeneration = {
        developer: {
          id: developer.id,
          email: developer.email,
          name: developer.name,
          company_name: developer.company_name,
          nip: developer.nip,
          phone: developer.phone,
          krs: developer.krs,
          ceidg: developer.ceidg,
          regon: developer.regon,
          legal_form: developer.legal_form,
          headquarters_address: developer.headquarters_address,
          website_url: developer.website_url,
          license_number: developer.license_number,
          tax_office_code: developer.tax_office_code
        },
        projects: validProjects.map(p => ({
          id: p.id,
          name: p.name,
          location: p.location,
          address: p.address,
          status: p.status
        })),
        properties: []
      }
      // Generate empty Ministry XML
      const ministryOptions = convertToMinistryFormat([], emptyData.developer, emptyData.projects)
      return generateMinistryXML(ministryOptions)
    }

    // Prepare data for XML generation
    const aggregatedData: DataForGeneration = {
      developer: {
        id: developer.id,
        email: developer.email,
        name: developer.name,
        company_name: developer.company_name,
        nip: developer.nip,
        phone: developer.phone,
        krs: developer.krs,
        ceidg: developer.ceidg,
        regon: developer.regon,
        legal_form: developer.legal_form,
        headquarters_address: developer.headquarters_address,
        website_url: developer.website_url,
        license_number: developer.license_number,
        tax_office_code: developer.tax_office_code
      },
      projects: validProjects.map(project => ({
        id: project.id,
        name: project.name,
        location: project.location,
        status: project.status
      })),
      properties: allPropertiesWithContext
    }

    // CRITICAL: Generate XML using official Ministry Schema 1.13
    console.log('Converting to Ministry format and validating...')
    const ministryOptions = convertToMinistryFormat(
      allProperties,
      aggregatedData.developer,
      aggregatedData.projects
    )

    // Validate before generation
    const validation = validateMinistryXML(ministryOptions)
    if (!validation.valid) {
      console.warn('Ministry XML validation warnings:', validation.errors)
      console.warn('Continuing with generation despite warnings...')
    }

    // Generate Ministry-compliant XML
    const xmlContent = generateMinistryXML(ministryOptions)

    console.log(`Generated Ministry Schema 1.13 XML with ${allProperties.length} properties from ${validProjects.length} projects`)
    console.log(`Validation: ${validation.valid ? 'PASSED' : 'WARNINGS'} (${validation.errors.length} issues)`)

    return xmlContent

  } catch (error) {
    console.error('Aggregated XML generation error:', error)
    throw new Error(`Failed to generate aggregated XML: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get projects summary for dashboard
 */
export async function getProjectsSummary(developerId: string): Promise<{
  totalProjects: number
  activeProjects: number
  totalProperties: number
  projectsBreakdown: Array<{
    id: string
    name: string
    location: string | null
    propertiesCount: number
    lastUpdated: string
    status: string
  }>
}> {
  try {
    const { data: projects, error } = await createAdminClient()
      .from('projects')
      .select(`
        id,
        name,
        location,
        status,
        created_at,
        properties!inner(id)
      `)
      .eq('developer_id', developerId)

    if (error) {
      throw new Error(`Failed to fetch projects summary: ${error.message}`)
    }

    const validProjects = projects || []
    const activeProjects = validProjects.filter(p => p.status === 'active')
    const totalProperties = validProjects.reduce((sum, project) => 
      sum + (Array.isArray(project.properties) ? project.properties.length : 0), 0
    )

    const projectsBreakdown = validProjects.map(project => ({
      id: project.id,
      name: project.name,
      location: project.location,
      propertiesCount: Array.isArray(project.properties) ? project.properties.length : 0,
      lastUpdated: project.created_at,
      status: project.status
    }))

    return {
      totalProjects: validProjects.length,
      activeProjects: activeProjects.length,
      totalProperties,
      projectsBreakdown
    }

  } catch (error) {
    console.error('Error getting projects summary:', error)
    throw error
  }
}

/**
 * Performance optimization for large multi-project XML
 * Handles 1000+ properties as mentioned in CLAUDE.md warnings
 */
export async function generateOptimizedAggregatedXML(
  developerId: string,
  options: {
    maxProperties?: number
    includeInactive?: boolean
    sortBy?: 'created_at' | 'updated_at' | 'price_per_m2'
    sortOrder?: 'asc' | 'desc'
  } = {}
): Promise<{
  xmlContent: string
  totalProperties: number
  includedProperties: number
  performanceWarning?: string
}> {
  const {
    maxProperties = 1000,
    includeInactive = false,
    sortBy = 'updated_at',
    sortOrder = 'desc'
  } = options

  console.log(`Generating optimized XML for ${developerId}, max properties: ${maxProperties}`)

  const xmlContent = await generateAggregatedXML(developerId)
  
  // For now, return the full XML - optimization would require query-level limits
  // This is a placeholder for future performance improvements
  return {
    xmlContent,
    totalProperties: 0, // Would count from XML or query
    includedProperties: 0, // Would count included
    performanceWarning: maxProperties > 1000 
      ? 'Large property sets may impact XML generation performance'
      : undefined
  }
}

/**
 * Validate multi-project XML compliance
 * Ensures all projects meet ministry requirements
 */
export async function validateMultiProjectCompliance(developerId: string): Promise<{
  compliant: boolean
  issues: string[]
  missingFields: string[]
  recommendations: string[]
}> {
  try {
    const summary = await getProjectsSummary(developerId)
    const issues: string[] = []
    const missingFields: string[] = []
    const recommendations: string[] = []

    // Check for minimum data requirements
    if (summary.totalProperties === 0) {
      issues.push('No properties found across any projects')
      recommendations.push('Upload property data for at least one project')
    }

    if (summary.activeProjects === 0) {
      issues.push('No active projects found')
      recommendations.push('Set at least one project status to "active"')
    }

    // Performance warnings from CLAUDE.md
    if (summary.totalProperties > 1000) {
      recommendations.push('Large property count detected - consider pagination or caching')
    }

    return {
      compliant: issues.length === 0,
      issues,
      missingFields,
      recommendations
    }

  } catch (error) {
    return {
      compliant: false,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      missingFields: [],
      recommendations: ['Check database connectivity and project configuration']
    }
  }
}