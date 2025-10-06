/**
 * Email Preferences Checker
 * Utilities for checking if a developer should receive specific email types
 */

import { createClient } from '@/lib/supabase/server'

export type EmailType =
  | 'weekly_digest'
  | 'data_staleness_alert'
  | 'endpoint_health_alert'
  | 'support_update'
  | 'marketing'
  | 'upload_confirmation'

interface Developer {
  id: string
  email: string
  email_notifications_enabled?: boolean
  email_weekly_digest?: boolean
  email_data_staleness_alerts?: boolean
  email_endpoint_health_alerts?: boolean
  email_support_updates?: boolean
  email_marketing?: boolean
}

/**
 * Check if a developer should receive a specific type of email
 */
export async function shouldSendEmail(
  developerId: string,
  emailType: EmailType
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data: developer, error } = await supabase
      .from('developers')
      .select(`
        email_notifications_enabled,
        email_weekly_digest,
        email_data_staleness_alerts,
        email_endpoint_health_alerts,
        email_support_updates,
        email_marketing
      `)
      .eq('id', developerId)
      .single()

    if (error || !developer) {
      console.error('❌ Error checking email preferences:', error)
      // Default to sending if we can't check preferences (safety fallback)
      return true
    }

    // Master toggle - if disabled, no emails at all
    if (developer.email_notifications_enabled === false) {
      console.log(`⏭️ Email notifications disabled for developer ${developerId}`)
      return false
    }

    // Check specific email type preference
    switch (emailType) {
      case 'weekly_digest':
        return developer.email_weekly_digest !== false

      case 'data_staleness_alert':
        return developer.email_data_staleness_alerts !== false

      case 'endpoint_health_alert':
        return developer.email_endpoint_health_alerts !== false

      case 'support_update':
        return developer.email_support_updates !== false

      case 'marketing':
        return developer.email_marketing === true // opt-in only

      case 'upload_confirmation':
        // Upload confirmations always sent if master toggle is on
        return true

      default:
        return true
    }
  } catch (error) {
    console.error('❌ Error in shouldSendEmail:', error)
    // Default to sending on error (safety fallback)
    return true
  }
}

/**
 * Get unsubscribe URL for a developer
 */
export async function getUnsubscribeUrl(developerId: string): Promise<string | null> {
  try {
    const supabase = await createClient()

    const { data: developer, error } = await supabase
      .from('developers')
      .select('unsubscribe_token')
      .eq('id', developerId)
      .single()

    if (error || !developer || !developer.unsubscribe_token) {
      console.error('❌ Error getting unsubscribe token:', error)
      return null
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://otoraport.vercel.app'
    return `${baseUrl}/api/unsubscribe?token=${developer.unsubscribe_token}`
  } catch (error) {
    console.error('❌ Error in getUnsubscribeUrl:', error)
    return null
  }
}

/**
 * Add unsubscribe footer to email HTML
 */
export function addUnsubscribeFooter(html: string, unsubscribeUrl: string | null): string {
  if (!unsubscribeUrl) {
    return html
  }

  const footer = `
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">
      <p>
        Nie chcesz otrzymywać tych emaili?
        <a href="${unsubscribeUrl}" style="color: #2563eb; text-decoration: underline;">Wypisz się</a>
      </p>
    </div>
  `

  // Insert footer before closing </body> tag
  return html.replace('</body>', `${footer}</body>`)
}

/**
 * Add unsubscribe footer to plain text email
 */
export function addUnsubscribeFooterText(text: string, unsubscribeUrl: string | null): string {
  if (!unsubscribeUrl) {
    return text
  }

  return `${text}

---
Nie chcesz otrzymywać tych emaili?
Wypisz się: ${unsubscribeUrl}
`
}
