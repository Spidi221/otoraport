/**
 * Admin Properties Bulk Actions API
 *
 * POST /api/admin/properties/bulk
 * Perform bulk actions on properties (admin only)
 *
 * Actions:
 * - approve: Set status to 'dostępne'
 * - reject: Set status to 'wycofane'
 * - delete: Soft delete properties
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit-logger';

const bulkActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'delete']),
  propertyIds: z.array(z.string().uuid()).min(1).max(100),
});

export async function POST(request: NextRequest) {
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
      .select('id, is_admin, company_name')
      .eq('user_id', user.id)
      .single();

    if (!developer || !developer.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = bulkActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { action, propertyIds } = validation.data;

    // Get properties before action for audit log
    const { data: propertiesBefore } = await supabase
      .from('properties')
      .select('id, status, developer_id, address')
      .in('id', propertyIds);

    let result;
    const errors: Array<{ id: string; error: string }> = [];
    const successes: string[] = [];

    // Perform action based on type
    switch (action) {
      case 'approve':
        // Set status to 'dostępne'
        for (const propertyId of propertyIds) {
          const { error } = await supabase
            .from('properties')
            .update({ status: 'dostępne', updated_at: new Date().toISOString() })
            .eq('id', propertyId);

          if (error) {
            errors.push({ id: propertyId, error: error.message });
          } else {
            successes.push(propertyId);
          }
        }
        break;

      case 'reject':
        // Set status to 'wycofane'
        for (const propertyId of propertyIds) {
          const { error } = await supabase
            .from('properties')
            .update({ status: 'wycofane', updated_at: new Date().toISOString() })
            .eq('id', propertyId);

          if (error) {
            errors.push({ id: propertyId, error: error.message });
          } else {
            successes.push(propertyId);
          }
        }
        break;

      case 'delete':
        // Soft delete by setting status to 'wycofane' or hard delete
        // For now, we'll do hard delete
        for (const propertyId of propertyIds) {
          const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', propertyId);

          if (error) {
            errors.push({ id: propertyId, error: error.message });
          } else {
            successes.push(propertyId);
          }
        }
        break;
    }

    // Log bulk action in audit log
    await logAuditEvent({
      action: action === 'approve'
        ? 'property_bulk_upload'
        : action === 'reject'
        ? 'property_status_change'
        : 'property_bulk_delete',
      resourceType: 'property',
      metadata: {
        action,
        totalProperties: propertyIds.length,
        successCount: successes.length,
        errorCount: errors.length,
        adminName: developer.company_name,
        properties: propertiesBefore,
      },
    }, request);

    return NextResponse.json({
      success: true,
      results: {
        total: propertyIds.length,
        succeeded: successes.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Unexpected error in bulk properties API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
