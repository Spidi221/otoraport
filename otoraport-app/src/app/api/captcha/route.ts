import { NextRequest, NextResponse } from 'next/server'
import { generateCaptcha, checkCaptchaRateLimit } from '@/lib/captcha'
import { generalAPIRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Rate limiting for CAPTCHA generation
    const rateLimitResult = await generalAPIRateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Zbyt wiele zapytań. Spróbuj ponownie później.' },
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

    // Get client IP for additional rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Additional CAPTCHA-specific rate limiting
    if (!checkCaptchaRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Zbyt wiele prób generowania CAPTCHA. Spróbuj ponownie za 5 minut.' },
        { status: 429 }
      )
    }

    const captcha = generateCaptcha()
    
    return NextResponse.json({
      success: true,
      challenge: {
        id: captcha.id,
        question: captcha.question
      }
    })

  } catch (error) {
    console.error('CAPTCHA generation error:', error)
    return NextResponse.json(
      { error: 'Błąd podczas generowania CAPTCHA' },
      { status: 500 }
    )
  }
}