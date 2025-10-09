import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface PriceHistoryRecord {
  id: string;
  property_id: string;
  developer_id: string;
  old_base_price: number | null;
  new_base_price: number | null;
  old_final_price: number | null;
  new_final_price: number | null;
  old_price_per_m2: number | null;
  new_price_per_m2: number | null;
  change_reason: string | null;
  changed_at: string;
  created_by: string | null;
}

interface PriceHistoryResponse {
  success: true;
  history: PriceHistoryRecord[];
  total: number;
  hasMore: boolean;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<PriceHistoryResponse | ErrorResponse>> {
  try {
    const supabase = await createClient();
    const params = await context.params;
    const propertyId = params.id;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get developer_id for the authenticated user
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (devError || !developer) {
      return NextResponse.json(
        { success: false, error: 'Developer not found' },
        { status: 404 }
      );
    }

    // Verify the property belongs to the developer
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, developer_id')
      .eq('id', propertyId)
      .eq('developer_id', developer.id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { success: false, error: 'Property not found or access denied' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build query
    let query = supabase
      .from('price_history')
      .select('*', { count: 'exact' })
      .eq('property_id', propertyId)
      .order('changed_at', { ascending: false });

    // Apply date filters
    if (from) {
      query = query.gte('changed_at', from);
    }
    if (to) {
      query = query.lte('changed_at', to);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: history, error: historyError, count } = await query;

    if (historyError) {
      console.error('Error fetching price history:', historyError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch price history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      history: history || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Price history API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
