import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ PROFILE API: No authenticated user')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ PROFILE API: User authenticated:', user.email)

    // Try to get existing developer profile
    const { data: developer, error: fetchError } = await supabase
      .from('developers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('❌ PROFILE API: Database error:', fetchError.message)
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    // If developer profile exists, return it
    if (developer) {
      console.log('✅ PROFILE API: Profile found:', developer.client_id)
      return NextResponse.json({
        success: true,
        developer
      })
    }

    // Profile doesn't exist - create it
    console.log('🔨 PROFILE API: Creating new profile for:', user.email)

    // Generate client_id using database function
    const { data: clientIdData } = await supabase.rpc('generate_client_id')
    const client_id = clientIdData || `dev_${Math.random().toString(36).substring(2, 15)}`

    // Create developer profile
    const { data: newDeveloper, error: createError } = await supabase
      .from('developers')
      .insert({
        user_id: user.id,
        client_id: client_id,
        email: user.email!,
        company_name: user.user_metadata?.company_name || 'Moja Firma',
        nip: '0000000000', // Default - user can update later
        subscription_plan: 'trial',
        subscription_status: 'active',
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ PROFILE API: Failed to create profile:', createError.message)
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      )
    }

    console.log('✅ PROFILE API: Profile created:', newDeveloper.client_id)

    return NextResponse.json({
      success: true,
      developer: newDeveloper
    })
  } catch (error) {
    console.error('💥 PROFILE API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
