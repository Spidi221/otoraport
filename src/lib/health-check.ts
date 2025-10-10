/**
 * System Health Check Library - SERVER ONLY
 *
 * Provides health check functionality for monitoring critical system components
 * IMPORTANT: This file uses server-side dependencies and should NOT be imported by client components
 * For client components, use '@/lib/health-check-utils' instead
 */

import { createServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Re-export types and utilities from client-safe utils file
export type { ComponentStatus, HealthCheckResult } from './health-check-utils';
export {
  MONITORED_COMPONENTS,
  getComponentDisplayName,
  getStatusDisplayInfo
} from './health-check-utils';

// Import types for use in this file
import type { ComponentStatus, HealthCheckResult } from './health-check-utils';
import { MONITORED_COMPONENTS } from './health-check-utils';

/**
 * Check database health by measuring query latency
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const supabase = await createServerClient();

    // Simple query to test database responsiveness
    const { error } = await supabase
      .from('developers')
      .select('id')
      .limit(1)
      .single();

    const responseTimeMs = Date.now() - startTime;

    if (error) {
      return {
        component: MONITORED_COMPONENTS.DATABASE,
        status: 'outage',
        responseTimeMs,
        errorMessage: error.message,
      };
    }

    // Determine status based on response time
    const status: ComponentStatus = responseTimeMs > 1000 ? 'degraded' : 'operational';

    return {
      component: MONITORED_COMPONENTS.DATABASE,
      status,
      responseTimeMs,
      metadata: {
        threshold_ms: 1000,
      },
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return {
      component: MONITORED_COMPONENTS.DATABASE,
      status: 'outage',
      responseTimeMs,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check ministry endpoint health
 */
export async function checkMinistryEndpoint(
  endpoint: 'xml' | 'csv' | 'md5',
  testClientId: string = 'test-health-check'
): Promise<HealthCheckResult> {
  const componentMap = {
    xml: MONITORED_COMPONENTS.MINISTRY_XML,
    csv: MONITORED_COMPONENTS.MINISTRY_CSV,
    md5: MONITORED_COMPONENTS.MINISTRY_MD5,
  };

  const component = componentMap[endpoint];
  const startTime = Date.now();

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/public/${testClientId}/data.${endpoint}`;

    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD to avoid downloading full response
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const responseTimeMs = Date.now() - startTime;

    // 404 is acceptable for test client ID
    const isHealthy = response.ok || response.status === 404;

    const status: ComponentStatus = !isHealthy
      ? 'outage'
      : responseTimeMs > 2000
      ? 'degraded'
      : 'operational';

    return {
      component,
      status,
      responseTimeMs,
      metadata: {
        http_status: response.status,
        threshold_ms: 2000,
      },
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return {
      component,
      status: 'outage',
      responseTimeMs,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Stripe API health
 */
export async function checkStripeHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        component: MONITORED_COMPONENTS.STRIPE_API,
        status: 'outage',
        responseTimeMs: 0,
        errorMessage: 'Stripe API key not configured',
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // Lightweight API call to check connectivity
    await stripe.prices.list({ limit: 1 });

    const responseTimeMs = Date.now() - startTime;

    const status: ComponentStatus = responseTimeMs > 3000 ? 'degraded' : 'operational';

    return {
      component: MONITORED_COMPONENTS.STRIPE_API,
      status,
      responseTimeMs,
      metadata: {
        threshold_ms: 3000,
      },
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return {
      component: MONITORED_COMPONENTS.STRIPE_API,
      status: 'outage',
      responseTimeMs,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Supabase Auth health
 */
export async function checkSupabaseAuthHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const supabase = await createServerClient();

    // Try to get session (will return null if not authenticated, but that's OK)
    const { error } = await supabase.auth.getSession();

    const responseTimeMs = Date.now() - startTime;

    if (error) {
      return {
        component: MONITORED_COMPONENTS.SUPABASE_AUTH,
        status: 'outage',
        responseTimeMs,
        errorMessage: error.message,
      };
    }

    const status: ComponentStatus = responseTimeMs > 1000 ? 'degraded' : 'operational';

    return {
      component: MONITORED_COMPONENTS.SUPABASE_AUTH,
      status,
      responseTimeMs,
      metadata: {
        threshold_ms: 1000,
      },
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return {
      component: MONITORED_COMPONENTS.SUPABASE_AUTH,
      status: 'outage',
      responseTimeMs,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run all health checks
 */
export async function runAllHealthChecks(): Promise<HealthCheckResult[]> {
  const checks = await Promise.all([
    checkDatabaseHealth(),
    checkMinistryEndpoint('xml'),
    checkMinistryEndpoint('csv'),
    checkMinistryEndpoint('md5'),
    checkStripeHealth(),
    checkSupabaseAuthHealth(),
  ]);

  return checks;
}

/**
 * Store health check result in database
 */
export async function storeHealthCheck(result: HealthCheckResult): Promise<void> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('health_checks')
      .insert({
        component: result.component,
        status: result.status,
        response_time_ms: result.responseTimeMs,
        error_message: result.errorMessage || null,
        metadata: result.metadata || null,
      });

    if (error) {
      console.error('Failed to store health check:', error);
    }
  } catch (error) {
    console.error('Error storing health check:', error);
  }
}

/**
 * Get latest health check for each component
 */
export async function getLatestHealthChecks(): Promise<Record<string, HealthCheckResult>> {
  const supabase = await createServerClient();

  const components = Object.values(MONITORED_COMPONENTS);
  const results: Record<string, HealthCheckResult> = {};

  for (const component of components) {
    const { data, error } = await supabase
      .from('health_checks')
      .select('*')
      .eq('component', component)
      .order('checked_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      results[component] = {
        component: data.component,
        status: data.status as ComponentStatus,
        responseTimeMs: data.response_time_ms,
        errorMessage: data.error_message || undefined,
        metadata: data.metadata || undefined,
      };
    }
  }

  return results;
}

/**
 * Get uptime percentage for a component over the last N days
 */
export async function getComponentUptime(
  component: string,
  days: number = 30
): Promise<Array<{ date: string; uptime: number }>> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('uptime_summaries')
    .select('date, uptime_percentage')
    .eq('component', component)
    .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('date', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    date: row.date,
    uptime: row.uptime_percentage,
  }));
}
