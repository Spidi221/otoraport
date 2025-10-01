import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get developer profile with client_id
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('client_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (devError || !developer) {
      return NextResponse.json(
        { error: 'Developer profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      client_id: developer.client_id
    })

  } catch (error) {
    console.error('Error fetching client ID:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
