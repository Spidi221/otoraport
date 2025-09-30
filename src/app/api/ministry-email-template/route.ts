import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'
import { generateMinistryNotificationEmail } from '@/lib/email-templates'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/ministry-email-template
 * Sends developer a ready-to-copy email template for ministry
 * Triggered when developer completes company data
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

    // Check if developer has complete data (NIP required)
    if (!developer.nip || !developer.company_name) {
      return NextResponse.json(
        { error: 'Developer data incomplete (NIP and company_name required)' },
        { status: 400 }
      )
    }

    // Generate ministry email template
    const ministryEmail = generateMinistryNotificationEmail({
      id: developer.id,
      name: developer.company_name || developer.email.split('@')[0],
      company_name: developer.company_name,
      nip: developer.nip,
      email: developer.email,
      phone: developer.phone
    })

    // Send email to developer with the ministry template
    const emailToSend = {
      to: developer.email,
      subject: '📧 Gotowy email do ministerstwa - OTORAPORT',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .template-box { background: #f9fafb; border: 2px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .copy-instructions { background: #dbeafe; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #2563eb; }
    .footer { border-top: 1px solid #e5e7eb; padding: 20px; text-align: center; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📧 Gotowy Email do Ministerstwa</h1>
    <p>OTORAPORT - Automatyzacja raportowania</p>
  </div>

  <div class="content">
    <h2>Witaj ${developer.company_name}!</h2>

    <p>Świetna wiadomość! Twoje dane zostały uzupełnione i system wygenerował dla Ciebie gotowy email do ministerstwa.</p>

    <div class="copy-instructions">
      <h3>📋 Instrukcja:</h3>
      <ol>
        <li><strong>Skopiuj</strong> poniższą wiadomość (zaznacz cały tekst i Ctrl+C / Cmd+C)</li>
        <li><strong>Wklej</strong> do swojego klienta pocztowego (Gmail, Outlook, itp.)</li>
        <li><strong>Wyślij</strong> na adres portalu dane.gov.pl: <strong>kontakt@dane.gov.pl</strong></li>
        <li><strong>Gotowe!</strong> Twoja firma jest teraz w pełni compliance</li>
      </ol>
    </div>

    <h3>👇 Email do skopiowania:</h3>

    <div class="template-box">
      <p><strong>DO:</strong> kontakt@dane.gov.pl</p>
      <p><strong>TEMAT:</strong> ${ministryEmail.subject}</p>
      <hr>
      <div style="margin-top: 15px;">
        ${ministryEmail.html}
      </div>
    </div>

    <div class="copy-instructions">
      <h3>ℹ️ Ważne informacje:</h3>
      <ul>
        <li>Twoje dane są automatycznie aktualizowane pod podanymi URL</li>
        <li>Nie musisz wysyłać ponownego emaila przy zmianie cen</li>
        <li>System OTORAPORT zajmie się resztą</li>
      </ul>
    </div>

    <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
      <h3 style="color: #92400e; margin-top: 0;">📧 ADRES EMAIL - Portal Dane.gov.pl</h3>
      <p style="font-size: 18px; font-weight: bold; color: #92400e; margin: 10px 0;">
        kontakt@dane.gov.pl
      </p>
      <p style="color: #78350f; margin-bottom: 0;">
        Proszę skopiować powyższą wiadomość i wysłać na ten adres email w celu zgłoszenia URL-i do systemu harvester.
      </p>
    </div>

    <p>W razie pytań skontaktuj się z nami: support@otoraport.pl</p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} OTORAPORT</p>
    <p>Email wygenerowany automatycznie: ${new Date().toLocaleString('pl-PL')}</p>
  </div>
</body>
</html>
      `,
      text: `
OTORAPORT - Gotowy Email do Ministerstwa

Witaj ${developer.company_name}!

Twoje dane zostały uzupełnione i system wygenerował dla Ciebie gotowy email do ministerstwa.

INSTRUKCJA:
1. Skopiuj poniższą wiadomość
2. Wklej do swojego klienta pocztowego
3. Wyślij na adres: kontakt@dane.gov.pl

--- EMAIL DO SKOPIOWANIA ---

DO: kontakt@dane.gov.pl
TEMAT: ${ministryEmail.subject}

${ministryEmail.text}

--- KONIEC EMAILA ---

WAŻNE:
- Twoje dane są automatycznie aktualizowane
- Nie musisz wysyłać ponownie przy zmianie cen
- System OTORAPORT zajmie się resztą

═══════════════════════════════════════════════════════

📧 ADRES EMAIL - Portal Dane.gov.pl

kontakt@dane.gov.pl

Proszę skopiować powyższą wiadomość i wysłać na ten adres email
w celu zgłoszenia URL-i do systemu harvester.

═══════════════════════════════════════════════════════

Pytania? support@otoraport.pl

---
© ${new Date().getFullYear()} OTORAPORT
      `
    }

    // Send email
    const result = await sendEmail(emailToSend)

    if (!result.success) {
      console.error('Failed to send ministry template email:', result.error)
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }

    console.log(`✅ Ministry template email sent to ${developer.email} (ID: ${result.id})`)

    return NextResponse.json({
      success: true,
      emailId: result.id,
      message: 'Ministry template email sent successfully'
    })

  } catch (error) {
    console.error('Ministry template email error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
