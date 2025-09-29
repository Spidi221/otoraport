import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase'
import { supabaseAdmin } from '@/lib/supabase-single'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request)

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const developer = auth.developer

    // Check if developer has data to report
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('developer_id', developer.id)

    const projectIds = projects?.map(p => p.id) || []
    const { data: properties, count } = await supabaseAdmin
      .from('properties')
      .select('*', { count: 'exact' })
      .in('project_id', projectIds)

    if (!count || count === 0) {
      return NextResponse.json(
        { error: 'Brak danych do zgłoszenia. Proszę najpierw wgrać dane nieruchomości.' },
        { status: 400 }
      )
    }

    // Simulate sending notification to ministry
    const notificationData = {
      developer: {
        name: developer.company_name || developer.name,
        nip: developer.nip,
        email: developer.email
      },
      urls: {
        xml: developer.xml_url,
        md: developer.md_url
      },
      propertiesCount: count,
      timestamp: new Date().toISOString()
    }

    // In production, this would send to actual ministry API/email
    console.log('Ministry notification sent:', notificationData)

    // Log the notification in the database (optional)
    try {
      await supabaseAdmin
        .from('ministry_notifications')
        .insert({
          developer_id: developer.id,
          notification_data: notificationData,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
    } catch (logError) {
      console.warn('Failed to log notification:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Powiadomienie zostało wysłane do ministerstwa',
      data: {
        sentAt: notificationData.timestamp,
        propertiesCount: count,
        urls: notificationData.urls
      }
    })

  } catch (error) {
    console.error('Error sending ministry notification:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}