import { NextRequest, NextResponse } from 'next/server'
import { generateHarvesterXML } from '@/lib/harvester-xml-generator'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateClientId, applySecurityHeaders } from '@/lib/security'
import { rateLimit, publicRateLimit, getCachedValue, setCachedValue, getMinistryCacheKey, MINISTRY_CACHE_TTL } from '@/lib/redis-rate-limit'
import crypto from 'crypto'

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

    console.log(`MD5 checksum request for client: ${clientId}`)

    // Try to get from Redis cache first
    const cacheKey = getMinistryCacheKey(clientId, 'md5');
    const cachedMd5 = await getCachedValue<string>(cacheKey);

    if (cachedMd5) {
      console.log(`[Cache HIT] Serving MD5 from Redis cache for client: ${clientId}`);

      const headers = applySecurityHeaders(new Headers({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60, must-revalidate',
        'X-Generated-At': new Date().toISOString(),
        'X-Hash-Type': 'md5',
        'X-Client-ID': clientId.substring(0, 8) + '****',
        'X-Cache': 'HIT',
        'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': rateLimitInfo.reset.toString()
      }));

      return new NextResponse(cachedMd5, { status: 200, headers });
    }

    console.log(`[Cache MISS] Generating fresh MD5 for client: ${clientId}`);

    // Get developer data (using admin client to bypass RLS)
    const supabase = createAdminClient()
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()

    if (devError || !developer) {
      return new NextResponse(
        JSON.stringify({ error: 'Developer not found' }),
        { status: 404 }
      );
    }

    // Generate CSV URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://otoraport.vercel.app'
    const csvUrl = `${baseUrl}/api/public/${clientId}/data.csv`

    // Generate the SAME Harvester XML as data.xml endpoint
    const xmlContent = generateHarvesterXML({
      developer: {
        name: developer.company_name || '',
        client_id: developer.client_id
      },
      csvUrl,
      date: new Date().toISOString().split('T')[0]
    })

    // Generate MD5 hash
    const md5Hash = crypto.createHash('md5').update(xmlContent).digest('hex')

    // Cache the generated MD5 for 5 minutes
    await setCachedValue(cacheKey, md5Hash.toLowerCase(), MINISTRY_CACHE_TTL);
    console.log(`[Cache SET] Cached MD5 for client: ${clientId} (TTL: ${MINISTRY_CACHE_TTL}s, hash: ${md5Hash.substring(0, 8)}...)`);

    // Set headers with rate limit info
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60, must-revalidate', // 1-minute client cache for Ministry compliance
      'X-Generated-At': new Date().toISOString(),
      'X-Hash-Type': 'md5',
      'X-Client-ID': clientId.substring(0, 8) + '****',
      'X-Cache': 'MISS',
      // Rate limit headers
      'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
      'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
      'X-RateLimit-Reset': rateLimitInfo.reset.toString()
    }))

    // Return MD5 hash as plain text
    return new NextResponse(md5Hash.toLowerCase(), {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('MD5 generation error:', error)

    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error generating MD5',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers }
    )
  }
}
