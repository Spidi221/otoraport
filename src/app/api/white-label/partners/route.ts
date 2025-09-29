import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
import { createAdminClient } from '@/lib/supabase/server';
import { WhiteLabelEngine, WhiteLabelPartner } from '@/lib/white-label';

// GET /api/white-label/partners - List or get current partner
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const developer = auth.developer;

    if (!developer) {
      return NextResponse.json(
        { success: false, error: 'Developer not found' },
        { status: 404 }
      );
    }

    // Check if this is an admin request to list all partners
    const { searchParams } = new URL(request.url);
    const listAll = searchParams.get('list') === 'all';

    if (listAll) {
      // Only super admins can list all partners
      if (!['super_admin'].includes(developer.subscription_plan)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      try {
        const { data: partners } = await createAdminClient()
          .from('whitelabel_partners')
          .select('*')
          .order('created_at', { ascending: false });

        return NextResponse.json({
          success: true,
          data: partners || []
        });

      } catch (error) {
        console.error('Error fetching partners:', error);
        return NextResponse.json({
          success: true,
          data: [WhiteLabelEngine.getMockPartnerData()],
          note: 'Using mock data - database not available'
        });
      }
    }

    // Get current user's partner status
    if (developer.is_partner && developer.partner_id) {
      const partner = await WhiteLabelEngine.getPartner(developer.partner_id);

      if (partner) {
        return NextResponse.json({
          success: true,
          data: partner
        });
      }
    }

    // Return mock data if no partner found but enterprise plan
    if (developer.subscription_plan === 'enterprise') {
      return NextResponse.json({
        success: true,
        data: WhiteLabelEngine.getMockPartnerData(),
        note: 'Mock partner data for Enterprise plan'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Not a white-label partner',
      can_become_partner: developer.subscription_plan === 'enterprise'
    }, { status: 404 });

  } catch (error) {
    console.error('Partners API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/white-label/partners - Create new partner
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const developer = auth.developer;

    if (!developer) {
      return NextResponse.json(
        { success: false, error: 'Developer not found' },
        { status: 404 }
      );
    }

    // Only Enterprise customers can become partners
    if (developer.subscription_plan !== 'enterprise') {
      return NextResponse.json({
        success: false,
        error: 'White-label partnership requires Enterprise subscription',
        upgrade_required: true
      }, { status: 403 });
    }

    // Check if already a partner
    if (developer.is_partner) {
      return NextResponse.json({
        success: false,
        error: 'Already a white-label partner'
      }, { status: 409 });
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'company_name', 'contact_name', 'subdomain',
      'brand_name', 'primary_color', 'support_email'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!subdomainRegex.test(body.subdomain)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      );
    }

    // Check subdomain availability
    const existingPartner = await WhiteLabelEngine.getPartnerByDomain(body.subdomain);
    if (existingPartner) {
      return NextResponse.json(
        { success: false, error: 'Subdomain already taken' },
        { status: 409 }
      );
    }

    // Create partner
    const partnerData = {
      company_name: body.company_name,
      contact_email: auth.user.email,
      contact_name: body.contact_name,
      domain: body.domain || '',
      subdomain: body.subdomain,
      logo_url: body.logo_url,
      primary_color: body.primary_color,
      secondary_color: body.secondary_color || body.primary_color,
      brand_name: body.brand_name,
      support_email: body.support_email,
      support_phone: body.support_phone,
      custom_css: body.custom_css,
      features_enabled: body.features_enabled || ['analytics', 'automation'],
      commission_rate: body.commission_rate || 15, // Default 15%
      status: 'pending' as const,
      settings: {
        allow_custom_pricing: body.allow_custom_pricing || false,
        allow_trial_extension: body.allow_trial_extension || false,
        require_approval_for_new_clients: body.require_approval_for_new_clients || true,
        max_clients: body.max_clients || 50,
        custom_onboarding_flow: body.custom_onboarding_flow || false
      }
    };

    const partner = await WhiteLabelEngine.createPartner(partnerData);

    // Update developer record
    await createAdminClient()
      .from('developers')
      .update({
        is_partner: true,
        partner_id: partner.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', developer.id);

    return NextResponse.json({
      success: true,
      data: partner,
      message: 'Partner application submitted successfully. Approval pending.'
    }, { status: 201 });

  } catch (error) {
    console.error('Create partner error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// PATCH /api/white-label/partners - Update partner settings
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const developer = auth.developer;

    if (!developer || !developer.is_partner || !developer.partner_id) {
      return NextResponse.json(
        { success: false, error: 'Not a white-label partner' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...updates } = body;

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (action) {
      case 'update_branding':
        // Update branding elements
        const brandingFields = [
          'logo_url', 'primary_color', 'secondary_color',
          'custom_css', 'support_email', 'support_phone'
        ];

        brandingFields.forEach(field => {
          if (updates[field] !== undefined) {
            updateData[field] = updates[field];
          }
        });

        // Update branding via WhiteLabelEngine
        await WhiteLabelEngine.updatePartnerBranding(developer.partner_id, updateData);
        break;

      case 'update_settings':
        // Update partner settings
        if (updates.settings) {
          updateData.settings = updates.settings;
        }
        break;

      case 'activate':
        updateData.status = 'active';
        updateData.activated_at = new Date().toISOString();
        break;

      case 'suspend':
        updateData.status = 'suspended';
        break;

      default:
        // General update
        Object.assign(updateData, updates);
    }

    const { data: updatedPartner, error } = await createAdminClient()
      .from('whitelabel_partners')
      .update(updateData)
      .eq('id', developer.partner_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: updatedPartner,
      message: 'Partner updated successfully'
    });

  } catch (error) {
    console.error('Update partner error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}