import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { parseCSVSmart, validateMinistryCompliance } from '@/lib/smart-csv-parser'
import { sendComplianceNotification } from '@/lib/email-service'
import path from 'path'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/xml',
  'text/xml'
]

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nie wybrano pliku' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Plik jest za duży. Maksymalny rozmiar to 10MB' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy typ pliku. Dozwolone: CSV, XLSX, XML' },
        { status: 400 }
      )
    }

    console.log(`Processing file upload from user ${session.user.email}: ${file.name}`)

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory already exists
    }

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const userId = (session.user as any).id || 'anonymous'
    const fileName = `${userId}-${timestamp}-${file.name}`
    const filePath = path.join(uploadsDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Smart parsing and database storage
    const fileContent = await file.text()
    let smartParseResult = null
    let propertiesCount = 0
    let processingErrors: string[] = []
    let savedToDatabase = false

    try {
      if (file.name.endsWith('.csv')) {
        // Use smart CSV parser
        smartParseResult = parseCSVSmart(fileContent)
        propertiesCount = smartParseResult.totalRows

        console.log(`Smart parsing result: ${smartParseResult.validRows}/${smartParseResult.totalRows} valid rows, confidence: ${Math.round(smartParseResult.confidence * 100)}%`)

        if (smartParseResult.success) {
          // Validate compliance
          const validation = validateMinistryCompliance(smartParseResult.data)
          
          if (validation.valid) {
            // Get developer ID and save to database
            const developerId = await getDeveloperIdFromSession(session)
            if (developerId) {
              await savePropertiesToDatabase(developerId, smartParseResult.data, file.name)
              savedToDatabase = true
              console.log(`Saved ${smartParseResult.validRows} properties to database for developer ${developerId}`)
            }
          } else {
            processingErrors = [...validation.errors, ...validation.warnings]
          }
        } else {
          processingErrors = smartParseResult.errors
        }
      } else if (file.name.endsWith('.xml')) {
        // Legacy XML parsing
        const xmlPreview = parseXMLPreview(fileContent)
        propertiesCount = xmlPreview.totalRows
        smartParseResult = { 
          ...xmlPreview, 
          success: true, 
          mappings: {}, 
          errors: [], 
          suggestions: {}, 
          confidence: 0.8, 
          validRows: xmlPreview.totalRows 
        }
      }
    } catch (parseError) {
      console.error('Smart parse error:', parseError)
      processingErrors.push(parseError instanceof Error ? parseError.message : 'Unknown parsing error')
    }

    const processingResult = {
      fileName: file.name,
      originalSize: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      status: savedToDatabase ? 'processed_and_saved' : 'processed_only',
      recordsCount: propertiesCount,
      validRecords: smartParseResult?.validRows || 0,
      errors: processingErrors.length,
      preview: smartParseResult?.data?.slice(0, 3) || null,
      filePath: fileName,
      mappings: smartParseResult?.mappings || {},
      suggestions: smartParseResult?.suggestions || {},
      confidence: Math.round((smartParseResult?.confidence || 0) * 100),
      processingErrors,
      savedToDatabase
    }

    // Auto-regenerate XML/MD files and send compliance notification
    try {
      const { regenerateFilesForDeveloper } = await import('@/lib/file-regeneration')
      const regenerationResult = await regenerateFilesForDeveloper(userId)
      
      // Send compliance notification email if regeneration was successful
      if (regenerationResult.success && processingResult.totalProperties > 0) {
        try {
          const { data: developer } = await supabaseAdmin
            .from('developers')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (developer) {
            await sendComplianceNotification(developer, processingResult.totalProperties)
          }
        } catch (emailError) {
          console.warn('Compliance notification email failed:', emailError)
          // Non-critical - don't fail the upload
        }
      }
      
      console.log(`Auto-regeneration completed for user ${session.user.email}:`, regenerationResult)
    } catch (regenerationError) {
      console.error('Auto-regeneration failed:', regenerationError)
      // Don't fail the upload because of regeneration error
    }

    return NextResponse.json({
      success: true,
      message: 'Plik został pomyślnie przesłany i przetworzony',
      data: processingResult
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas przesyłania pliku' },
      { status: 500 }
    )
  }
}

function parseCSVPreview(content: string) {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) return { totalRows: 0, preview: [] }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const preview = []

  for (let i = 1; i < Math.min(lines.length, 4); i++) { // First 3 data rows
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      preview.push(row)
    }
  }

  return {
    totalRows: lines.length - 1, // Exclude header
    preview
  }
}

async function getDeveloperIdFromSession(session: any): Promise<string | null> {
  try {
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('email', session.user.email)
      .single()
    
    return developer?.id || null
  } catch (error) {
    console.error('Error getting developer ID:', error)
    return null
  }
}

async function savePropertiesToDatabase(developerId: string, properties: any[], fileName: string) {
  try {
    // First, get or create a project for this upload
    let { data: project } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('developer_id', developerId)
      .eq('name', `Import from ${fileName}`)
      .single()

    if (!project) {
      const { data: newProject } = await supabaseAdmin
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
      status: property.status || 'dostępne',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      raw_data: property.raw_data
    }))

    // Insert properties in batch
    const { error } = await supabaseAdmin
      .from('properties')
      .insert(propertiesToInsert)

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`)
    }

    console.log(`Successfully saved ${propertiesToInsert.length} properties to database`)

  } catch (error) {
    console.error('Error saving properties to database:', error)
    throw error
  }
}

function parseXMLPreview(content: string) {
  const propertyMatches = content.match(/<property[^>]*>.*?<\/property>/gs) || []
  const preview = []

  for (let i = 0; i < Math.min(propertyMatches.length, 3); i++) {
    const match = propertyMatches[i]
    const numberMatch = match.match(/<number>(.*?)<\/number>/)
    const priceMatch = match.match(/<price>(.*?)<\/price>/)
    const areaMatch = match.match(/<area>(.*?)<\/area>/)
    
    preview.push({
      property_number: numberMatch ? numberMatch[1] : `Property_${i + 1}`,
      price: priceMatch ? priceMatch[1] : 'N/A',
      area: areaMatch ? areaMatch[1] : 'N/A'
    })
  }

  return {
    totalRows: propertyMatches.length,
    preview
  }
}