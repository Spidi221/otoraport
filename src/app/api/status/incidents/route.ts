/**
 * Incidents API Endpoint
 *
 * GET /api/status/incidents
 * Returns recent incidents (public, no auth required)
 *
 * POST /api/status/incidents
 * Create a new incident (admin only)
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Query parameter schema for GET
const getQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional(),
});

// Request body schema for POST
const createIncidentSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  severity: z.enum(['minor', 'major', 'critical']),
  affectedComponents: z.array(z.string()).min(1),
  startedAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { limit, status } = getQuerySchema.parse(searchParams);

    const supabase = await createServerClient();

    // Build query
    let query = supabase
      .from('incidents')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: incidents, error } = await query;

    if (error) {
      console.error('Failed to fetch incidents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch incidents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      incidents: incidents || [],
    });
  } catch (error) {
    console.error('Error in incidents API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (devError || !developer || developer.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createIncidentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, severity, affectedComponents, startedAt } = validation.data;

    // Create incident
    const { data: incident, error: insertError } = await supabase
      .from('incidents')
      .insert({
        title,
        description: description || null,
        status: 'investigating',
        severity,
        affected_components: affectedComponents,
        started_at: startedAt || new Date().toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create incident:', insertError);
      return NextResponse.json(
        { error: 'Failed to create incident' },
        { status: 500 }
      );
    }

    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
