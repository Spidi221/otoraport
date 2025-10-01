import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parseCSVSmart, SmartCSVParser, parseExcelFile } from '@/lib/smart-csv-parser'
import { validateUploadFile } from '@/lib/security'

export async function POST(request: NextRequest) {
  console.log('🚀 UPLOAD API: Starting file upload...')

  try {
    // Create server client with proper SSR cookie handling
    const supabase = await createClient()

    // Get authenticated user (proper SSR method)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ UPLOAD API: Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      )
    }

    console.log('✅ UPLOAD API: User authenticated:', user.email)

    // Get developer profile
    const { data: developer, error: profileError } = await supabase
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

    if (!developer) {
      console.log('⚠️ UPLOAD API: No developer profile, creating one...')

      // Auto-create developer profile
      const clientId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const { data: newDeveloper, error: createError } = await supabase
        .from('developers')
        .insert({
          user_id: user.id,
          email: user.email!,
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
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
        const fileContent = detectEncodingAndDecode(arrayBuffer)

        smartParseResult = parseCSVSmart(fileContent)
        propertiesCount = smartParseResult.totalRows

        console.log(`✅ UPLOAD API: Parsed ${smartParseResult.validRows}/${smartParseResult.totalRows} valid rows`)
        console.log(`📋 UPLOAD API: Format detected - ${smartParseResult.detectedFormat?.toUpperCase()} (${smartParseResult.formatConfidence?.toFixed(1)}%)`)
        console.log('🔍 UPLOAD API: Sample data:', JSON.stringify(smartParseResult.data[0], null, 2))
        console.log('🗺️ UPLOAD API: Mappings:', JSON.stringify(smartParseResult.mappings, null, 2))

        // Save properties to database
        if (smartParseResult.data && smartParseResult.data.length > 0) {
          await savePropertiesToDatabase(developer.id, smartParseResult.data, file.name, fileContent)
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

        // Save properties to database
        if (smartParseResult.data && smartParseResult.data.length > 0) {
          // Convert buffer to base64 string for storage (Excel files need special handling)
          const fileContentForStorage = buffer.toString('base64')
          await savePropertiesToDatabase(developer.id, smartParseResult.data, file.name, fileContentForStorage)
          savedToDatabase = true
          console.log(`✅ UPLOAD API: Saved ${smartParseResult.data.length} properties to database`)
        }
      }
    } catch (parseError) {
      console.error('❌ UPLOAD API: Parse error:', parseError)
      return NextResponse.json(
        {
          error: 'Failed to parse file',
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        },
        { status: 400 }
      )
    }

    // Revalidate cache to show uploaded files immediately
    if (savedToDatabase) {
      console.log('🔄 UPLOAD API: Revalidating cache...')
      revalidatePath('/dashboard')
      revalidatePath('/api/files/list')
    }

    return NextResponse.json({
      success: true,
      message: `Plik został pomyślnie przesłany i przetworzony. ${savedToDatabase ? 'Dane zapisane w bazie.' : ''}`,
      data: {
        fileName: file.name,
        recordsCount: propertiesCount,
        validRecords: smartParseResult?.validRows || 0,
        savedToDatabase,
        preview: smartParseResult?.data?.slice(0, 3) || null
      }
    })

  } catch (error) {
    console.error('💥 UPLOAD API: Unexpected error:', error)
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

async function savePropertiesToDatabase(developerId: string, properties: any[], fileName: string, fileContent: string) {
  try {
    // CRITICAL FIX: Extract meaningful project name from filename
    const projectName = SmartCSVParser.extractProjectName(fileName)
    const projectSlug = generateSlug(projectName)

    console.log(`🔍 DATABASE: Looking for existing project: "${projectName}" (slug: ${projectSlug})`)

    // First, get or create a project for this upload
    let { data: project, error: projectLookupError } = await createAdminClient()
      .from('projects')
      .select('id')
      .eq('developer_id', developerId)
      .eq('slug', projectSlug)
      .maybeSingle()

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
          description: `Automatically created from CSV upload: ${fileName}`
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
      console.log(`✅ DATABASE: Created project ${project.id}`)
    } else {
      console.log(`♻️ DATABASE: Found existing project (id: ${project.id}), will replace properties`)

      // CRITICAL FIX: Delete old properties before inserting new ones (re-upload scenario)
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

    if (!project?.id) {
      throw new Error('Failed to create or get project - no project ID')
    }

    // Prepare properties for database insert
    // Map parsed properties to database schema
    const propertiesToInsert = properties.map(property => {
      // Parse numeric values safely
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
        rooms: property.rooms ? parseInt(property.rooms) : null,
        floor: property.floor ? parseInt(property.floor) : null,
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

    console.log(`✅ DATABASE: Saved ${propertiesToInsert.length} properties to project ${project.id}`)

  } catch (error) {
    console.error('❌ DATABASE: Error saving properties:', error)
    throw error
  }
}

/**
 * Detect encoding and decode ArrayBuffer to string with Polish character support
 * Tries UTF-8 first, then Windows-1250 (common in Polish Excel exports), then ISO-8859-2
 */
function detectEncodingAndDecode(arrayBuffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(arrayBuffer)

  // Check for BOM (Byte Order Mark)
  if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
    console.log('📝 ENCODING: UTF-8 BOM detected')
    // Skip BOM and decode as UTF-8
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(uint8Array.slice(3))
  }

  // Try UTF-8 first (most common)
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    const decoded = decoder.decode(uint8Array)

    // Validate UTF-8: check if Polish characters are correctly decoded
    const hasPolishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(decoded)
    const hasReplacementChars = /�/.test(decoded)

    if (!hasReplacementChars) {
      console.log(`📝 ENCODING: UTF-8 successful${hasPolishChars ? ' (Polish characters detected)' : ''}`)
      return decoded
    }
  } catch (error) {
    console.log('📝 ENCODING: UTF-8 decode failed, trying Windows-1250...')
  }

  // Try Windows-1250 (common in Polish Windows Excel exports)
  try {
    const decoder = new TextDecoder('windows-1250')
    const decoded = decoder.decode(uint8Array)

    // Check if Polish characters appear correctly
    const hasPolishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(decoded)
    if (hasPolishChars) {
      console.log('📝 ENCODING: Windows-1250 successful (Polish characters detected)')
      return decoded
    }

    // Even without Polish chars, Windows-1250 might be correct
    console.log('📝 ENCODING: Windows-1250 used (fallback)')
    return decoded
  } catch (error) {
    console.log('📝 ENCODING: Windows-1250 failed, trying ISO-8859-2...')
  }

  // Try ISO-8859-2 (Latin-2, Central European)
  try {
    const decoder = new TextDecoder('iso-8859-2')
    const decoded = decoder.decode(uint8Array)
    console.log('📝 ENCODING: ISO-8859-2 used (fallback)')
    return decoded
  } catch (error) {
    console.log('⚠️ ENCODING: All decoders failed, using UTF-8 with replacement chars')
  }

  // Final fallback: UTF-8 with replacement characters
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(uint8Array)
}