import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - no valid session' },
        { status: 401 }
      )
    }

    const body: CompleteProfileRequest = await request.json()
    
    // Validate input data
    const validationResult = validateRegistrationData({
      email: session.user.email,
      name: session.user.name || '',
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

    // Check if user already has a developer profile via bridge table
    const { data: existingBridge } = await supabaseAdmin
      .from('user_developer_bridge')
      .select(`
        developer_id,
        developers (
          id, 
          registration_completed, 
          company_name, 
          nip
        )
      `)
      .eq('nextauth_user_id', session.user.id)
      .single()

    let developerId: string
    let isUpdate = false

    if (existingBridge?.developer_id) {
      // Update existing developer profile
      developerId = existingBridge.developer_id
      isUpdate = true
      
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
    } else {
      // Create new developer profile (this should not happen if trigger worked)
      const { data: newDeveloper, error: developerError } = await supabaseAdmin
        .from('developers')
        .insert({
          email: session.user.email.toLowerCase(),
          name: session.user.name || '',
          company_name: company_name.trim(),
          nip: cleanNip,
          phone: phone?.trim() || null,
          subscription_plan: plan,
          subscription_billing_period: billing,
          subscription_status: 'trial',
          client_id: clientId,
          oauth_provider: session.user.provider || 'google',
          registration_completed: true,
          xml_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/public/${clientId}/data.xml`,
          md5_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/public/${clientId}/data.md5`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (developerError) {
        console.error('Developer creation error:', developerError)
        return NextResponse.json(
          { error: 'Failed to create developer profile' },
          { status: 500 }
        )
      }

      developerId = newDeveloper.id

      // Create bridge record
      const { error: bridgeError } = await supabaseAdmin
        .from('user_developer_bridge')
        .insert({
          nextauth_user_id: session.user.id,
          developer_id: developerId
        })

      if (bridgeError) {
        console.error('Bridge creation error:', bridgeError)
        // Continue, might already exist
      }
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