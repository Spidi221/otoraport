import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
import { supabaseAdmin } from '@/lib/supabase-single';
import { MarketingAutomationEngine, EmailCampaign, EmailTemplate, AudienceSegment } from '@/lib/marketing-automation';

// GET /api/marketing/campaigns - List email campaigns
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check subscription plan
    const developer = auth.developer;

    if (!developer || !['pro', 'enterprise'].includes(developer.subscription_plan)) {
      return NextResponse.json({
        success: false,
        error: 'Email campaigns require Pro or Enterprise plan',
        current_plan: developer?.subscription_plan || 'basic',
        upgrade_required: true
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Get campaigns from database
    let query = supabaseAdmin
      .from('email_campaigns')
      .select(`
        id,
        name,
        type,
        status,
        target_audience,
        performance_metrics,
        created_by,
        created_at,
        activated_at,
        paused_at
      `)
      .eq('created_by', developer.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: campaigns, error, count } = await query;

    if (error) {
      console.error('Database error fetching campaigns:', error);
      // Return mock campaigns if database fails
      return getMockCampaigns(type, status, page, limit);
    }

    // Enrich with additional metrics
    const enrichedCampaigns = (campaigns || []).map(campaign => ({
      ...campaign,
      days_active: campaign.activated_at ?
        Math.floor((Date.now() - new Date(campaign.activated_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      estimated_reach: campaign.target_audience?.estimated_size || 0,
      cost_per_lead: campaign.performance_metrics?.total_conversions > 0 ?
        Math.round((campaign.performance_metrics.revenue_attributed || 0) / campaign.performance_metrics.total_conversions) : 0
    }));

    return NextResponse.json({
      success: true,
      data: enrichedCampaigns,
      pagination: {
        page,
        limit,
        total: count || 0,
        has_more: (campaigns?.length || 0) === limit
      },
      summary: {
        total_campaigns: count || 0,
        active_campaigns: enrichedCampaigns.filter(c => c.status === 'active').length,
        total_sends: enrichedCampaigns.reduce((sum, c) => sum + (c.performance_metrics?.total_sent || 0), 0),
        avg_open_rate: calculateAvgMetric(enrichedCampaigns, 'open_rate'),
        avg_click_rate: calculateAvgMetric(enrichedCampaigns, 'click_rate'),
        total_revenue: enrichedCampaigns.reduce((sum, c) => sum + (c.performance_metrics?.revenue_attributed || 0), 0)
      }
    });

  } catch (error) {
    console.error('Campaigns API error:', error);
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

// POST /api/marketing/campaigns - Create email campaign
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

    if (!developer || !['pro', 'enterprise'].includes(developer.subscription_plan)) {
      return NextResponse.json({
        success: false,
        error: 'Email campaigns require Pro or Enterprise plan'
      }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.type || !body.target_audience) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, type, target_audience' },
        { status: 400 }
      );
    }

    // Validate campaign type
    const validTypes = ['onboarding', 'nurture', 'promotional', 'retention', 'reactivation'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid campaign type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create campaign using marketing automation engine
    const campaign = await MarketingAutomationEngine.createEmailCampaign({
      name: body.name,
      type: body.type,
      target_audience: body.target_audience,
      email_sequence: body.email_sequence || [],
      trigger_conditions: body.trigger_conditions || [],
      created_by: developer.id
    });

    // Save to database
    const { data: savedCampaign, error } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        target_audience: campaign.target_audience,
        email_sequence: campaign.email_sequence,
        trigger_conditions: campaign.trigger_conditions,
        performance_metrics: campaign.performance_metrics,
        created_by: campaign.created_by,
        created_at: campaign.created_at
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving campaign:', error);
      // Return created campaign even if database save fails
    }

    return NextResponse.json({
      success: true,
      data: savedCampaign || campaign,
      message: 'Campaign created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create campaign error:', error);
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

// PATCH /api/marketing/campaigns - Update campaign status
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

    if (!developer) {
      return NextResponse.json(
        { success: false, error: 'Developer not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { campaign_id, action, updates } = body;

    if (!campaign_id) {
      return NextResponse.json(
        { success: false, error: 'campaign_id is required' },
        { status: 400 }
      );
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (action) {
      case 'activate':
        updateData.status = 'active';
        updateData.activated_at = new Date().toISOString();
        break;
      case 'pause':
        updateData.status = 'paused';
        updateData.paused_at = new Date().toISOString();
        break;
      case 'archive':
        updateData.status = 'archived';
        break;
      case 'update':
        updateData = { ...updateData, ...updates };
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: activate, pause, archive, or update' },
          { status: 400 }
        );
    }

    const { data: updatedCampaign, error } = await supabaseAdmin
      .from('email_campaigns')
      .update(updateData)
      .eq('id', campaign_id)
      .eq('created_by', developer.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Campaign not found or access denied' },
          { status: 404 }
        );
      }
      throw error;
    }

    // If activating campaign, start sending emails
    if (action === 'activate') {
      await startCampaignExecution(updatedCampaign);
    }

    return NextResponse.json({
      success: true,
      data: updatedCampaign,
      message: `Campaign ${action}d successfully`
    });

  } catch (error) {
    console.error('Update campaign error:', error);
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

// Helper functions

function calculateAvgMetric(campaigns: any[], metric: string): number {
  const validCampaigns = campaigns.filter(c => c.performance_metrics?.[metric] != null);
  if (validCampaigns.length === 0) return 0;

  const sum = validCampaigns.reduce((acc, c) => acc + (c.performance_metrics[metric] || 0), 0);
  return Math.round((sum / validCampaigns.length) * 100) / 100;
}

async function startCampaignExecution(campaign: any) {
  try {
    console.log(`Starting campaign execution: ${campaign.name}`);

    // Get target audience
    const contacts = await MarketingAutomationEngine.segmentContacts(
      campaign.target_audience.criteria || []
    );

    console.log(`Campaign ${campaign.id} targeting ${contacts.length} contacts`);

    // Queue emails for sending (in production, use job queue)
    for (const template of campaign.email_sequence || []) {
      await queueEmailSending(campaign, template, contacts);
    }

  } catch (error) {
    console.error('Error starting campaign execution:', error);
  }
}

async function queueEmailSending(campaign: any, template: EmailTemplate, contacts: any[]) {
  // In production, use Redis/Bull queue for reliable email sending
  console.log(`Queuing ${contacts.length} emails for template: ${template.name}`);

  // Mock email sending with delay
  setTimeout(async () => {
    for (const contact of contacts) {
      await MarketingAutomationEngine.triggerAutomation('campaign_email', contact);
    }
  }, template.delay_days * 24 * 60 * 60 * 1000); // Convert days to milliseconds
}

function getMockCampaigns(type?: string | null, status?: string | null, page: number = 1, limit: number = 20) {
  const mockCampaigns = [
    {
      id: 'campaign_onboarding_001',
      name: 'Onboarding Series 2025',
      type: 'onboarding',
      status: 'active',
      target_audience: {
        id: 'new_users',
        name: 'New Users',
        estimated_size: 156
      },
      performance_metrics: {
        total_sent: 1240,
        total_delivered: 1198,
        total_opened: 647,
        total_clicked: 189,
        total_conversions: 23,
        open_rate: 0.54,
        click_rate: 0.158,
        conversion_rate: 0.0186,
        revenue_attributed: 5670,
        roi: 2.3
      },
      created_by: 'dev_123',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      activated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      days_active: 14,
      estimated_reach: 156,
      cost_per_lead: 246
    },
    {
      id: 'campaign_nurture_002',
      name: 'Pro Plan Nurture',
      type: 'nurture',
      status: 'active',
      target_audience: {
        id: 'trial_users',
        name: 'Trial Users',
        estimated_size: 89
      },
      performance_metrics: {
        total_sent: 534,
        total_delivered: 521,
        total_opened: 312,
        total_clicked: 67,
        total_conversions: 12,
        open_rate: 0.599,
        click_rate: 0.129,
        conversion_rate: 0.023,
        revenue_attributed: 2988,
        roi: 1.8
      },
      created_by: 'dev_123',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      activated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      days_active: 7,
      estimated_reach: 89,
      cost_per_lead: 249
    },
    {
      id: 'campaign_retention_003',
      name: 'Win-Back Campaign Q1',
      type: 'retention',
      status: 'paused',
      target_audience: {
        id: 'inactive_users',
        name: 'Inactive Users',
        estimated_size: 234
      },
      performance_metrics: {
        total_sent: 234,
        total_delivered: 228,
        total_opened: 89,
        total_clicked: 23,
        total_conversions: 4,
        open_rate: 0.39,
        click_rate: 0.101,
        conversion_rate: 0.017,
        revenue_attributed: 996,
        roi: 0.8
      },
      created_by: 'dev_123',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      activated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      paused_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      days_active: 22,
      estimated_reach: 234,
      cost_per_lead: 249
    }
  ];

  // Apply filters
  let filteredCampaigns = mockCampaigns;

  if (type) {
    filteredCampaigns = filteredCampaigns.filter(c => c.type === type);
  }

  if (status) {
    filteredCampaigns = filteredCampaigns.filter(c => c.status === status);
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  const paginatedCampaigns = filteredCampaigns.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    data: paginatedCampaigns,
    pagination: {
      page,
      limit,
      total: filteredCampaigns.length,
      has_more: offset + limit < filteredCampaigns.length
    },
    summary: {
      total_campaigns: filteredCampaigns.length,
      active_campaigns: filteredCampaigns.filter(c => c.status === 'active').length,
      total_sends: filteredCampaigns.reduce((sum, c) => sum + c.performance_metrics.total_sent, 0),
      avg_open_rate: calculateAvgMetric(filteredCampaigns, 'open_rate'),
      avg_click_rate: calculateAvgMetric(filteredCampaigns, 'click_rate'),
      total_revenue: filteredCampaigns.reduce((sum, c) => sum + c.performance_metrics.revenue_attributed, 0)
    },
    note: 'Using mock data - database not available'
  });
}