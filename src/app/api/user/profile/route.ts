import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth, getDeveloperProfile, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getServerAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create developer profile
    let developer = await getDeveloperProfile(user.id)

    // If no profile exists, create one automatically
    if (!developer) {
      console.log('🔧 PROFILE API: Creating new developer profile for:', user.email)

      const clientId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const { data: newDeveloper, error: createError } = await createAdminClient()
        .from('developers')
        .insert({
          user_id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || user.email!.split('@')[0],
          company_name: user.user_metadata?.company_name || 'My Company',
          client_id: clientId,
          subscription_plan: 'basic',
          subscription_status: 'trial'
        })
        .select()
        .single()

      if (createError || !newDeveloper) {
        console.error('❌ PROFILE API: Failed to create profile:', createError?.message)
        return NextResponse.json(
          { success: false, error: 'Failed to create profile' },
          { status: 500 }
        )
      }

      developer = newDeveloper
      console.log('✅ PROFILE API: Profile created:', developer.client_id)
    }

    // Return developer profile
    return NextResponse.json({
      success: true,
      developer: {
        id: developer.id,
        user_id: developer.user_id,
        email: developer.email,
        name: developer.name,
        company_name: developer.company_name,
        client_id: developer.client_id,
        subscription_plan: developer.subscription_plan,
        subscription_status: developer.subscription_status,
        created_at: developer.created_at
      }
    })

  } catch (error) {
    console.error('Error checking user profile:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        profile_completed: false,
        reason: 'server_error'
      },
      { status: 500 }
    )
  }
}