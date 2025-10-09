/**
 * Uptime Data API Endpoint
 *
 * GET /api/status/uptime
 * Returns uptime data for all components over the specified period
 *
 * Query Parameters:
 * - days: Number of days to fetch (default: 30, max: 90)
 * - component: Optional component filter
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
  component: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { days, component } = querySchema.parse(searchParams);

    const supabase = await createServerClient();

    // Calculate date range
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Build query
    let query = supabase
      .from('uptime_summaries')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (component) {
      query = query.eq('component', component);
    }

    const { data: uptimeData, error } = await query;

    if (error) {
      console.error('Failed to fetch uptime data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch uptime data' },
        { status: 500 }
      );
    }

    // Group by component
    const grouped: Record<string, Array<any>> = {};
    (uptimeData || []).forEach(row => {
      if (!grouped[row.component]) {
        grouped[row.component] = [];
      }
      grouped[row.component].push({
        date: row.date,
        uptime: row.uptime_percentage,
        totalChecks: row.total_checks,
        successfulChecks: row.successful_checks,
        avgResponseTime: row.avg_response_time_ms,
      });
    });

    return NextResponse.json({
      period: { days, startDate: startDate.toISOString().split('T')[0] },
      components: grouped,
    });
  } catch (error) {
    console.error('Error in uptime API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
