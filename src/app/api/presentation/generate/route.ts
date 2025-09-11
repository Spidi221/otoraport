import { NextRequest, NextResponse } from 'next/server'
import { withSubscriptionCheck } from '@/lib/subscription-middleware'
import { supabaseAdmin } from '@/lib/supabase'
import { generatePresentationHTML, generateRobotsTxt, generateSitemap, type PresentationSiteData } from '@/lib/presentation-generator'

async function generatePresentationSite(request: any) {
  try {
    const { developerId, subscription } = request

    // Check if presentation pages feature is available
    if (!subscription?.limits.presentationPages) {
      return NextResponse.json(
        {
          error: 'Presentation pages are available in Pro and Enterprise plans',
          code: 'FEATURE_RESTRICTED',
          currentPlan: subscription?.plan || 'basic',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      )
    }

    // Get developer data
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single()

    if (devError || !developer) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
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
      return NextResponse.json(
        { 
          error: 'Brak nieruchomości do wygenerowania strony prezentacyjnej',
          message: 'Najpierw wgraj dane nieruchomości' 
        },
        { status: 400 }
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

    // Create presentation site configuration
    const siteConfig: PresentationSiteData = {
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

    // Generate static HTML files
    const htmlContent = generatePresentationHTML(siteConfig)
    const robotsTxt = generateRobotsTxt(presentationUrl)
    const sitemapXml = generateSitemap(presentationUrl, siteConfig.projects)

    // In production, this would deploy to:
    // 1. Static file hosting (Vercel/Cloudflare Pages)
    // 2. Configure subdomain DNS automatically
    // 3. Set up SSL certificate
    // 4. Update CDN cache
    
    // For now, we'll save files to demonstrate functionality
    try {
      // Here you would deploy to your chosen hosting platform
      // For example: await deployToVercel(htmlContent, presentationUrl)
      // Or: await deployToCloudflare(htmlContent, robotsTxt, sitemapXml)
      console.log(`Generated presentation site for ${presentationUrl}`)
      console.log(`HTML size: ${htmlContent.length} characters`)
      console.log(`Properties: ${properties.length}, Projects: ${projects?.length || 0}`)
    } catch (deployError) {
      console.warn('Deployment simulation complete:', deployError)
    }
    
    // Update developer record with presentation URL
    await supabaseAdmin
      .from('developers')
      .update({
        presentation_url: `https://${presentationUrl}`,
        presentation_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId)

    return NextResponse.json({
      success: true,
      message: 'Strona prezentacyjna została wygenerowana',
      data: {
        url: `https://${presentationUrl}`,
        properties: properties.length,
        projects: projects?.length || 0,
        generatedAt: siteConfig.generatedAt,
        htmlSize: htmlContent.length,
        siteConfig
      }
    })

  } catch (error) {
    console.error('Error generating presentation site:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withSubscriptionCheck(generatePresentationSite, {
  requireFeature: 'presentationPages',
  requireActive: true
})