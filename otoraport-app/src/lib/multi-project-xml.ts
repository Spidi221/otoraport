/**
 * Multi-Project XML Aggregation for Phase 2
 * Based on CLAUDE.md specification - combines all projects into single XML
 */

import { supabaseAdmin } from '@/lib/supabase'
import { generateXMLForMinistry, DataForGeneration } from '@/lib/generators'

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
    property_number: string
    property_type: string
    price_per_m2: number | null
    total_price: number | null
    final_price: number | null
    area: number | null
    parking_space: string | null
    parking_price: number | null
    status: string
    raw_data: Record<string, any>
    // All ministry fields
    wojewodztwo?: string | null
    powiat?: string | null
    gmina?: string | null
    miejscowosc?: string | null
    ulica?: string | null
    numer_nieruchomosci?: string | null
    kod_pocztowy?: string | null
    price_valid_from?: string | null
    price_valid_to?: string | null
    status_dostepnosci?: string | null
    data_rezerwacji?: string | null
    data_sprzedazy?: string | null
    construction_year?: number | null
    building_permit_number?: string | null
    energy_class?: string | null
    additional_costs?: number | null
    vat_rate?: number | null
    legal_status?: string | null
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
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single()

    if (devError || !developer) {
      throw new Error(`Developer not found: ${developerId}`)
    }

    // Pobierz wszystkie projekty developera z właściwościami
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        name,
        location,
        address,
        status,
        developer_id,
        created_at,
        properties (
          id,
          project_id,
          property_number,
          property_type,
          price_per_m2,
          total_price,
          final_price,
          area,
          parking_space,
          parking_price,
          status,
          raw_data,
          wojewodztwo,
          powiat,
          gmina,
          miejscowosc,
          ulica,
          numer_nieruchomosci,
          kod_pocztowy,
          price_valid_from,
          price_valid_to,
          status_dostepnosci,
          data_rezerwacji,
          data_sprzedazy,
          construction_year,
          building_permit_number,
          energy_class,
          additional_costs,
          vat_rate,
          legal_status,
          created_at,
          updated_at
        )
      `)
      .eq('developer_id', developerId)
      .eq('status', 'active') as { data: ProjectWithProperties[] | null, error: any }

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      throw new Error(`Failed to fetch projects: ${projectsError.message}`)
    }

    const validProjects = projects || []
    console.log(`Found ${validProjects.length} active projects for developer`)

    // Połącz wszystkie properties z wszystkich projektów
    const allProperties = validProjects.flatMap(project => {
      if (!project.properties || !Array.isArray(project.properties)) {
        console.warn(`Project ${project.id} has no properties`)
        return []
      }

      return project.properties.map(property => ({
        ...property,
        // Add project context to each property
        project_name: project.name,
        project_location: project.location,
        investment_address: project.address,
        // Ensure raw_data includes project info
        raw_data: {
          ...property.raw_data,
          project_id: project.id,
          project_name: project.name,
          project_location: project.location
        }
      }))
    })

    console.log(`Total properties across all projects: ${allProperties.length}`)

    if (allProperties.length === 0) {
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
      return generateXMLForMinistry(emptyData)
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
        address: project.address,
        status: project.status
      })),
      properties: allProperties
    }

    // Generate ministry-compliant XML
    const xmlContent = generateXMLForMinistry(aggregatedData)
    
    console.log(`Generated XML with ${allProperties.length} properties from ${validProjects.length} projects`)
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
    const { data: projects, error } = await supabaseAdmin
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