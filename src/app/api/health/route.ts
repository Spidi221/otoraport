import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring services.
 * Checks database connectivity and returns application health status.
 *
 * Returns:
 * - 200 OK: Application is healthy
 * - 503 Service Unavailable: Application has issues (e.g., database connection failed)
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check Supabase database connection
    const supabase = await createClient();

    // Simple query to verify database connectivity
    // Using a lightweight query that doesn't depend on data
    const { error } = await supabase.from('developers').select('id').limit(1);

    if (error) {
      console.error('[Health Check] Database query failed:', error);

      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            database: {
              status: 'failed',
              error: error.message,
            },
          },
        },
        { status: 503 }
      );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      checks: {
        database: {
          status: 'ok',
          responseTime: `${responseTime}ms`,
        },
      },
      version: '2.0.0',
    });

  } catch (error) {
    console.error('[Health Check] Unexpected error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
