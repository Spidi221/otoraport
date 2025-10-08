/**
 * Upload Parsed Data API Endpoint
 * Receives pre-parsed CSV data from Web Worker (client-side parsing)
 * This prevents server timeouts on large files and keeps UI responsive
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { rateLimitWithAuth, uploadRateLimit, uploadRateLimitAuthenticated } from '@/lib/redis-rate-limit'
import { UploadParsedRequestSchema, parseDecimal, parseDate } from '@/lib/api-schemas'

export async function POST(request: NextRequest) {
  console.log('🚀 UPLOAD PARSED API: Receiving pre-parsed data from Web Worker...')

  // SECURITY: Tiered rate limiting
  const { response: rateLimitResponse, user, rateLimitInfo } = await rateLimitWithAuth(
    request,
    uploadRateLimit,
    uploadRateLimitAuthenticated
  )

  if (rateLimitResponse) {
    console.log('⛔ UPLOAD PARSED API: Rate limit exceeded')
    return rateLimitResponse
  }

  try {
    // Validate user authentication
    if (!user) {
      console.log('❌ UPLOAD PARSED API: No authenticated user')
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      )
    }

    // Parse and validate request body with Zod
    const body = await request.json()
    const validationResult = UploadParsedRequestSchema.safeParse(body)

    if (!validationResult.success) {
      console.error('❌ UPLOAD PARSED API: Validation failed:', validationResult.error)
      return NextResponse.json(
        { error: 'Invalid request format', details: validationResult.error.message },
        { status: 400 }
      )
    }

    const { properties, validRecords } = validationResult.data

    // Get optional project_id from query params or request body
    const { searchParams } = new URL(request.url)
    const requestedProjectId = searchParams.get('project_id') || body.project_id || null

    console.log(`✅ UPLOAD PARSED API: Received ${properties.length} pre-parsed properties${requestedProjectId ? ` for project ${requestedProjectId}` : ''}`)

    // Create server client
    const supabase = await createClient()

    // Get developer profile
    const { data: developer, error: profileError } = await supabase
      .from('developers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('❌ UPLOAD PARSED API: Profile query failed:', profileError.message)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!developer) {
      console.log('⚠️ UPLOAD PARSED API: No developer profile found')
      return NextResponse.json(
        { error: 'Developer profile not found' },
        { status: 404 }
      )
    }

    console.log('✅ UPLOAD PARSED API: Developer profile found:', developer.client_id)

    // If project_id provided, validate it belongs to this developer
    if (requestedProjectId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', requestedProjectId)
        .eq('developer_id', developer.id)
        .single()

      if (projectError || !project) {
        return NextResponse.json(
          { error: 'Projekt nie znaleziony lub nie należy do Ciebie' },
          { status: 400 }
        )
      }
    }

    let project: { id: string } | null = null

    // If requestedProjectId is explicitly provided, use it (validation already done above)
    if (requestedProjectId) {
      console.log(`🔍 DATABASE: Using provided project ID: ${requestedProjectId}`)

      const { data: projectData, error: projectLookupError } = await createAdminClient()
        .from('projects')
        .select('id')
        .eq('id', requestedProjectId)
        .eq('developer_id', developer.id)
        .single()

      if (projectLookupError || !projectData) {
        console.error('❌ DATABASE: Error looking up provided project:', projectLookupError?.message)
        return NextResponse.json(
          { error: 'Failed to lookup provided project' },
          { status: 500 }
        )
      }

      project = projectData

      // Delete old properties before inserting new ones (re-upload scenario)
      if (project?.id) {
        const { error: deleteError } = await createAdminClient()
          .from('properties')
          .delete()
          .eq('project_id', project.id)

        if (deleteError) {
          console.error('⚠️ DATABASE: Error deleting old properties:', deleteError.message)
        } else {
          console.log(`🗑️ DATABASE: Cleared old properties for project ${project.id}`)
        }
      }
    } else {
      // FALLBACK: Auto-create project from property data (legacy behavior)
      const projectName = properties[0]?.project_name || 'Imported Properties'
      const projectSlug = generateSlug(projectName)

      console.log(`🔍 DATABASE: Auto-creating project from data: "${projectName}" (slug: ${projectSlug})`)

      // Get or create project
      const { data: projectData, error: projectLookupError } = await createAdminClient()
        .from('projects')
        .select('id')
        .eq('developer_id', developer.id)
        .eq('slug', projectSlug)
        .maybeSingle()

      project = projectData

      if (projectLookupError) {
        console.error('❌ DATABASE: Error looking up project:', projectLookupError.message)
        return NextResponse.json(
          { error: 'Failed to lookup project' },
          { status: 500 }
        )
      }

      if (!project) {
        console.log(`📦 DATABASE: Creating new project: "${projectName}"`)

        const { data: newProject, error: insertError } = await createAdminClient()
          .from('projects')
          .insert({
            developer_id: developer.id,
            name: projectName,
            slug: projectSlug,
            description: `Auto-created from Web Worker parsed CSV upload`,
            status: 'active'
          })
          .select('id')
          .single()

        if (insertError || !newProject) {
          console.error('❌ DATABASE: Project creation failed:', insertError)
          return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
          )
        }

        project = newProject
        console.log(`✅ DATABASE: Created project ${newProject.id}`)
      } else {
        console.log(`♻️ DATABASE: Found existing project (id: ${projectData.id}), will replace properties`)

        // Delete old properties before inserting new ones
        const { error: deleteError } = await createAdminClient()
          .from('properties')
          .delete()
          .eq('project_id', projectData.id)

        if (deleteError) {
          console.error('⚠️ DATABASE: Error deleting old properties:', deleteError.message)
        } else {
          console.log(`🗑️ DATABASE: Cleared old properties for project ${projectData.id}`)
        }
      }
    }

    // Ensure project exists before proceeding
    if (!project?.id) {
      console.error('❌ DATABASE: No valid project ID after lookup/creation')
      return NextResponse.json(
        { error: 'Failed to establish project for properties' },
        { status: 500 }
      )
    }

    // Prepare properties for database insert (map Web Worker parsed data to DB schema)
    const projectId = project.id // Store in const for TypeScript
    const propertiesToInsert = properties.map(property => {
      return {
        project_id: projectId,
        developer_id: developer.id,

        // Location (required)
        wojewodztwo: property.wojewodztwo || 'nieznane',
        powiat: property.powiat || 'nieznane',
        gmina: property.gmina || 'nieznane',
        miejscowosc: property.miejscowosc || null,
        ulica: property.ulica || null,
        nr_budynku: property.numer_nieruchomosci || null,
        kod_pocztowy: property.kod_pocztowy || null,

        // Basic data (required)
        property_type: property.property_type === 'dom jednorodzinny' ? 'dom' : 'mieszkanie',
        apartment_number: property.property_number || property.apartment_number || `Property-${Date.now()}`,
        area: parseDecimal(property.area),

        // Prices (required)
        price_per_m2: parseDecimal(property.price_per_m2) || parseDecimal(property.final_price) || 1,
        price_valid_from: parseDate(property.price_valid_from) || new Date().toISOString().split('T')[0],
        base_price: parseDecimal(property.base_price) || parseDecimal(property.total_price) || parseDecimal(property.final_price) || 1,
        base_price_valid_from: parseDate(property.price_valid_from) || new Date().toISOString().split('T')[0],
        final_price: parseDecimal(property.final_price) || parseDecimal(property.total_price) || 1,
        final_price_valid_from: parseDate(property.price_valid_from) || new Date().toISOString().split('T')[0],

        // Optional fields
        parking_type: property.parking_type || null,
        parking_designation: property.parking_designation || null,
        parking_price: parseDecimal(property.parking_price),
        parking_date: parseDate(property.parking_date),

        storage_type: property.storage_type || null,
        storage_designation: property.storage_designation || null,
        storage_price: parseDecimal(property.storage_price),
        storage_date: parseDate(property.storage_date),

        necessary_rights_type: property.necessary_rights_type || null,
        necessary_rights_description: property.necessary_rights_description || null,
        necessary_rights_price: parseDecimal(property.necessary_rights_price),
        necessary_rights_date: parseDate(property.necessary_rights_date),

        other_services_type: property.other_services_type || null,
        other_services_price: parseDecimal(property.other_services_price),
        prospectus_url: property.prospectus_url || null,

        rooms: property.rooms ? parseInt(String(property.rooms)) : null,
        floor: property.floor ? parseInt(String(property.floor)) : null,
        status: property.status === 'X' || property.status === 'x' ? 'sold' : 'available'
      }
    })

    console.log(`🔧 DATABASE: Inserting ${propertiesToInsert.length} properties`)

    // Insert properties in batch
    const { error: insertError } = await createAdminClient()
      .from('properties')
      .insert(propertiesToInsert)

    if (insertError) {
      console.error('❌ DATABASE INSERT ERROR:', insertError)
      return NextResponse.json(
        { error: 'Database insert failed: ' + insertError.message },
        { status: 500 }
      )
    }

    console.log(`✅ DATABASE: Saved ${propertiesToInsert.length} properties to project ${projectId}`)

    // Get project name for response
    const { data: projectDetails } = await createAdminClient()
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    // Build response with rate limit headers
    const response = NextResponse.json({
      success: true,
      message: `Parsed and saved ${validRecords} properties`,
      data: {
        propertiesAdded: propertiesToInsert.length,
        projectId: projectId,
        projectName: projectDetails?.name || 'Unknown'
      }
    })

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())

    return response

  } catch (error: unknown) {
    console.error('💥 UPLOAD PARSED API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Upload failed - internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate a URL-safe slug from project name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 255)
}
