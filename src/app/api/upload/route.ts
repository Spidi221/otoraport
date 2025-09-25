import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase'
import { parseCSVSmart, validateMinistryCompliance, parseExcelFileFromBlob, parsePropertyFile } from '@/lib/smart-csv-parser'
import { sendComplianceNotification } from '@/lib/email-service'
import {
  checkRateLimit,
  validateUploadFile,
  generateSafeFilePath,
  applySecurityHeaders,
  sanitizeInput
} from '@/lib/security'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting
    const rateLimitResult = await checkRateLimit(request, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // Max 10 file uploads per 15 minutes
    });

    if (!rateLimitResult.allowed) {
      const headers = applySecurityHeaders(new Headers({
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      }));
      
      return new NextResponse(
        JSON.stringify({ error: 'Za dużo żądań. Spróbuj ponownie później.' }),
        { status: 429, headers }
      );
    }

    // Authentication check
    const auth = await getAuthenticatedDeveloper(request)

    if (!auth.success || !auth.user || !auth.developer) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: auth.error || 'Unauthorized. Please log in.' }),
        { status: 401, headers }
      );
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    // SECURITY: Validate file using security library
    const fileValidation = validateUploadFile(file);
    if (!fileValidation.valid) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: fileValidation.error }),
        { status: 400, headers }
      );
    }

    // File upload processing initiated (user details redacted for security)

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory already exists
    }

    // SECURITY: Generate safe filename to prevent path traversal
    const userId = auth.developer.id
    const safeFileName = generateSafeFilePath(file.name, sanitizeInput(userId))
    const filePath = path.join(uploadsDir, safeFileName)

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
      // Enhanced file type detection
      const isCSV = file.name.toLowerCase().endsWith('.csv')
      const isExcel = /\.(xlsx?|xlsm)$/i.test(file.name.toLowerCase())
      const isXML = file.name.toLowerCase().endsWith('.xml')

      if (isCSV) {
        // Use smart CSV parser
        smartParseResult = parseCSVSmart(fileContent)
        propertiesCount = smartParseResult.totalRows
      } else if (isExcel) {
        // NEW: Use Excel parser
        smartParseResult = await parseExcelFileFromBlob(file)
        propertiesCount = smartParseResult.totalRows
        
        console.log(`Excel parsing result: ${smartParseResult.validRows}/${smartParseResult.totalRows} valid rows, confidence: ${Math.round(smartParseResult.confidence * 100)}%`)
      } else if (isXML) {
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
      filePath: safeFileName,
      mappings: smartParseResult?.mappings || {},
      suggestions: smartParseResult?.suggestions || {},
      confidence: Math.round((smartParseResult?.confidence || 0) * 100),
      processingErrors,
      savedToDatabase
    }

    // Auto-regenerate XML/MD files and send compliance notification
    try {
      const { regenerateFilesForDeveloper } = await import('@/lib/file-regeneration')
      const regenerationResult = await regenerateFilesForDeveloper(sanitizeInput(userId))
      
      // Send compliance notification email if regeneration was successful
      if (regenerationResult.success && processingResult.recordsCount > 0) {
        try {
          const { data: developer } = await supabaseAdmin
            .from('developers')
            .select('*')
            .eq('id', sanitizeInput(userId))
            .single()
          
          if (developer) {
            await sendComplianceNotification(developer, processingResult.recordsCount)
          }
        } catch (emailError) {
          console.warn('Compliance notification email failed:', emailError)
          // Non-critical - don't fail the upload
        }
      }
      
      // Auto-regeneration completed (user details redacted for security)
    } catch (regenerationError) {
      console.error('Auto-regeneration failed:', regenerationError)
      // Don't fail the upload because of regeneration error
    }

    // SECURITY: Apply security headers to response
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Plik został pomyślnie przesłany i przetworzony',
        data: processingResult
      }),
      { status: 200, headers }
    )

  } catch (error) {
    console.error('Upload error:', error)
    
    // SECURITY: Apply security headers even to error responses
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));
    
    return new NextResponse(
      JSON.stringify({ error: 'Wystąpił błąd podczas przesyłania pliku' }),
      { status: 500, headers }
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

async function getDeveloperIdFromUser(user: any): Promise<string | null> {
  try {
    // Use the bridge table to get developer ID from Supabase auth user ID
    const { data: bridgeData } = await supabaseAdmin
      .rpc('get_developer_by_nextauth_user', { user_id: user.id })
      .single()
    
    return bridgeData?.developer_id || null
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