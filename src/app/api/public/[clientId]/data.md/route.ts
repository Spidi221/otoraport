import { NextRequest, NextResponse } from 'next/server'
import { generateMarkdownForMinistry, createSampleData } from '@/lib/generators'
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

    console.log(`Ministry Markdown request for client: ${clientId}`)

    let data: any = null
    
    try {
      // Try to get real data from database
      const { data: developer, error: devError } = await createAdminClient()
        .from('developers')
        .select('*')
        .eq('client_id', clientId)
        .single()
      
      if (devError || !developer) {
        console.log('Developer not found, using sample data')
        data = createSampleData(clientId)
      } else {
        // Get projects for this developer
        const { data: projects } = await createAdminClient()
          .from('projects')
          .select('*')
          .eq('developer_id', developer.id)

        // Get properties for these projects
        const projectIds = projects?.map(p => p.id) || []
        const { data: properties } = await createAdminClient()
          .from('properties')
          .select('*')
          .in('project_id', projectIds)

        data = { 
          developer: {
            id: developer.id,
            email: developer.email,
            name: developer.name,
            company_name: developer.company_name,
            nip: developer.nip,
            phone: developer.phone
          }, 
          projects: projects || [], 
          properties: (properties || []).map(prop => ({
            id: prop.id,
            property_number: prop.property_number || 'N/A',
            property_type: prop.property_type || 'mieszkanie',
            price_per_m2: prop.price_per_m2,
            total_price: prop.total_price,
            final_price: prop.final_price || prop.total_price,
            area: prop.area,
            parking_space: prop.parking_space,
            parking_price: prop.parking_price,
            status: prop.status || 'dostępne',
            raw_data: prop
          }))
        }
        
        console.log(`Found real data: ${properties?.length || 0} properties for ${developer.company_name}`)
      }
    } catch (dbError) {
      console.log('Database query failed, using sample data:', dbError)
      data = createSampleData(clientId)
    }

    // Generate Markdown according to ministry requirements
    const markdownContent = generateMarkdownForMinistry(data)

    // SECURITY: Set appropriate headers for Markdown response with security headers
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour with validation
      'X-Generated-At': new Date().toISOString(),
      'X-Format': 'markdown',
      'X-Client-ID': clientId.substring(0, 8) + '****' // Partially hide client ID in response
    }))

    return new NextResponse(markdownContent, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Markdown generation error:', error)
    
    // SECURITY: Apply security headers even to error responses
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error generating Markdown',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers }
    )
  }
}