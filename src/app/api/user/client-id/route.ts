import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get developer record by email
    const { data: developer, error } = await supabaseAdmin
      .from('developers')
      .select('client_id')
      .eq('email', session.user.email)
      .single()

    if (error || !developer) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      )
    }

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