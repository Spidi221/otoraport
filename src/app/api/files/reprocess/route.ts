import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parseCSVSmart } from '@/lib/smart-csv-parser'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get developer profile
    const { data: developer, error: profileError } = await supabase
      .from('developers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !developer) {
      return NextResponse.json(
        { error: 'Developer profile not found' },
        { status: 404 }
      )
    }

    // Get fileId from request body
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Re-processing file ${fileId} for developer ${developer.id}`)

    // Get file record with stored content
    const { data: fileRecord, error: fileError } = await createAdminClient()
      .from('uploaded_files')
      .select('*')
      .eq('id', fileId)
      .eq('developer_id', developer.id)
      .single()

    if (fileError || !fileRecord) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      )
    }

    // Check if file has stored content (file_path or raw content)
    if (!fileRecord.file_content && !fileRecord.file_path) {
      return NextResponse.json(
        { error: 'File content not available for reprocessing. Please upload the file again.' },
        { status: 400 }
      )
    }

    // Delete existing properties from this file's project
    if (fileRecord.project_id) {
      const { error: deleteError } = await createAdminClient()
        .from('properties')
        .delete()
        .eq('project_id', fileRecord.project_id)

      if (deleteError) {
        console.error('Error deleting old properties:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete old properties' },
          { status: 500 }
        )
      }
    }

    // Parse the file content again
    const fileContent = fileRecord.file_content || ''

    if (!fileContent) {
      return NextResponse.json(
        { error: 'File content is empty. Cannot reprocess.' },
        { status: 400 }
      )
    }

    const smartParseResult = parseCSVSmart(fileContent)

    console.log(`✅ Re-parsed: ${smartParseResult.validRows}/${smartParseResult.totalRows} valid rows`)

    // Save new properties to database
    if (smartParseResult.data && smartParseResult.data.length > 0) {
      const propertiesToInsert = smartParseResult.data.map(property => ({
        project_id: fileRecord.project_id,
        raw_data: property
      }))

      const { error: insertError } = await createAdminClient()
        .from('properties')
        .insert(propertiesToInsert)

      if (insertError) {
        console.error('Error inserting properties:', insertError)
        return NextResponse.json(
          { error: 'Failed to save reprocessed properties' },
          { status: 500 }
        )
      }

      console.log(`✅ Saved ${propertiesToInsert.length} properties`)
    }

    // Update file record
    await createAdminClient()
      .from('uploaded_files')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', fileId)

    return NextResponse.json({
      success: true,
      message: `Plik został ponownie przetworzony. ${smartParseResult.validRows} rekordów zapisanych.`,
      data: {
        totalRows: smartParseResult.totalRows,
        validRows: smartParseResult.validRows,
        savedCount: smartParseResult.data?.length || 0
      }
    })

  } catch (error) {
    console.error('Error reprocessing file:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reprocess file' },
      { status: 500 }
    )
  }
}