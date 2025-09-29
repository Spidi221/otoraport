import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
import { createAdminClient } from '@/lib/supabase/server';
import { WhiteLabelEngine } from '@/lib/white-label';

// GET /api/white-label/metrics - Get partner dashboard metrics
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

    if (!developer || !developer.is_partner || !developer.partner_id) {
      return NextResponse.json(
        { success: false, error: 'Not a white-label partner' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('range') || '30d';
    const metric = searchParams.get('metric'); // Specific metric requested

    // Calculate date filter
    const days = parseInt(dateRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    try {
      // Get metrics from WhiteLabelEngine
      const metrics = await WhiteLabelEngine.getPartnerMetrics(
        developer.partner_id,
        { start: startDate, end: endDate }
      );

      // Get additional detailed metrics
      const detailedMetrics = await getDetailedMetrics(developer.partner_id, startDate, endDate);

      const response = {
        success: true,
        data: {
          ...metrics,
          ...detailedMetrics
        },
        date_range: dateRange,
        generated_at: new Date().toISOString()
      };

      // Return specific metric if requested
      if (metric && response.data[metric as keyof typeof response.data] !== undefined) {
        return NextResponse.json({
          success: true,
          data: {
            [metric]: response.data[metric as keyof typeof response.data]
          },
          date_range: dateRange,
          generated_at: new Date().toISOString()
        });
      }

      return NextResponse.json(response);

    } catch (dbError) {
      console.error('Database error, returning mock metrics:', dbError);
      return NextResponse.json({
        success: true,
        data: {
          ...WhiteLabelEngine.getMockPartnerMetrics(),
          ...getMockDetailedMetrics(dateRange)
        },
        date_range: dateRange,
        generated_at: new Date().toISOString(),
        note: 'Using mock data - database not available'
      });
    }

  } catch (error) {
    console.error('White-label metrics API error:', error);
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

async function getDetailedMetrics(partnerId: string, startDate: Date, endDate: Date) {
  try {
    // Get partner info
    const partner = await WhiteLabelEngine.getPartner(partnerId);
    if (!partner) throw new Error('Partner not found');

    // Get clients in date range
    const { data: clients } = await createAdminClient()
      .from('whitelabel_clients')
      .select('*')
      .eq('partner_id', partnerId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Calculate conversion funnel
    const totalSignups = clients?.length || 0;
    const trialsStarted = clients?.filter(c => c.status === 'trial' || c.status === 'active').length || 0;
    const conversions = clients?.filter(c => c.status === 'active').length || 0;

    // Calculate time-based metrics
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const { data: thisMonthClients } = await createAdminClient()
      .from('whitelabel_clients')
      .select('*')
      .eq('partner_id', partnerId)
      .gte('created_at', thisMonth.toISOString());

    const { data: lastMonthClients } = await createAdminClient()
      .from('whitelabel_clients')
      .select('*')
      .eq('partner_id', partnerId)
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', thisMonth.toISOString());

    // Calculate growth rates
    const clientGrowth = calculateGrowthRate(
      lastMonthClients?.length || 0,
      thisMonthClients?.length || 0
    );

    const thisMonthRevenue = (thisMonthClients || []).reduce((sum, client) => sum + (client.lifetime_value || 0), 0);
    const lastMonthRevenue = (lastMonthClients || []).reduce((sum, client) => sum + (client.lifetime_value || 0), 0);

    const revenueGrowth = calculateGrowthRate(lastMonthRevenue, thisMonthRevenue);

    // Calculate commission metrics
    const totalCommissionOwed = (clients || []).reduce((sum, client) => sum + (client.commission_earned || 0), 0);
    const { data: paidCommissions } = await createAdminClient()
      .from('commission_payments')
      .select('amount')
      .eq('partner_id', partnerId)
      .eq('status', 'paid');

    const paidCommissionTotal = (paidCommissions || []).reduce((sum, payment) => sum + payment.amount, 0);
    const pendingCommission = totalCommissionOwed - paidCommissionTotal;

    // Top performing metrics
    const topClients = (clients || [])
      .sort((a, b) => (b.lifetime_value || 0) - (a.lifetime_value || 0))
      .slice(0, 5);

    return {
      // Conversion funnel
      conversion_funnel: {
        signups: totalSignups,
        trials_started: trialsStarted,
        conversions: conversions,
        signup_to_trial_rate: totalSignups > 0 ? trialsStarted / totalSignups : 0,
        trial_to_paid_rate: trialsStarted > 0 ? conversions / trialsStarted : 0
      },

      // Growth metrics
      growth: {
        client_growth_rate: clientGrowth,
        revenue_growth_rate: revenueGrowth,
        month_over_month_signups: (thisMonthClients?.length || 0) - (lastMonthClients?.length || 0)
      },

      // Commission details
      commission: {
        total_earned: totalCommissionOwed,
        total_paid: paidCommissionTotal,
        pending_payment: pendingCommission,
        next_payment_date: getNextPaymentDate(),
        commission_rate: partner.commission_rate
      },

      // Performance insights
      insights: {
        top_clients: topClients.map(client => ({
          id: client.id,
          lifetime_value: client.lifetime_value,
          commission_earned: client.commission_earned,
          status: client.status
        })),
        average_time_to_conversion: calculateAverageTimeToConversion(clients || []),
        seasonal_trends: await getSeasonalTrends(partnerId)
      }
    };

  } catch (error) {
    console.error('Error calculating detailed metrics:', error);
    return {};
  }
}

function calculateGrowthRate(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  return (current - previous) / previous;
}

function calculateAverageTimeToConversion(clients: any[]): number {
  const convertedClients = clients.filter(c => c.status === 'active' && c.subscription_starts_at);

  if (convertedClients.length === 0) return 0;

  const totalDays = convertedClients.reduce((sum, client) => {
    const created = new Date(client.created_at);
    const converted = new Date(client.subscription_starts_at);
    const days = Math.floor((converted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);

  return totalDays / convertedClients.length;
}

function getNextPaymentDate(): string {
  // Commission payments processed on 1st of each month
  const nextPayment = new Date();
  nextPayment.setMonth(nextPayment.getMonth() + 1);
  nextPayment.setDate(1);
  nextPayment.setHours(0, 0, 0, 0);
  return nextPayment.toISOString();
}

async function getSeasonalTrends(partnerId: string): Promise<any[]> {
  try {
    // Get last 12 months of data
    const { data: yearData } = await createAdminClient()
      .from('whitelabel_clients')
      .select('created_at, lifetime_value')
      .eq('partner_id', partnerId)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    // Group by month
    const monthlyData = (yearData || []).reduce((acc, client) => {
      const month = new Date(client.created_at).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { signups: 0, revenue: 0 };
      }
      acc[month].signups++;
      acc[month].revenue += client.lifetime_value || 0;
      return acc;
    }, {} as Record<string, { signups: number; revenue: number }>);

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));

  } catch (error) {
    return [];
  }
}

function getMockDetailedMetrics(dateRange: string) {
  const multiplier = dateRange === '7d' ? 0.25 : dateRange === '90d' ? 3 : 1;

  return {
    conversion_funnel: {
      signups: Math.floor(45 * multiplier),
      trials_started: Math.floor(38 * multiplier),
      conversions: Math.floor(31 * multiplier),
      signup_to_trial_rate: 0.844,
      trial_to_paid_rate: 0.816
    },

    growth: {
      client_growth_rate: 0.18, // 18% growth
      revenue_growth_rate: 0.24, // 24% revenue growth
      month_over_month_signups: Math.floor(8 * multiplier)
    },

    commission: {
      total_earned: Math.floor(25200 * multiplier),
      total_paid: Math.floor(18900 * multiplier),
      pending_payment: Math.floor(6300 * multiplier),
      next_payment_date: getNextPaymentDate(),
      commission_rate: 15
    },

    insights: {
      top_clients: [
        { id: 'client_001', lifetime_value: 29900, commission_earned: 4485, status: 'active' },
        { id: 'client_003', lifetime_value: 59700, commission_earned: 8955, status: 'active' },
        { id: 'client_005', lifetime_value: 24900, commission_earned: 3735, status: 'active' }
      ],
      average_time_to_conversion: 8.5, // days
      seasonal_trends: [
        { month: '2025-01', signups: 12, revenue: 119600 },
        { month: '2024-12', signups: 8, revenue: 79800 },
        { month: '2024-11', signups: 15, revenue: 149500 }
      ]
    }
  };
}