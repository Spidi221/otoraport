/**
 * INDIVIDUAL PROJECT API - Get, update, delete specific project
 * Task #52 - Projects (Inwestycje) System
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/api-schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/[id] - Get single project with properties count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const projectId = params.id;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch project (RLS ensures it belongs to this developer)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get properties count
    const { count } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);

    return NextResponse.json({
      ...project,
      properties_count: count || 0
    });

  } catch (error: unknown) {
    console.error('❌ PROJECTS API: Error in GET /api/projects/[id]:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id] - Update project details
 * Supports updating name, description, and status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const projectId = params.id;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const { name, description, status } = body;

    // Build updates object
    const updates: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
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
      updates.name = name.trim();
      updates.slug = generateSlug(name.trim());
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (status !== undefined) {
      if (!['active', 'inactive', 'archived'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value. Must be: active, inactive, or archived' },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    // If no updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Update project (RLS ensures it belongs to this developer)
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ PROJECTS API: Error updating project:', updateError);

      // Check for duplicate slug error
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'Projekt o tej nazwie już istnieje' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Project not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    console.log(`✅ PROJECTS API: Updated project ${projectId}`);

    return NextResponse.json({
      project: updatedProject,
      message: 'Projekt zaktualizowany pomyślnie'
    });

  } catch (error: unknown) {
    console.error('❌ PROJECTS API: Error in PATCH /api/projects/[id]:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id] - Delete project
 * Prevents deletion if project has properties
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const projectId = params.id;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if project has properties
    const { count } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: `Nie można usunąć projektu z ${count} mieszkaniami. Przenieś mieszkania do innego projektu lub usuń je.`,
          properties_count: count
        },
        { status: 400 }
      );
    }

    // Delete project (RLS ensures it belongs to this developer)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      console.error('❌ PROJECTS API: Error deleting project:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }

    console.log(`✅ PROJECTS API: Deleted project ${projectId}`);

    return NextResponse.json({
      message: 'Projekt usunięty pomyślnie'
    });

  } catch (error: unknown) {
    console.error('❌ PROJECTS API: Error in DELETE /api/projects/[id]:', error);
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
