import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateCSRFToken } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate CSRF token using session ID
    const csrfToken = generateCSRFToken(session.user.id)
    
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