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
      // Get developer by client_id
      const { data: developer, error: devError } = await createAdminClient()
        .from('developers')
        .select('*')
        .eq('client_id', clientId)
        .single()

      if (devError || !developer) {
        console.log('Developer not found, using sample data')
        data = createSampleData(clientId)
      } else {
        console.log(`🔍 MD: Developer found: ${developer.id} (${developer.company_name})`)

        // Get projects (same query as XML generation)
        const { data: projects, error: projectsError } = await createAdminClient()
          .from('projects')
          .select('id, name, location, status, developer_id, created_at')
          .eq('developer_id', developer.id)
          .eq('status', 'active')

        console.log(`🔍 MD: Found ${projects?.length || 0} projects`)
        if (projectsError) console.error('❌ MD: Projects error:', projectsError)

        const validProjects = projects || []
        const projectIds = validProjects.map(p => p.id)
        console.log(`🔍 MD: Project IDs:`, projectIds)

        // Get properties (EXACTLY same query as XML generation)
        const { data: rawProperties, error: propertiesError } = await createAdminClient()
          .from('properties')
          .select('id, project_id, raw_data, created_at, updated_at')
          .in('project_id', projectIds)

        console.log(`🔍 MD: Found ${rawProperties?.length || 0} properties`)
        if (propertiesError) console.error('❌ MD: Properties error:', propertiesError)

        // Pass properties array directly (MD generator will extract from raw_data)
        data = {
          developer,
          projects: validProjects,
          properties: rawProperties || [],
          generatedAt: new Date()
        }
      }
    } catch (dbError) {
      console.log('❌ MD: Database error:', dbError)
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