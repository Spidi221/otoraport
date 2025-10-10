/**
 * Audit Logging Utilities - Client-Safe
 *
 * Types and pure functions for audit logging (no server dependencies)
 * Safe to import in client components
 */

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
