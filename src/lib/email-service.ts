// Email service using Resend for OTO-RAPORT notifications
import { Resend } from 'resend'
import { Database } from './supabase/server'

type Developer = Database['public']['Tables']['developers']['Row']

// Validate required environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY
export const EMAIL_FROM = process.env.EMAIL_FROM || 'OTO-RAPORT <noreply@oto-raport.pl>'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://oto-raport.vercel.app'
const MINISTRY_EMAIL = process.env.MINISTRY_EMAIL || 'kontakt@dane.gov.pl'

if (!RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY not configured - email sending will fail')
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * Check if developer has email notifications enabled
 */
async function checkEmailPreferences(developerEmail: string): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase/server')
    const supabase = await createClient()

    const { data: developer } = await supabase
      .from('developers')
      .select('email_notifications_enabled')
      .eq('email', developerEmail)
      .single()

    // If developer not found or email_notifications_enabled is null, default to true
    return developer?.email_notifications_enabled !== false
  } catch (error) {
    console.error('[Email] Error checking preferences:', error)
    // Default to sending emails if we can't check preferences
    return true
  }
}

/**
 * Log failed email attempt
 */
async function logEmailFailure(
  recipientEmail: string,
  subject: string,
  error: string
) {
  try {
    console.error('[Email] Failed send:', {
      timestamp: new Date().toISOString(),
      recipient: recipientEmail,
      subject,
      error
    })

    // Could also save to database or external logging service like Sentry
    // For now, just console logging
  } catch (logError) {
    console.error('[Email] Failed to log email failure:', logError)
  }
}

/**
 * Send email using Resend service
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = EMAIL_FROM,
  skipOptOutCheck = false
}: {
  to: string | string[]
  subject: string
  html: string
  text: string
  from?: string
  skipOptOutCheck?: boolean // Set to true for transactional emails that should always be sent
}) {
  // Check if Resend is configured
  if (!resend) {
    console.error('[Email] RESEND_API_KEY not configured')
    await logEmailFailure(
      Array.isArray(to) ? to.join(', ') : to,
      subject,
      'Email service not configured'
    )
    return {
      success: false,
      error: 'Email service not configured'
    }
  }

  // Check opt-out preferences (unless skipOptOutCheck is true)
  if (!skipOptOutCheck) {
    const recipientEmail = Array.isArray(to) ? to[0] : to
    const hasOptedIn = await checkEmailPreferences(recipientEmail)

    if (!hasOptedIn) {
      console.log('[Email] User has opted out of emails:', recipientEmail)
      return {
        success: false,
        error: 'User has opted out of email notifications'
      }
    }
  }

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text
    })

    console.log('[Email] Sent successfully:', result.data?.id)
    return { success: true, id: result.data?.id }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Email] Sending failed:', error)

    // Log the failure
    await logEmailFailure(
      Array.isArray(to) ? to.join(', ') : to,
      subject,
      errorMessage
    )

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Send ministry registration email
 */
export async function sendMinistryRegistrationEmail(developer: Developer) {
  const xmlUrl = `${APP_URL}/api/public/${developer.client_id}/data.xml`
  const mdUrl = `${APP_URL}/api/public/${developer.client_id}/data.md5`
  
  const subject = `Zgłoszenie dewelopera do systemu raportowania cen - ${developer.company_name || developer.name}`
  
  const html = `
    <h1>OTO-RAPORT - System automatycznego raportowania cen mieszkań</h1>
    
    <p>Dzień dobry,</p>
    
    <p><strong>${developer.company_name || developer.name}</strong> zgłasza się do systemu automatycznego raportowania cen mieszkań zgodnie z wymogami ustawy z dnia 21 maja 2025 r.</p>
    
    <h3>Dane dewelopera:</h3>
    <ul>
      <li>Nazwa firmy: ${developer.company_name || 'Nie podano'}</li>
      <li>Imię i nazwisko: ${developer.name}</li>
      <li>NIP: ${developer.nip || 'Nie podano'}</li>
      <li>Email: ${developer.email}</li>
      <li>Telefon: ${developer.phone || 'Nie podano'}</li>
    </ul>
    
    <h3>Adresy URL do pobierania danych:</h3>
    <p><strong>XML (schema 1.13):</strong> <a href="${xmlUrl}">${xmlUrl}</a></p>
    <p><strong>Markdown:</strong> <a href="${mdUrl}">${mdUrl}</a></p>
    
    <p>Prosimy o potwierdzenie rejestracji w systemie harvestera danych.</p>
    
    <p>Pozdrawiam,<br>${developer.name}</p>
  `
  
  const text = `
OTO-RAPORT - System automatycznego raportowania cen mieszkań

${developer.company_name || developer.name} zgłasza się do systemu automatycznego raportowania cen mieszkań.

Dane dewelopera:
- Nazwa: ${developer.company_name || 'Nie podano'}
- Kontakt: ${developer.name}
- Email: ${developer.email}

Adresy URL:
XML: ${xmlUrl}
Markdown: ${mdUrl}

Prosimy o potwierdzenie rejestracji.

${developer.name}
  `

  const ministryEmail = MINISTRY_EMAIL
  
  return await sendEmail({
    to: ministryEmail,
    subject,
    html,
    text
  })
}

/**
 * Send welcome email to developer
 */
export async function sendDeveloperWelcomeEmail(developer: Developer) {
  const dashboardUrl = `${APP_URL}/dashboard`
  const planType = developer.subscription_plan || 'trial'
  
  const subject = `Witamy w OTO-RAPORT! Twoje konto ${planType} jest aktywne`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Witaj w OTO-RAPORT</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTO-RAPORT</h1>
        <p style="color: #666; font-size: 16px;">Automatyzacja compliance dla deweloperów</p>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #1e293b; margin-top: 0;">Witaj, ${developer.name}! 👋</h2>
        
        <p>Dziękujemy za dołączenie do OTO-RAPORT. Twoje konto <strong>${planType}</strong> zostało pomyślnie utworzone i możesz rozpocząć korzystanie z platformy.</p>
        
        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #2563eb; margin-top: 0; font-size: 18px;">🚀 Następne kroki:</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><strong>Wgraj dane nieruchomości</strong> - używaj plików CSV lub XML</li>
            <li style="margin-bottom: 8px;"><strong>Sprawdź compliance</strong> - automatyczne generowanie XML/MD</li>
            <li style="margin-bottom: 8px;"><strong>Skonfiguruj powiadomienia</strong> - bądź na bieżąco</li>
            ${planType === 'pro' || planType === 'enterprise' ? 
              '<li style="margin-bottom: 8px;"><strong>Wygeneruj stronę prezentacyjną</strong> - pokaż ofertę klientom</li>' : 
              ''
            }
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Przejdź do dashboardu
          </a>
        </div>
      </div>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">⚠️ Ważne - Ustawa z 21 maja 2025</h3>
        <p style="margin-bottom: 0; color: #78350f; font-size: 14px;">
          Pamiętaj o obowiązku raportowania cen nieruchomości zgodnie z nową ustawą. 
          OTO-RAPORT automatyzuje ten proces, ale dane muszą być aktualne i kompletne.
        </p>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280;">
        <p><strong>Potrzebujesz pomocy?</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>📧 Email: <a href="mailto:support@oto-raport.pl" style="color: #2563eb;">support@oto-raport.pl</a></li>
          <li>📚 Dokumentacja: <a href="${APP_URL}/docs" style="color: #2563eb;">oto-raport.pl/docs</a></li>
          <li>💬 Chat: Dostępny w panelu użytkownika</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #9ca3af;">
        <p>OTO-RAPORT.pl - Compliance made simple</p>
        <p>Ten email został wysłany automatycznie. Nie odpowiadaj na tę wiadomość.</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
Witaj w OTO-RAPORT, ${developer.name}!

Twoje konto ${planType} zostało pomyślnie utworzone.

Następne kroki:
1. Wgraj dane nieruchomości (CSV/XML)
2. Sprawdź compliance (automatyczne XML/MD)  
3. Skonfiguruj powiadomienia
${planType === 'pro' || planType === 'enterprise' ? '4. Wygeneruj stronę prezentacyjną' : ''}

Przejdź do dashboardu: ${dashboardUrl}

WAŻNE: Pamiętaj o obowiązku raportowania zgodnie z ustawą z 21 maja 2025.

Potrzebujesz pomocy?
- Email: support@oto-raport.pl
- Dokumentacja: oto-raport.pl/docs

OTO-RAPORT.pl - Compliance made simple
  `
  
  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}

/**
 * Send trial expiry warning email
 */
export async function sendTrialExpiryWarning(developer: Developer, daysLeft: number) {
  const subject = `⏰ Twój trial OTO-RAPORT wygasa za ${daysLeft} dni`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Trial wygasa za ${daysLeft} dni</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTO-RAPORT</h1>
      </div>

      <div style="background: #fef2f2; border: 2px solid #f87171; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #dc2626; margin-top: 0;">⏰ Twój trial wygasa za ${daysLeft} dni</h2>
        
        <p>Witaj ${developer.name},</p>
        
        <p>Twój 14-dniowy okres próbny OTO-RAPORT wygasa za <strong>${daysLeft} dni</strong>. 
        Aby zachować dostęp do platformy i compliance z ministerstwem, wybierz plan odpowiedni dla Twojej firmy.</p>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-top: 0;">📊 Dostępne pakiety:</h3>
        
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px;">
            <h4 style="color: #2563eb; margin-top: 0;">Basic - 149 zł/mies</h4>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
              <li>Do 2 projektów deweloperskich</li>
              <li>Nieograniczona liczba nieruchomości</li>
              <li>Automatyczne XML/MD dla ministerstwa</li>
              <li>Email powiadomienia</li>
            </ul>
          </div>
          
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; border-radius: 6px; padding: 20px; position: relative;">
            <div style="position: absolute; top: -10px; right: 10px; background: #16a34a; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
              POLECANE
            </div>
            <h4 style="margin-top: 0; color: white;">Pro - 249 zł/mies</h4>
            <ul style="margin: 0; padding-left: 20px; opacity: 0.9;">
              <li>Do 10 projektów deweloperskich</li>
              <li>Strony prezentacyjne dla klientów</li>
              <li>Zaawansowana analityka</li>
              <li>Priorytetowe wsparcie</li>
            </ul>
          </div>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px;">
            <h4 style="color: #7c3aed; margin-top: 0;">Enterprise - 399 zł/mies</h4>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
              <li>Nieograniczona liczba projektów</li>
              <li>Custom domeny</li>
              <li>API access</li>
              <li>White-label rozwiązania</li>
            </ul>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/pricing" style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Wybierz plan i kontynuuj
          </a>
        </div>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280; text-align: center;">
        <p>Masz pytania? Skontaktuj się z nami: <a href="mailto:support@oto-raport.pl" style="color: #2563eb;">support@oto-raport.pl</a></p>
      </div>
    </body>
    </html>
  `

  const text = `
⏰ Twój trial OTO-RAPORT wygasa za ${daysLeft} dni

Witaj ${developer.name},

Twój 14-dniowy trial kończy się za ${daysLeft} dni. Wybierz plan:

BASIC - 149 zł/mies
- Do 2 projektów
- Nieograniczona liczba nieruchomości  
- XML/MD compliance
- Email powiadomienia

PRO - 249 zł/mies (POLECANE)
- Do 10 projektów
- Strony prezentacyjne
- Zaawansowana analityka
- Priorytetowe wsparcie

ENTERPRISE - 399 zł/mies
- Nieograniczone projekty
- Custom domeny
- API access  
- White-label

Wybierz plan: ${APP_URL}/pricing

Pytania? support@oto-raport.pl
  `

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}

/**
 * Send compliance report notification
 */
export async function sendComplianceNotification(
  developer: Developer,
  propertiesCount: number
) {
  const xmlUrl = `${APP_URL}/api/public/${developer.client_id}/data.xml`
  const mdUrl = `${APP_URL}/api/public/${developer.client_id}/data.md5`
  
  const subject = '✅ Raport compliance OTO-RAPORT został wygenerowany'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Raport compliance gotowy</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #15803d; margin-top: 0;">✅ Raport compliance gotowy!</h2>
        
        <p>Witaj ${developer.name},</p>
        
        <p>Twój automatyczny raport compliance został pomyślnie wygenerowany dla <strong>${propertiesCount} nieruchomości</strong>.</p>
        
        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #15803d; margin-top: 0;">📋 Dostępne formaty:</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="${xmlUrl}" style="display: inline-block; background: #f0fdf4; color: #15803d; padding: 10px 16px; text-decoration: none; border-radius: 4px; border: 1px solid #16a34a;">
              📄 Pobierz raport XML
            </a>
            <a href="${mdUrl}" style="display: inline-block; background: #f0fdf4; color: #15803d; padding: 10px 16px; text-decoration: none; border-radius: 4px; border: 1px solid #16a34a;">
              📝 Pobierz raport MD
            </a>
          </div>
        </div>
      </div>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">📅 Następna aktualizacja</h3>
        <p style="margin-bottom: 0; color: #78350f; font-size: 14px;">
          Raporty są generowane automatycznie po każdej aktualizacji danych. 
          Ministerstwo ma stały dostęp do aktualnych informacji przez nasze API.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Zobacz dashboard
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280; text-align: center;">
        <p>OTO-RAPORT.pl - Automatyczny compliance dla deweloperów</p>
      </div>
    </body>
    </html>
  `

  const text = `
✅ Raport compliance OTO-RAPORT gotowy!

Witaj ${developer.name},

Raport dla ${propertiesCount} nieruchomości został wygenerowany:

XML: ${xmlUrl}
MD: ${mdUrl}

Raporty są dostępne 24/7 dla ministerstwa przez nasze API.

Dashboard: ${APP_URL}/dashboard

OTO-RAPORT.pl - Automatyczny compliance
  `

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}

/**
 * Send upload error email
 */
export async function sendUploadErrorEmail(
  developer: Developer,
  uploadData: {
    fileName: string
    errorMessage: string
    errorDetails?: string
  }
) {
  const dashboardUrl = `${APP_URL}/dashboard`
  const supportEmail = 'support@oto-raport.pl'

  const subject = `❌ Błąd podczas przetwarzania pliku "${uploadData.fileName}"`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Błąd przetwarzania pliku</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTO-RAPORT</h1>
      </div>

      <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #dc2626; margin-top: 0;">❌ Błąd przetwarzania pliku</h2>

        <p>Witaj ${developer.name},</p>

        <p>Niestety, wystąpił błąd podczas przetwarzania pliku <strong>"${uploadData.fileName}"</strong>.</p>

        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">⚠️ Szczegóły błędu:</h3>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 10px 0; font-family: monospace; font-size: 13px;">
            ${uploadData.errorMessage}
          </div>
          ${uploadData.errorDetails ? `
          <div style="margin-top: 10px; font-size: 14px; color: #6b7280;">
            <strong>Dodatkowe informacje:</strong><br>
            ${uploadData.errorDetails}
          </div>
          ` : ''}
        </div>
      </div>

      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #0369a1; margin-top: 0; font-size: 16px;">💡 Możliwe rozwiązania:</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #075985; font-size: 14px;">
          <li style="margin-bottom: 8px;">Sprawdź format pliku (CSV lub Excel zgodny z szablonem ministerstwa)</li>
          <li style="margin-bottom: 8px;">Upewnij się, że plik zawiera wymagane kolumny</li>
          <li style="margin-bottom: 8px;">Sprawdź kodowanie znaków (UTF-8)</li>
          <li style="margin-bottom: 8px;">Usuń puste wiersze i nieprawidłowe wartości</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 10px;">
          Spróbuj ponownie
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280;">
        <p><strong>Potrzebujesz pomocy?</strong></p>
        <p>Skontaktuj się z naszym zespołem wsparcia: <a href="mailto:${supportEmail}" style="color: #2563eb;">${supportEmail}</a></p>
      </div>

      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
        <p>OTO-RAPORT.pl - Automatyczny compliance dla deweloperów</p>
      </div>
    </body>
    </html>
  `

  const text = `
❌ Błąd podczas przetwarzania pliku "${uploadData.fileName}"

Witaj ${developer.name},

Wystąpił błąd podczas przetwarzania Twojego pliku.

Szczegóły błędu:
${uploadData.errorMessage}

${uploadData.errorDetails ? `Dodatkowe informacje:\n${uploadData.errorDetails}\n` : ''}

Możliwe rozwiązania:
- Sprawdź format pliku (CSV/Excel zgodny z szablonem)
- Upewnij się, że plik zawiera wymagane kolumny
- Sprawdź kodowanie znaków (UTF-8)
- Usuń puste wiersze i nieprawidłowe wartości

Spróbuj ponownie: ${dashboardUrl}

Potrzebujesz pomocy? ${supportEmail}

OTO-RAPORT.pl
  `

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}

/**
 * Send weekly report email
 */
export async function sendWeeklyReportEmail(
  developer: Developer,
  reportData: {
    totalProperties: number
    availableProperties: number
    soldProperties: number
    reservedProperties: number
    newPropertiesThisWeek: number
    soldThisWeek: number
    avgPricePerM2: number
  }
) {
  const dashboardUrl = `${APP_URL}/dashboard`
  const xmlUrl = `${APP_URL}/api/public/${developer.client_id}/data.xml`

  const subject = `📊 Tygodniowy raport OTO-RAPORT - ${new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' })}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tygodniowy raport OTO-RAPORT</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTO-RAPORT</h1>
        <p style="color: #666; font-size: 16px;">Tygodniowy raport compliance</p>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #1e293b; margin-top: 0;">Cześć ${developer.name}! 👋</h2>

        <p>Oto podsumowanie Twoich nieruchomości z ostatniego tygodnia:</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0;">
          <!-- Total Properties Card -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; border-radius: 8px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${reportData.totalProperties}</div>
            <div style="font-size: 14px; opacity: 0.9;">Wszystkie nieruchomości</div>
          </div>

          <!-- Available Properties Card -->
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; border-radius: 8px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${reportData.availableProperties}</div>
            <div style="font-size: 14px; opacity: 0.9;">Dostępne</div>
          </div>

          <!-- Sold Properties Card -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; border-radius: 8px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${reportData.soldProperties}</div>
            <div style="font-size: 14px; opacity: 0.9;">Sprzedane</div>
          </div>

          <!-- Reserved Properties Card -->
          <div style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: white; border-radius: 8px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${reportData.reservedProperties}</div>
            <div style="font-size: 14px; opacity: 0.9;">Zarezerwowane</div>
          </div>
        </div>

        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #2563eb; margin-top: 0;">📈 Aktywność w tym tygodniu:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">Nowe nieruchomości:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #16a34a;">
                ${reportData.newPropertiesThisWeek > 0 ? '+' : ''}${reportData.newPropertiesThisWeek}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">Sprzedane w tym tygodniu:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #dc2626;">
                ${reportData.soldThisWeek}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">Średnia cena za m²:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #2563eb;">
                ${reportData.avgPricePerM2.toLocaleString('pl-PL')} zł
              </td>
            </tr>
          </table>
        </div>
      </div>

      <div style="background: #f0fdf4; border: 1px solid #16a34a; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #15803d; margin-top: 0; font-size: 16px;">✅ Status compliance</h3>
        <p style="margin-bottom: 10px; color: #166534; font-size: 14px;">
          Twoje dane są na bieżąco dostępne dla ministerstwa:
        </p>
        <div style="background: white; border-radius: 4px; padding: 10px; font-family: monospace; font-size: 12px; overflow-wrap: break-word;">
          ${xmlUrl}
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Zobacz pełen dashboard
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
        <p>Ten raport jest wysyłany automatycznie co poniedziałek.</p>
        <p>Możesz zarządzać powiadomieniami w <a href="${dashboardUrl}/settings" style="color: #2563eb;">ustawieniach konta</a>.</p>
        <p style="margin-top: 20px;">OTO-RAPORT.pl - Automatyczny compliance dla deweloperów</p>
      </div>
    </body>
    </html>
  `

  const text = `
📊 Tygodniowy raport OTO-RAPORT

Cześć ${developer.name}!

Podsumowanie nieruchomości:
- Wszystkie: ${reportData.totalProperties}
- Dostępne: ${reportData.availableProperties}
- Sprzedane: ${reportData.soldProperties}
- Zarezerwowane: ${reportData.reservedProperties}

Aktywność w tym tygodniu:
- Nowe: ${reportData.newPropertiesThisWeek > 0 ? '+' : ''}${reportData.newPropertiesThisWeek}
- Sprzedane: ${reportData.soldThisWeek}
- Średnia cena/m²: ${reportData.avgPricePerM2.toLocaleString('pl-PL')} zł

Status compliance: ✅
${xmlUrl}

Dashboard: ${dashboardUrl}

Ten raport jest wysyłany co poniedziałek.
Zarządzaj powiadomieniami: ${dashboardUrl}/settings

OTO-RAPORT.pl
  `

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}

/**
 * Send upload confirmation email
 */
export async function sendUploadConfirmationEmail(
  developer: Developer,
  uploadData: {
    fileName: string
    totalProperties: number
    validProperties: number
    skippedProperties: number
  }
) {
  const dashboardUrl = `${APP_URL}/dashboard`
  const xmlUrl = `${APP_URL}/api/public/${developer.client_id}/data.xml`

  const subject = `✅ Plik "${uploadData.fileName}" został pomyślnie przetworzony`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upload potwierdzony</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTO-RAPORT</h1>
      </div>

      <div style="background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #15803d; margin-top: 0;">✅ Plik pomyślnie przetworzony!</h2>

        <p>Witaj ${developer.name},</p>

        <p>Twój plik <strong>"${uploadData.fileName}"</strong> został pomyślnie przesłany i przetworzony przez system OTO-RAPORT.</p>

        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #15803d; margin-top: 0;">📊 Podsumowanie parsowania:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Przetworzonych mieszkań:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #16a34a;">${uploadData.validProperties}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Pominiętych (sprzedane):</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #6b7280;">${uploadData.skippedProperties}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Łącznie wierszy:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${uploadData.totalProperties}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #0369a1; margin-top: 0; font-size: 16px;">🔗 Dostęp ministerstwa</h3>
        <p style="margin-bottom: 10px; color: #075985; font-size: 14px;">
          Twoje dane są już dostępne dla ministerstwa przez publiczny endpoint:
        </p>
        <div style="background: white; border-radius: 4px; padding: 10px; font-family: monospace; font-size: 12px; overflow-wrap: break-word;">
          ${xmlUrl}
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Zobacz szczegóły w dashboardzie
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280; text-align: center;">
        <p>OTO-RAPORT.pl - Automatyczny compliance dla deweloperów</p>
        <p style="font-size: 12px; margin-top: 10px;">
          Ten email został wysłany automatycznie po przetworzeniu Twojego pliku.
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
✅ Plik "${uploadData.fileName}" został pomyślnie przetworzony

Witaj ${developer.name},

Podsumowanie parsowania:
- Przetworzonych mieszkań: ${uploadData.validProperties}
- Pominiętych (sprzedane): ${uploadData.skippedProperties}
- Łącznie wierszy: ${uploadData.totalProperties}

Dostęp ministerstwa:
${xmlUrl}

Zobacz szczegóły: ${dashboardUrl}

OTO-RAPORT.pl - Automatyczny compliance
  `

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}

/**
 * Send trial ending reminder email (3 days before end)
 * Task #50, Subtask 50.7
 */
export async function sendTrialEndingReminderEmail(developer: Developer, daysLeft: number = 3) {
  const dashboardUrl = `${APP_URL}/dashboard`

  const subject = `⏰ Twój trial OTO-RAPORT kończy się za ${daysLeft} dni`

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb;">🏢 OTO-RAPORT</h1>
      </div>
      <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #856404;">⏰ Twój trial kończy się za ${daysLeft} dni</h2>
        <p>Witaj ${developer.name},</p>
        <p>Twój 14-dniowy trial OTO-RAPORT wygasa za <strong>${daysLeft} dni</strong>.</p>
        <p>Po zakończeniu trialu automatycznie przejdziesz na wybrany plan płatny.</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Przejdź do dashboardu
        </a>
      </div>
    </body>
    </html>
  `

  const text = `
⏰ Twój trial kończy się za ${daysLeft} dni

Witaj ${developer.name},
Twój 14-dniowy trial wygasa za ${daysLeft} dni.

Dashboard: ${dashboardUrl}
  `

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}

/**
 * Send trial welcome email (Day 0)
 * Task #51, Subtask 51.1
 */
export async function sendTrialWelcomeEmail(developer: {
  email: string;
  company_name: string;
  trial_ends_at: string;
}): Promise<void> {
  const dashboardUrl = `${APP_URL}/dashboard`
  const docsUrl = `${APP_URL}/docs`
  const trialEndDate = new Date(developer.trial_ends_at).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  const subject = `Witaj w OTO-RAPORT! Twój 14-dniowy trial rozpoczął się 🚀`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTO-RAPORT</h1>
        <p style="color: #666; font-size: 16px;">Automatyzacja compliance dla deweloperów</p>
      </div>

      <div style="background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #15803d; margin-top: 0;">🚀 Witamy w OTO-RAPORT!</h2>
        <p>Cześć ${developer.company_name}!</p>
        <p>Twój 14-dniowy trial właśnie się rozpoczął. Masz pełny dostęp do wszystkich funkcji platformy do <strong>${trialEndDate}</strong>.</p>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-top: 0;">📋 Szybki start - 3 proste kroki:</h3>
        <ol style="margin: 20px 0; padding-left: 20px;">
          <li style="margin-bottom: 15px;">
            <strong>Wgraj dane</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Upload pliku CSV lub Excel z cenami mieszkań</span>
          </li>
          <li style="margin-bottom: 15px;">
            <strong>Sprawdź endpoint XML</strong><br>
            <span style="color: #6b7280; font-size: 14px;">System automatycznie wygeneruje raporty dla ministerstwa</span>
          </li>
          <li style="margin-bottom: 15px;">
            <strong>Przetestuj raportowanie</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Zweryfikuj zgodność z wymogami ustawy</span>
          </li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
          Przejdź do dashboardu
        </a>
        <a href="${docsUrl}" style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Dokumentacja
        </a>
      </div>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">💡 Potrzebujesz pomocy?</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #78350f; font-size: 14px;">
          <li>📧 Email: support@oto-raport.pl</li>
          <li>📚 Dokumentacja: ${docsUrl}</li>
          <li>💬 Chat na żywo w dashboardzie</li>
        </ul>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
        <p>Trial kończy się: ${trialEndDate}</p>
        <p>Ten email to transakcyjna wiadomość systemowa</p>
        <p>OTO-RAPORT.pl © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `

  const text = `
Witaj w OTO-RAPORT! 🚀

Cześć ${developer.company_name}!

Twój 14-dniowy trial rozpoczął się. Masz pełny dostęp do platformy do ${trialEndDate}.

SZYBKI START - 3 KROKI:
1. Wgraj dane - Upload pliku CSV/Excel z cenami
2. Sprawdź endpoint XML - Automatyczne raporty dla ministerstwa
3. Przetestuj raportowanie - Sprawdź zgodność z ustawą

LINKI:
Dashboard: ${dashboardUrl}
Dokumentacja: ${docsUrl}

POMOC:
Email: support@oto-raport.pl
Dokumentacja: ${docsUrl}

Trial kończy się: ${trialEndDate}

OTO-RAPORT.pl
  `

  await sendEmail({
    to: developer.email,
    subject,
    html,
    text,
    skipOptOutCheck: true // Transactional email
  })
}

/**
 * Send trial midway check-in email (Day 7)
 * Task #51, Subtask 51.1
 */
export async function sendTrialMidwayEmail(developer: {
  email: string;
  company_name: string;
  properties_count: number;
  trial_ends_at: string;
  xml_endpoint_url: string;
}): Promise<void> {
  const dashboardUrl = `${APP_URL}/dashboard`
  const trialEndDate = new Date(developer.trial_ends_at).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  const subject = `Połowa trialu za nami! Sprawdź swoje postępy 📊`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTO-RAPORT</h1>
        <p style="color: #666; font-size: 16px;">Podsumowanie tygodnia trialu</p>
      </div>

      <div style="background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #1e40af; margin-top: 0;">📊 Połowa trialu za nami!</h2>
        <p>Cześć ${developer.company_name}!</p>
        <p>Minął już tydzień od rozpoczęcia Twojego trialu. Sprawdźmy, co udało Ci się osiągnąć!</p>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-top: 0;">✅ Twoje postępy:</h3>
        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="font-weight: 600;">Dodane mieszkania:</span>
            <span style="font-size: 24px; color: #16a34a; font-weight: bold;">${developer.properties_count}</span>
          </div>
          <div style="padding: 15px 0;">
            <span style="font-weight: 600;">XML endpoint działa:</span><br>
            <a href="${developer.xml_endpoint_url}" style="color: #2563eb; font-size: 12px; word-break: break-all;">${developer.xml_endpoint_url}</a>
          </div>
        </div>
      </div>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">⏰ Pozostało 7 dni trialu</h3>
        <p style="color: #78350f; font-size: 14px; margin-bottom: 10px;">
          Trial kończy się: <strong>${trialEndDate}</strong>
        </p>
        <p style="color: #78350f; font-size: 14px;">
          Wykorzystaj pozostały czas na:
        </p>
        <ul style="color: #78350f; font-size: 14px; margin: 10px 0;">
          <li>Wgranie większej ilości danych</li>
          <li>Przetestowanie wszystkich funkcji</li>
          <li>Sprawdzenie raportów ministerialnych</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Kontynuuj eksplorację
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
        <p>Masz pytania? Skontaktuj się: support@oto-raport.pl</p>
        <p>OTO-RAPORT.pl © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `

  const text = `
Połowa trialu za nami! 📊

Cześć ${developer.company_name}!

Minął tydzień trialu. Sprawdźmy postępy:

TWOJE POSTĘPY:
✅ Dodane mieszkania: ${developer.properties_count}
✅ XML endpoint działa: ${developer.xml_endpoint_url}

POZOSTAŁO 7 DNI
Trial kończy się: ${trialEndDate}

Wykorzystaj czas na:
- Wgranie większej ilości danych
- Przetestowanie wszystkich funkcji
- Sprawdzenie raportów ministerialnych

Dashboard: ${dashboardUrl}

Pytania? support@oto-raport.pl

OTO-RAPORT.pl
  `

  await sendEmail({
    to: developer.email,
    subject,
    html,
    text,
    skipOptOutCheck: false // Respects email preferences
  })
}

/**
 * Send trial urgency warning email (Day 11 - 3 days left)
 * Task #51, Subtask 51.1
 */
export async function sendTrialUrgencyEmail(developer: {
  email: string;
  company_name: string;
  trial_ends_at: string;
  subscription_plan: string;
  properties_count: number;
}): Promise<void> {
  const dashboardUrl = `${APP_URL}/dashboard`
  const trialEndDate = new Date(developer.trial_ends_at).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  const subject = `⏰ Tylko 3 dni do końca trialu - nie trać dostępu!`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTO-RAPORT</h1>
      </div>

      <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #dc2626; margin-top: 0;">⏰ Tylko 3 dni do końca trialu!</h2>
        <p>Cześć ${developer.company_name}!</p>
        <p>Twój 14-dniowy trial OTO-RAPORT kończy się za <strong>3 dni</strong> (${trialEndDate}).</p>
        <p style="font-size: 16px; font-weight: 600; color: #dc2626;">
          Upewnij się, że Twoja metoda płatności jest aktywna, aby zachować dostęp!
        </p>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-top: 0;">📋 Co się stanie po trialu?</h3>
        <div style="background: white; border-radius: 6px; padding: 20px; margin: 15px 0;">
          <p style="margin: 0; color: #6b7280;">
            Automatycznie przejdziesz na plan <strong style="color: #2563eb;">${developer.subscription_plan.toUpperCase()}</strong>.
            Twoje ${developer.properties_count} mieszkań pozostanie w systemie i będzie dalej raportowane do ministerstwa.
          </p>
        </div>
      </div>

      <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #15803d; margin-top: 0; font-size: 16px;">✨ Korzyści z pozostania z nami:</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #166534; font-size: 14px;">
          <li>Automatyczne compliance z ministerstwem</li>
          <li>Oszczędność czasu i zasobów</li>
          <li>Bezpieczeństwo prawne firmy</li>
          <li>Profesjonalna prezentacja oferty</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Przejdź do dashboardu
        </a>
      </div>

      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 15px; margin-bottom: 30px;">
        <p style="margin: 0; color: #075985; font-size: 14px; text-align: center;">
          💳 Płatność zostanie automatycznie pobrana po zakończeniu trialu
        </p>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
        <p>Pytania? Kontakt: support@oto-raport.pl</p>
        <p>OTO-RAPORT.pl © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `

  const text = `
⏰ Tylko 3 dni do końca trialu!

Cześć ${developer.company_name}!

Twój trial kończy się za 3 dni (${trialEndDate}).

CO SIĘ STANIE?
Automatycznie przejdziesz na plan ${developer.subscription_plan.toUpperCase()}.
Twoje ${developer.properties_count} mieszkań pozostanie w systemie.

KORZYŚCI:
✅ Automatyczne compliance z ministerstwem
✅ Oszczędność czasu i zasobów
✅ Bezpieczeństwo prawne
✅ Profesjonalna prezentacja oferty

Dashboard: ${dashboardUrl}

Pytania? support@oto-raport.pl

OTO-RAPORT.pl
  `

  await sendEmail({
    to: developer.email,
    subject,
    html,
    text,
    skipOptOutCheck: false // Respects email preferences
  })
}

/**
 * Send trial conversion success email (Day 14)
 * Task #51, Subtask 51.1
 */
export async function sendTrialConversionSuccessEmail(developer: {
  email: string;
  company_name: string;
  subscription_plan: string;
  monthly_price: number;
}): Promise<void> {
  const dashboardUrl = `${APP_URL}/dashboard`
  const supportUrl = `${APP_URL}/support`

  const subject = `🎉 Witaj jako klient premium OTO-RAPORT!`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTO-RAPORT</h1>
      </div>

      <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border-radius: 8px; padding: 40px; margin-bottom: 30px; text-align: center;">
        <h2 style="color: white; margin-top: 0; font-size: 32px;">🎉</h2>
        <h2 style="color: white; margin-top: 10px;">Gratulacje!</h2>
        <p style="color: white; font-size: 18px; margin-bottom: 0;">
          Witaj jako klient premium OTO-RAPORT
        </p>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <p style="font-size: 16px;">Cześć ${developer.company_name}!</p>
        <p>Dziękujemy za zaufanie i wybór OTO-RAPORT! Twój trial zakończył się pomyślnie i teraz jesteś oficjalnie naszym klientem premium.</p>

        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">📋 Szczegóły subskrypcji:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Plan:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${developer.subscription_plan.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Cena:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #16a34a; font-weight: 600;">${developer.monthly_price} zł/miesiąc</td>
            </tr>
            <tr>
              <td style="padding: 10px 0;"><strong>Status:</strong></td>
              <td style="padding: 10px 0; text-align: right;"><span style="background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;">AKTYWNY</span></td>
            </tr>
          </table>
        </div>
      </div>

      <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #1e40af; margin-top: 0; font-size: 16px;">🚀 Co teraz jest dostępne?</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
          <li>Pełny dostęp do wszystkich funkcji planu ${developer.subscription_plan.toUpperCase()}</li>
          <li>Automatyczne raportowanie do ministerstwa</li>
          <li>Profesjonalna prezentacja oferty</li>
          <li>Priorytetowy support (odpowiedź do 2h)</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
          Przejdź do dashboardu
        </a>
        <a href="${supportUrl}" style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Kontakt z supportem
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
        <p><strong>Dziękujemy za zaufanie!</strong></p>
        <p>Zespół OTO-RAPORT</p>
        <p>OTO-RAPORT.pl © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `

  const text = `
🎉 Gratulacje! Witaj jako klient premium OTO-RAPORT

Cześć ${developer.company_name}!

Dziękujemy za zaufanie! Twój trial zakończył się pomyślnie.

SZCZEGÓŁY SUBSKRYPCJI:
Plan: ${developer.subscription_plan.toUpperCase()}
Cena: ${developer.monthly_price} zł/miesiąc
Status: AKTYWNY

CO JEST DOSTĘPNE?
✅ Pełny dostęp do funkcji planu ${developer.subscription_plan.toUpperCase()}
✅ Automatyczne raportowanie do ministerstwa
✅ Profesjonalna prezentacja oferty
✅ Priorytetowy support (odpowiedź do 2h)

Dashboard: ${dashboardUrl}
Support: ${supportUrl}

Dziękujemy za zaufanie!
Zespół OTO-RAPORT

OTO-RAPORT.pl
  `

  await sendEmail({
    to: developer.email,
    subject,
    html,
    text,
    skipOptOutCheck: true // Transactional email
  })
}

/**
 * Send trial failed email (Day 14 - payment failed)
 * Task #51, Subtask 51.1
 */
export async function sendTrialFailedEmail(developer: {
  email: string;
  company_name: string;
  trial_ended_at: string;
  properties_count: number;
}): Promise<void> {
  const pricingUrl = `${APP_URL}/pricing`
  const trialEndDate = new Date(developer.trial_ended_at).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  const subject = `Twój trial OTO-RAPORT wygasł - reaktywuj z rabatem 20%! 💳`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTO-RAPORT</h1>
      </div>

      <div style="background: #fff3cd; border: 2px solid #f59e0b; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #92400e; margin-top: 0;">Twój trial wygasł</h2>
        <p>Cześć ${developer.company_name}!</p>
        <p>Twój 14-dniowy trial OTO-RAPORT zakończył się ${trialEndDate}. Mamy nadzieję, że miałeś okazję poznać wszystkie funkcje platformy!</p>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-top: 0;">📊 Twoje osiągnięcia podczas trialu:</h3>
        <div style="background: white; border-radius: 6px; padding: 20px; margin: 15px 0; text-align: center;">
          <div style="font-size: 48px; color: #2563eb; font-weight: bold; margin-bottom: 10px;">${developer.properties_count}</div>
          <div style="color: #6b7280; font-size: 16px;">mieszkań w systemie</div>
        </div>
        <p style="color: #6b7280; text-align: center; margin-top: 20px;">
          Wszystkie te dane są bezpiecznie zapisane i czekają na reaktywację!
        </p>
      </div>

      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 8px; padding: 30px; margin-bottom: 30px; text-align: center;">
        <h2 style="color: white; margin-top: 0; font-size: 28px;">🎁 Specjalna oferta!</h2>
        <p style="color: white; font-size: 18px; margin-bottom: 20px;">
          Reaktywuj konto z <strong>rabatem 20%</strong><br>na pierwszy miesiąc!
        </p>
        <div style="background: white; color: #dc2626; padding: 15px 30px; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 20px; margin: 10px 0;">
          KOD: COMEBACK20
        </div>
        <p style="color: white; font-size: 14px; margin-top: 15px; opacity: 0.9;">
          ⏰ Oferta ważna przez 7 dni
        </p>
      </div>

      <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #15803d; margin-top: 0; font-size: 16px;">💡 Dlaczego warto wrócić?</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #166534; font-size: 14px;">
          <li><strong>Automatyczne compliance</strong> - bez ręcznego raportowania do ministerstwa</li>
          <li><strong>Oszczędność czasu</strong> - zapomnij o manualnym przygotowywaniu XML</li>
          <li><strong>Bezpieczeństwo prawne</strong> - zawsze zgodny z wymogami ustawy</li>
          <li><strong>Profesjonalna prezentacja</strong> - strona z ofertą dla Twoich klientów</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${pricingUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 18px;">
          Reaktywuj konto z rabatem 20%
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
        <p>Masz pytania? Skontaktuj się: support@oto-raport.pl</p>
        <p>OTO-RAPORT.pl © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `

  const text = `
Twój trial OTO-RAPORT wygasł 💳

Cześć ${developer.company_name}!

Twój trial zakończył się ${trialEndDate}.

TWOJE OSIĄGNIĘCIA:
📊 ${developer.properties_count} mieszkań w systemie

🎁 SPECJALNA OFERTA!
Reaktywuj konto z rabatem 20% na pierwszy miesiąc!

KOD: COMEBACK20
⏰ Oferta ważna przez 7 dni

DLACZEGO WARTO WRÓCIĆ?
✅ Automatyczne compliance - bez ręcznego raportowania
✅ Oszczędność czasu - zapomnij o manualnym XML
✅ Bezpieczeństwo prawne - zawsze zgodny z ustawą
✅ Profesjonalna prezentacja - strona dla klientów

Reaktywuj: ${pricingUrl}

Pytania? support@oto-raport.pl

OTO-RAPORT.pl
  `

  await sendEmail({
    to: developer.email,
    subject,
    html,
    text,
    skipOptOutCheck: true // Transactional email
  })
}

/**
 * Send trial converted email
 * Task #50, Subtask 50.7
 */
export async function sendTrialConvertedEmail(developer: Developer) {
  const dashboardUrl = `${APP_URL}/dashboard`
  const planType = developer.subscription_plan || 'basic'

  const subject = `🎉 Witaj jako klient premium OTO-RAPORT!`

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb;">🏢 OTO-RAPORT</h1>
      </div>
      <div style="background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #15803d;">🎉 Witaj jako klient premium!</h2>
        <p>Witaj ${developer.name},</p>
        <p>Twój trial zakończył się i teraz jesteś klientem premium na planie <strong>${planType.toUpperCase()}</strong>!</p>
        <p>Dziękujemy za zaufanie.</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Przejdź do dashboardu
        </a>
      </div>
    </body>
    </html>
  `

  const text = `
🎉 Witaj jako klient premium OTO-RAPORT!

Witaj ${developer.name},
Twój trial zakończył się. Jesteś teraz klientem premium na planie ${planType.toUpperCase()}!

Dashboard: ${dashboardUrl}
  `

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}

/**
 * Send payment failed email
 * Task #50, Subtask 50.7
 */
export async function sendPaymentFailedEmail(developer: Developer) {
  const dashboardUrl = `${APP_URL}/dashboard`

  const subject = `⚠️ Problem z płatnością - OTO-RAPORT`

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb;">🏢 OTO-RAPORT</h1>
      </div>
      <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #dc2626;">⚠️ Problem z płatnością</h2>
        <p>Witaj ${developer.name},</p>
        <p>Nie udało się przetworzyć Twojej płatności za subskrypcję OTO-RAPORT.</p>
        <p>Zaktualizuj metodę płatności aby uniknąć przerwy w dostępie.</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Przejdź do dashboardu
        </a>
      </div>
    </body>
    </html>
  `

  const text = `
⚠️ Problem z płatnością - OTO-RAPORT

Witaj ${developer.name},
Nie udało się przetworzyć płatności.

Dashboard: ${dashboardUrl}
  `

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text,
    skipOptOutCheck: true
  })
}
