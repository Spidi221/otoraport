import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { apiIntegrationService } from '@/lib/api-integration'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'

    switch (action) {
      case 'list': {
        const integrations = await apiIntegrationService.getDeveloperIntegrations(userId)
        return NextResponse.json({
          success: true,
          data: integrations
        })
      }

      case 'api-keys': {
        const apiKeys = await apiIntegrationService.getDeveloperAPIKeys(userId)
        return NextResponse.json({
          success: true,
          data: apiKeys
        })
      }

      case 'webhooks': {
        const webhooks = await apiIntegrationService.getDeveloperWebhooks(userId)
        return NextResponse.json({
          success: true,
          data: webhooks
        })
      }

      case 'usage-stats': {
        const stats = await apiIntegrationService.getAPIUsageStats(userId)
        return NextResponse.json({
          success: true,
          data: stats
        })
      }

      case 'partners': {
        const partners = await apiIntegrationService.getAvailablePartners()
        return NextResponse.json({
          success: true,
          data: partners
        })
      }

      case 'documentation': {
        const docs = apiIntegrationService.generateAPIDocumentation()
        return NextResponse.json({
          success: true,
          data: docs
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Integrations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'create-api-key': {
        const { keyName, permissions, rateLimit } = data
        
        if (!keyName || !permissions) {
          return NextResponse.json(
            { error: 'Key name and permissions are required' },
            { status: 400 }
          )
        }

        const apiKey = await apiIntegrationService.generateAPIKey(
          userId,
          keyName,
          permissions,
          rateLimit
        )

        return NextResponse.json({
          success: true,
          data: apiKey,
          message: 'API key created successfully'
        })
      }

      case 'create-webhook': {
        const { url, events, secret } = data
        
        if (!url || !events) {
          return NextResponse.json(
            { error: 'URL and events are required' },
            { status: 400 }
          )
        }

        const webhook = await apiIntegrationService.createWebhook(
          userId,
          url,
          events,
          secret
        )

        return NextResponse.json({
          success: true,
          data: webhook,
          message: 'Webhook created successfully'
        })
      }

      case 'create-integration': {
        const { partnerId, configuration } = data
        
        if (!partnerId || !configuration) {
          return NextResponse.json(
            { error: 'Partner ID and configuration are required' },
            { status: 400 }
          )
        }

        const integration = await apiIntegrationService.createPartnerIntegration(
          userId,
          partnerId,
          configuration
        )

        return NextResponse.json({
          success: true,
          data: integration,
          message: 'Integration created successfully'
        })
      }

      case 'test-webhook': {
        const { webhookId } = data
        
        if (!webhookId) {
          return NextResponse.json(
            { error: 'Webhook ID is required' },
            { status: 400 }
          )
        }

        const result = await apiIntegrationService.testWebhook(webhookId)

        return NextResponse.json({
          success: true,
          data: result,
          message: 'Webhook test completed'
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Integrations POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { action, id, ...updates } = body

    switch (action) {
      case 'update-api-key': {
        if (!id) {
          return NextResponse.json(
            { error: 'API key ID is required' },
            { status: 400 }
          )
        }

        await apiIntegrationService.updateAPIKey(id, updates)

        return NextResponse.json({
          success: true,
          message: 'API key updated successfully'
        })
      }

      case 'update-webhook': {
        if (!id) {
          return NextResponse.json(
            { error: 'Webhook ID is required' },
            { status: 400 }
          )
        }

        await apiIntegrationService.updateWebhook(id, updates)

        return NextResponse.json({
          success: true,
          message: 'Webhook updated successfully'
        })
      }

      case 'update-integration': {
        if (!id) {
          return NextResponse.json(
            { error: 'Integration ID is required' },
            { status: 400 }
          )
        }

        await apiIntegrationService.updatePartnerIntegration(id, updates)

        return NextResponse.json({
          success: true,
          message: 'Integration updated successfully'
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Integrations PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const id = searchParams.get('id')

    if (!action || !id) {
      return NextResponse.json(
        { error: 'Action and ID are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'api-key': {
        await apiIntegrationService.revokeAPIKey(id)
        return NextResponse.json({
          success: true,
          message: 'API key revoked successfully'
        })
      }

      case 'webhook': {
        await apiIntegrationService.deleteWebhook(id)
        return NextResponse.json({
          success: true,
          message: 'Webhook deleted successfully'
        })
      }

      case 'integration': {
        await apiIntegrationService.deletePartnerIntegration(id)
        return NextResponse.json({
          success: true,
          message: 'Integration deleted successfully'
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Integrations DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}