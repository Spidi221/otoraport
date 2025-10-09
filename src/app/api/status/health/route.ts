/**
 * Health Check API Endpoint
 *
 * GET /api/status/health
 * Returns current health status of all monitored components
 *
 * This endpoint is public (no authentication required) and is used
 * by the /status page to display real-time system health.
 */

import { NextResponse } from 'next/server';
import { runAllHealthChecks, storeHealthCheck, getLatestHealthChecks } from '@/lib/health-check';

// Revalidate every 30 seconds
export const revalidate = 30;

export async function GET() {
  try {
    // Run health checks
    const checks = await runAllHealthChecks();

    // Store results in database (fire and forget)
    checks.forEach(check => {
      storeHealthCheck(check).catch(err =>
        console.error('Failed to store health check:', err)
      );
    });

    // Get latest checks from database for all components
    const latestChecks = await getLatestHealthChecks();

    // Calculate overall system status
    const statuses = Object.values(latestChecks).map(check => check.status);
    const hasOutage = statuses.includes('outage');
    const hasDegraded = statuses.includes('degraded');

    const overallStatus = hasOutage ? 'outage' : hasDegraded ? 'degraded' : 'operational';

    return NextResponse.json({
      overall: overallStatus,
      components: latestChecks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        overall: 'outage',
        components: {},
        timestamp: new Date().toISOString(),
        error: 'Health check system failure',
      },
      { status: 500 }
    );
  }
}
