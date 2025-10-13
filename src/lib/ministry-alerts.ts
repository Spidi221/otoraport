/**
 * Ministry Compliance Alert System
 * Automated email notifications for ministry endpoint monitoring
 */

import { sendEmail, EMAIL_FROM, APP_URL } from './email-service'
import { shouldSendEmail, getUnsubscribeUrl, addUnsubscribeFooter, addUnsubscribeFooterText } from './email-preferences-checker'
import type { Database } from './supabase/server'

type Developer = Database['public']['Tables']['developers']['Row']

// Export APP_URL and EMAIL_FROM from email-service for reuse
export { APP_URL, EMAIL_FROM }

/**
 * Send endpoint health alert (when ministry endpoints fail)
 */
export async function sendEndpointHealthAlert(
  developer: Developer,
  failedEndpoint: 'xml' | 'csv' | 'md5',
  errorMessage: string
) {
  // Check if user wants to receive this type of email
  if (!await shouldSendEmail(developer.id, 'endpoint_health_alert')) {
    console.log(`⏭️ Skipping endpoint health alert for ${developer.email} (preferences)`)
    return { success: false, reason: 'user_preferences' }
  }

  const dashboardUrl = `${APP_URL}/dashboard`
  const endpointUrl = `${APP_URL}/api/public/${developer.client_id}/data.${failedEndpoint}`
  const unsubscribeUrl = await getUnsubscribeUrl(developer.id)

  const subject = `🚨 ALERT: Endpoint ministerstwa ${failedEndpoint.toUpperCase()} nie działa`

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Alert: Endpoint nie działa</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #dc2626; margin-top: 0;">🚨 Endpoint ministerstwa nie działa!</h2>

        <p>Witaj ${developer.company_name || developer.email},</p>

        <p>Wykryliśmy problem z Twoim endpointem ministerstwa:</p>

        <div style="background: white; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Typ:</strong> ${failedEndpoint.toUpperCase()}</p>
          <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 12px; color: #6b7280; overflow-wrap: break-word;">${endpointUrl}</p>
        </div>

        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: 600;">Błąd:</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">${errorMessage}</p>
        </div>
      </div>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">⚠️ Wymagane działanie</h3>
        <p style="margin-bottom: 10px; color: #78350f; font-size: 14px;">
          Ministerstwo nie może pobrać Twoich danych. Sprawdź dashboard i wgraj aktualne dane.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Przejdź do dashboardu
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280; text-align: center;">
        <p>OTO-RAPORT.pl - Monitoring compliance 24/7</p>
      </div>
    </body>
    </html>
  `

  let text = `
🚨 ALERT: Endpoint ministerstwa ${failedEndpoint.toUpperCase()} nie działa

Witaj ${developer.company_name || developer.email},

Wykryliśmy problem z endpointem:
${endpointUrl}

Błąd: ${errorMessage}

⚠️ Ministerstwo nie może pobrać Twoich danych!
Sprawdź dashboard: ${dashboardUrl}

OTO-RAPORT.pl - Monitoring compliance
  `

  // Add unsubscribe links
  html = addUnsubscribeFooter(html, unsubscribeUrl)
  text = addUnsubscribeFooterText(text, unsubscribeUrl)

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}

/**
 * Send data staleness alert (when data hasn't been updated in X days)
 */
export async function sendDataStalenessAlert(
  developer: Developer,
  daysSinceLastUpdate: number
) {
  // Check if user wants to receive this type of email
  if (!await shouldSendEmail(developer.id, 'data_staleness_alert')) {
    console.log(`⏭️ Skipping data staleness alert for ${developer.email} (preferences)`)
    return { success: false, reason: 'user_preferences' }
  }

  const dashboardUrl = `${APP_URL}/dashboard`
  const unsubscribeUrl = await getUnsubscribeUrl(developer.id)

  const subject = `⏰ Dane ministerstwa nieaktualne od ${daysSinceLastUpdate} dni`

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Alert: Dane nieaktualne</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #92400e; margin-top: 0;">⏰ Dane wymagają aktualizacji</h2>

        <p>Witaj ${developer.company_name || developer.email},</p>

        <p>Twoje dane dla ministerstwa nie były aktualizowane od <strong>${daysSinceLastUpdate} dni</strong>.</p>

        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">📋 Co to oznacza?</h3>
          <ul style="margin: 0; padding-left: 20px; color: #78350f;">
            <li>Ministerstwo może otrzymywać przestarzałe informacje o cenach</li>
            <li>Ryzyko braku zgodności z ustawą z 21 maja 2025</li>
            <li>Potencjalne sankcje za brak aktualnych danych</li>
          </ul>
        </div>
      </div>

      <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #15803d; margin-top: 0; font-size: 16px;">✅ Jak zaktualizować?</h3>
        <ol style="margin: 0; padding-left: 20px; color: #166534;">
          <li>Wgraj najnowszy plik CSV/Excel z cenami</li>
          <li>System automatycznie zaktualizuje wszystkie endpointy</li>
          <li>Ministerstwo od razu otrzyma dostęp do nowych danych</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Wgraj aktualne dane
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280; text-align: center;">
        <p>OTO-RAPORT.pl - Automatyczny compliance</p>
      </div>
    </body>
    </html>
  `

  let text = `
⏰ Dane ministerstwa nieaktualne od ${daysSinceLastUpdate} dni

Witaj ${developer.company_name || developer.email},

Twoje dane nie były aktualizowane od ${daysSinceLastUpdate} dni.

Ryzyko:
- Ministerstwo otrzymuje przestarzałe dane
- Brak zgodności z ustawą z 21 maja 2025
- Potencjalne sankcje

Jak zaktualizować?
1. Wgraj najnowszy CSV/Excel
2. System automatycznie zaktualizuje endpointy
3. Ministerstwo od razu otrzyma nowe dane

Zaktualizuj teraz: ${dashboardUrl}

OTO-RAPORT.pl - Automatyczny compliance
  `

  // Add unsubscribe links
  html = addUnsubscribeFooter(html, unsubscribeUrl)
  text = addUnsubscribeFooterText(text, unsubscribeUrl)

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}

/**
 * Send weekly compliance digest
 */
export async function sendWeeklyComplianceDigest(
  developer: Developer,
  stats: {
    totalProperties: number
    uploadsThisWeek: number
    lastUpdateDate: string
    endpointUptime: number
  }
) {
  // Check if user wants to receive this type of email
  if (!await shouldSendEmail(developer.id, 'weekly_digest')) {
    console.log(`⏭️ Skipping weekly digest for ${developer.email} (preferences)`)
    return { success: false, reason: 'user_preferences' }
  }

  const dashboardUrl = `${APP_URL}/dashboard`
  const xmlUrl = `${APP_URL}/api/public/${developer.client_id}/data.xml`
  const unsubscribeUrl = await getUnsubscribeUrl(developer.id)

  const subject = `📊 Tygodniowy raport compliance OTO-RAPORT`

  const uptimeStatus = stats.endpointUptime >= 99 ? '🟢 Doskonały' : stats.endpointUptime >= 95 ? '🟡 Dobry' : '🔴 Wymaga uwagi'

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Tygodniowy raport compliance</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">📊 Raport Tygodniowy</h1>
        <p style="color: #6b7280;">OTO-RAPORT - Compliance Summary</p>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #1e293b; margin-top: 0;">Witaj ${developer.company_name || developer.email}!</h2>

        <p>Oto podsumowanie Twojego compliance za ostatni tydzień:</p>

        <div style="display: grid; gap: 15px; margin: 20px 0;">
          <div style="background: white; border-radius: 6px; padding: 15px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Nieruchomości w systemie</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: 600; color: #2563eb;">${stats.totalProperties}</p>
          </div>

          <div style="background: white; border-radius: 6px; padding: 15px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Aktualizacji w tym tygodniu</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: 600; color: #16a34a;">${stats.uploadsThisWeek}</p>
          </div>

          <div style="background: white; border-radius: 6px; padding: 15px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Ostatnia aktualizacja</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #1e293b;">${stats.lastUpdateDate}</p>
          </div>

          <div style="background: white; border-radius: 6px; padding: 15px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Dostępność endpointów</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600;">${uptimeStatus} (${stats.endpointUptime}%)</p>
          </div>
        </div>
      </div>

      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #0369a1; margin-top: 0; font-size: 16px;">🔗 Endpoint ministerstwa</h3>
        <p style="margin-bottom: 10px; color: #075985; font-size: 14px;">Dane dostępne 24/7:</p>
        <div style="background: white; border-radius: 4px; padding: 10px; font-family: monospace; font-size: 12px; overflow-wrap: break-word;">
          ${xmlUrl}
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Zobacz pełny dashboard
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
        <p>OTO-RAPORT.pl - Automatyczny compliance dla deweloperów</p>
        <p>Otrzymujesz ten email jako cotygodniowe podsumowanie.</p>
      </div>
    </body>
    </html>
  `

  let text = `
📊 Tygodniowy raport compliance OTO-RAPORT

Witaj ${developer.company_name || developer.email}!

Podsumowanie za ostatni tydzień:

📈 Nieruchomości: ${stats.totalProperties}
📤 Aktualizacji: ${stats.uploadsThisWeek}
📅 Ostatnia aktualizacja: ${stats.lastUpdateDate}
🔌 Dostępność: ${uptimeStatus} (${stats.endpointUptime}%)

Endpoint ministerstwa:
${xmlUrl}

Dashboard: ${dashboardUrl}

OTO-RAPORT.pl - Automatyczny compliance
  `

  // Add unsubscribe links
  html = addUnsubscribeFooter(html, unsubscribeUrl)
  text = addUnsubscribeFooterText(text, unsubscribeUrl)

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  })
}
