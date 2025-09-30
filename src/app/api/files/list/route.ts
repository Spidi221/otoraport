import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('📋 FILES LIST API: Fetching uploaded files...')

  try {
    // Create server client with proper SSR cookie handling
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ FILES LIST API: Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      )
    }

    console.log('✅ FILES LIST API: User authenticated:', user.email)

    // Get developer profile
    const { data: developer, error: profileError } = await supabase
      .from('developers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('❌ FILES LIST API: Profile query failed:', profileError.message)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!developer) {
      console.log('⚠️ FILES LIST API: No developer profile found')
      return NextResponse.json(
        { success: true, files: [] },
        { status: 200 }
      )
    }

    console.log('✅ FILES LIST API: Developer found:', developer.id)

    // Fetch uploaded files with project info
    const { data: files, error: filesError } = await supabase
      .from('uploaded_files')
      .select(`
        id,
        file_name,
        file_size,
        created_at,
        processed,
        processed_at,
        project:projects(id, name)
      `)
      .eq('developer_id', developer.id)
      .order('created_at', { ascending: false })

    if (filesError) {
      console.error('❌ FILES LIST API: Error fetching files:', filesError.message)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    console.log(`✅ FILES LIST API: Found ${files?.length || 0} files`)

    return NextResponse.json({
      success: true,
      files: files || []
    })

  } catch (error) {
    console.error('💥 FILES LIST API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
