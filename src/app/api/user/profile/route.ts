import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  company_name: z.string().min(1, 'Nazwa firmy jest wymagana').max(255).optional(),
  nip: z.string().regex(/^\d{10}$/, 'NIP musi składać się z 10 cyfr').optional(),
  regon: z.string().regex(/^\d{9}$|^\d{14}$/, 'REGON musi składać się z 9 lub 14 cyfr').optional(),
  krs_number: z.string().max(50).optional(),
  phone: z.string().max(50).optional(),
  website: z.string().url('Nieprawidłowy adres URL').optional().or(z.literal('')),
})

export async function GET() {
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

    // Create developer profile with trial
    // Note: trigger_set_trial_on_signup will automatically set trial_ends_at and trial_status
    const { data: newDeveloper, error: createError } = await supabase
      .from('developers')
      .insert({
        user_id: user.id,
        client_id: client_id,
        email: user.email!,
        company_name: user.user_metadata?.company_name || 'Moja Firma',
        nip: '0000000000', // Default - user can update later
        subscription_plan: 'basic', // Default plan (can be changed later)
        subscription_status: 'trialing', // Start with trial
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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)

    console.log('🔄 PROFILE UPDATE: Updating profile for user:', user.email)

    // Update developer profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('developers')
      .update(validatedData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ PROFILE UPDATE: Error:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ PROFILE UPDATE: Successfully updated profile')

    return NextResponse.json({
      success: true,
      developer: updatedProfile
    })

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Nieprawidłowe dane', details: error.errors },
        { status: 400 }
      )
    }

    console.error('💥 PROFILE UPDATE: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
