import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request)

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const developer = auth.developer

    return NextResponse.json({
      client_id: developer.client_id
    })

  } catch (error) {
    console.error('Error getting client ID:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}