import { NextRequest, NextResponse } from 'next/server'
import { generateMinistryDataXML, validateMinistryDataXML } from '@/lib/ministry-xml-generator'
import { createAdminClient } from '@/lib/supabase/server'
import { validateClientId, applySecurityHeaders, checkRateLimit } from '@/lib/security'
import { Database } from '@/types/database'

type Developer = Database['public']['Tables']['developers']['Row']
type Property = Database['public']['Tables']['properties']['Row']

// Next.js Route Segment Config - Enable caching for better performance
export const revalidate = 3600 // Revalidate every 1 hour (3600 seconds)
export const dynamic = 'force-static' // Try to generate statically when possible

/**
 * Ministry Property Data XML Endpoint
 *
 * Returns XML file with all property pricing data according to Schema 1.13
 * Contains all 58 required fields for Housing Price Transparency Act
 *
 * @route GET /api/public/[clientId]/prices.xml
 */
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

    // SECURITY: Validate client ID format
    if (!validateClientId(clientId)) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: 'Invalid client ID format' }),
        { status: 400, headers }
      );
    }

    console.log(`Ministry Property Data XML request for client: ${clientId}`)

    // Fetch developer data
    const supabase = createAdminClient()
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('*')
      .eq('id', clientId)
      .single()

    if (devError || !developer) {
      console.error('Developer not found:', clientId, devError)
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({
          error: 'Developer not found',
          message: 'No developer found with provided client ID'
        }),
        { status: 404, headers }
      );
    }

    // Fetch all properties for this developer
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('developer_id', developer.id)

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      throw new Error('Failed to fetch projects')
    }

    const projectIds = projects?.map(p => p.id) || []

    if (projectIds.length === 0) {
      console.log('No projects found for developer:', developer.id)
      // Return empty XML with developer info but no properties
      const xmlContent = generateMinistryDataXML({
        developer: developer as Developer,
        properties: []
      })

      const headers = applySecurityHeaders(new Headers({
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'X-Generated-At': new Date().toISOString(),
        'X-Schema-Version': '1.13',
        'X-Client-ID': clientId.substring(0, 8) + '****'
      }))

      return new NextResponse(xmlContent, { status: 200, headers })
    }

    // Fetch all properties from all projects
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .in('project_id', projectIds)
      .order('property_number', { ascending: true })

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError)
      throw new Error('Failed to fetch properties')
    }

    console.log(`Fetched ${properties?.length || 0} properties for ${projects.length} projects`)

    // Validate data before generating XML
    const validation = validateMinistryDataXML({
      developer: developer as Developer,
      properties: (properties || []) as Property[]
    })

    if (!validation.valid) {
      console.warn('Ministry data validation warnings:', validation.warnings)
      console.error('Ministry data validation errors:', validation.errors)
      // Continue anyway but log the issues
    }

    // Generate ministry-compliant XML
    const xmlContent = generateMinistryDataXML({
      developer: developer as Developer,
      properties: (properties || []) as Property[]
    })

    // SECURITY: Set appropriate headers for XML response
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour
      'X-Generated-At': new Date().toISOString(),
      'X-Schema-Version': '1.13',
      'X-Client-ID': clientId.substring(0, 8) + '****',
      'X-Properties-Count': (properties?.length || 0).toString(),
      'X-Projects-Count': projects.length.toString(),
      'X-Validation-Status': validation.valid ? 'valid' : 'warnings'
    }))

    console.log(`Successfully generated ministry XML for ${developer.company_name}: ${properties?.length || 0} properties`)

    return new NextResponse(xmlContent, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Ministry XML generation error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // SECURITY: Apply security headers even to error responses
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error generating ministry XML',
        message: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers }
    )
  }
}
