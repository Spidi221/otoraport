import { NextRequest, NextResponse } from 'next/server'
import { generateMarkdownFile } from '@/lib/md-generator'
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
        const { data: projects, error: projectsError } = await createAdminClient()
          .from('projects')
          .select('*')
          .eq('developer_id', developer.id)

        console.log(`🔍 MD: Found ${projects?.length || 0} projects for developer ${developer.id}`)
        if (projectsError) console.error('❌ MD: Projects query error:', projectsError)

        // Get properties for these projects
        // CRITICAL: Must explicitly select raw_data column (JSONB columns not included in *)
        const projectIds = projects?.map(p => p.id) || []
        console.log(`🔍 MD: Project IDs:`, projectIds)

        const { data: properties, error: propertiesError } = await createAdminClient()
          .from('properties')
          .select('id, project_id, raw_data, status, created_at, updated_at')
          .in('project_id', projectIds)

        console.log(`🔍 MD: Found ${properties?.length || 0} properties`)
        if (propertiesError) console.error('❌ MD: Properties query error:', propertiesError)

        // CRITICAL: Pass raw properties with raw_data for extraction
        data = {
          developer,
          projects: projects || [],
          properties: properties || [],
          generatedAt: new Date()
        }

        console.log(`Found real data: ${properties?.length || 0} properties for ${developer.company_name}`)
      }
    } catch (dbError) {
      console.log('Database query failed, using sample data:', dbError)
      data = createSampleData(clientId)
    }

    // Generate Markdown according to ministry requirements (using fixed generator)
    const markdownContent = generateMarkdownFile(data)

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