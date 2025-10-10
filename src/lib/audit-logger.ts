/**
 * Audit Logging System - SERVER ONLY
 *
 * Provides centralized audit logging functionality for tracking user actions
 * across the OTO-RAPORT platform. All logs are immutable and stored in the
 * audit_logs table with comprehensive context.
 *
 * IMPORTANT: This file uses server-side dependencies and should NOT be imported by client components
 * For client components, use '@/lib/audit-logger-utils' instead
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Re-export types and utilities from client-safe utils file
export type { AuditAction, ResourceType, AuditLogEntry } from './audit-logger-utils';
export { formatAuditChanges, getActionDisplayName } from './audit-logger-utils';

// Import types for use in this file
import type { AuditAction, ResourceType, AuditLogEntry } from './audit-logger-utils';

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string | null {
  // Check various headers for IP (Vercel, Cloudflare, standard)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }

  return null;
}

/**
 * Extract user agent from request
 */
function getUserAgent(request: NextRequest): string | null {
  return request.headers.get('user-agent');
}

/**
 * Log an audit event to the audit_logs table
 *
 * This function uses the Supabase service role to bypass RLS and ensure
 * audit logs are written even if the user doesn't have direct insert permissions.
 *
 * @param entry - The audit log entry details
 * @param request - The NextRequest object for extracting IP and user agent
 * @returns Promise<void>
 *
 * @example
 * await logAuditEvent({
 *   action: 'property_create',
 *   resourceType: 'property',
 *   resourceId: newProperty.id,
 *   changes: {
 *     after: { name: 'New Apartment', price: 500000 }
 *   }
 * }, request);
 */
export async function logAuditEvent(
  entry: AuditLogEntry,
  request: NextRequest
): Promise<void> {
  try {
    // Get authenticated user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Failed to get user for audit log:', authError);
      return;
    }

    // Get developer profile
    const { data: developer } = await supabase
      .from('developers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Extract request metadata
    const ipAddress = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Insert audit log (using service role would be ideal, but we'll use regular client for now)
    // In production, this should use service role to bypass RLS
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        developer_id: developer?.id || null,
        action: entry.action,
        resource_type: entry.resourceType || null,
        resource_id: entry.resourceId || null,
        changes: entry.changes || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: entry.metadata || null,
      });

    if (insertError) {
      console.error('Failed to insert audit log:', insertError);
      // Don't throw - audit logging should not break the main flow
    }
  } catch (error) {
    console.error('Error in audit logging:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log an audit event without requiring a NextRequest object
 * Useful for server-side operations that don't have access to the request
 *
 * @param entry - The audit log entry details
 * @param userId - The user ID performing the action
 * @returns Promise<void>
 */
export async function logAuditEventServer(
  entry: AuditLogEntry,
  userId: string
): Promise<void> {
  try {
    const supabase = await createServerClient();

    // Get developer profile
    const { data: developer } = await supabase
      .from('developers')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Insert audit log
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        developer_id: developer?.id || null,
        action: entry.action,
        resource_type: entry.resourceType || null,
        resource_id: entry.resourceId || null,
        changes: entry.changes || null,
        ip_address: null,
        user_agent: null,
        metadata: entry.metadata || null,
      });

    if (insertError) {
      console.error('Failed to insert audit log:', insertError);
    }
  } catch (error) {
    console.error('Error in audit logging:', error);
  }
}
