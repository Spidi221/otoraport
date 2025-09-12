import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { developerId, approved } = body

    // Simple auth check - in production this would be more robust
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.MINISTRY_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!developerId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: developerId, approved' },
        { status: 400 }
      )
    }

    // Find developer
    const { data: developer, error: findError } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single()

    if (findError || !developer) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      )
    }

    // Update ministry approval status
    const { error: updateError } = await supabaseAdmin
      .from('developers')
      .update({
        ministry_approved: approved,
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId)

    if (updateError) {
      console.error('Failed to update developer approval status:', updateError)
      return NextResponse.json(
        { error: 'Database update failed' },
        { status: 500 }
      )
    }

    // Send confirmation email to developer
    try {
      if (approved) {
        await sendEmail({
          to: developer.email,
          subject: `✅ Potwierdzenie rejestracji w systemie ministerstwa - ${developer.company_name || developer.name}`,
          html: `
            <h1>✅ SUKCES! Rejestracja zatwierdzona</h1>
            
            <p>Dzień dobry ${developer.name},</p>
            
            <p>Mamy doskonałe wiadomości! Ministerstwo potwierdziło rejestrację <strong>${developer.company_name || developer.name}</strong> w systemie automatycznego pobierania danych.</p>
            
            <h3>Co to oznacza?</h3>
            <ul>
              <li>✅ Twoje raporty są już automatycznie pobierane przez ministerstwo</li>
              <li>✅ Spełniasz wymogi ustawy bez dodatkowych działań</li>
              <li>✅ System OTORAPORT będzie działał w pełni automatycznie</li>
              <li>✅ Otrzymasz powiadomienia o każdej zmianie danych</li>
            </ul>
            
            <p><strong>Gratulacje!</strong> Twój proces onboardingu został zakończony pomyślnie.</p>
            
            <p>Zespół OTORAPORT</p>
          `,
          text: `
✅ SUKCES! - Rejestracja zatwierdzona

Dzień dobry ${developer.name},

Ministerstwo potwierdziło rejestrację ${developer.company_name || developer.name} w systemie automatycznego pobierania danych.

CO TO OZNACZA:
✅ Raporty automatycznie pobierane przez ministerstwo  
✅ Spełniasz wymogi ustawy
✅ System OTORAPORT działa w pełni automatycznie
✅ Powiadomienia o zmianach danych

Gratulacje! Onboarding zakończony pomyślnie.

Zespół OTORAPORT
          `
        })
      } else {
        // Send rejection email
        await sendEmail({
          to: developer.email,
          subject: `❌ Rejestracja w systemie ministerstwa wymaga dodatkowych informacji`,
          html: `
            <h1>❌ Rejestracja wymaga dodatkowych informacji</h1>
            
            <p>Dzień dobry ${developer.name},</p>
            
            <p>Ministerstwo wymaga dodatkowych informacji w sprawie rejestracji <strong>${developer.company_name || developer.name}</strong> w systemie automatycznego pobierania danych.</p>
            
            <p>Prosimy o kontakt z ministerством w celu wyjaśnienia wymaganych dokumentów.</p>
            
            <p>Zespół OTORAPORT</p>
          `,
          text: `
❌ Rejestracja wymaga dodatkowych informacji

Ministerstwo wymaga dodatkowych informacji dla ${developer.company_name || developer.name}.

Prosimy o kontakt z ministerством.

Zespół OTORAPORT
          `
        })
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the API call because of email error
    }

    return NextResponse.json({
      success: true,
      message: `Developer ${approved ? 'approved' : 'rejected'} successfully`,
      developerId,
      approved
    })

  } catch (error) {
    console.error('Ministry confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}