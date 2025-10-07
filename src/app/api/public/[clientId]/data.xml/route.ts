import { NextRequest, NextResponse } from 'next/server'
import { generateHarvesterXML } from '@/lib/harvester-xml-generator'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateClientId, applySecurityHeaders } from '@/lib/security'
import { rateLimit, publicRateLimit } from '@/lib/redis-rate-limit'

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
        name: developer.company_name || '',
        client_id: developer.client_id
      },
      csvUrl,
      date: new Date().toISOString().split('T')[0]
    })

    // Set headers with rate limit info
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, must-revalidate', // Browser: 5min, CDN: 1h
      'X-Generated-At': new Date().toISOString(),
      'X-Schema-Version': '1.13',
      'X-Client-ID': clientId.substring(0, 8) + '****',
      // Rate limit headers
      'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
      'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
      'X-RateLimit-Reset': rateLimitInfo.reset.toString()
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
