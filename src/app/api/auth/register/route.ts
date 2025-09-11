import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendDeveloperWelcomeEmail } from '@/lib/email-service'
import bcrypt from 'bcryptjs'

interface RegisterRequest {
  email: string
  password: string
  name: string
  company_name: string
  nip: string
  phone: string
  plan: 'basic' | 'pro' | 'enterprise'
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    
    // Validate required fields
    const { email, password, name, company_name, nip, plan } = body
    
    if (!email || !password || !name || !company_name || !nip || !plan) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione', success: false },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy format adresu email', success: false },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Hasło musi mieć co najmniej 8 znaków', success: false },
        { status: 400 }
      )
    }

    // Validate NIP format (10 digits)
    const cleanNip = nip.replace(/\D/g, '')
    if (cleanNip.length !== 10) {
      return NextResponse.json(
        { error: 'NIP musi zawierać dokładnie 10 cyfr', success: false },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('developers')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Użytkownik z tym adresem email już istnieje', success: false },
        { status: 409 }
      )
    }

    // Check if company with NIP already exists
    const { data: existingCompany } = await supabaseAdmin
      .from('developers')
      .select('id, nip')
      .eq('nip', cleanNip)
      .single()

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Firma z tym numerem NIP jest już zarejestrowana', success: false },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate unique client ID for ministry URLs
    const clientId = `dev_${cleanNip}_${Date.now()}`

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    // Create user record in developers table
    const { data: newDeveloper, error: insertError } = await supabaseAdmin
      .from('developers')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        name: name.trim(),
        company_name: company_name.trim(),
        nip: cleanNip,
        phone: body.phone?.trim() || null,
        subscription_plan: plan,
        subscription_status: 'trial',
        subscription_end_date: trialEndDate.toISOString(),
        client_id: clientId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Ministry compliance URLs
        xml_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/public/${clientId}/data.xml`,
        md_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/public/${clientId}/data.md`,
        
        // Trial settings
        trial_started_at: new Date().toISOString(),
        onboarding_completed: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Wystąpił błąd podczas tworzenia konta. Spróbuj ponownie.', success: false },
        { status: 500 }
      )
    }

    // Create initial project for the developer (optional - helps with onboarding)
    const { error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        developer_id: newDeveloper.id,
        name: `Projekt ${company_name}`,
        description: 'Domyślny projekt utworzony automatycznie',
        status: 'active',
        created_at: new Date().toISOString()
      })

    if (projectError) {
      console.warn('Warning: Could not create default project:', projectError)
      // Non-critical error - don't fail the registration
    }

    // Send welcome email
    try {
      const emailResult = await sendDeveloperWelcomeEmail(newDeveloper)
      if (!emailResult.success) {
        console.warn('Welcome email failed:', emailResult.error)
        // Non-critical - don't fail registration
      }
    } catch (emailError) {
      console.warn('Welcome email error:', emailError)
      // Non-critical - don't fail registration
    }

    // Log successful registration (for analytics)
    console.log(`New developer registered: ${email} (${company_name}) - Plan: ${plan}`)

    // Return success response (excluding sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Konto zostało utworzone pomyślnie!',
      user: {
        id: newDeveloper.id,
        email: newDeveloper.email,
        name: newDeveloper.name,
        company_name: newDeveloper.company_name,
        subscription_plan: newDeveloper.subscription_plan,
        subscription_status: newDeveloper.subscription_status,
        trial_end_date: newDeveloper.subscription_end_date,
        client_id: newDeveloper.client_id,
        ministry_urls: {
          xml: newDeveloper.xml_url,
          md: newDeveloper.md_url
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    return NextResponse.json(
      { 
        error: 'Wystąpił nieoczekiwany błąd podczas rejestracji. Spróbuj ponownie.', 
        success: false 
      },
      { status: 500 }
    )
  }
}