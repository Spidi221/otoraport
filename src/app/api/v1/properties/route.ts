/**
 * API v1 - Properties Endpoint
 * Demonstrates the fixed authentication and rate limiting system
 */

import { NextRequest, NextResponse } from 'next/server';
import { withReadOnlyAuth, withWriteAuth } from '@/lib/api-middleware';
import { ApiResponseBuilder, type PropertyApiModel } from '@/lib/api-v1';
import { supabaseAdmin } from '@/lib/supabase-single';

/**
 * GET /api/v1/properties
 * Retrieve properties for authenticated developer
 */
export async function GET(request: NextRequest) {
  return withReadOnlyAuth(request, 'properties', async (req, context) => {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 1000);
      const status = url.searchParams.get('status');
      const project_id = url.searchParams.get('project_id');

      // Build query
      let query = supabaseAdmin
        .from('properties')
        .select(`
          id,
          property_number,
          property_type,
          price_per_m2,
          total_price,
          final_price,
          area,
          parking_space,
          parking_price,
          status,
          created_at,
          updated_at,
          projects!inner (
            id,
            name,
            location,
            developer_id
          )
        `)
        .eq('projects.developer_id', context.developerId)
        .order('created_at', { ascending: false });

      // Add filters
      if (status) {
        query = query.eq('status', status);
      }

      if (project_id) {
        query = query.eq('project_id', project_id);
      }

      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error in GET /api/v1/properties:', error);
        return NextResponse.json(
          ApiResponseBuilder.error('Failed to fetch properties', 500, context.requestId),
          { status: 500 }
        );
      }

      // Transform to API model
      const properties: PropertyApiModel[] = data.map(prop => ({
        id: prop.id,
        apartment_number: prop.property_number,
        property_type: prop.property_type as 'mieszkanie' | 'dom',
        price_per_m2: prop.price_per_m2 || 0,
        surface_area: prop.area || 0,
        total_price: prop.total_price || 0,
        location: {
          wojewodztwo: '', // TODO: Add when ministry fields are implemented
          powiat: '',
          gmina: '',
          miejscowosc: '',
          ulica: ''
        },
        features: {
          parking_spaces: prop.parking_space ? [prop.parking_space] : []
        },
        status: prop.status as 'available' | 'reserved' | 'sold',
        created_at: prop.created_at,
        updated_at: prop.updated_at
      }));

      const totalCount = count || properties.length;
      const hasMore = (from + properties.length) < totalCount;

      return NextResponse.json(
        ApiResponseBuilder.success(
          properties,
          `Retrieved ${properties.length} properties`,
          {
            page,
            limit,
            total: totalCount,
            has_more: hasMore
          },
          context.requestId
        )
      );

    } catch (error) {
      console.error('Unexpected error in GET /api/v1/properties:', error);
      return NextResponse.json(
        ApiResponseBuilder.error('Internal server error', 500, context.requestId),
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/v1/properties
 * Create new properties (bulk import supported)
 */
export async function POST(request: NextRequest) {
  return withWriteAuth(request, 'properties', async (req, context) => {
    try {
      const body = await req.json();

      // Validate request body
      if (!body || (!Array.isArray(body) && !body.properties)) {
        return NextResponse.json(
          ApiResponseBuilder.error('Request body must contain properties array', 400, context.requestId),
          { status: 400 }
        );
      }

      // Support both direct array and wrapped object
      const properties = Array.isArray(body) ? body : body.properties;

      if (!Array.isArray(properties) || properties.length === 0) {
        return NextResponse.json(
          ApiResponseBuilder.error('Properties array cannot be empty', 400, context.requestId),
          { status: 400 }
        );
      }

      // Validate each property
      const validationErrors: string[] = [];
      properties.forEach((prop, index) => {
        if (!prop.apartment_number) {
          validationErrors.push(`Property ${index + 1}: apartment_number is required`);
        }
        if (!prop.property_type || !['mieszkanie', 'dom'].includes(prop.property_type)) {
          validationErrors.push(`Property ${index + 1}: property_type must be 'mieszkanie' or 'dom'`);
        }
        if (!prop.project_id) {
          validationErrors.push(`Property ${index + 1}: project_id is required`);
        }
      });

      if (validationErrors.length > 0) {
        return NextResponse.json(
          ApiResponseBuilder.error(`Validation errors: ${validationErrors.join('; ')}`, 400, context.requestId),
          { status: 400 }
        );
      }

      // Verify project ownership
      const projectIds = [...new Set(properties.map(p => p.project_id))];
      const { data: projects, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('developer_id', context.developerId)
        .in('id', projectIds);

      if (projectError) {
        console.error('Error verifying project ownership:', projectError);
        return NextResponse.json(
          ApiResponseBuilder.error('Failed to verify project ownership', 500, context.requestId),
          { status: 500 }
        );
      }

      const ownedProjectIds = projects.map(p => p.id);
      const unauthorizedProjects = projectIds.filter(id => !ownedProjectIds.includes(id));

      if (unauthorizedProjects.length > 0) {
        return NextResponse.json(
          ApiResponseBuilder.error(`Unauthorized access to projects: ${unauthorizedProjects.join(', ')}`, 403, context.requestId),
          { status: 403 }
        );
      }

      // Transform properties for database
      const dbProperties = properties.map(prop => ({
        project_id: prop.project_id,
        property_number: prop.apartment_number,
        property_type: prop.property_type,
        price_per_m2: prop.price_per_m2 || null,
        total_price: prop.total_price || null,
        final_price: prop.total_price || null, // Use total_price as final_price if not specified
        area: prop.surface_area || null,
        parking_space: prop.features?.parking_spaces?.[0] || null,
        parking_price: prop.features?.parking_price || null,
        status: prop.status || 'available'
      }));

      // Insert properties
      const { data: insertedProperties, error: insertError } = await supabaseAdmin
        .from('properties')
        .insert(dbProperties)
        .select();

      if (insertError) {
        console.error('Error inserting properties:', insertError);
        return NextResponse.json(
          ApiResponseBuilder.error('Failed to create properties', 500, context.requestId),
          { status: 500 }
        );
      }

      // Transform back to API model
      const createdProperties: PropertyApiModel[] = insertedProperties.map(prop => ({
        id: prop.id,
        apartment_number: prop.property_number,
        property_type: prop.property_type as 'mieszkanie' | 'dom',
        price_per_m2: prop.price_per_m2 || 0,
        surface_area: prop.area || 0,
        total_price: prop.total_price || 0,
        location: {
          wojewodztwo: '',
          powiat: '',
          gmina: '',
          miejscowosc: '',
          ulica: ''
        },
        features: {
          parking_spaces: prop.parking_space ? [prop.parking_space] : []
        },
        status: prop.status as 'available' | 'reserved' | 'sold',
        created_at: prop.created_at,
        updated_at: prop.updated_at
      }));

      // TODO: Trigger webhook for property.created events

      return NextResponse.json(
        ApiResponseBuilder.success(
          createdProperties,
          `Created ${createdProperties.length} properties`,
          undefined,
          context.requestId
        ),
        { status: 201 }
      );

    } catch (error) {
      console.error('Unexpected error in POST /api/v1/properties:', error);
      return NextResponse.json(
        ApiResponseBuilder.error('Internal server error', 500, context.requestId),
        { status: 500 }
      );
    }
  });
}