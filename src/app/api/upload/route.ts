import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parseCSVSmart, parseExcelFile } from '@/lib/papaparse-csv-parser'
import { SmartCSVParser } from '@/lib/smart-csv-parser'
import { validateUploadFile } from '@/lib/security'
import { rateLimitWithAuth, uploadRateLimit, uploadRateLimitAuthenticated } from '@/lib/redis-rate-limit'
import { sendUploadConfirmationEmail, sendUploadErrorEmail } from '@/lib/email-service'
import { ParsedProperty, parseDecimal, parseDate } from '@/lib/api-schemas'
import { enforcePropertyLimit, logLimitViolation } from '@/lib/middleware/subscription-limits'
import { canAccessFeature } from '@/lib/middleware/trial-middleware'

/**
 * Helper function to get error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error occurred'
}

export async function POST(request: NextRequest) {
  console.log('🚀 UPLOAD API: Starting file upload...')

  // SECURITY: Tiered rate limiting
  // - Unauthenticated: 10 uploads/hour (IP-based)
  // - Authenticated: 50 uploads/hour (user-based)
  const { response: rateLimitResponse, user, isAuthenticated, rateLimitInfo } = await rateLimitWithAuth(
    request,
    uploadRateLimit,
    uploadRateLimitAuthenticated
  )

  if (rateLimitResponse) {
    console.log(`⛔ UPLOAD API: Rate limit exceeded (${isAuthenticated ? 'authenticated user' : 'IP-based'})`)
    return rateLimitResponse
  }

  // Declare variables outside try block for error handling
  let developer: any = null
  let file: File | null = null

  try {
    // If rate limiting already checked auth and found a user, reuse it
    if (!user) {
      console.log('❌ UPLOAD API: No authenticated user (should not happen after rate limit check)')
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      )
    }

    // Create server client with proper SSR cookie handling
    const supabase = await createClient()

    console.log('✅ UPLOAD API: User authenticated:', user.email)

    // Get developer profile using user ID from rate limit check
    const { data: developerData, error: profileError } = await supabase
      .from('developers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('❌ UPLOAD API: Profile query failed:', profileError.message)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    developer = developerData

    if (!developer) {
      console.log('⚠️ UPLOAD API: No developer profile, creating one...')

      // Auto-create developer profile (using user from rate limit check)
      const clientId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const { data: newDeveloper, error: createError } = await supabase
        .from('developers')
        .insert({
          user_id: user.id,
          email: user.email || '',
          company_name: 'My Company',
          nip: '0000000000',  // Required field - placeholder
          client_id: clientId,
          subscription_plan: 'trial',
          subscription_status: 'active'
        })
        .select()
        .single()

      if (createError || !newDeveloper) {
        console.error('❌ UPLOAD API: Profile creation failed:', createError?.message)
        return NextResponse.json(
          { error: 'Failed to create developer profile' },
          { status: 500 }
        )
      }

      console.log('✅ UPLOAD API: Developer profile created:', newDeveloper.client_id)
      return NextResponse.json({
        success: true,
        message: 'Developer profile created. Please try uploading again.',
        developer: newDeveloper.client_id
      })
    }

    console.log('✅ UPLOAD API: Developer profile found:', developer.client_id)

    // Check trial status - block upload if trial expired
    const trialCheck = await canAccessFeature(developer.id, 'upload')
    if (!trialCheck.allowed) {
      console.log('❌ UPLOAD API: Trial check failed:', trialCheck.reason)
      return NextResponse.json(
        {
          error: 'Trial expired',
          message: trialCheck.reason || 'Twój okres próbny wygasł. Upgrade aby kontynuować.',
          upgradeUrl: '/dashboard/settings#subscription'
        },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    file = formData.get('file') as File
    const requestedProjectId = formData.get('project_id') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

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

    console.log('📁 UPLOAD API: File received:', file.name, file.size, 'bytes')

    // SECURITY: Validate file (size, type, name)
    const fileValidation = validateUploadFile(file)
    if (!fileValidation.valid) {
      console.log('❌ UPLOAD API: File validation failed:', fileValidation.error)
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      )
    }

    // Validate file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const validExtensions = ['csv', 'xlsx', 'xls']

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Unsupported file format. Please use CSV or Excel (.xlsx, .xls)' },
        { status: 400 }
      )
    }

    // Parse file based on type
    let smartParseResult = null
    let propertiesCount = 0
    let savedToDatabase = false

    try {
      if (fileExtension === 'csv') {
        console.log('📊 UPLOAD API: Parsing CSV file...')

        // Get file content with proper encoding detection for Polish characters
        const arrayBuffer = await file.arrayBuffer()
        const encodingResult = detectEncodingAndDecode(arrayBuffer)

        console.log(`📝 UPLOAD API: Encoding - ${encodingResult.encoding} (confidence: ${encodingResult.confidence})${encodingResult.hasPolishChars ? ' 🇵🇱' : ''}`)

        smartParseResult = parseCSVSmart(encodingResult.content)
        propertiesCount = smartParseResult.totalRows

        console.log(`✅ UPLOAD API: Parsed ${smartParseResult.validRows}/${smartParseResult.totalRows} valid rows`)
        console.log(`📋 UPLOAD API: Format detected - ${smartParseResult.detectedFormat?.toUpperCase()} (${smartParseResult.formatConfidence?.toFixed(1)}%)`)
        console.log('🔍 UPLOAD API: Sample data:', JSON.stringify(smartParseResult.data[0], null, 2))
        console.log('🗺️ UPLOAD API: Mappings:', JSON.stringify(smartParseResult.mappings, null, 2))

        // SUBSCRIPTION LIMIT CHECK: Enforce property limits before saving
        if (smartParseResult.data && smartParseResult.data.length > 0) {
          const limitCheck = await enforcePropertyLimit(developer.id, smartParseResult.data.length)

          if (!limitCheck.allowed && limitCheck.error) {
            // Log the violation for analytics
            await logLimitViolation(developer.id, 'property', {
              current: limitCheck.error.currentUsage.properties || 0,
              limit: limitCheck.error.currentUsage.limit || 0,
              attempted: smartParseResult.data.length,
              plan: developer.subscription_plan || 'basic'
            })

            console.log(`⛔ UPLOAD API: Property limit exceeded for developer ${developer.id}`)
            return NextResponse.json(limitCheck.error, { status: 403 })
          }

          // Save properties to database
          await savePropertiesToDatabase(developer.id, smartParseResult.data, file.name, requestedProjectId)
          savedToDatabase = true
          console.log(`✅ UPLOAD API: Saved ${smartParseResult.data.length} properties to database`)
        }
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        console.log('📊 UPLOAD API: Parsing Excel file...')

        // Convert File to Buffer for Excel parser
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Parse Excel file (uses same smart parser as CSV)
        smartParseResult = parseExcelFile(buffer)
        propertiesCount = smartParseResult.totalRows

        console.log(`✅ UPLOAD API: Parsed ${smartParseResult.validRows}/${smartParseResult.totalRows} valid rows from Excel`)
        console.log(`📋 UPLOAD API: Format detected - ${smartParseResult.detectedFormat?.toUpperCase()} (${smartParseResult.formatConfidence?.toFixed(1)}%)`)
        console.log('🔍 UPLOAD API: Sample data:', JSON.stringify(smartParseResult.data[0], null, 2))
        console.log('🗺️ UPLOAD API: Mappings:', JSON.stringify(smartParseResult.mappings, null, 2))

        // SUBSCRIPTION LIMIT CHECK: Enforce property limits before saving
        if (smartParseResult.data && smartParseResult.data.length > 0) {
          const limitCheck = await enforcePropertyLimit(developer.id, smartParseResult.data.length)

          if (!limitCheck.allowed && limitCheck.error) {
            // Log the violation for analytics
            await logLimitViolation(developer.id, 'property', {
              current: limitCheck.error.currentUsage.properties || 0,
              limit: limitCheck.error.currentUsage.limit || 0,
              attempted: smartParseResult.data.length,
              plan: developer.subscription_plan || 'basic'
            })

            console.log(`⛔ UPLOAD API: Property limit exceeded for developer ${developer.id}`)
            return NextResponse.json(limitCheck.error, { status: 403 })
          }

          // Save properties to database
          await savePropertiesToDatabase(developer.id, smartParseResult.data, file.name, requestedProjectId)
          savedToDatabase = true
          console.log(`✅ UPLOAD API: Saved ${smartParseResult.data.length} properties to database`)
        }
      }
    } catch (parseError: unknown) {
      console.error('❌ UPLOAD API: Parse error:', parseError)
      return NextResponse.json(
        {
          error: 'Failed to parse file',
          details: getErrorMessage(parseError)
        },
        { status: 400 }
      )
    }

    // Revalidate cache to show uploaded files immediately
    if (savedToDatabase) {
      console.log('🔄 UPLOAD API: Revalidating cache...')
      revalidatePath('/dashboard')
      revalidatePath('/api/files/list')

      // Send upload confirmation email
      try {
        await sendUploadConfirmationEmail(developer, {
          fileName: file.name,
          totalProperties: smartParseResult?.totalRows || 0,
          validProperties: smartParseResult?.validRows || 0,
          skippedProperties: (smartParseResult?.totalRows || 0) - (smartParseResult?.validRows || 0)
        })
        console.log('✉️ UPLOAD API: Confirmation email sent')
      } catch (emailError) {
        console.error('⚠️ UPLOAD API: Email sending failed:', emailError)
        // Don't fail the upload if email fails
      }
    }

    const response = NextResponse.json({
      success: true,
      message: `Plik został pomyślnie przesłany i przetworzony. ${savedToDatabase ? 'Dane zapisane w bazie.' : ''}`,
      data: {
        fileName: file.name,
        recordsCount: propertiesCount,
        validRecords: smartParseResult?.validRows || 0,
        savedToDatabase,
        preview: smartParseResult?.data?.slice(0, 3) || null,
        // Add tracking metadata for client-side GA4 event
        trackingData: {
          fileType: fileExtension as 'csv' | 'xlsx' | 'xls',
          recordsCount: smartParseResult?.validRows || 0
        }
      }
    })

    // Add rate limit headers to successful response
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())

    return response

  } catch (error: unknown) {
    console.error('💥 UPLOAD API: Unexpected error:', error)

    // Try to send error email if we have developer info
    try {
      if (developer) {
        await sendUploadErrorEmail(developer, {
          fileName: file?.name || 'unknown file',
          errorMessage: getErrorMessage(error),
          errorDetails: error instanceof Error ? error.stack : undefined
        })
        console.log('✉️ UPLOAD API: Error email sent')
      }
    } catch (emailError) {
      console.error('⚠️ UPLOAD API: Failed to send error email:', emailError)
    }

    return NextResponse.json(
      { error: 'Upload failed - internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate a URL-safe slug from project name
 * Example: "Osiedle Słoneczne 2025" -> "osiedle-sloneczne-2025"
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Normalize Polish characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .substring(0, 255) // Limit to schema max length
}

async function savePropertiesToDatabase(developerId: string, properties: any[], fileName: string, requestedProjectId: string | null = null) {
  try {
    let project: { id: string } | null = null

    // If requestedProjectId is explicitly provided, use it (validation already done in main handler)
    if (requestedProjectId) {
      console.log(`🔍 DATABASE: Using provided project ID: ${requestedProjectId}`)

      const { data: projectData, error: projectLookupError } = await createAdminClient()
        .from('projects')
        .select('id')
        .eq('id', requestedProjectId)
        .eq('developer_id', developerId)
        .single()

      if (projectLookupError || !projectData) {
        console.error('❌ DATABASE: Error looking up provided project:', projectLookupError?.message)
        throw new Error(`Failed to lookup provided project: ${projectLookupError?.message}`)
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
      // FALLBACK: Auto-create project from filename (legacy behavior)
      const projectName = SmartCSVParser.extractProjectName(fileName)
      const projectSlug = generateSlug(projectName)

      console.log(`🔍 DATABASE: Auto-creating project from filename: "${projectName}" (slug: ${projectSlug})`)

      // First, get or create a project for this upload
      const { data: projectData, error: projectLookupError } = await createAdminClient()
        .from('projects')
        .select('id')
        .eq('developer_id', developerId)
        .eq('slug', projectSlug)
        .maybeSingle()

      project = projectData

      if (projectLookupError) {
        console.error('❌ DATABASE: Error looking up project:', projectLookupError.message)
        throw new Error(`Failed to lookup project: ${projectLookupError.message}`)
      }

      if (!project) {
        console.log(`📦 DATABASE: Creating new project: "${projectName}"`)

        const { data: newProject, error: insertError } = await createAdminClient()
          .from('projects')
          .insert({
            developer_id: developerId,
            name: projectName,
            slug: projectSlug,
            description: `Automatically created from CSV upload: ${fileName}`,
            status: 'active'
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('❌ DATABASE: Project insert error:', insertError)
          throw new Error(`Failed to create project: ${insertError.message}`)
        }

        if (!newProject) {
          throw new Error('Project insert returned no data')
        }

        project = newProject
        console.log(`✅ DATABASE: Created project ${newProject.id}`)
      } else {
        console.log(`♻️ DATABASE: Found existing project (id: ${projectData.id}), will replace properties`)

        // Delete old properties before inserting new ones (re-upload scenario)
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

    if (!project?.id) {
      throw new Error('Failed to create or get project - no project ID')
    }

    // Prepare properties for database insert
    // Map parsed properties to database schema
    const projectId = project.id // Store in const for TypeScript
    const propertiesToInsert = properties.map(property => {
      return {
        project_id: projectId,
        developer_id: developerId,

        // Lokalizacja (wymagane: wojewodztwo, powiat, gmina)
        wojewodztwo: property.wojewodztwo || 'nieznane',
        powiat: property.powiat || 'nieznane',
        gmina: property.gmina || 'nieznane',
        miejscowosc: property.miejscowosc || null,
        ulica: property.ulica || null,
        nr_budynku: property.numer_nieruchomosci || null,
        kod_pocztowy: property.kod_pocztowy || null,

        // Podstawowe dane (wymagane: property_type, apartment_number)
        property_type: property.property_type === 'dom jednorodzinny' ? 'dom' : 'mieszkanie',
        apartment_number: property.property_number || property.apartment_number || `Property-${Date.now()}`,
        area: parseDecimal(property.area),

        // Ceny (wymagane: price_per_m2, base_price, final_price)
        price_per_m2: parseDecimal(property.price_per_m2) || parseDecimal(property.final_price) || 1,
        price_valid_from: parseDate(property.price_valid_from) || new Date().toISOString().split('T')[0],
        base_price: parseDecimal(property.base_price) || parseDecimal(property.total_price) || parseDecimal(property.final_price) || 1,
        base_price_valid_from: parseDate(property.price_valid_from) || new Date().toISOString().split('T')[0],
        final_price: parseDecimal(property.final_price) || parseDecimal(property.total_price) || 1,
        final_price_valid_from: parseDate(property.price_valid_from) || new Date().toISOString().split('T')[0],

        // Parking (opcjonalne)
        parking_type: property.parking_type || null,
        parking_designation: property.parking_designation || null,
        parking_price: parseDecimal(property.parking_price),
        parking_date: parseDate(property.parking_date),

        // Storage (opcjonalne)
        storage_type: property.storage_type || null,
        storage_designation: property.storage_designation || null,
        storage_price: parseDecimal(property.storage_price),
        storage_date: parseDate(property.storage_date),

        // Necessary rights (opcjonalne)
        necessary_rights_type: property.necessary_rights_type || null,
        necessary_rights_description: property.necessary_rights_description || null,
        necessary_rights_price: parseDecimal(property.necessary_rights_price),
        necessary_rights_date: parseDate(property.necessary_rights_date),

        // Other services (opcjonalne)
        other_services_type: property.other_services_type || null,
        other_services_price: parseDecimal(property.other_services_price),
        prospectus_url: property.prospectus_url || null,

        // Dodatkowe
        rooms: property.rooms ? parseInt(String(property.rooms)) : null,
        floor: property.floor ? parseInt(String(property.floor)) : null,
        status: property.status === 'X' || property.status === 'x' ? 'sold' : 'available'
      }
    })

    // Insert properties in batch
    console.log(`🔧 DATABASE: Inserting ${propertiesToInsert.length} properties`)

    const { error: insertError } = await createAdminClient()
      .from('properties')
      .insert(propertiesToInsert)

    if (insertError) {
      console.error('❌ DATABASE INSERT ERROR:', insertError)
      throw new Error(`Database insert failed: ${insertError.message}`)
    }

    console.log(`✅ DATABASE: Saved ${propertiesToInsert.length} properties to project ${projectId}`)

  } catch (error) {
    console.error('❌ DATABASE: Error saving properties:', error)
    throw error
  }
}

/**
 * Detect encoding and decode ArrayBuffer to string with Polish character support
 * Tries UTF-8 first, then Windows-1250 (common in Polish Excel exports), then ISO-8859-2
 */
interface EncodingDetectionResult {
  content: string
  encoding: 'utf-8-bom' | 'utf-8' | 'windows-1250' | 'iso-8859-2' | 'utf-8-fallback'
  confidence: 'high' | 'medium' | 'low'
  hasPolishChars: boolean
}

function detectEncodingAndDecode(arrayBuffer: ArrayBuffer): EncodingDetectionResult {
  const uint8Array = new Uint8Array(arrayBuffer)

  // Check for BOM (Byte Order Mark)
  if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
    const decoder = new TextDecoder('utf-8')
    const content = decoder.decode(uint8Array.slice(3))
    const hasPolishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(content)
    console.log(`📝 ENCODING: UTF-8 BOM detected${hasPolishChars ? ' (Polish characters present)' : ''}`)
    return {
      content,
      encoding: 'utf-8-bom',
      confidence: 'high',
      hasPolishChars
    }
  }

  // Try UTF-8 first (most common)
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    const content = decoder.decode(uint8Array)

    // Validate UTF-8: check if Polish characters are correctly decoded
    const hasPolishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(content)
    const hasReplacementChars = /�/.test(content)

    if (!hasReplacementChars) {
      console.log(`📝 ENCODING: UTF-8 detected (confidence: high)${hasPolishChars ? ' - Polish characters: ✅' : ''}`)
      return {
        content,
        encoding: 'utf-8',
        confidence: 'high',
        hasPolishChars
      }
    }
  } catch {
    console.log('📝 ENCODING: UTF-8 validation failed, trying Windows-1250...')
  }

  // Analyze byte frequency for better detection between Windows-1250 and ISO-8859-2
  const byteCounts = new Array(256).fill(0)
  uint8Array.forEach(byte => byteCounts[byte]++)

  // Polish-specific byte ranges:
  // Windows-1250: ą=0x B9, ć=0xE6, ę=0xEA, ł=0xB3, ń=0xF1, ó=0xF3, ś=0x9C, ź=0x9F, ż=0xBF
  // ISO-8859-2:   ą=0xB1, ć=0xE6, ę=0xEA, ł=0xB3, ń=0xF1, ó=0xF3, ś=0xB6, ź=0xBC, ż=0xBF
  const win1250Indicators = byteCounts[0xB9] + byteCounts[0x9C] + byteCounts[0x9F] // ą, ś, ź specific to Win1250
  const iso88592Indicators = byteCounts[0xB1] + byteCounts[0xB6] + byteCounts[0xBC] // ą, ś, ź specific to ISO-8859-2

  const preferWin1250 = win1250Indicators > iso88592Indicators

  // Try Windows-1250 (common in Polish Windows Excel exports)
  if (preferWin1250) {
    try {
      const decoder = new TextDecoder('windows-1250')
      const content = decoder.decode(uint8Array)

      const hasPolishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(content)
      const confidence = hasPolishChars ? 'high' : 'medium'
      console.log(`📝 ENCODING: Windows-1250 detected (confidence: ${confidence})${hasPolishChars ? ' - Polish characters: ✅' : ''}`)

      return {
        content,
        encoding: 'windows-1250',
        confidence,
        hasPolishChars
      }
    } catch {
      console.log('📝 ENCODING: Windows-1250 failed, trying ISO-8859-2...')
    }
  }

  // Try ISO-8859-2 (Latin-2, Central European)
  try {
    const decoder = new TextDecoder('iso-8859-2')
    const content = decoder.decode(uint8Array)
    const hasPolishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(content)
    const confidence = hasPolishChars ? 'high' : 'low'
    console.log(`📝 ENCODING: ISO-8859-2 detected (confidence: ${confidence})${hasPolishChars ? ' - Polish characters: ✅' : ''}`)

    return {
      content,
      encoding: 'iso-8859-2',
      confidence,
      hasPolishChars
    }
  } catch {
    console.log('⚠️ ENCODING: ISO-8859-2 failed')
  }

  // If Win1250 wasn't tried yet, try it now
  if (!preferWin1250) {
    try {
      const decoder = new TextDecoder('windows-1250')
      const content = decoder.decode(uint8Array)
      const hasPolishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(content)
      console.log(`📝 ENCODING: Windows-1250 fallback${hasPolishChars ? ' - Polish characters: ✅' : ''}`)

      return {
        content,
        encoding: 'windows-1250',
        confidence: hasPolishChars ? 'medium' : 'low',
        hasPolishChars
      }
    } catch {
      console.log('⚠️ ENCODING: Windows-1250 fallback failed')
    }
  }

  // Final fallback: UTF-8 with replacement characters
  console.log('⚠️ ENCODING: All decoders failed, using UTF-8 with replacement chars')
  const decoder = new TextDecoder('utf-8')
  const content = decoder.decode(uint8Array)

  return {
    content,
    encoding: 'utf-8-fallback',
    confidence: 'low',
    hasPolishChars: false
  }
}