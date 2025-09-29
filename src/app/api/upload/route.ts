import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth, getDeveloperProfile } from '@/lib/supabase-single'

export async function POST(request: NextRequest) {
  console.log('🚀 SIMPLE UPLOAD: Starting file upload...')

  try {
    // Get authenticated user
    const user = await getServerAuth(request)

    if (!user) {
      console.log('❌ SIMPLE UPLOAD: No authenticated user')
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      )
    }

    console.log('✅ SIMPLE UPLOAD: User authenticated:', user.email)

    // Get developer profile
    const developer = await getDeveloperProfile(user.id)

    if (!developer) {
      console.log('❌ SIMPLE UPLOAD: No developer profile found')
      return NextResponse.json(
        { error: 'Developer profile not found' },
        { status: 404 }
      )
    }

    console.log('✅ SIMPLE UPLOAD: Developer profile found:', developer.client_id)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('📁 SIMPLE UPLOAD: File received:', file.name, file.size, 'bytes')

    // For now, just return success (you can add actual file processing here)
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      developer: developer.client_id,
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    })

  } catch (error) {
    console.error('💥 SIMPLE UPLOAD: Error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}