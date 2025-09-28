import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase'
import { generateCSRFToken } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request)

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate CSRF token using user ID
    const csrfToken = generateCSRFToken(auth.user.id)
    
    return NextResponse.json({
      csrfToken,
      expiresIn: 3600 // 1 hour
    })

  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}