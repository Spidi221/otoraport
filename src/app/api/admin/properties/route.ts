/**
 * Admin Properties API
 *
 * GET /api/admin/properties
 * Returns all properties across all developers (admin only)
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - search: Search in address, city
 * - developer: Filter by developer_id
 * - status: Filter by status
 * - minPrice: Minimum price
 * - maxPrice: Maximum price
 * - city: Filter by city
 * - sortBy: Sort column (default: created_at)
 * - sortOrder: asc or desc (default: desc)
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  developer: z.string().uuid().optional(),
  status: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  city: z.string().optional(),
  sortBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate and check admin role
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: developer } = await supabase
      .from('developers')
      .select('id, is_admin')
      .eq('user_id', user.id)
      .single();

    if (!developer || !developer.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validation = querySchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      search,
      developer: developerId,
      status,
      minPrice,
      maxPrice,
      city,
      sortBy,
      sortOrder,
    } = validation.data;

    const offset = (page - 1) * limit;

    // Build base query with developer info
    let query = supabase
      .from('properties')
      .select(`
        *,
        developer:developers (
          id,
          company_name,
          email
        )
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`address.ilike.%${search}%,city.ilike.%${search}%`);
    }

    if (developerId) {
      query = query.eq('developer_id', developerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    if (city) {
      query = query.eq('city', city);
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'updated_at', 'price', 'address', 'city', 'status'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: properties, error: propertiesError, count } = await query;

    if (propertiesError) {
      console.error('Failed to fetch properties:', propertiesError);
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      );
    }

    // Get unique developers for filter dropdown
    const { data: developers } = await supabase
      .from('developers')
      .select('id, company_name, email')
      .order('company_name');

    // Get unique cities for filter dropdown
    const { data: citiesData } = await supabase
      .from('properties')
      .select('city')
      .not('city', 'is', null);

    const cities = Array.from(new Set(citiesData?.map(p => p.city).filter(Boolean) || [])).sort();

    return NextResponse.json({
      properties: properties || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      filters: {
        search: search || '',
        developer: developerId || '',
        status: status || '',
        minPrice: minPrice || 0,
        maxPrice: maxPrice || 0,
        city: city || '',
        sortBy,
        sortOrder,
      },
      filterOptions: {
        developers: developers || [],
        cities,
      },
    });
  } catch (error) {
    console.error('Unexpected error in admin properties API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
