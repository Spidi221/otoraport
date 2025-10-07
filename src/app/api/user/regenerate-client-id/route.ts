/**
 * REGENERATE CLIENT ID API
 * POST /api/user/regenerate-client-id
 * Generates a new client_id for the authenticated user
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
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

    console.log('🔄 REGENERATE CLIENT ID: Starting for user:', user.email)

    // Generate new client_id using database function
    const { data: clientIdData, error: generateError } = await supabase.rpc('generate_client_id')

    if (generateError || !clientIdData) {
      console.error('❌ REGENERATE CLIENT ID: Failed to generate:', generateError)
      return NextResponse.json(
        { success: false, error: 'Failed to generate client ID' },
        { status: 500 }
      )
    }

    const newClientId = clientIdData

    // Update developer profile with new client_id
    const { data: updatedProfile, error: updateError } = await supabase
      .from('developers')
      .update({
        client_id: newClientId,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ REGENERATE CLIENT ID: Update error:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ REGENERATE CLIENT ID: Successfully updated to:', newClientId.substring(0, 8) + '****')

    return NextResponse.json({
      success: true,
      client_id: newClientId,
      message: 'Client ID został pomyślnie zaktualizowany'
    })

  } catch (error) {
    console.error('💥 REGENERATE CLIENT ID: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
