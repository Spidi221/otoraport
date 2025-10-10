/**
 * Health Check Utilities - Client-Safe
 *
 * Pure functions and constants for health monitoring (no server dependencies)
 * Safe to import in client components
 */

export type ComponentStatus = 'operational' | 'degraded' | 'outage';

export interface HealthCheckResult {
  component: string;
  status: ComponentStatus;
  responseTimeMs: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Component identifiers for health monitoring
 */
export const MONITORED_COMPONENTS = {
  DATABASE: 'database',
  MINISTRY_XML: 'ministry_xml',
  MINISTRY_CSV: 'ministry_csv',
  MINISTRY_MD5: 'ministry_md5',
  STRIPE_API: 'stripe_api',
  SUPABASE_AUTH: 'supabase_auth',
  SUPABASE_STORAGE: 'supabase_storage',
} as const;

/**
 * Get human-readable component name in Polish
 */
export function getComponentDisplayName(component: string): string {
  const names: Record<string, string> = {
    [MONITORED_COMPONENTS.DATABASE]: 'Baza danych',
    [MONITORED_COMPONENTS.MINISTRY_XML]: 'Endpoint XML (Ministerstwo)',
    [MONITORED_COMPONENTS.MINISTRY_CSV]: 'Endpoint CSV (Ministerstwo)',
    [MONITORED_COMPONENTS.MINISTRY_MD5]: 'Endpoint MD5 (Ministerstwo)',
    [MONITORED_COMPONENTS.STRIPE_API]: 'Płatności Stripe',
    [MONITORED_COMPONENTS.SUPABASE_AUTH]: 'Uwierzytelnianie',
    [MONITORED_COMPONENTS.SUPABASE_STORAGE]: 'Przechowywanie plików',
  };

  return names[component] || component;
}

/**
 * Get status display info (color, label)
 */
export function getStatusDisplayInfo(status: ComponentStatus): {
  color: string;
  label: string;
  bgColor: string;
} {
  const info = {
    operational: {
      color: 'text-green-700',
      label: 'Działa prawidłowo',
      bgColor: 'bg-green-100',
    },
    degraded: {
      color: 'text-yellow-700',
      label: 'Częściowa awaria',
      bgColor: 'bg-yellow-100',
    },
    outage: {
      color: 'text-red-700',
      label: 'Awaria',
      bgColor: 'bg-red-100',
    },
  };

  return info[status];
}
