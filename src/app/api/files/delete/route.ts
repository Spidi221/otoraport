import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { deleteUploadedFile } from '@/lib/database'

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

    console.log(`🗑️ Deleting file ${fileId} for developer ${developer.id}`)

    // Delete file and associated properties (cascade delete handled in database.ts)
    const result = await deleteUploadedFile(fileId, developer.id)

    console.log(`✅ File ${fileId} deleted successfully (${result.deletedPropertiesCount} properties removed)`)

    // Revalidate dashboard path to refresh UI immediately
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      message: 'Plik został usunięty wraz z powiązanymi nieruchomościami',
      deletedPropertiesCount: result.deletedPropertiesCount
    })

  } catch (error) {
    console.error('❌ Error deleting file:', error)

    // Provide specific error messages based on error type
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete file'

    // Handle specific error cases
    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      )
    }

    if (errorMessage.includes('properties')) {
      return NextResponse.json(
        { error: 'Failed to delete associated properties', details: errorMessage },
        { status: 500 }
      )
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    )
  }
}