import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  generateMinistryRegistrationEmail, 
  generateMinistryFollowUpEmail,
  generateMinistryDataErrorEmail 
} from '@/lib/ministry-email-templates'
import { checkRateLimit, applySecurityHeaders, sanitizeInput } from '@/lib/security'

interface GenerateEmailRequest {
  type: 'registration' | 'follow-up' | 'error'
  developerId?: string
  errors?: string[]
  daysSinceRegistration?: number
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting
    const rateLimitResult = await checkRateLimit(request, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // Max 5 email generations per 15 minutes
    });

    if (!rateLimitResult.allowed) {
      const headers = applySecurityHeaders(new Headers({
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      }));
      
      return new NextResponse(
        JSON.stringify({ error: 'Za dużo żądań. Spróbuj ponownie później.' }),
        { status: 429, headers }
      );
    }

    // Check authentication
    const auth = await getAuthenticatedDeveloper(request)
    if (!auth.success || !auth.user || !auth.developer) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: auth.error || 'Unauthorized' }),
        { status: 401, headers }
      );
    }

    const body: GenerateEmailRequest = await request.json()
    const { type, developerId, errors, daysSinceRegistration } = body

    // Get current developer from auth
    let targetDeveloperId = developerId || auth.developer.id

    // Get full developer data
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('id', sanitizeInput(targetDeveloperId))
      .single()

    if (!developer) {
      const headers = applySecurityHeaders(new Headers());
      return new NextResponse(
        JSON.stringify({ error: 'Developer not found' }),
        { status: 404, headers }
      );
    }

    // Prepare developer data for template
    const developerData = {
      company_name: developer.company_name || 'Nazwa firmy',
      name: developer.name || 'Imię Nazwisko',
      email: developer.email,
      phone: developer.phone,
      nip: developer.nip,
      krs: developer.krs,
      regon: developer.regon,
      legal_form: developer.legal_form,
      headquarters_address: developer.headquarters_address,
      client_id: developer.client_id || `dev_${developer.nip}_${Date.now()}`,
      xml_url: developer.xml_url || `${process.env.NEXTAUTH_URL}/api/public/${developer.client_id}/data.xml`,
      md5_url: developer.md5_url || `${process.env.NEXTAUTH_URL}/api/public/${developer.client_id}/data.md5`
    }

    let emailTemplate
    
    switch (type) {
      case 'registration':
        emailTemplate = generateMinistryRegistrationEmail(developerData)
        break
        
      case 'follow-up':
        const days = daysSinceRegistration || 7
        emailTemplate = generateMinistryFollowUpEmail(developerData, days)
        break
        
      case 'error':
        const errorList = errors || ['Nieznany błąd walidacji danych']
        emailTemplate = generateMinistryDataErrorEmail(developerData, errorList)
        break
        
      default:
        const headers = applySecurityHeaders(new Headers());
        return new NextResponse(
          JSON.stringify({ error: 'Invalid email type' }),
          { status: 400, headers }
        );
    }

    console.log(`Generated ministry ${type} email for: ${developer.company_name}`)

    // SECURITY: Apply security headers to response
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        success: true,
        emailTemplate,
        preview: {
          to: emailTemplate.to,
          subject: emailTemplate.subject,
          bodyPreview: emailTemplate.body.substring(0, 200) + '...'
        }
      }),
      { status: 200, headers }
    )

  } catch (error) {
    console.error('Ministry email generation error:', error)
    
    // SECURITY: Apply security headers even to error responses
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));
    
    return new NextResponse(
      JSON.stringify({ error: 'Wystąpił błąd podczas generowania emaila' }),
      { status: 500, headers }
    )
  }
}