import { NextRequest, NextResponse } from 'next/server'
import { apiIntegrationService } from '@/lib/api-integration'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('id')
    
    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID required' },
        { status: 400 }
      )
    }

    const signature = request.headers.get('x-webhook-signature')
    const body = await request.text()

    // Verify webhook signature
    const webhook = await apiIntegrationService.getWebhookById(webhookId)
    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      )
    }

    if (webhook.secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex')
      
      if (signature !== `sha256=${expectedSignature}`) {
        console.log('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    let payload
    try {
      payload = JSON.parse(body)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Process webhook based on event type
    const { event, data } = payload

    switch (event) {
      case 'property.created':
      case 'property.updated':
      case 'property.deleted': {
        await apiIntegrationService.processPropertyWebhook(webhook.developer_id, event, data)
        break
      }

      case 'project.created':
      case 'project.updated': {
        await apiIntegrationService.processProjectWebhook(webhook.developer_id, event, data)
        break
      }

      case 'payment.completed':
      case 'payment.failed': {
        await apiIntegrationService.processPaymentWebhook(webhook.developer_id, event, data)
        break
      }

      case 'ministry.approval':
      case 'ministry.rejection': {
        await apiIntegrationService.processMinistryWebhook(webhook.developer_id, event, data)
        break
      }

      default:
        console.log(`Unknown webhook event: ${event}`)
    }

    // Log webhook delivery
    await apiIntegrationService.logWebhookDelivery(webhookId, {
      event,
      status: 'success',
      response_time: Date.now(),
      payload_size: body.length
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Log failed webhook delivery
    const webhookId = new URL(request.url).searchParams.get('id')
    if (webhookId) {
      await apiIntegrationService.logWebhookDelivery(webhookId, {
        event: 'unknown',
        status: 'failed',
        response_time: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle webhook verification for platforms like GitHub, Slack, etc.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const challenge = searchParams.get('hub.challenge')
    const verify_token = searchParams.get('hub.verify_token')
    const webhookId = searchParams.get('id')

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID required' },
        { status: 400 }
      )
    }

    const webhook = await apiIntegrationService.getWebhookById(webhookId)
    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      )
    }

    // For platforms that require challenge verification
    if (challenge && verify_token) {
      if (verify_token === webhook.verification_token) {
        return new NextResponse(challenge, { status: 200 })
      } else {
        return NextResponse.json(
          { error: 'Invalid verification token' },
          { status: 403 }
        )
      }
    }

    // Default webhook info response
    return NextResponse.json({
      webhook_id: webhookId,
      status: webhook.active ? 'active' : 'inactive',
      events: webhook.events,
      created_at: webhook.created_at
    })

  } catch (error) {
    console.error('Webhook GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}