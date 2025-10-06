/**
 * Upload Parsed Data API Endpoint
 * Receives pre-parsed CSV data from Web Worker (client-side parsing)
 * This prevents server timeouts on large files and keeps UI responsive
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { SmartCSVParser } from '@/lib/smart-csv-parser'
import { rateLimitWithAuth, uploadRateLimit, uploadRateLimitAuthenticated } from '@/lib/redis-rate-limit'

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

    // Parse request body
    const body = await request.json()
    const { properties, validRecords } = body

    if (!properties || !Array.isArray(properties)) {
      return NextResponse.json(
        { error: 'Invalid request: properties array required' },
        { status: 400 }
      )
    }

    console.log(`✅ UPLOAD PARSED API: Received ${properties.length} pre-parsed properties`)

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

    // Extract project name from first property (or use default)
    const projectName = properties[0]?.project_name || 'Imported Properties'
    const projectSlug = generateSlug(projectName)

    console.log(`🔍 DATABASE: Looking for project: "${projectName}" (slug: ${projectSlug})`)

    // Get or create project
    let { data: project, error: projectLookupError } = await createAdminClient()
      .from('projects')
      .select('id')
      .eq('developer_id', developer.id)
      .eq('slug', projectSlug)
      .maybeSingle()

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
          description: `Auto-created from Web Worker parsed CSV upload`
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
      console.log(`✅ DATABASE: Created project ${project.id}`)
    } else {
      console.log(`♻️ DATABASE: Found existing project (id: ${project.id}), will replace properties`)

      // Delete old properties before inserting new ones
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

    // Prepare properties for database insert (map Web Worker parsed data to DB schema)
    const propertiesToInsert = properties.map(property => {
      const parseDecimal = (value: any): number | null => {
        if (!value || value === 'X' || value === 'x') return null
        const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ''))
        return isNaN(parsed) ? null : parsed
      }

      const parseDate = (value: any): string | null => {
        if (!value || value === 'X' || value === 'x') return null
        return String(value)
      }

      return {
        project_id: project.id,
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

        rooms: property.rooms ? parseInt(property.rooms) : null,
        floor: property.floor ? parseInt(property.floor) : null,
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

    console.log(`✅ DATABASE: Saved ${propertiesToInsert.length} properties to project ${project.id}`)

    // Build response with rate limit headers
    const response = NextResponse.json({
      success: true,
      message: `Parsed and saved ${validRecords} properties`,
      data: {
        propertiesAdded: propertiesToInsert.length,
        projectId: project.id,
        projectName: projectName
      }
    })

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())

    return response

  } catch (error) {
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
