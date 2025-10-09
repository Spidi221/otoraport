/**
 * Unsubscribe API Endpoint
 * One-click unsubscribe from all emails using token
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/unsubscribe?token={unsubscribe_token}
 * Unsubscribe from all emails using token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Błąd - OTO-RAPORT</title>
          <style>
            body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; }
            .error { background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 30px; text-align: center; }
            h1 { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Brakujący token</h1>
            <p>Link do wypisania się jest nieprawidłowy. Upewnij się, że kopiujesz pełny link z emaila.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      )
    }

    const supabase = await createClient()

    // Find developer by unsubscribe token
    const { data: developer, error: findError } = await supabase
      .from('developers')
      .select('id, email, company_name')
      .eq('unsubscribe_token', token)
      .single()

    if (findError || !developer) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Błąd - OTO-RAPORT</title>
          <style>
            body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; }
            .error { background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 30px; text-align: center; }
            h1 { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Nieprawidłowy token</h1>
            <p>Link do wypisania się jest nieprawidłowy lub wygasł.</p>
            <p>Jeśli nadal chcesz wypisać się z newslettera, skontaktuj się z support@oto-raport.pl</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      )
    }

    // Disable all email notifications
    const { error: updateError } = await supabase
      .from('developers')
      .update({
        email_notifications_enabled: false,
        email_weekly_digest: false,
        email_data_staleness_alerts: false,
        email_endpoint_health_alerts: false,
        email_support_updates: false,
        email_marketing: false
      })
      .eq('id', developer.id)

    if (updateError) {
      console.error('❌ Error unsubscribing:', updateError)
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Błąd - OTO-RAPORT</title>
          <style>
            body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; }
            .error { background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 30px; text-align: center; }
            h1 { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Wystąpił błąd</h1>
            <p>Nie udało się wypisać Cię z newslettera. Spróbuj ponownie później.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      )
    }

    // Success page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Wypisano z newslettera - OTO-RAPORT</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            padding: 20px;
            line-height: 1.6;
          }
          .success {
            background: #dcfce7;
            border: 2px solid #16a34a;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
          }
          h1 { color: #15803d; margin-top: 0; }
          p { color: #166534; margin: 15px 0; }
          .info { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin-top: 30px; text-align: left; }
          .info h3 { color: #0369a1; margin-top: 0; }
          .info ul { color: #075985; }
          a { color: #2563eb; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅ Wypisano z newslettera</h1>
          <p>Nie będziesz już otrzymywać emaili od OTO-RAPORT.</p>
          <p><strong>Konto:</strong> ${developer.email}</p>
        </div>

        <div class="info">
          <h3>📋 Co się zmieniło?</h3>
          <ul>
            <li>✅ Wyłączono wszystkie powiadomienia email</li>
            <li>✅ Wyłączono tygodniowe podsumowania</li>
            <li>✅ Wyłączono alerty ministerstwa</li>
            <li>✅ Wyłączono newsletter marketingowy</li>
          </ul>

          <p><strong>💡 Możesz w każdej chwili włączyć powiadomienia ponownie w <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings">ustawieniach dashboardu</a>.</strong></p>
        </div>

        <div style="text-align: center; margin-top: 40px; font-size: 14px; color: #6b7280;">
          <p>OTO-RAPORT.pl - Automatyczny compliance dla deweloperów</p>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    )

  } catch (error) {
    console.error('❌ Unsubscribe error:', error)
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Błąd - OTO-RAPORT</title>
        <style>
          body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; }
          .error { background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 30px; text-align: center; }
          h1 { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>❌ Wystąpił błąd</h1>
          <p>Przepraszamy, wystąpił problem. Spróbuj ponownie później.</p>
        </div>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    )
  }
}
