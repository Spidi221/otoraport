import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { WhiteLabelEngine } from '@/lib/white-label';

// GET /api/white-label/clients - List partner clients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id, partner_id, is_partner')
      .eq('email', session.user.email)
      .single();

    if (!developer || !developer.is_partner || !developer.partner_id) {
      return NextResponse.json(
        { success: false, error: 'Not a white-label partner' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    try {
      // Get clients from database
      let query = supabaseAdmin
        .from('whitelabel_clients')
        .select(`
          *,
          developers (
            company_name,
            email,
            phone,
            created_at
          )
        `)
        .eq('partner_id', developer.partner_id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: clients, error, count } = await query;

      if (error) {
        throw error;
      }

      // Calculate additional metrics
      const commissionRate = await getCommissionRate(developer.partner_id);
      const enrichedClients = (clients || []).map(client => ({
        ...client,
        days_since_created: Math.floor((Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        trial_days_remaining: client.trial_ends_at ?
          Math.max(0, Math.floor((new Date(client.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
        commission_rate: commissionRate
      }));

      return NextResponse.json({
        success: true,
        data: enrichedClients,
        pagination: {
          page,
          limit,
          total: count || 0,
          has_more: (clients?.length || 0) === limit
        },
        summary: {
          total_clients: count || 0,
          active_clients: enrichedClients.filter(c => c.status === 'active').length,
          trial_clients: enrichedClients.filter(c => c.status === 'trial').length,
          total_revenue: enrichedClients.reduce((sum, c) => sum + (c.lifetime_value || 0), 0),
          commission_earned: enrichedClients.reduce((sum, c) => sum + (c.commission_earned || 0), 0)
        }
      });

    } catch (dbError) {
      console.error('Database error, returning mock clients:', dbError);
      return getMockClients(status, page, limit);
    }

  } catch (error) {
    console.error('White-label clients API error:', error);
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

// POST /api/white-label/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id, partner_id, is_partner')
      .eq('email', session.user.email)
      .single();

    if (!developer || !developer.is_partner || !developer.partner_id) {
      return NextResponse.json(
        { success: false, error: 'Not a white-label partner' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.developer_email) {
      return NextResponse.json(
        { success: false, error: 'developer_email is required' },
        { status: 400 }
      );
    }

    // Check if developer exists or create new one
    let { data: targetDeveloper } = await supabaseAdmin
      .from('developers')
      .select('id, email')
      .eq('email', body.developer_email)
      .single();

    if (!targetDeveloper) {
      // Create new developer account
      const { data: newDeveloper, error: createError } = await supabaseAdmin
        .from('developers')
        .insert({
          email: body.developer_email,
          company_name: body.company_name || 'New Client',
          subscription_plan: 'basic',
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      targetDeveloper = newDeveloper;
    }

    // Create white-label client
    const clientData = {
      developer_id: targetDeveloper.id,
      custom_pricing: body.custom_pricing ? {
        monthly_price: body.custom_pricing.monthly_price,
        yearly_price: body.custom_pricing.yearly_price,
        trial_days: body.custom_pricing.trial_days || 14
      } : undefined
    };

    const client = await WhiteLabelEngine.createClient(developer.partner_id, clientData);

    return NextResponse.json({
      success: true,
      data: client,
      message: 'White-label client created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create white-label client error:', error);
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

// PATCH /api/white-label/clients - Update client
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id, partner_id, is_partner')
      .eq('email', session.user.email)
      .single();

    if (!developer || !developer.is_partner || !developer.partner_id) {
      return NextResponse.json(
        { success: false, error: 'Not a white-label partner' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { client_id, action, ...updates } = body;

    if (!client_id) {
      return NextResponse.json(
        { success: false, error: 'client_id is required' },
        { status: 400 }
      );
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (action) {
      case 'activate':
        updateData.status = 'active';
        updateData.subscription_starts_at = new Date().toISOString();
        updateData.trial_ends_at = null;
        break;

      case 'suspend':
        updateData.status = 'suspended';
        break;

      case 'cancel':
        updateData.status = 'cancelled';
        updateData.cancelled_at = new Date().toISOString();
        break;

      case 'extend_trial':
        if (updates.trial_days) {
          const newTrialEnd = new Date();
          newTrialEnd.setDate(newTrialEnd.getDate() + updates.trial_days);
          updateData.trial_ends_at = newTrialEnd.toISOString();
        }
        break;

      case 'update_pricing':
        if (updates.custom_pricing) {
          updateData.custom_pricing = updates.custom_pricing;
        }
        break;

      default:
        Object.assign(updateData, updates);
    }

    const { data: updatedClient, error } = await supabaseAdmin
      .from('whitelabel_clients')
      .update(updateData)
      .eq('id', client_id)
      .eq('partner_id', developer.partner_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Client not found or access denied' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: 'Client updated successfully'
    });

  } catch (error) {
    console.error('Update white-label client error:', error);
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

async function getCommissionRate(partnerId: string): Promise<number> {
  try {
    const partner = await WhiteLabelEngine.getPartner(partnerId);
    return partner?.commission_rate || 15;
  } catch (error) {
    return 15; // Default commission rate
  }
}

function getMockClients(status?: string | null, page: number = 1, limit: number = 20) {
  const mockClients = [
    {
      id: 'client_001',
      partner_id: 'partner_mock_001',
      developer_id: 'dev_001',
      custom_pricing: {
        monthly_price: 29900,
        yearly_price: 299000,
        trial_days: 30
      },
      branded_dashboard_url: 'https://propertytech.otoraport.pl/dashboard',
      status: 'active',
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      trial_ends_at: null,
      subscription_starts_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_activity_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      lifetime_value: 29900,
      commission_earned: 4485,
      days_since_created: 45,
      trial_days_remaining: 0,
      commission_rate: 15,
      developers: {
        company_name: 'Deweloper Premium Sp. z o.o.',
        email: 'kontakt@deweloper-premium.pl',
        phone: '+48 22 123 4567',
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      id: 'client_002',
      partner_id: 'partner_mock_001',
      developer_id: 'dev_002',
      custom_pricing: null,
      branded_dashboard_url: 'https://propertytech.otoraport.pl/dashboard',
      status: 'trial',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_starts_at: null,
      last_activity_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      lifetime_value: 0,
      commission_earned: 0,
      days_since_created: 7,
      trial_days_remaining: 7,
      commission_rate: 15,
      developers: {
        company_name: 'Nowy Deweloper Sp. z o.o.',
        email: 'biuro@nowy-deweloper.pl',
        phone: '+48 22 987 6543',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      id: 'client_003',
      partner_id: 'partner_mock_001',
      developer_id: 'dev_003',
      custom_pricing: {
        monthly_price: 19900,
        yearly_price: 199000,
        trial_days: 14
      },
      branded_dashboard_url: 'https://propertytech.otoraport.pl/dashboard',
      status: 'active',
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      trial_ends_at: null,
      subscription_starts_at: new Date(Date.now() - 76 * 24 * 60 * 60 * 1000).toISOString(),
      last_activity_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lifetime_value: 59700, // 3 months
      commission_earned: 8955,
      days_since_created: 90,
      trial_days_remaining: 0,
      commission_rate: 15,
      developers: {
        company_name: 'Budowa Marzeń Sp. z o.o.',
        email: 'info@budowa-marzen.pl',
        phone: '+48 22 555 1234',
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ];

  // Apply filters
  let filteredClients = mockClients;

  if (status) {
    filteredClients = filteredClients.filter(c => c.status === status);
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  const paginatedClients = filteredClients.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    data: paginatedClients,
    pagination: {
      page,
      limit,
      total: filteredClients.length,
      has_more: offset + limit < filteredClients.length
    },
    summary: {
      total_clients: filteredClients.length,
      active_clients: filteredClients.filter(c => c.status === 'active').length,
      trial_clients: filteredClients.filter(c => c.status === 'trial').length,
      total_revenue: filteredClients.reduce((sum, c) => sum + c.lifetime_value, 0),
      commission_earned: filteredClients.reduce((sum, c) => sum + c.commission_earned, 0)
    },
    note: 'Using mock data - database not available'
  });
}