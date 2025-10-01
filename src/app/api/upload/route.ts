import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parseCSVSmart, SmartCSVParser, parseExcelFile } from '@/lib/smart-csv-parser'

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
          name: user.email!.split('@')[0],
          company_name: 'My Company',
          client_id: clientId,
          subscription_plan: 'basic',
          subscription_status: 'trial'
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

    // Validate file type
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

async function savePropertiesToDatabase(developerId: string, properties: any[], fileName: string, fileContent: string) {
  try {
    // CRITICAL FIX: Extract meaningful project name from filename
    const projectName = SmartCSVParser.extractProjectName(fileName)

    console.log(`🔍 DATABASE: Looking for existing project: "${projectName}"`)

    // First, get or create a project for this upload
    let { data: project } = await createAdminClient()
      .from('projects')
      .select('id')
      .eq('developer_id', developerId)
      .eq('name', projectName)
      .maybeSingle()

    if (!project) {
      console.log(`📦 DATABASE: Creating new project: "${projectName}"`)
      const { data: newProject } = await createAdminClient()
        .from('projects')
        .insert({
          developer_id: developerId,
          name: projectName,
          description: `Automatically created from CSV upload: ${fileName}`,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      project = newProject
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
      throw new Error('Failed to create or get project')
    }

    // Save uploaded file record with content for reprocessing
    const { data: fileRecord, error: fileError } = await createAdminClient()
      .from('uploaded_files')
      .insert({
        developer_id: developerId,
        project_id: project.id,
        file_name: fileName,
        file_size: fileContent.length,
        file_content: fileContent, // Store content for reprocessing
        processed: true,
        processed_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (fileError) {
      console.error('❌ Error creating file record:', fileError)
      // Don't throw - continue with properties insert
    } else {
      console.log(`✅ File record created: ${fileRecord.id}`)
    }

    // Prepare properties for database insert
    // CRITICAL: Supabase schema cache is broken - ONLY use project_id and raw_data
    const propertiesToInsert = properties.map(property => ({
      project_id: project.id,
      // Store EVERYTHING in raw_data to bypass schema cache validation
      raw_data: property
    }))

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