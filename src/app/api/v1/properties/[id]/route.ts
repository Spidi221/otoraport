import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { ApiKeyManager, ApiResponseBuilder, PropertyApiModel, WebhookManager } from '@/lib/api-v1';

// GET /api/v1/properties/[id] - Get single property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  let apiKey: any = null;
  let requestSize = 0;
  let responseSize = 0;
  let responseStatus = 200;

  try {
    // Validate API key
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      responseStatus = 401;
      return NextResponse.json(
        ApiResponseBuilder.error('Missing or invalid authorization header'),
        { status: 401 }
      );
    }

    const key = authorization.substring(7);
    requestSize = key.length;

    const validation = await ApiKeyManager.validateApiKey(key, 'properties', 'read');
    if (!validation.isValid) {
      responseStatus = 401;
      return NextResponse.json(
        ApiResponseBuilder.error(validation.error || 'Invalid API key'),
        { status: 401 }
      );
    }

    apiKey = validation.apiKey;

    // Check rate limiting
    const rateLimit = await ApiKeyManager.checkRateLimit(apiKey.id);
    if (!rateLimit.allowed) {
      responseStatus = 429;
      return NextResponse.json(
        ApiResponseBuilder.rateLimited(rateLimit.remaining, rateLimit.resetAt),
        { status: 429 }
      );
    }

    // Get property from database
    const { data: property, error } = await createAdminClient()
      .from('properties')
      .select(`
        id,
        apartment_number,
        property_type,
        price_per_m2,
        surface_area,
        total_price,
        wojewodztwo,
        powiat,
        gmina,
        miejscowosc,
        ulica,
        liczba_pokoi,
        kondygnacja,
        powierzchnia_balkon,
        miejsca_postojowe_nr,
        komorki_nr,
        status_dostepnosci,
        created_at,
        updated_at
      `)
      .eq('id', params.id)
      .eq('developer_id', apiKey.developer_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        responseStatus = 404;
        return NextResponse.json(
          ApiResponseBuilder.error('Property not found'),
          { status: 404 }
        );
      }
      throw error;
    }

    // Transform to API model
    const apiProperty: PropertyApiModel = {
      id: property.id,
      apartment_number: property.apartment_number,
      property_type: property.property_type,
      price_per_m2: property.price_per_m2,
      surface_area: property.surface_area,
      total_price: property.total_price,
      location: {
        wojewodztwo: property.wojewodztwo,
        powiat: property.powiat,
        gmina: property.gmina,
        miejscowosc: property.miejscowosc,
        ulica: property.ulica
      },
      features: {
        rooms_count: property.liczba_pokoi,
        floor: property.kondygnacja,
        balcony_area: property.powierzchnia_balkon,
        parking_spaces: property.miejsca_postojowe_nr || [],
        storage_rooms: property.komorki_nr || []
      },
      status: property.status_dostepnosci || 'available',
      created_at: property.created_at,
      updated_at: property.updated_at
    };

    const response = ApiResponseBuilder.success(apiProperty);
    const responseBody = JSON.stringify(response);
    responseSize = responseBody.length;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Property GET API error:', error);
    responseStatus = 500;
    return NextResponse.json(
      ApiResponseBuilder.error('Internal server error'),
      { status: 500 }
    );

  } finally {
    if (apiKey) {
      const responseTime = Date.now() - startTime;
      await ApiKeyManager.logApiRequest(
        apiKey.id,
        apiKey.developer_id,
        'GET',
        `/api/v1/properties/${params.id}`,
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        requestSize,
        responseStatus,
        responseSize,
        responseTime
      );
    }
  }
}

// PUT /api/v1/properties/[id] - Update property
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  let apiKey: any = null;
  let requestSize = 0;
  let responseSize = 0;
  let responseStatus = 200;

  try {
    // Validate API key
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      responseStatus = 401;
      return NextResponse.json(
        ApiResponseBuilder.error('Missing or invalid authorization header'),
        { status: 401 }
      );
    }

    const key = authorization.substring(7);
    const validation = await ApiKeyManager.validateApiKey(key, 'properties', 'write');
    if (!validation.isValid) {
      responseStatus = 401;
      return NextResponse.json(
        ApiResponseBuilder.error(validation.error || 'Invalid API key'),
        { status: 401 }
      );
    }

    apiKey = validation.apiKey;

    // Check rate limiting
    const rateLimit = await ApiKeyManager.checkRateLimit(apiKey.id);
    if (!rateLimit.allowed) {
      responseStatus = 429;
      return NextResponse.json(
        ApiResponseBuilder.rateLimited(rateLimit.remaining, rateLimit.resetAt),
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    requestSize = JSON.stringify(body).length;

    // Get existing property
    const { data: existingProperty, error: fetchError } = await createAdminClient()
      .from('properties')
      .select('*')
      .eq('id', params.id)
      .eq('developer_id', apiKey.developer_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        responseStatus = 404;
        return NextResponse.json(
          ApiResponseBuilder.error('Property not found'),
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.apartment_number !== undefined) updateData.apartment_number = body.apartment_number;
    if (body.property_type !== undefined) {
      if (!['mieszkanie', 'dom'].includes(body.property_type)) {
        responseStatus = 400;
        return NextResponse.json(
          ApiResponseBuilder.error('property_type must be "mieszkanie" or "dom"'),
          { status: 400 }
        );
      }
      updateData.property_type = body.property_type;
    }
    if (body.price_per_m2 !== undefined) updateData.price_per_m2 = body.price_per_m2;
    if (body.surface_area !== undefined) updateData.surface_area = body.surface_area;
    if (body.total_price !== undefined) updateData.total_price = body.total_price;
    if (body.status !== undefined) updateData.status_dostepnosci = body.status;

    // Location updates
    if (body.location) {
      if (body.location.wojewodztwo !== undefined) updateData.wojewodztwo = body.location.wojewodztwo;
      if (body.location.powiat !== undefined) updateData.powiat = body.location.powiat;
      if (body.location.gmina !== undefined) updateData.gmina = body.location.gmina;
      if (body.location.miejscowosc !== undefined) updateData.miejscowosc = body.location.miejscowosc;
      if (body.location.ulica !== undefined) updateData.ulica = body.location.ulica;
    }

    // Features updates
    if (body.features) {
      if (body.features.rooms_count !== undefined) updateData.liczba_pokoi = body.features.rooms_count;
      if (body.features.floor !== undefined) updateData.kondygnacja = body.features.floor;
      if (body.features.balcony_area !== undefined) updateData.powierzchnia_balkon = body.features.balcony_area;
      if (body.features.parking_spaces !== undefined) updateData.miejsca_postojowe_nr = body.features.parking_spaces;
      if (body.features.storage_rooms !== undefined) updateData.komorki_nr = body.features.storage_rooms;
    }

    // Recalculate total price if needed
    if (updateData.price_per_m2 || updateData.surface_area) {
      const newPricePerM2 = updateData.price_per_m2 || existingProperty.price_per_m2;
      const newSurfaceArea = updateData.surface_area || existingProperty.surface_area;
      updateData.total_price = updateData.total_price || (newPricePerM2 * newSurfaceArea);
    }

    // Update property in database
    const { data: property, error } = await createAdminClient()
      .from('properties')
      .update(updateData)
      .eq('id', params.id)
      .eq('developer_id', apiKey.developer_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Transform to API model
    const apiProperty: PropertyApiModel = {
      id: property.id,
      apartment_number: property.apartment_number,
      property_type: property.property_type,
      price_per_m2: property.price_per_m2,
      surface_area: property.surface_area,
      total_price: property.total_price,
      location: {
        wojewodztwo: property.wojewodztwo,
        powiat: property.powiat,
        gmina: property.gmina,
        miejscowosc: property.miejscowosc,
        ulica: property.ulica
      },
      features: {
        rooms_count: property.liczba_pokoi,
        floor: property.kondygnacja,
        balcony_area: property.powierzchnia_balkon,
        parking_spaces: property.miejsca_postojowe_nr || [],
        storage_rooms: property.komorki_nr || []
      },
      status: property.status_dostepnosci || 'available',
      created_at: property.created_at,
      updated_at: property.updated_at
    };

    // Send webhook notification
    await sendWebhookEvent('property.updated', apiProperty, apiKey.developer_id);

    const response = ApiResponseBuilder.success(
      apiProperty,
      'Property updated successfully'
    );

    const responseBody = JSON.stringify(response);
    responseSize = responseBody.length;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Property PUT API error:', error);
    responseStatus = 500;
    return NextResponse.json(
      ApiResponseBuilder.error('Internal server error'),
      { status: 500 }
    );

  } finally {
    if (apiKey) {
      const responseTime = Date.now() - startTime;
      await ApiKeyManager.logApiRequest(
        apiKey.id,
        apiKey.developer_id,
        'PUT',
        `/api/v1/properties/${params.id}`,
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        requestSize,
        responseStatus,
        responseSize,
        responseTime
      );
    }
  }
}

// DELETE /api/v1/properties/[id] - Delete property
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  let apiKey: any = null;
  let requestSize = 0;
  let responseSize = 0;
  let responseStatus = 200;

  try {
    // Validate API key
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      responseStatus = 401;
      return NextResponse.json(
        ApiResponseBuilder.error('Missing or invalid authorization header'),
        { status: 401 }
      );
    }

    const key = authorization.substring(7);
    requestSize = key.length;

    const validation = await ApiKeyManager.validateApiKey(key, 'properties', 'delete');
    if (!validation.isValid) {
      responseStatus = 401;
      return NextResponse.json(
        ApiResponseBuilder.error(validation.error || 'Invalid API key'),
        { status: 401 }
      );
    }

    apiKey = validation.apiKey;

    // Check rate limiting
    const rateLimit = await ApiKeyManager.checkRateLimit(apiKey.id);
    if (!rateLimit.allowed) {
      responseStatus = 429;
      return NextResponse.json(
        ApiResponseBuilder.rateLimited(rateLimit.remaining, rateLimit.resetAt),
        { status: 429 }
      );
    }

    // Get property before deletion for webhook
    const { data: existingProperty, error: fetchError } = await createAdminClient()
      .from('properties')
      .select('*')
      .eq('id', params.id)
      .eq('developer_id', apiKey.developer_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        responseStatus = 404;
        return NextResponse.json(
          ApiResponseBuilder.error('Property not found'),
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Delete property from database
    const { error } = await createAdminClient()
      .from('properties')
      .delete()
      .eq('id', params.id)
      .eq('developer_id', apiKey.developer_id);

    if (error) {
      throw error;
    }

    // Send webhook notification
    await sendWebhookEvent('property.deleted', { id: params.id }, apiKey.developer_id);

    const response = ApiResponseBuilder.success(
      { id: params.id },
      'Property deleted successfully'
    );

    const responseBody = JSON.stringify(response);
    responseSize = responseBody.length;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Property DELETE API error:', error);
    responseStatus = 500;
    return NextResponse.json(
      ApiResponseBuilder.error('Internal server error'),
      { status: 500 }
    );

  } finally {
    if (apiKey) {
      const responseTime = Date.now() - startTime;
      await ApiKeyManager.logApiRequest(
        apiKey.id,
        apiKey.developer_id,
        'DELETE',
        `/api/v1/properties/${params.id}`,
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        requestSize,
        responseStatus,
        responseSize,
        responseTime
      );
    }
  }
}

async function sendWebhookEvent(eventType: string, data: any, developerId: string) {
  try {
    const { data: webhooks } = await createAdminClient()
      .from('webhook_endpoints')
      .select('*')
      .eq('developer_id', developerId)
      .eq('is_active', true);

    if (!webhooks || webhooks.length === 0) return;

    for (const webhook of webhooks) {
      const subscribesToEvent = webhook.events.some((event: any) => event.event_type === eventType);
      if (subscribesToEvent) {
        await WebhookManager.sendWebhook(webhook, eventType, data);
      }
    }
  } catch (error) {
    console.error('Webhook sending error:', error);
  }
}