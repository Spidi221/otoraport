import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'
import { generateDeveloperWelcomeEmail } from '@/lib/email-templates'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/welcome-email
 * Sends welcome email to newly registered developer
 */
export async function POST(request: NextRequest) {
  try {
    const { developerId } = await request.json()

    if (!developerId) {
      return NextResponse.json(
        { error: 'Developer ID is required' },
        { status: 400 }
      )
    }

    // Fetch developer data
    const { data: developer, error: fetchError } = await createAdminClient()
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single()

    if (fetchError || !developer) {
      console.error('Failed to fetch developer:', fetchError)
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      )
    }

    // Generate welcome email
    const emailContent = generateDeveloperWelcomeEmail({
      id: developer.id,
      name: developer.company_name || developer.email.split('@')[0],
      company_name: developer.company_name || 'Twoja Firma',
      nip: developer.nip || '',
      email: developer.email,
      phone: developer.phone
    })

    // Send email
    const result = await sendEmail({
      to: developer.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    if (!result.success) {
      console.error('Failed to send welcome email:', result.error)
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }

    console.log(`✅ Welcome email sent to ${developer.email} (ID: ${result.id})`)

    return NextResponse.json({
      success: true,
      emailId: result.id,
      message: 'Welcome email sent successfully'
    })

  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
