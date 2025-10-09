/**
 * User Audit Logs API Endpoint
 *
 * GET /api/user/audit-logs
 * Returns paginated audit log entries for the authenticated user
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 100)
 * - dateFrom: Start date (ISO format)
 * - dateTo: End date (ISO format)
 * - action: Filter by action type
 * - resourceType: Filter by resource type
 * - search: Search in action, resource_type, or metadata
 *
 * Response:
 * {
 *   logs: AuditLog[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     totalPages: number
 *   }
 * }
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Query parameter validation schema
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryResult = querySchema.safeParse(searchParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, dateFrom, dateTo, action, resourceType, search } = queryResult.data;
    const offset = (page - 1) * limit;

    // Build base query
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (search) {
      // Search in action, resource_type, or metadata fields
      // Note: Supabase doesn't support OR with ilike easily, so we'll do a text search
      query = query.or(`action.ilike.%${search}%,resource_type.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: logs, error: logsError, count } = await query;

    if (logsError) {
      console.error('Failed to fetch audit logs:', logsError);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Unexpected error in audit logs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
