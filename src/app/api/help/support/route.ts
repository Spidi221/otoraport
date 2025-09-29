import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
import { supabaseAdmin } from '@/lib/supabase-single';
import { InAppHelpSystem, HelpContext } from '@/lib/help-system';
import { sendEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subject, description, priority = 'medium', context } = await request.json();

    if (!subject || !description) {
      return NextResponse.json(
        { success: false, error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    // Get user info
    const developer = auth.developer;

    // Validate and sanitize context
    const helpContext: HelpContext = {
      page: context?.page || 'unknown',
      section: context?.section || 'unknown',
      user_action: context?.user_action || 'unknown',
      subscription_plan: developer.subscription_plan,
      onboarding_step: context?.onboarding_step || 0,
      feature_flags: Array.isArray(context?.feature_flags) ? context.feature_flags : []
    };

    // Create support ticket
    const ticket = await InAppHelpSystem.createSupportTicket(
      developer.id,
      subject,
      description,
      helpContext,
      priority
    );

    // Save ticket to database
    const { data: savedTicket, error: saveError } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        id: ticket.id,
        user_id: developer.id,
        user_email: auth.user.email,
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        category: ticket.category,
        context_data: helpContext,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving support ticket:', saveError);
      // Continue anyway - we can still process the ticket manually
    }

    // Send email notification to support team
    const supportEmail = `
Nowy ticket wsparcia od ${developer.company_name}

SZCZEGÓŁY ZGŁOSZENIA:
- ID Ticket: ${ticket.id}
- Użytkownik: ${auth.user.email}
- Firma: ${developer.company_name}
- Plan: ${developer.subscription_plan}
- Priorytet: ${priority}
- Kategoria: ${ticket.category}

TEMAT: ${subject}

OPIS:
${description}

KONTEKST APLIKACJI:
- Strona: ${helpContext.page}
- Sekcja: ${helpContext.section}
- Akcja: ${helpContext.user_action}
- Krok onboardingu: ${helpContext.onboarding_step}

DANE KONTAKTOWE:
- Email: ${auth.user.email}
- Telefon: ${developer.phone || 'Nie podano'}

Link do ticketu: ${process.env.NEXTAUTH_URL}/admin/tickets/${ticket.id}
    `;

    try {
      await sendEmail({
        to: process.env.SUPPORT_EMAIL || 'support@otoraport.pl',
        subject: `[${priority.toUpperCase()}] ${ticket.category} - ${subject}`,
        text: supportEmail,
        replyTo: auth.user.email
      });
    } catch (emailError) {
      console.error('Error sending support email:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to user
    const confirmationEmail = `
Dziękujemy za zgłoszenie!

Otrzymaliśmy Twoje zgłoszenie i zajmiemy się nim w najkrótszym możliwym czasie.

SZCZEGÓŁY ZGŁOSZENIA:
- ID Ticket: ${ticket.id}
- Temat: ${subject}
- Priorytet: ${priority}
- Status: Otwarte

Czas odpowiedzi:
- Niski priorytet: do 48 godzin
- Średni priorytet: do 24 godzin
- Wysoki priorytet: do 8 godzin
- Pilne: do 2 godzin

Jeśli masz dodatkowe pytania, odpowiedz na ten email podając numer ticket: ${ticket.id}

Zespół DevReporter
    `;

    try {
      await sendEmail({
        to: auth.user.email,
        subject: `Potwierdzenie zgłoszenia #${ticket.id} - ${subject}`,
        text: confirmationEmail,
        from: process.env.SUPPORT_EMAIL || 'support@otoraport.pl'
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    // For high priority tickets, send additional alerts
    if (priority === 'urgent' || priority === 'high') {
      // In production, send SMS or Slack notification
      console.log(`HIGH PRIORITY TICKET: ${ticket.id} - ${subject}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        ticket_id: ticket.id,
        status: ticket.status,
        estimated_response_time: getEstimatedResponseTime(priority),
        category: ticket.category
      },
      message: 'Support ticket created successfully. You will receive confirmation via email.'
    });

  } catch (error) {
    console.error('Support ticket creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while creating support ticket',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's support tickets
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get developer ID
    const developer = auth.developer;

    // Build query
    let query = supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('user_id', developer.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: tickets, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: tickets || [],
      metadata: {
        total: tickets?.length || 0,
        limit,
        offset,
        has_more: (tickets?.length || 0) === limit
      }
    });

  } catch (error) {
    console.error('Support tickets fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching support tickets',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function getEstimatedResponseTime(priority: string): string {
  switch (priority) {
    case 'urgent': return '2 hours';
    case 'high': return '8 hours';
    case 'medium': return '24 hours';
    case 'low': return '48 hours';
    default: return '24 hours';
  }
}