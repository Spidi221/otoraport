import { NextRequest, NextResponse } from 'next/server'
import { generateHarvesterXML } from '@/lib/harvester-xml-generator'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateClientId, applySecurityHeaders } from '@/lib/security'
import { rateLimit, publicRateLimit, getCachedValue, setCachedValue, getMinistryCacheKey, MINISTRY_CACHE_TTL } from '@/lib/redis-rate-limit'

// Next.js Route Segment Config - Always fresh for Ministry compliance
export const revalidate = 0 // No server-side caching (Art. 19b compliance)
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

    // Try to get from Redis cache first
    const cacheKey = getMinistryCacheKey(clientId, 'xml');
    const cachedXml = await getCachedValue<string>(cacheKey);

    if (cachedXml) {
      console.log(`[Cache HIT] Serving XML from Redis cache for client: ${clientId}`);

      const headers = applySecurityHeaders(new Headers({
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60, must-revalidate',
        'X-Generated-At': new Date().toISOString(),
        'X-Schema-Version': '1.13',
        'X-Client-ID': clientId.substring(0, 8) + '****',
        'X-Cache': 'HIT',
        'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': rateLimitInfo.reset.toString()
      }));

      return new NextResponse(cachedXml, { status: 200, headers });
    }

    console.log(`[Cache MISS] Generating fresh XML for client: ${clientId}`);

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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oto-raport.vercel.app'
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

    // Cache the generated XML for 5 minutes
    await setCachedValue(cacheKey, xmlContent, MINISTRY_CACHE_TTL);
    console.log(`[Cache SET] Cached XML for client: ${clientId} (TTL: ${MINISTRY_CACHE_TTL}s)`);

    // Set headers with rate limit info
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60, must-revalidate', // 1-minute client cache for Ministry compliance
      'X-Generated-At': new Date().toISOString(),
      'X-Schema-Version': '1.13',
      'X-Client-ID': clientId.substring(0, 8) + '****',
      'X-Cache': 'MISS',
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
