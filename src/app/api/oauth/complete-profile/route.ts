import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase'
import { supabaseAdmin } from '@/lib/supabase-single'
import { validateRegistrationData } from '@/lib/input-validation'

interface CompleteProfileRequest {
  company_name: string
  nip: string
  phone?: string
  plan: 'basic' | 'pro' | 'enterprise'
  billing: 'monthly' | 'annual'
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request)
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CompleteProfileRequest = await request.json()
    
    // Validate input data
    const validationResult = validateRegistrationData({
      email: auth.user.email,
      name: auth.user.name || '',
      company_name: body.company_name,
      nip: body.nip,
      phone: body.phone || '',
      plan: body.plan,
      password: 'oauth_user' // Placeholder for validation
    })
    
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.errors },
        { status: 400 }
      )
    }

    const { company_name, nip, phone, plan, billing } = {
      ...validationResult.sanitized,
      plan: body.plan,
      billing: body.billing,
      phone: body.phone
    }

    // Clean NIP format
    const cleanNip = nip.replace(/\D/g, '')
    if (cleanNip.length !== 10) {
      return NextResponse.json(
        { error: 'NIP must be exactly 10 digits' },
        { status: 400 }
      )
    }

    // Check if NIP already exists
    const { data: existingDeveloper } = await supabaseAdmin
      .from('developers')
      .select('id, nip')
      .eq('nip', cleanNip)
      .single()

    if (existingDeveloper) {
      return NextResponse.json(
        { error: 'Company with this NIP is already registered' },
        { status: 409 }
      )
    }

    // Generate client ID for ministry URLs
    const clientId = `dev_${cleanNip}_${Date.now()}`
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    // Use existing developer from auth
    const developerId = auth.developer.id
    const isUpdate = auth.developer.registration_completed || false

    // Update existing developer profile
    const { error: updateError } = await supabaseAdmin
      .from('developers')
      .update({
        company_name: company_name.trim(),
        nip: cleanNip,
        phone: phone?.trim() || null,
        subscription_plan: plan,
        subscription_billing_period: billing,
        registration_completed: true,
        client_id: clientId,
        xml_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/public/${clientId}/data.xml`,
        md5_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/public/${clientId}/data.md5`,
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId)

    if (updateError) {
      console.error('Developer update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update developer profile' },
        { status: 500 }
      )
    }

    // Get the updated/created developer profile
    const { data: developerProfile } = await supabaseAdmin
      .from('developers')
      .select('id, company_name, subscription_plan, client_id, created_at')
      .eq('id', developerId)
      .single()

    // Create initial project (only if this is a new profile, not an update)
    if (!isUpdate) {
      await supabaseAdmin
        .from('projects')
        .insert({
          developer_id: developerId,
          name: `Projekt ${company_name}`,
          description: 'Default project created automatically',
          status: 'active',
          created_at: new Date().toISOString()
        })
    }

    return NextResponse.json({
      success: true,
      message: isUpdate ? 'Profile updated successfully' : 'Profile completed successfully',
      developer: {
        id: developerId,
        company_name: developerProfile?.company_name || company_name,
        plan: developerProfile?.subscription_plan || plan,
        client_id: developerProfile?.client_id || clientId,
        is_update: isUpdate
      }
    })

  } catch (error) {
    console.error('OAuth profile completion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}