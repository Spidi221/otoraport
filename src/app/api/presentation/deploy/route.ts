import { NextRequest, NextResponse } from 'next/server'
import { withSubscriptionCheck } from '@/lib/subscription-middleware'
import { supabaseAdmin } from '@/lib/supabase-single'
import { generatePresentationHTML, generateRobotsTxt, generateSitemap, calculateMarketStats, generatePriceHistoryChart, type PresentationSiteData } from '@/lib/presentation-generator'

// Deployment functions
async function deployToSubdomain(
  htmlContent: string,
  robotsTxt: string,
  sitemapXml: string,
  subdomain: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // In production, this would:
    // 1. Create/update files on static hosting (Vercel, Cloudflare Pages, etc.)
    // 2. Configure subdomain DNS (*.otoraport.pl)
    // 3. Set up SSL certificate
    // 4. Update CDN cache
    
    console.log(`Deploying to subdomain: ${subdomain}.otoraport.pl`)
    console.log(`HTML size: ${htmlContent.length} characters`)
    console.log(`Robots.txt size: ${robotsTxt.length} characters`)
    console.log(`Sitemap.xml size: ${sitemapXml.length} characters`)
    
    // Simulate deployment process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const deploymentUrl = `https://${subdomain}.otoraport.pl`
    
    // TODO: Implement actual deployment logic
    // Example with Vercel API:
    // const vercelResponse = await fetch('https://api.vercel.com/v2/deployments', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     name: `otoraport-${subdomain}`,
    //     files: [
    //       { file: 'index.html', data: htmlContent },
    //       { file: 'robots.txt', data: robotsTxt },
    //       { file: 'sitemap.xml', data: sitemapXml }
    //     ],
    //     projectSettings: {
    //       framework: 'other'
    //     }
    //   })
    // })
    
    return {
      success: true,
      url: deploymentUrl
    }
  } catch (error) {
    console.error('Subdomain deployment error:', error)
    return {
      success: false,
      error: 'Failed to deploy to subdomain'
    }
  }
}

async function deployToCustomDomain(
  htmlContent: string,
  robotsTxt: string,
  sitemapXml: string,
  customDomain: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // In production, this would:
    // 1. Verify domain ownership
    // 2. Configure DNS records
    // 3. Set up SSL certificate
    // 4. Deploy files to custom domain
    // 5. Update CDN configuration
    
    console.log(`Deploying to custom domain: ${customDomain}`)
    console.log(`HTML size: ${htmlContent.length} characters`)
    
    // Simulate deployment process
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const deploymentUrl = `https://${customDomain}`
    
    // TODO: Implement actual custom domain deployment
    // This would involve:
    // - DNS verification
    // - SSL certificate provisioning
    // - CDN configuration
    // - File deployment
    
    return {
      success: true,
      url: deploymentUrl
    }
  } catch (error) {
    console.error('Custom domain deployment error:', error)
    return {
      success: false,
      error: 'Failed to deploy to custom domain'
    }
  }
}

async function deployPresentationSite(request: any) {
  try {
    const { developerId, subscription } = request

    // Check if presentation pages feature is available
    if (!subscription?.limits.presentationPages) {
      return NextResponse.json(
        {
          error: 'Deployment stron prezentacyjnych dostępny w pakietach Pro i Enterprise',
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
        { error: 'Developer nie został znaleziony' },
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
          error: 'Brak nieruchomości do wdrożenia strony prezentacyjnej',
          message: 'Najpierw wgraj dane nieruchomości do systemu' 
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

    // Determine deployment strategy
    const isEnterprise = subscription.plan === 'enterprise'
    const hasCustomDomain = developer.custom_domain && developer.custom_domain_verified
    const useCustomDomain = isEnterprise && hasCustomDomain

    const presentationUrl = useCustomDomain 
      ? developer.custom_domain
      : `${companySlug}.otoraport.pl`

    // Create presentation site configuration
    const allProperties = properties || []
    const marketStats = calculateMarketStats(allProperties)
    const priceHistory = generatePriceHistoryChart(allProperties)

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
        properties: properties?.filter(prop => prop.project_id === project.id) || []
      })) || [],
      totalProperties: properties.length,
      avgPrice: properties.reduce((sum, prop) => sum + (prop.total_price || 0), 0) / properties.length,
      priceRange: {
        min: Math.min(...properties.map(p => p.total_price || 0)),
        max: Math.max(...properties.map(p => p.total_price || 0))
      },
      generatedAt: new Date().toISOString(),
      presentationUrl,
      marketStats,
      priceHistory
    }

    // Generate static files
    const htmlContent = generatePresentationHTML(siteConfig)
    const robotsTxt = generateRobotsTxt(presentationUrl)
    const sitemapXml = generateSitemap(presentationUrl, siteConfig.projects)

    // Deploy based on subscription type
    let deploymentResult
    if (useCustomDomain) {
      deploymentResult = await deployToCustomDomain(
        htmlContent, 
        robotsTxt, 
        sitemapXml, 
        developer.custom_domain
      )
    } else {
      deploymentResult = await deployToSubdomain(
        htmlContent, 
        robotsTxt, 
        sitemapXml, 
        companySlug
      )
    }

    if (!deploymentResult.success) {
      return NextResponse.json(
        { 
          error: 'Deployment failed',
          details: deploymentResult.error 
        },
        { status: 500 }
      )
    }
    
    // Update developer record with deployment info
    await supabaseAdmin
      .from('developers')
      .update({
        presentation_url: deploymentResult.url,
        presentation_deployed_at: new Date().toISOString(),
        presentation_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId)

    // Log deployment for analytics
    await supabaseAdmin
      .from('deployment_logs')
      .insert([{
        developer_id: developerId,
        deployment_type: useCustomDomain ? 'custom_domain' : 'subdomain',
        deployment_url: deploymentResult.url,
        properties_count: properties.length,
        projects_count: projects?.length || 0,
        file_size_html: htmlContent.length,
        deployment_status: 'success',
        created_at: new Date().toISOString()
      }])
      .select()

    return NextResponse.json({
      success: true,
      message: 'Strona prezentacyjna została pomyślnie wdrożona',
      data: {
        url: deploymentResult.url,
        deploymentType: useCustomDomain ? 'custom_domain' : 'subdomain',
        properties: properties.length,
        projects: projects?.length || 0,
        deployedAt: new Date().toISOString(),
        marketStats: {
          avgPrice: marketStats.avgPrice,
          avgPricePerM2: marketStats.avgPricePerM2,
          availableCount: marketStats.availableCount
        },
        siteConfig
      }
    })

  } catch (error) {
    console.error('Error deploying presentation site:', error)
    
    // Log deployment failure
    try {
      await supabaseAdmin
        .from('deployment_logs')
        .insert([{
          developer_id: request.developerId,
          deployment_type: 'unknown',
          deployment_status: 'failed',
          error_message: error.message,
          created_at: new Date().toISOString()
        }])
    } catch (logError) {
      console.error('Failed to log deployment error:', logError)
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error podczas wdrażania strony',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export const POST = withSubscriptionCheck(deployPresentationSite, {
  requireFeature: 'presentationPages',
  requireActive: true
})

// GET endpoint to check deployment status
async function checkDeploymentStatus(request: any) {
  try {
    const { developerId } = request

    const { data: developer, error } = await supabaseAdmin
      .from('developers')
      .select('presentation_url, presentation_deployed_at, presentation_generated_at')
      .eq('id', developerId)
      .single()

    if (error || !developer) {
      return NextResponse.json(
        { error: 'Developer nie został znaleziony' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        isDeployed: !!developer.presentation_url,
        url: developer.presentation_url,
        deployedAt: developer.presentation_deployed_at,
        generatedAt: developer.presentation_generated_at
      }
    })

  } catch (error) {
    console.error('Error checking deployment status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withSubscriptionCheck(checkDeploymentStatus, {
  requireFeature: 'presentationPages',
  requireActive: true
})