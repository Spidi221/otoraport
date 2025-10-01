// Email service using Resend for OTORAPORT notifications
import { Resend } from 'resend'
import { Database } from './supabase/server'

type Developer = Database['public']['Tables']['developers']['Row']

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder-resend-key')

// Environment variables with fallbacks
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'https://otoraport.pl'
const MINISTRY_EMAIL = process.env.MINISTRY_EMAIL || 'dane@ministerstwo.gov.pl'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * Send email using Resend service
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = 'OTORAPORT <noreply@cenysync.pl>'
}: {
  to: string | string[]
  subject: string
  html: string
  text: string
  from?: string
}) {
  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text
    })

    console.log('Email sent successfully:', result.data?.id)
    return { success: true, id: result.data?.id }

  } catch (error) {
    console.error('Email sending failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send ministry registration email
 */
export async function sendMinistryRegistrationEmail(developer: Developer) {
  const xmlUrl = `${NEXTAUTH_URL}/api/public/${developer.id}/data.xml`
  const mdUrl = `${NEXTAUTH_URL}/api/public/${developer.id}/data.md`
  
  const subject = `Zgłoszenie dewelopera do systemu raportowania cen - ${developer.company_name || developer.name}`
  
  const html = `
    <h1>OTORAPORT - System automatycznego raportowania cen mieszkań</h1>
    
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
OTORAPORT - System automatycznego raportowania cen mieszkań

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
  const dashboardUrl = `${NEXTAUTH_URL}/dashboard`
  const planType = developer.subscription_plan || 'trial'
  
  const subject = `Witamy w OTORAPORT! Twoje konto ${planType} jest aktywne`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Witaj w OTORAPORT</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTORAPORT</h1>
        <p style="color: #666; font-size: 16px;">Automatyzacja compliance dla deweloperów</p>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #1e293b; margin-top: 0;">Witaj, ${developer.name}! 👋</h2>
        
        <p>Dziękujemy za dołączenie do OTORAPORT. Twoje konto <strong>${planType}</strong> zostało pomyślnie utworzone i możesz rozpocząć korzystanie z platformy.</p>
        
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
          OTORAPORT automatyzuje ten proces, ale dane muszą być aktualne i kompletne.
        </p>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280;">
        <p><strong>Potrzebujesz pomocy?</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>📧 Email: <a href="mailto:support@cenysync.pl" style="color: #2563eb;">support@cenysync.pl</a></li>
          <li>📚 Dokumentacja: <a href="https://cenysync.pl/docs" style="color: #2563eb;">cenysync.pl/docs</a></li>
          <li>💬 Chat: Dostępny w panelu użytkownika</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #9ca3af;">
        <p>OTORAPORT.pl - Compliance made simple</p>
        <p>Ten email został wysłany automatycznie. Nie odpowiadaj na tę wiadomość.</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
Witaj w OTORAPORT, ${developer.name}!

Twoje konto ${planType} zostało pomyślnie utworzone.

Następne kroki:
1. Wgraj dane nieruchomości (CSV/XML)
2. Sprawdź compliance (automatyczne XML/MD)  
3. Skonfiguruj powiadomienia
${planType === 'pro' || planType === 'enterprise' ? '4. Wygeneruj stronę prezentacyjną' : ''}

Przejdź do dashboardu: ${dashboardUrl}

WAŻNE: Pamiętaj o obowiązku raportowania zgodnie z ustawą z 21 maja 2025.

Potrzebujesz pomocy?
- Email: support@cenysync.pl
- Dokumentacja: cenysync.pl/docs

OTORAPORT.pl - Compliance made simple
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
  const subject = `⏰ Twój trial OTORAPORT wygasa za ${daysLeft} dni`
  
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
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTORAPORT</h1>
      </div>

      <div style="background: #fef2f2; border: 2px solid #f87171; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #dc2626; margin-top: 0;">⏰ Twój trial wygasa za ${daysLeft} dni</h2>
        
        <p>Witaj ${developer.name},</p>
        
        <p>Twój 14-dniowy okres próbny OTORAPORT wygasa za <strong>${daysLeft} dni</strong>. 
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
          <a href="${NEXTAUTH_URL}/pricing" style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Wybierz plan i kontynuuj
          </a>
        </div>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280; text-align: center;">
        <p>Masz pytania? Skontaktuj się z nami: <a href="mailto:support@cenysync.pl" style="color: #2563eb;">support@cenysync.pl</a></p>
      </div>
    </body>
    </html>
  `

  const text = `
⏰ Twój trial OTORAPORT wygasa za ${daysLeft} dni

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

Wybierz plan: ${NEXTAUTH_URL}/pricing

Pytania? support@cenysync.pl
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
  const xmlUrl = `${NEXTAUTH_URL}/api/public/${developer.client_id}/data.xml`
  const mdUrl = `${NEXTAUTH_URL}/api/public/${developer.client_id}/data.md`
  
  const subject = '✅ Raport compliance OTORAPORT został wygenerowany'
  
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
        <a href="${NEXTAUTH_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Zobacz dashboard
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280; text-align: center;">
        <p>OTORAPORT.pl - Automatyczny compliance dla deweloperów</p>
      </div>
    </body>
    </html>
  `

  const text = `
✅ Raport compliance OTORAPORT gotowy!

Witaj ${developer.name},

Raport dla ${propertiesCount} nieruchomości został wygenerowany:

XML: ${xmlUrl}
MD: ${mdUrl}

Raporty są dostępne 24/7 dla ministerstwa przez nasze API.

Dashboard: ${NEXTAUTH_URL}/dashboard

OTORAPORT.pl - Automatyczny compliance
  `

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}
