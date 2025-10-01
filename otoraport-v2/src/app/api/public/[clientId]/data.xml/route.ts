import { NextRequest, NextResponse } from 'next/server'
import { generateHarvesterXML } from '@/lib/harvester-xml-generator'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateClientId, applySecurityHeaders, checkRateLimit } from '@/lib/security'

// Next.js Route Segment Config - Dynamic with ISR
export const revalidate = 300 // Revalidate every 5 minutes
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    // SECURITY: Rate limiting
    const rateLimitResult = await checkRateLimit(request, {
      windowMs: 60 * 1000,
      maxRequests: 60,
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

    // SECURITY: Validate client ID
    if (!validateClientId(clientId)) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: 'Invalid client ID format' }),
        { status: 400, headers }
      );
    }

    console.log(`Ministry XML request for client: ${clientId}`)

    // Get developer data (using admin client to bypass RLS)
    const supabase = createAdminClient()
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()

    if (devError || !developer) {
      console.log('Developer not found')
      return new NextResponse(
        JSON.stringify({ error: 'Developer not found' }),
        { status: 404 }
      );
    }

    // Generate CSV URL for this developer
    // Note: Harvester XML only contains metadata and CSV URL,
    // it doesn't need the actual property data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://otoraport.vercel.app'
    const csvUrl = `${baseUrl}/api/public/${clientId}/data.csv`

    // Generate Harvester XML (metadata pointing to CSV)
    const xmlContent = generateHarvesterXML({
      developer: {
        name: developer.company_name || developer.name,
        client_id: developer.client_id
      },
      csvUrl,
      date: new Date().toISOString().split('T')[0]
    })

    // Set headers
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, must-revalidate', // Browser: 5min, CDN: 1h
      'X-Generated-At': new Date().toISOString(),
      'X-Schema-Version': '1.13',
      'X-Client-ID': clientId.substring(0, 8) + '****'
    }))

    return new NextResponse(xmlContent, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('XML generation error:', error)

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
