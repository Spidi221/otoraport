/**
 * Support Email System for OTORAPORT
 * Handles support requests, auto-responders, and ticket routing
 */

import { sendEmail, EMAIL_FROM, APP_URL } from './email-service'

interface SupportRequest {
  name: string
  email: string
  subject: string
  message: string
  category?: 'technical' | 'billing' | 'general' | 'urgent'
  developerEmail?: string
}

/**
 * Send auto-responder to support request sender
 */
export async function sendSupportAutoResponder(request: SupportRequest) {
  const subject = `Potwierdzenie zgłoszenia: ${request.subject}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Potwierdzenie zgłoszenia</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTORAPORT</h1>
        <p style="color: #6b7280;">Support Team</p>
      </div>

      <div style="background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #15803d; margin-top: 0;">✅ Otrzymaliśmy Twoje zgłoszenie</h2>

        <p>Witaj ${request.name},</p>

        <p>Dziękujemy za kontakt z zespołem OTORAPORT. Twoje zgłoszenie zostało zarejestrowane i zostanie rozpatrzone w możliwie najkrótszym czasie.</p>

        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #15803d; margin-top: 0;">📋 Szczegóły zgłoszenia:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Temat:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${request.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Kategoria:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${getCategoryLabel(request.category || 'general')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Email kontaktowy:</td>
              <td style="padding: 8px 0;">${request.email}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #0369a1; margin-top: 0; font-size: 16px;">⏱️ Czas odpowiedzi</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #075985;">
          <li><strong>Pilne zgłoszenia:</strong> do 4 godzin roboczych</li>
          <li><strong>Problemy techniczne:</strong> do 24 godzin</li>
          <li><strong>Pytania ogólne:</strong> do 48 godzin</li>
        </ul>
        <p style="margin: 15px 0 0 0; color: #075985; font-size: 14px;">
          💡 <strong>Wskazówka:</strong> W przypadku pilnych problemów dodaj "[PILNE]" w temacie wiadomości.
        </p>
      </div>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">🔍 Przydatne zasoby</h3>
        <ul style="margin: 0; padding-left: 20px; color: #78350f;">
          <li><a href="${APP_URL}/docs" style="color: #92400e; text-decoration: underline;">📚 Dokumentacja</a></li>
          <li><a href="${APP_URL}/faq" style="color: #92400e; text-decoration: underline;">❓ FAQ - Najczęściej zadawane pytania</a></li>
          <li><a href="${APP_URL}/dashboard" style="color: #92400e; text-decoration: underline;">🏠 Dashboard</a></li>
        </ul>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280; text-align: center;">
        <p><strong>Zespół OTORAPORT Support</strong></p>
        <p style="font-size: 12px; margin-top: 10px;">
          support@otoraport.pl | otoraport.pl
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
          Ten email został wysłany automatycznie jako potwierdzenie zgłoszenia.
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
✅ Otrzymaliśmy Twoje zgłoszenie

Witaj ${request.name},

Dziękujemy za kontakt. Twoje zgłoszenie zostało zarejestrowane.

Szczegóły:
- Temat: ${request.subject}
- Kategoria: ${getCategoryLabel(request.category || 'general')}
- Email: ${request.email}

Czas odpowiedzi:
- Pilne zgłoszenia: do 4h roboczych
- Problemy techniczne: do 24h
- Pytania ogólne: do 48h

Przydatne zasoby:
- Dokumentacja: ${APP_URL}/docs
- FAQ: ${APP_URL}/faq
- Dashboard: ${APP_URL}/dashboard

Zespół OTORAPORT Support
support@otoraport.pl
  `

  return await sendEmail({
    to: request.email,
    subject,
    html,
    text
  })
}

/**
 * Forward support request to development team
 */
export async function forwardSupportRequestToTeam(request: SupportRequest) {
  const SUPPORT_TEAM_EMAIL = process.env.SUPPORT_TEAM_EMAIL || 'admin@otoraport.pl'

  const urgencyFlag = request.category === 'urgent' ? '🚨 [PILNE] ' : ''
  const subject = `${urgencyFlag}Support Request: ${request.subject}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nowe zgłoszenie support</title>
    </head>
    <body style="font-family: monospace; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">

      <div style="background: ${request.category === 'urgent' ? '#fef2f2' : '#f8fafc'}; border-left: 4px solid ${request.category === 'urgent' ? '#dc2626' : '#2563eb'}; padding: 20px; margin-bottom: 20px;">
        <h2 style="margin-top: 0;">📧 Nowe zgłoszenie support</h2>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: white;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Od:</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${request.name} &lt;${request.email}&gt;</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Kategoria:</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${getCategoryLabel(request.category || 'general')}</td>
          </tr>
          ${request.developerEmail ? `
          <tr style="background: white;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Developer Account:</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${request.developerEmail}</td>
          </tr>
          ` : ''}
          <tr style="background: white;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Temat:</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${request.subject}</td>
          </tr>
        </table>

        <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Wiadomość:</h3>
          <p style="white-space: pre-wrap;">${request.message}</p>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin-top: 20px;">
          <p style="margin: 0;"><strong>Odpowiedz bezpośrednio na:</strong> ${request.email}</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
📧 Nowe zgłoszenie support ${request.category === 'urgent' ? '[PILNE]' : ''}

Od: ${request.name} <${request.email}>
Kategoria: ${getCategoryLabel(request.category || 'general')}
${request.developerEmail ? `Developer Account: ${request.developerEmail}\n` : ''}
Temat: ${request.subject}

Wiadomość:
${request.message}

---
Odpowiedz na: ${request.email}
  `

  return await sendEmail({
    to: SUPPORT_TEAM_EMAIL,
    subject,
    html,
    text,
    from: EMAIL_FROM
  })
}

/**
 * Get category label in Polish
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    technical: '🔧 Techniczne',
    billing: '💰 Płatności',
    general: '💬 Ogólne',
    urgent: '🚨 Pilne'
  }
  return labels[category] || labels.general
}
