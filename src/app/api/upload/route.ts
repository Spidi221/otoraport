import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parseCSVSmart } from '@/lib/smart-csv-parser'

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

    // Parse CSV file
    const fileContent = await file.text()
    let smartParseResult = null
    let propertiesCount = 0
    let savedToDatabase = false

    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        console.log('📊 UPLOAD API: Parsing CSV file...')
        smartParseResult = parseCSVSmart(fileContent)
        propertiesCount = smartParseResult.totalRows

        console.log(`✅ UPLOAD API: Parsed ${smartParseResult.validRows}/${smartParseResult.totalRows} valid rows`)

        // Save properties to database
        if (smartParseResult.data && smartParseResult.data.length > 0) {
          await savePropertiesToDatabase(developer.id, smartParseResult.data, file.name)
          savedToDatabase = true
          console.log(`✅ UPLOAD API: Saved ${smartParseResult.data.length} properties to database`)
        }
      } else {
        return NextResponse.json(
          { error: 'Currently only CSV files are supported' },
          { status: 400 }
        )
      }
    } catch (parseError) {
      console.error('❌ UPLOAD API: Parse error:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse file' },
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

async function savePropertiesToDatabase(developerId: string, properties: any[], fileName: string) {
  try {
    // First, get or create a project for this upload
    let { data: project } = await createAdminClient()
      .from('projects')
      .select('id')
      .eq('developer_id', developerId)
      .eq('name', `Import from ${fileName}`)
      .maybeSingle()

    if (!project) {
      const { data: newProject } = await createAdminClient()
        .from('projects')
        .insert({
          developer_id: developerId,
          name: `Import from ${fileName}`,
          description: `Automatically created from CSV upload: ${fileName}`,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      project = newProject
    }

    if (!project?.id) {
      throw new Error('Failed to create or get project')
    }

    // Prepare properties for database insert
    const propertiesToInsert = properties.map(property => ({
      project_id: project.id,
      property_number: property.property_number || null,
      property_type: property.property_type || 'mieszkanie',
      price_per_m2: property.price_per_m2 || null,
      total_price: property.total_price || null,
      final_price: property.final_price || property.total_price || null,
      area: property.area || null,
      parking_space: property.parking_space || null,
      parking_price: property.parking_price || null,
      status: property.status || 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    // Insert properties in batch
    const { error } = await createAdminClient()
      .from('properties')
      .insert(propertiesToInsert)

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`)
    }

    console.log(`✅ DATABASE: Saved ${propertiesToInsert.length} properties`)

  } catch (error) {
    console.error('❌ DATABASE: Error saving properties:', error)
    throw error
  }
}