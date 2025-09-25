import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { EmailMarketingEngine } from '@/lib/email-marketing';

// POST /api/webhooks/email-events - Handle Resend email events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('Resend-Signature');

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const { type, data } = payload;

    console.log(`Received email event: ${type} for email ${data.email_id}`);

    // Handle different email events
    switch (type) {
      case 'email.sent':
        await handleEmailSent(data);
        break;
      case 'email.delivered':
        await handleEmailDelivered(data);
        break;
      case 'email.opened':
        await handleEmailOpened(data);
        break;
      case 'email.clicked':
        await handleEmailClicked(data);
        break;
      case 'email.bounced':
        await handleEmailBounced(data);
        break;
      case 'email.complained':
        await handleEmailComplained(data);
        break;
      default:
        console.log(`Unhandled email event type: ${type}`);
    }

    // Pass event to marketing automation engine
    await EmailMarketingEngine.handleEmailEvent({
      type,
      data
    });

    return NextResponse.json({
      success: true,
      message: 'Event processed successfully'
    });

  } catch (error) {
    console.error('Email webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Verify webhook signature from Resend
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.RESEND_WEBHOOK_SECRET) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RESEND_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Event handlers

async function handleEmailSent(data: any) {
  console.log(`Email sent: ${data.email_id} to ${data.to}`);

  // Update campaign/workflow metrics
  await updateMetrics(data, 'sent');
}

async function handleEmailDelivered(data: any) {
  console.log(`Email delivered: ${data.email_id} to ${data.to}`);

  // Update delivery metrics
  await updateMetrics(data, 'delivered');

  // Mark contact as active if this was their first successful delivery
  await updateContactActivity(data.to, 'email_delivered');
}

async function handleEmailOpened(data: any) {
  console.log(`Email opened: ${data.email_id} by ${data.to}`);

  // Update open metrics
  await updateMetrics(data, 'opened');

  // Update contact engagement score
  await updateContactActivity(data.to, 'email_opened');

  // Trigger follow-up automations
  await triggerFollowUpAutomations(data, 'email_opened');
}

async function handleEmailClicked(data: any) {
  console.log(`Email clicked: ${data.email_id} by ${data.to}, URL: ${data.click?.url}`);

  // Update click metrics
  await updateMetrics(data, 'clicked');

  // High engagement - update lead scoring
  await updateContactActivity(data.to, 'email_clicked', {
    url: data.click?.url,
    engagement_score_boost: 10
  });

  // Trigger high-engagement automations
  await triggerFollowUpAutomations(data, 'email_clicked');
}

async function handleEmailBounced(data: any) {
  console.log(`Email bounced: ${data.email_id} to ${data.to}, reason: ${data.bounce?.type}`);

  // Update bounce metrics
  await updateMetrics(data, 'bounced');

  // Handle different bounce types
  const bounceType = data.bounce?.type;

  if (bounceType === 'hard') {
    // Hard bounce - mark email as invalid
    await markEmailAsInvalid(data.to, 'hard_bounce');
  } else if (bounceType === 'soft') {
    // Soft bounce - increment retry counter
    await incrementSoftBounceCounter(data.to);
  }

  // Alert admin if bounce rate is high
  await checkBounceRateAlert(data);
}

async function handleEmailComplained(data: any) {
  console.log(`Email complaint: ${data.email_id} from ${data.to}`);

  // Update complaint metrics
  await updateMetrics(data, 'complained');

  // Immediately unsubscribe and mark as complaint
  await markEmailAsInvalid(data.to, 'spam_complaint');

  // Alert admin about complaint
  await alertAdminOfComplaint(data);
}

// Helper functions

async function updateMetrics(data: any, eventType: string) {
  try {
    const tags = data.tags || [];
    const getTagValue = (name: string) => tags.find((tag: any) => tag.name === name)?.value;

    const campaignId = getTagValue('campaign_id');
    const workflowId = getTagValue('workflow_id');
    const abTestId = getTagValue('ab_test_id');

    // Update campaign metrics if applicable
    if (campaignId && campaignId !== 'none') {
      await updateCampaignMetrics(campaignId, eventType);
    }

    // Update workflow metrics if applicable
    if (workflowId && workflowId !== 'none') {
      await updateWorkflowMetrics(workflowId, eventType);
    }

    // Update A/B test metrics if applicable
    if (abTestId) {
      const variantId = getTagValue('variant_id');
      if (variantId) {
        await EmailMarketingEngine.updateABTestMetrics(
          abTestId,
          variantId,
          eventType as 'sent' | 'delivered' | 'opened' | 'clicked'
        );
      }
    }

  } catch (error) {
    console.error('Error updating metrics:', error);
  }
}

async function updateContactActivity(email: string, activityType: string, metadata: any = {}) {
  try {
    // Implementation would update contact's last activity and engagement score
    console.log(`Updating contact activity: ${email} - ${activityType}`, metadata);

    // This would integrate with the marketing automation system
    // await MarketingAutomationEngine.updateContactActivity(email, activityType, metadata);

  } catch (error) {
    console.error('Error updating contact activity:', error);
  }
}

async function triggerFollowUpAutomations(data: any, trigger: string) {
  try {
    // Trigger automated workflows based on email engagement
    console.log(`Triggering follow-up automations for ${data.to} - ${trigger}`);

    // This would integrate with the workflow engine
    // await MarketingAutomationEngine.triggerAutomation(trigger, { email: data.to });

  } catch (error) {
    console.error('Error triggering follow-up automations:', error);
  }
}

async function markEmailAsInvalid(email: string, reason: string) {
  try {
    console.log(`Marking email as invalid: ${email} - ${reason}`);

    // Implementation would update contact status in database
    // This prevents future emails to this address

  } catch (error) {
    console.error('Error marking email as invalid:', error);
  }
}

async function incrementSoftBounceCounter(email: string) {
  try {
    console.log(`Incrementing soft bounce counter for: ${email}`);

    // Implementation would track soft bounces and convert to hard bounce after threshold

  } catch (error) {
    console.error('Error incrementing soft bounce counter:', error);
  }
}

async function checkBounceRateAlert(data: any) {
  try {
    // Check if bounce rate is above threshold and alert admins
    console.log('Checking bounce rate for alerts');

  } catch (error) {
    console.error('Error checking bounce rate:', error);
  }
}

async function alertAdminOfComplaint(data: any) {
  try {
    console.log(`SPAM COMPLAINT: ${data.to} - immediate admin alert required`);

    // Implementation would send urgent alert to admin
    // This is critical for maintaining email reputation

  } catch (error) {
    console.error('Error alerting admin of complaint:', error);
  }
}

async function updateCampaignMetrics(campaignId: string, eventType: string) {
  try {
    console.log(`Updating campaign ${campaignId} metrics for ${eventType}`);

    // Implementation would update campaign performance metrics

  } catch (error) {
    console.error('Error updating campaign metrics:', error);
  }
}

async function updateWorkflowMetrics(workflowId: string, eventType: string) {
  try {
    console.log(`Updating workflow ${workflowId} metrics for ${eventType}`);

    // Implementation would update workflow performance metrics

  } catch (error) {
    console.error('Error updating workflow metrics:', error);
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Email events webhook is operational',
    timestamp: new Date().toISOString()
  });
}