/**
 * PROJECTS API - List and create projects for authenticated developer
 * Task #52 - Projects (Inwestycje) System
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canAddProject, SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';
import { getErrorMessage } from '@/lib/api-schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/projects - List all projects for authenticated developer
 * Returns projects with property counts and subscription plan details
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, subscription_plan')
      .eq('id', user.id)
      .single();

    if (devError || !developer) {
      return NextResponse.json(
        { error: 'Developer profile not found' },
        { status: 404 }
      );
    }

    // Fetch all projects for this developer
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('developer_id', developer.id)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('❌ PROJECTS API: Error fetching projects:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    // Get properties count for each project
    const projectsWithCounts = await Promise.all(
      (projects || []).map(async (project) => {
        const { count } = await supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id);

        return {
          ...project,
          properties_count: count || 0
        };
      })
    );

    return NextResponse.json({
      projects: projectsWithCounts,
      subscription_plan: developer.subscription_plan,
      plan_details: SUBSCRIPTION_PLANS[developer.subscription_plan as keyof typeof SUBSCRIPTION_PLANS]
    });

  } catch (error: unknown) {
    console.error('❌ PROJECTS API: Unexpected error in GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects - Create new project with subscription limit check
 * Enforces subscription limits (Basic=1, Pro=2, Enterprise=unlimited)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, subscription_plan')
      .eq('id', user.id)
      .single();

    if (devError || !developer) {
      return NextResponse.json(
        { error: 'Developer profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nazwa projektu jest wymagana' },
        { status: 400 }
      );
    }

    if (name.length > 200) {
      return NextResponse.json(
        { error: 'Nazwa projektu może mieć maksymalnie 200 znaków' },
        { status: 400 }
      );
    }

    // Count current active projects
    const { data: currentProjects, error: countError } = await supabase
      .from('projects')
      .select('id')
      .eq('developer_id', developer.id)
      .eq('status', 'active');

    if (countError) {
      console.error('❌ PROJECTS API: Error counting projects:', countError);
      return NextResponse.json(
        { error: 'Failed to check project limits' },
        { status: 500 }
      );
    }

    const currentProjectsCount = currentProjects?.length || 0;

    // TODO: Get additional_projects_count from developer subscription metadata
    // For now, assume 0 additional projects
    const additionalProjectsCount = 0;

    // Check subscription limits
    const limitCheck = canAddProject(
      currentProjectsCount,
      additionalProjectsCount,
      developer.subscription_plan as any
    );

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason,
          current_projects: currentProjectsCount,
          can_add_paid: limitCheck.canAddPaid,
          additional_cost: limitCheck.additionalCost
        },
        { status: 403 }
      );
    }

    // Generate slug from name
    const slug = generateSlug(name.trim());

    // Create project
    const { data: newProject, error: insertError } = await supabase
      .from('projects')
      .insert({
        developer_id: developer.id,
        name: name.trim(),
        slug: slug,
        description: description?.trim() || null,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ PROJECTS API: Error creating project:', insertError);

      // Check for duplicate slug error
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Projekt o tej nazwie już istnieje' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    console.log(`✅ PROJECTS API: Created project ${newProject.id} for developer ${developer.id}`);

    return NextResponse.json(
      {
        project: newProject,
        message: 'Projekt utworzony pomyślnie'
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('❌ PROJECTS API: Unexpected error in POST:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate a URL-safe slug from project name
 * Example: "Osiedle Słoneczne 2025" -> "osiedle-sloneczne-2025"
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Normalize Polish characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .substring(0, 255); // Limit to schema max length
}
