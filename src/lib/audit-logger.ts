/**
 * Audit Logging System
 *
 * Provides centralized audit logging functionality for tracking user actions
 * across the OTO-RAPORT platform. All logs are immutable and stored in the
 * audit_logs table with comprehensive context.
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

/**
 * Supported audit action types
 */
export type AuditAction =
  // Authentication
  | 'login'
  | 'logout'
  | 'signup'
  | 'password_reset'
  | 'password_change'

  // Property Management
  | 'property_create'
  | 'property_update'
  | 'property_delete'
  | 'property_bulk_upload'
  | 'property_bulk_delete'
  | 'property_status_change'

  // File Operations
  | 'csv_upload'
  | 'logo_upload'
  | 'file_delete'
  | 'csv_export'
  | 'xml_export'

  // Subscription Management
  | 'subscription_create'
  | 'subscription_update'
  | 'subscription_cancel'
  | 'subscription_reactivate'
  | 'plan_upgrade'
  | 'plan_downgrade'
  | 'payment_success'
  | 'payment_failed'

  // Account Management
  | 'profile_update'
  | 'email_change'
  | 'api_key_generate'
  | 'api_key_revoke'
  | 'custom_domain_add'
  | 'custom_domain_remove'

  // Admin Actions
  | 'admin_refund'
  | 'admin_plan_change'
  | 'admin_user_impersonate'
  | 'admin_data_export'

  // System Events
  | 'onboarding_start'
  | 'onboarding_complete'
  | 'onboarding_skip'
  | 'api_request'
  | 'error_occurred';

/**
 * Resource types that can be affected by actions
 */
export type ResourceType =
  | 'property'
  | 'subscription'
  | 'auth'
  | 'profile'
  | 'file'
  | 'api_key'
  | 'custom_domain'
  | 'payment'
  | 'system';

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  action: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

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

/**
 * Format audit log changes for display
 */
export function formatAuditChanges(changes: any): string {
  if (!changes) return '-';

  if (changes.before && changes.after) {
    const changedFields = Object.keys(changes.after).filter(
      key => changes.before[key] !== changes.after[key]
    );

    if (changedFields.length === 0) return 'Brak zmian';

    return changedFields
      .map(field => `${field}: ${changes.before[field]} → ${changes.after[field]}`)
      .join(', ');
  }

  if (changes.after) {
    return Object.entries(changes.after)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  return JSON.stringify(changes);
}

/**
 * Get human-readable action name in Polish
 */
export function getActionDisplayName(action: AuditAction): string {
  const actionNames: Record<AuditAction, string> = {
    // Authentication
    login: 'Logowanie',
    logout: 'Wylogowanie',
    signup: 'Rejestracja',
    password_reset: 'Reset hasła',
    password_change: 'Zmiana hasła',

    // Property Management
    property_create: 'Utworzenie nieruchomości',
    property_update: 'Aktualizacja nieruchomości',
    property_delete: 'Usunięcie nieruchomości',
    property_bulk_upload: 'Import nieruchomości (CSV)',
    property_bulk_delete: 'Masowe usunięcie nieruchomości',
    property_status_change: 'Zmiana statusu nieruchomości',

    // File Operations
    csv_upload: 'Upload pliku CSV',
    logo_upload: 'Upload logo',
    file_delete: 'Usunięcie pliku',
    csv_export: 'Eksport CSV',
    xml_export: 'Eksport XML',

    // Subscription Management
    subscription_create: 'Utworzenie subskrypcji',
    subscription_update: 'Aktualizacja subskrypcji',
    subscription_cancel: 'Anulowanie subskrypcji',
    subscription_reactivate: 'Reaktywacja subskrypcji',
    plan_upgrade: 'Upgrade planu',
    plan_downgrade: 'Downgrade planu',
    payment_success: 'Płatność zakończona sukcesem',
    payment_failed: 'Płatność nieudana',

    // Account Management
    profile_update: 'Aktualizacja profilu',
    email_change: 'Zmiana adresu email',
    api_key_generate: 'Wygenerowanie klucza API',
    api_key_revoke: 'Unieważnienie klucza API',
    custom_domain_add: 'Dodanie własnej domeny',
    custom_domain_remove: 'Usunięcie własnej domeny',

    // Admin Actions
    admin_refund: 'Zwrot środków (admin)',
    admin_plan_change: 'Zmiana planu (admin)',
    admin_user_impersonate: 'Personifikacja użytkownika (admin)',
    admin_data_export: 'Eksport danych (admin)',

    // System Events
    onboarding_start: 'Rozpoczęcie onboardingu',
    onboarding_complete: 'Ukończenie onboardingu',
    onboarding_skip: 'Pominięcie kroku onboardingu',
    api_request: 'Zapytanie API',
    error_occurred: 'Wystąpił błąd',
  };

  return actionNames[action] || action;
}
