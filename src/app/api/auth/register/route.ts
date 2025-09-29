import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendDeveloperWelcomeEmail } from '@/lib/email-service'
import bcrypt from 'bcryptjs'
import { registrationRateLimit } from '@/lib/rate-limit'
import { verifyCaptcha } from '@/lib/captcha'
import { validateRegistrationData } from '@/lib/input-validation'
import { createSecureError } from '@/lib/error-handler'

interface RegisterRequest {
  email: string
  password: string
  name: string
  company_name: string
  nip: string
  phone: string
  plan: 'basic' | 'pro' | 'enterprise'
  captcha_id: string
  captcha_answer: string
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting for registration attempts
    const rateLimitResult = await registrationRateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Zbyt wiele prób rejestracji. Spróbuj ponownie później.', success: false },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      )
    }

    const body: RegisterRequest = await request.json()
    
    // SECURITY: Comprehensive input validation and sanitization
    const validationResult = validateRegistrationData(body)
    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          error: 'Dane zawierają błędy', 
          details: validationResult.errors,
          success: false 
        },
        { status: 400 }
      )
    }
    
    // Use sanitized data
    const { email, password, name, company_name, nip, plan, captcha_id, captcha_answer } = {
      ...validationResult.sanitized,
      password: body.password, // Password not sanitized
      captcha_id: body.captcha_id,
      captcha_answer: body.captcha_answer
    }

    // SECURITY: Verify CAPTCHA before proceeding
    if (!captcha_id || !captcha_answer) {
      return NextResponse.json(
        { error: 'Wymagana weryfikacja CAPTCHA', success: false },
        { status: 400 }
      )
    }

    if (!verifyCaptcha(captcha_id, captcha_answer)) {
      return NextResponse.json(
        { error: 'Nieprawidłowa odpowiedź na pytanie weryfikacyjne', success: false },
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

    // SECURITY: Enhanced password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Hasło musi mieć co najmniej 8 znaków', success: false },
        { status: 400 }
      )
    }
    
    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        { error: 'Hasło musi zawierać wielkie litery, małe litery i cyfry', success: false },
        { status: 400 }
      )
    }
    
    // Check for common weak passwords
    const commonPasswords = ['12345678', 'password', 'qwerty123', 'admin123']
    if (commonPasswords.includes(password.toLowerCase())) {
      return NextResponse.json(
        { error: 'Hasło jest zbyt proste. Wybierz silniejsze hasło.', success: false },
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
    const { data: existingUser } = await createAdminClient()
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
    const { data: existingCompany } = await createAdminClient()
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

    // SECURITY: Hash password with stronger salt rounds
    const hashedPassword = await bcrypt.hash(password, 14)

    // Generate unique client ID for ministry URLs
    const clientId = `dev_${cleanNip}_${Date.now()}`

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    // Create user record in developers table
    const { data: newDeveloper, error: insertError } = await createAdminClient()
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
        md5_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/public/${clientId}/data.md5`,
        
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
    const { error: projectError } = await createAdminClient()
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
    console.log('New developer registered successfully')

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
    
    // SECURITY: Use secure error handler
    const secureError = createSecureError(error, 'Wystąpił nieoczekiwany błąd podczas rejestracji. Spróbuj ponownie.', 'REGISTRATION')
    
    return NextResponse.json(
      { 
        error: secureError.error,
        code: secureError.code,
        success: false 
      },
      { status: 500 }
    )
  }
}