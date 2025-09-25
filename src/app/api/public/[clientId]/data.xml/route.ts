import { NextRequest, NextResponse } from 'next/server'
import { generateXMLForMinistry, createSampleData } from '@/lib/generators'
import { generateAggregatedXML } from '@/lib/multi-project-xml'
import { supabaseAdmin } from '@/lib/supabase'
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

    console.log(`Ministry XML request for client: ${clientId}`)

    let xmlContent: string
    
    try {
      // PHASE 2: Try multi-project XML aggregation first
      const { data: developer, error: devError } = await supabaseAdmin
        .from('developers')
        .select('id, company_name, subscription_plan')
        .eq('client_id', clientId)
        .single()
      
      if (devError || !developer) {
        console.log('Developer not found, using sample data')
        const sampleData = createSampleData(clientId)
        xmlContent = generateXMLForMinistry(sampleData)
      } else {
        console.log(`Generating aggregated XML for developer: ${developer.company_name} (${developer.subscription_plan})`)
        
        // Use multi-project aggregation for all plans (Phase 2 feature)
        xmlContent = await generateAggregatedXML(developer.id)
      }
    } catch (dbError) {
      console.error('Multi-project XML generation failed, fallback to sample:', dbError)
      const sampleData = createSampleData(clientId)
      xmlContent = generateXMLForMinistry(sampleData)
    }

    // SECURITY: Set appropriate headers for XML response with security headers
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour with validation
      'X-Generated-At': new Date().toISOString(),
      'X-Schema-Version': '1.13',
      'X-Client-ID': clientId.substring(0, 8) + '****' // Partially hide client ID in response
    }))

    return new NextResponse(xmlContent, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('XML generation error:', error)
    
    // SECURITY: Apply security headers even to error responses
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error generating XML',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers }
    )
  }
}