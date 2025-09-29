import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
import { createAdminClient } from '@/lib/supabase/server';
import { MarketingAutomationEngine, MarketingContact } from '@/lib/marketing-automation';

// GET /api/marketing/contacts - List marketing contacts
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin/marketing permissions
    const developer = auth.developer;

    if (!developer) {
      return NextResponse.json(
        { success: false, error: 'Developer profile not found' },
        { status: 404 }
      );
    }

    // Marketing features only available in Pro/Enterprise
    if (!['pro', 'enterprise'].includes(developer.subscription_plan)) {
      return NextResponse.json({
        success: false,
        error: 'Marketing automation requires Pro or Enterprise plan',
        current_plan: developer.subscription_plan,
        upgrade_required: true
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const segment = searchParams.get('segment');
    const search = searchParams.get('search');

    // Get marketing contacts from database
    let query = createAdminClient
      .from('marketing_contacts')
      .select(`
        id,
        email,
        first_name,
        last_name,
        company_name,
        phone,
        lead_source,
        lead_status,
        subscription_interest,
        properties_count,
        estimated_revenue,
        lifecycle_stage,
        tags,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        last_activity_at,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('lead_status', status);
    }

    if (source) {
      query = query.eq('lead_source', source);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: contacts, error, count } = await query;

    if (error) {
      throw error;
    }

    // Filter by segment if specified (client-side filtering for complex criteria)
    let filteredContacts = contacts || [];
    if (segment) {
      const segmentCriteria = getSegmentCriteria(segment);
      if (segmentCriteria.length > 0) {
        filteredContacts = await MarketingAutomationEngine.segmentContacts(segmentCriteria);
      }
    }

    // Calculate additional metrics
    const contactsWithMetrics = filteredContacts.map(contact => ({
      ...contact,
      days_since_created: Math.floor((Date.now() - new Date(contact.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      days_since_activity: Math.floor((Date.now() - new Date(contact.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))
    }));

    return NextResponse.json({
      success: true,
      data: contactsWithMetrics,
      pagination: {
        page,
        limit,
        total: count || filteredContacts.length,
        has_more: filteredContacts.length === limit
      },
      metadata: {
        total_contacts: count || 0,
        by_status: await getContactsByStatus(),
        by_source: await getContactsBySource(),
        total_estimated_revenue: filteredContacts.reduce((sum, c) => sum + (c.estimated_revenue || 0), 0)
      }
    });

  } catch (error) {
    console.error('Marketing contacts API error:', error);
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

// POST /api/marketing/contacts - Create marketing contact
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if contact already exists
    const { data: existingContact } = await createAdminClient()
      .from('marketing_contacts')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existingContact) {
      return NextResponse.json(
        { success: false, error: 'Contact with this email already exists' },
        { status: 409 }
      );
    }

    // Create contact using marketing automation engine
    const contact = await MarketingAutomationEngine.createContact({
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      company_name: body.company_name,
      phone: body.phone,
      lead_source: body.lead_source || 'manual',
      subscription_interest: body.subscription_interest,
      properties_count: body.properties_count,
      tags: body.tags || [],
      utm_source: body.utm_source,
      utm_medium: body.utm_medium,
      utm_campaign: body.utm_campaign,
      utm_content: body.utm_content
    });

    // Save to database
    const { data: savedContact, error } = await createAdminClient()
      .from('marketing_contacts')
      .insert({
        id: contact.id,
        email: contact.email,
        first_name: contact.first_name,
        last_name: contact.last_name,
        company_name: contact.company_name,
        phone: contact.phone,
        lead_source: contact.lead_source,
        lead_status: contact.lead_status,
        subscription_interest: contact.subscription_interest,
        properties_count: contact.properties_count,
        estimated_revenue: contact.estimated_revenue,
        lifecycle_stage: contact.lifecycle_stage,
        tags: contact.tags,
        utm_source: contact.utm_source,
        utm_medium: contact.utm_medium,
        utm_campaign: contact.utm_campaign,
        utm_content: contact.utm_content,
        last_activity_at: contact.last_activity_at,
        created_at: contact.created_at,
        updated_at: contact.updated_at
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving marketing contact:', error);
      // Return the created contact even if database save fails
    }

    return NextResponse.json({
      success: true,
      data: savedContact || contact,
      message: 'Marketing contact created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create marketing contact error:', error);
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

// PUT /api/marketing/contacts - Bulk update contacts
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contact_ids, updates } = body;

    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'contact_ids array is required' },
        { status: 400 }
      );
    }

    // Bulk update contacts
    const { data: updatedContacts, error } = await createAdminClient()
      .from('marketing_contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .in('id', contact_ids)
      .select();

    if (error) {
      throw error;
    }

    // Trigger automations for status changes
    if (updates.lead_status) {
      for (const contact of updatedContacts || []) {
        await MarketingAutomationEngine.triggerAutomation(`status_changed_to_${updates.lead_status}`, contact);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedContacts,
      message: `Updated ${updatedContacts?.length || 0} contacts`
    });

  } catch (error) {
    console.error('Bulk update contacts error:', error);
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

function getSegmentCriteria(segment: string) {
  const segmentMap = {
    'hot_leads': [
      { field: 'lead_status', operator: 'equals' as const, value: 'hot' },
      { field: 'estimated_revenue', operator: 'greater_than' as const, value: 2000 }
    ],
    'enterprise_prospects': [
      { field: 'properties_count', operator: 'greater_than' as const, value: 30 },
      { field: 'subscription_interest', operator: 'in' as const, value: ['enterprise', 'pro'] }
    ],
    'new_leads': [
      { field: 'lead_status', operator: 'equals' as const, value: 'new' },
      { field: 'created_at', operator: 'greater_than' as const, value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    'inactive_leads': [
      { field: 'last_activity_at', operator: 'less_than' as const, value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  };

  return segmentMap[segment as keyof typeof segmentMap] || [];
}

async function getContactsByStatus() {
  const { data } = await createAdminClient()
    .from('marketing_contacts')
    .select('lead_status')
    .not('lead_status', 'is', null);

  if (!data) return {};

  return data.reduce((acc, contact) => {
    acc[contact.lead_status] = (acc[contact.lead_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

async function getContactsBySource() {
  const { data } = await createAdminClient()
    .from('marketing_contacts')
    .select('lead_source')
    .not('lead_source', 'is', null);

  if (!data) return {};

  return data.reduce((acc, contact) => {
    acc[contact.lead_source] = (acc[contact.lead_source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}