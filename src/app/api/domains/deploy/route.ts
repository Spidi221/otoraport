// API endpoint dla deploymentu presentation pages na custom domains
// POST /api/domains/deploy

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
import { supabaseAdmin } from '@/lib/supabase-single';
import { deployPresentationToDomain } from '@/lib/custom-domains';
import { generatePresentationHTML, calculateMarketStats, generatePriceHistoryChart } from '@/lib/presentation-generator';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('id', auth.developer.id)
      .single();

    if (devError || !developer) {
      return NextResponse.json(
        { success: false, error: 'Developer profile not found' },
        { status: 404 }
      );
    }

    // Check if user has Enterprise plan
    if (developer.subscription_plan !== 'enterprise') {
      return NextResponse.json(
        {
          success: false,
          error: 'Custom domains require Enterprise plan',
          current_plan: developer.subscription_plan
        },
        { status: 403 }
      );
    }

    // Check if custom domain is configured
    if (!developer.custom_domain) {
      return NextResponse.json(
        {
          success: false,
          error: 'No custom domain configured. Setup domain first.',
          action_required: 'setup_domain'
        },
        { status: 400 }
      );
    }

    // Get all projects and properties for this developer
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        name,
        description,
        location,
        properties (
          id,
          apartment_number,
          area,
          final_price,
          price_per_m2,
          floor,
          rooms,
          status,
          building_number,
          created_at,
          updated_at
        )
      `)
      .eq('developer_id', developer.id)
      .eq('status', 'active');

    if (projectsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to load project data' },
        { status: 500 }
      );
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No projects found. Add at least one project with properties first.',
          action_required: 'add_projects'
        },
        { status: 400 }
      );
    }

    // Flatten all properties from all projects
    const allProperties = projects.flatMap(project =>
      project.properties?.map(prop => ({
        ...prop,
        property_number: prop.apartment_number,
        total_price: prop.final_price
      })) || []
    );

    if (allProperties.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No properties found. Add properties to your projects first.',
          action_required: 'add_properties'
        },
        { status: 400 }
      );
    }

    // Prepare presentation data
    const presentationData = {
      developer: {
        name: developer.company_name,
        nip: developer.nip || '',
        phone: developer.phone,
        email: developer.email
      },
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        location: project.location,
        properties: project.properties?.map(prop => ({
          id: prop.id,
          property_number: prop.apartment_number,
          area: prop.area,
          total_price: prop.final_price,
          price_per_m2: prop.price_per_m2,
          floor: prop.floor,
          rooms: prop.rooms,
          status: prop.status,
          building_number: prop.building_number,
          created_at: prop.created_at,
          updated_at: prop.updated_at
        })) || []
      })),
      totalProperties: allProperties.length,
      avgPrice: allProperties.reduce((sum, prop) => sum + (prop.total_price || 0), 0) / allProperties.length,
      priceRange: {
        min: Math.min(...allProperties.map(prop => prop.total_price || 0)),
        max: Math.max(...allProperties.map(prop => prop.total_price || 0))
      },
      generatedAt: new Date().toISOString(),
      presentationUrl: developer.custom_domain
    };

    // Generate HTML content
    const htmlContent = generatePresentationHTML(presentationData);

    // Deploy to custom domain
    const deploymentResult = await deployPresentationToDomain(
      developer.id,
      htmlContent,
      developer.custom_domain
    );

    if (!deploymentResult.success) {
      return NextResponse.json(deploymentResult, { status: 400 });
    }

    // Log successful deployment
    console.log(`✅ Presentation deployed successfully: ${deploymentResult.url} for developer: ${developer.company_name}`);

    return NextResponse.json({
      success: true,
      url: deploymentResult.url,
      domain: developer.custom_domain,
      propertiesCount: allProperties.length,
      projectsCount: projects.length,
      deployedAt: new Date().toISOString(),
      message: `Strona prezentacyjna została wdrożona na ${developer.custom_domain}`
    });

  } catch (error) {
    console.error('Deployment API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during deployment'
      },
      { status: 500 }
    );
  }
}

// GET /api/domains/deploy - get deployment status
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get developer profile
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('custom_domain, presentation_url, presentation_generated_at, subscription_plan')
      .eq('id', auth.developer.id)
      .single();

    if (!developer) {
      return NextResponse.json(
        { success: false, error: 'Developer profile not found' },
        { status: 404 }
      );
    }

    const hasEnterprise = developer.subscription_plan === 'enterprise';
    const hasCustomDomain = !!developer.custom_domain;
    const hasDeployment = !!developer.presentation_url;

    return NextResponse.json({
      success: true,
      canDeploy: hasEnterprise && hasCustomDomain,
      hasDeployment,
      domain: developer.custom_domain,
      presentationUrl: developer.presentation_url,
      lastDeployed: developer.presentation_generated_at,
      requirements: {
        enterprisePlan: hasEnterprise,
        customDomain: hasCustomDomain,
        verifiedDomain: hasCustomDomain // TODO: Add real verification check
      }
    });

  } catch (error) {
    console.error('Get deployment status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}