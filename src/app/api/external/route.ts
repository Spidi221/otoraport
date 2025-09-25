import { NextRequest, NextResponse } from 'next/server'
import { apiIntegrationService } from '@/lib/api-integration'

// Publiczne API dla zewnętrznych integracji
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      )
    }

    const validation = await apiIntegrationService.validateAPIKey(apiKey, 'properties:read')
    
    if (!validation.isValid || !validation.developerId) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Track API usage
    await apiIntegrationService.trackAPIUsage(validation.keyId!, 'GET', '/api/external')

    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource') || 'properties'
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const format = searchParams.get('format') || 'json'

    switch (resource) {
      case 'properties': {
        const properties = await apiIntegrationService.getExternalProperties(
          validation.developerId,
          { projectId, limit, offset }
        )
        
        if (format === 'xml') {
          return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<properties>
${properties.map(p => `  <property>
    <id>${p.id}</id>
    <propertyNumber>${p.property_number}</propertyNumber>
    <pricePerM2>${p.price_per_m2}</pricePerM2>
    <totalPrice>${p.total_price}</totalPrice>
    <area>${p.area}</area>
    <status>${p.status}</status>
    <updatedAt>${p.updated_at}</updatedAt>
  </property>`).join('\n')}
</properties>`,
            {
              headers: {
                'Content-Type': 'application/xml',
                'X-Total-Count': properties.length.toString()
              }
            }
          )
        }

        return NextResponse.json({
          success: true,
          data: properties,
          pagination: {
            limit,
            offset,
            total: properties.length
          }
        })
      }

      case 'projects': {
        const projects = await apiIntegrationService.getExternalProjects(
          validation.developerId,
          { limit, offset }
        )

        return NextResponse.json({
          success: true,
          data: projects,
          pagination: {
            limit,
            offset,
            total: projects.length
          }
        })
      }

      case 'analytics': {
        const analytics = await apiIntegrationService.getExternalAnalytics(
          validation.developerId,
          searchParams.get('timeframe') || '30d'
        )

        return NextResponse.json({
          success: true,
          data: analytics
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid resource' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('External API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      )
    }

    const validation = await apiIntegrationService.validateAPIKey(apiKey, 'properties:write')
    
    if (!validation.isValid || !validation.developerId) {
      return NextResponse.json(
        { error: 'Invalid API key or insufficient permissions' },
        { status: 401 }
      )
    }

    await apiIntegrationService.trackAPIUsage(validation.keyId!, 'POST', '/api/external')

    const body = await request.json()
    const { resource, action, ...data } = body

    switch (resource) {
      case 'properties': {
        switch (action) {
          case 'create': {
            const property = await apiIntegrationService.createExternalProperty(
              validation.developerId,
              data
            )
            return NextResponse.json({
              success: true,
              data: property,
              message: 'Property created successfully'
            })
          }

          case 'update': {
            const { propertyId, ...updates } = data
            await apiIntegrationService.updateExternalProperty(
              validation.developerId,
              propertyId,
              updates
            )
            return NextResponse.json({
              success: true,
              message: 'Property updated successfully'
            })
          }

          case 'bulk-update': {
            const jobId = await apiIntegrationService.bulkUpdateExternalProperties(
              validation.developerId,
              data
            )
            return NextResponse.json({
              success: true,
              data: { jobId },
              message: 'Bulk update initiated'
            })
          }

          default:
            return NextResponse.json(
              { error: 'Invalid action' },
              { status: 400 }
            )
        }
      }

      case 'webhooks': {
        if (action === 'test') {
          const result = await apiIntegrationService.sendWebhookTest(
            validation.developerId,
            data.event,
            data.payload
          )
          return NextResponse.json({
            success: true,
            data: result
          })
        }
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid resource' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('External API POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}