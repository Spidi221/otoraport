import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
import { supabaseAdmin } from '@/lib/supabase-single';
import { ApiKeyManager, ApiResponseBuilder, API_PERMISSION_TEMPLATES } from '@/lib/api-v1';

// GET /api/v1/keys - List API keys (authenticated via session)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        ApiResponseBuilder.error(auth.error || 'Authentication required'),
        { status: 401 }
      );
    }

    const developer = auth.developer;

    // Get API keys
    const { data: apiKeys, error } = await supabaseAdmin
      .from('api_keys')
      .select(`
        id,
        name,
        key_preview,
        permissions,
        rate_limit,
        is_active,
        last_used_at,
        created_at,
        expires_at
      `)
      .eq('developer_id', developer.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(
      ApiResponseBuilder.success(
        apiKeys || [],
        `Retrieved ${apiKeys?.length || 0} API keys`
      )
    );

  } catch (error) {
    console.error('API keys GET error:', error);
    return NextResponse.json(
      ApiResponseBuilder.error('Internal server error'),
      { status: 500 }
    );
  }
}

// POST /api/v1/keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        ApiResponseBuilder.error(auth.error || 'Authentication required'),
        { status: 401 }
      );
    }

    const developer = auth.developer;

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        ApiResponseBuilder.error('API key name is required'),
        { status: 400 }
      );
    }

    if (!body.permissions_template && !body.permissions) {
      return NextResponse.json(
        ApiResponseBuilder.error('Either permissions_template or permissions must be provided'),
        { status: 400 }
      );
    }

    // Check API key limit based on subscription
    const limits = {
      basic: 2,
      pro: 5,
      enterprise: 10
    };

    const currentLimit = limits[developer.subscription_plan] || limits.basic;

    const { count } = await supabaseAdmin
      .from('api_keys')
      .select('id', { count: 'exact' })
      .eq('developer_id', developer.id)
      .eq('is_active', true);

    if ((count || 0) >= currentLimit) {
      return NextResponse.json(
        ApiResponseBuilder.error(`Maximum ${currentLimit} API keys allowed for ${developer.subscription_plan} plan`),
        { status: 400 }
      );
    }

    // Determine permissions
    let permissions;
    if (body.permissions_template) {
      if (!API_PERMISSION_TEMPLATES[body.permissions_template]) {
        return NextResponse.json(
          ApiResponseBuilder.error('Invalid permissions template'),
          { status: 400 }
        );
      }
      permissions = API_PERMISSION_TEMPLATES[body.permissions_template];
    } else {
      permissions = body.permissions;
    }

    // Validate permissions format
    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        ApiResponseBuilder.error('Permissions must be an array'),
        { status: 400 }
      );
    }

    // Set rate limits based on subscription
    const rateLimits = {
      basic: 1000,  // 1k requests per minute
      pro: 5000,    // 5k requests per minute
      enterprise: 10000 // 10k requests per minute
    };

    const rateLimit = body.rate_limit || rateLimits[developer.subscription_plan] || rateLimits.basic;

    // Create API key
    const { apiKey, plainKey } = await ApiKeyManager.createApiKey(
      developer.id,
      body.name,
      permissions,
      rateLimit,
      body.expires_in_days
    );

    // Save to database
    const { data: savedKey, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        id: apiKey.id,
        developer_id: apiKey.developer_id,
        name: apiKey.name,
        key_hash: apiKey.key_hash,
        key_preview: apiKey.key_preview,
        permissions: apiKey.permissions,
        rate_limit: apiKey.rate_limit,
        is_active: apiKey.is_active,
        created_at: apiKey.created_at,
        expires_at: apiKey.expires_at
      })
      .select(`
        id,
        name,
        key_preview,
        permissions,
        rate_limit,
        is_active,
        created_at,
        expires_at
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      ApiResponseBuilder.success(
        {
          ...savedKey,
          key: plainKey // Only return the plain key once during creation
        },
        'API key created successfully. Store this key securely - it will not be shown again.'
      ),
      { status: 201 }
    );

  } catch (error) {
    console.error('API keys POST error:', error);
    return NextResponse.json(
      ApiResponseBuilder.error('Internal server error'),
      { status: 500 }
    );
  }
}

// DELETE /api/v1/keys - Deactivate API key
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        ApiResponseBuilder.error(auth.error || 'Authentication required'),
        { status: 401 }
      );
    }

    const developer = auth.developer;

    // Parse request body
    const body = await request.json();

    if (!body.key_id) {
      return NextResponse.json(
        ApiResponseBuilder.error('key_id is required'),
        { status: 400 }
      );
    }

    // Deactivate API key
    const { data: updatedKey, error } = await supabaseAdmin
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', body.key_id)
      .eq('developer_id', developer.id)
      .select('id, name')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          ApiResponseBuilder.error('API key not found'),
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      ApiResponseBuilder.success(
        updatedKey,
        'API key deactivated successfully'
      )
    );

  } catch (error) {
    console.error('API keys DELETE error:', error);
    return NextResponse.json(
      ApiResponseBuilder.error('Internal server error'),
      { status: 500 }
    );
  }
}