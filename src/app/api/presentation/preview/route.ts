import { NextRequest, NextResponse } from 'next/server'
import { withSubscriptionCheck } from '@/lib/subscription-middleware'
import { supabaseAdmin } from '@/lib/supabase'
import { generatePresentationHTML, type PresentationSiteData } from '@/lib/presentation-generator'

async function previewPresentationSite(request: any) {
  try {
    const { developerId, subscription } = request

    // Check if presentation pages feature is available
    if (!subscription?.limits.presentationPages) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head><title>Funkcja niedostępna</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>🚫 Funkcja niedostępna</h1>
          <p>Strony prezentacyjne dostępne są w pakietach Pro i Enterprise.</p>
          <p>Twój aktualny plan: <strong>${subscription?.plan || 'basic'}</strong></p>
          <a href="/pricing" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Zmień pakiet</a>
        </body>
        </html>`,
        { 
          status: 403,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Get developer data
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single()

    if (devError || !developer) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head><title>Błąd</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Developer nie został znaleziony</h1>
        </body>
        </html>`,
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Get projects and properties
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('developer_id', developerId)

    const projectIds = projects?.map(p => p.id) || []
    const { data: properties } = await supabaseAdmin
      .from('properties')
      .select('*')
      .in('project_id', projectIds)

    if (!properties || properties.length === 0) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head><title>Brak danych</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>📊 Brak danych do wyświetlenia</h1>
          <p>Najpierw wgraj dane nieruchomości do systemu.</p>
          <a href="/upload" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px;">Wgraj dane</a>
        </body>
        </html>`,
        { 
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Generate subdomain based on company name  
    const companySlug = (developer.company_name || developer.name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30)

    const presentationUrl = subscription.plan === 'enterprise' && developer.custom_domain
      ? developer.custom_domain
      : `${companySlug}.cenysync.pl`

    // Create presentation site data
    const siteData: PresentationSiteData = {
      developer: {
        name: developer.company_name || developer.name,
        nip: developer.nip,
        phone: developer.phone,
        email: developer.email
      },
      projects: projects?.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        location: project.location,
        properties: properties?.filter(prop => prop.project_id === project.id)
      })) || [],
      totalProperties: properties.length,
      avgPrice: properties.reduce((sum, prop) => sum + (prop.total_price || 0), 0) / properties.length,
      priceRange: {
        min: Math.min(...properties.map(p => p.total_price || 0)),
        max: Math.max(...properties.map(p => p.total_price || 0))
      },
      generatedAt: new Date().toISOString(),
      presentationUrl
    }

    // Generate and return HTML
    const htmlContent = generatePresentationHTML(siteData)
    
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Error previewing presentation site:', error)
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head><title>Błąd serwera</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>⚠️ Błąd serwera</h1>
        <p>Wystąpił błąd podczas generowania podglądu.</p>
      </body>
      </html>`,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

export const GET = withSubscriptionCheck(previewPresentationSite, {
  requireFeature: 'presentationPages',
  requireActive: true
})