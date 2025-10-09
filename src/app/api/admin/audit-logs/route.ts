/**
 * Admin Audit Logs API Endpoint
 *
 * GET /api/admin/audit-logs
 * Returns paginated audit log entries for all users (admin only)
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 100)
 * - dateFrom: Start date (ISO format)
 * - dateTo: End date (ISO format)
 * - action: Filter by action type
 * - resourceType: Filter by resource type
 * - userId: Filter by specific user
 * - developerId: Filter by specific developer
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
import { logAuditEvent } from '@/lib/audit-logger';

// Query parameter validation schema
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  userId: z.string().uuid().optional(),
  developerId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate user and check admin role
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, is_admin, company_name')
      .eq('user_id', user.id)
      .single();

    if (devError || !developer || !developer.is_admin) {
      // Log unauthorized access attempt
      await logAuditEvent({
        action: 'error_occurred',
        resourceType: 'system',
        metadata: {
          error: 'Unauthorized admin audit log access attempt',
          userId: user.id,
        },
      }, request);

      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Log admin access to audit logs
    await logAuditEvent({
      action: 'admin_data_export',
      resourceType: 'system',
      metadata: {
        action: 'Accessed admin audit logs',
      },
    }, request);

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryResult = querySchema.safeParse(searchParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      dateFrom,
      dateTo,
      action,
      resourceType,
      userId,
      developerId,
      search,
    } = queryResult.data;
    const offset = (page - 1) * limit;

    // Build base query (no user filtering for admins)
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
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

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (developerId) {
      query = query.eq('developer_id', developerId);
    }

    if (search) {
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

    // Enrich logs with developer/user information
    const enrichedLogs = await Promise.all(
      (logs || []).map(async (log) => {
        if (!log.developer_id) return log;

        const { data: devInfo } = await supabase
          .from('developers')
          .select('company_name, email')
          .eq('id', log.developer_id)
          .single();

        return {
          ...log,
          developer_info: devInfo || null,
        };
      })
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Unexpected error in admin audit logs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
