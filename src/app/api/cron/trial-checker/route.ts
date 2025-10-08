/**
 * Trial Email Automation Cron Job
 * Task #51, Subtask 51.2
 *
 * Runs daily at 9:00 AM UTC (10:00 AM CET / 11:00 AM CEST)
 * Checks trial status and sends appropriate emails based on trial stage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  sendTrialMidwayEmail,
  sendTrialUrgencyEmail,
  sendTrialConversionSuccessEmail,
  sendTrialFailedEmail
} from '@/lib/email-service';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';

/**
 * Helper function to check if email should be skipped at current stage
 */
function shouldSkipEmail(currentStage: string | null, daysRemaining: number): boolean {
  // Skip if already sent email at this stage
  if (currentStage === 'day_7' && daysRemaining < 7) return true;
  if (currentStage === 'day_11' && daysRemaining < 3) return true;
  if (currentStage === 'day_14_success' || currentStage === 'day_14_failed') return true;
  return false;
}

/**
 * Get plan price in PLN from subscription plan
 */
function getPlanPrice(plan: string): number {
  const prices: Record<string, number> = {
    basic: 149,
    pro: 249,
    enterprise: 499
  };
  return prices[plan] || 149; // Default to basic price
}

/**
 * Check if developer has email notifications enabled
 */
async function shouldSendTrialEmail(
  developerId: string,
  emailType: 'day_0' | 'day_7' | 'day_11' | 'day_14_success' | 'day_14_failed'
): Promise<boolean> {
  // Transactional emails (day_0, day_14_success, day_14_failed) always send
  const transactionalTypes = ['day_0', 'day_14_success', 'day_14_failed'];
  if (transactionalTypes.includes(emailType)) {
    return true;
  }

  // Marketing emails (day_7, day_11) respect preferences
  const supabase = createAdminClient();
  const { data: dev } = await supabase
    .from('developers')
    .select('email_notifications_enabled, notification_frequency')
    .eq('id', developerId)
    .single();

  if (!dev?.email_notifications_enabled) {
    return false;
  }

  // Check notification frequency
  if (dev.notification_frequency === 'never') {
    return false;
  }

  return true;
}

/**
 * GET /api/cron/trial-checker
 * Cron job that checks trial status and sends appropriate emails
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate with CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Trial Checker] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Trial Checker] Unauthorized attempt:', authHeader);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Trial Checker] Starting trial email automation check...');

  try {
    // 2. Query developers with active trials
    const supabase = createAdminClient();
    const { data: developers, error } = await supabase
      .from('developers')
      .select('*')
      .eq('trial_status', 'active')
      .not('trial_ends_at', 'is', null);

    if (error) {
      console.error('[Trial Checker] Database query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Trial Checker] Found ${developers?.length || 0} developers with active trials`);

    // 3. For each developer, determine trial stage and send appropriate email
    const now = new Date();
    const results = {
      processed: 0,
      day7_sent: 0,
      day11_sent: 0,
      day14_success: 0,
      day14_failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const dev of developers || []) {
      try {
        const trialEndsAt = new Date(dev.trial_ends_at);
        const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        console.log(`[Trial Checker] Processing developer ${dev.id} (${dev.email}), days remaining: ${daysRemaining}`);

        // Skip if already sent email at this stage
        if (shouldSkipEmail(dev.trial_stage, daysRemaining)) {
          console.log(`[Trial Checker] Skipping developer ${dev.id} - already at stage ${dev.trial_stage}`);
          results.skipped++;
          continue;
        }

        // Determine which email to send based on days remaining
        if (daysRemaining === 7 && dev.trial_stage !== 'day_7') {
          // Send Day 7 midway email
          console.log(`[Trial Checker] Sending Day 7 email to ${dev.email}`);

          // Check email preferences
          const shouldSend = await shouldSendTrialEmail(dev.id, 'day_7');
          if (!shouldSend) {
            console.log(`[Trial Checker] Skipping Day 7 email - user opted out`);
            results.skipped++;
            continue;
          }

          // Get properties count
          const { data: properties } = await supabase
            .from('properties')
            .select('id')
            .eq('developer_id', dev.id);

          await sendTrialMidwayEmail({
            email: dev.email,
            company_name: dev.company_name || 'Developer',
            properties_count: properties?.length || 0,
            trial_ends_at: dev.trial_ends_at,
            xml_endpoint_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/public/${dev.client_id}/data.xml`
          });

          // Update trial_stage
          await supabase
            .from('developers')
            .update({
              trial_stage: 'day_7',
              last_trial_email_sent: now.toISOString()
            })
            .eq('id', dev.id);

          results.day7_sent++;
        }
        else if (daysRemaining === 3 && dev.trial_stage !== 'day_11') {
          // Send Day 11 urgency email
          console.log(`[Trial Checker] Sending Day 11 urgency email to ${dev.email}`);

          // Check email preferences
          const shouldSend = await shouldSendTrialEmail(dev.id, 'day_11');
          if (!shouldSend) {
            console.log(`[Trial Checker] Skipping Day 11 email - user opted out`);
            results.skipped++;
            continue;
          }

          // Get properties count
          const { data: properties } = await supabase
            .from('properties')
            .select('id')
            .eq('developer_id', dev.id);

          await sendTrialUrgencyEmail({
            email: dev.email,
            company_name: dev.company_name || 'Developer',
            trial_ends_at: dev.trial_ends_at,
            subscription_plan: dev.subscription_plan || 'basic',
            properties_count: properties?.length || 0
          });

          await supabase
            .from('developers')
            .update({
              trial_stage: 'day_11',
              last_trial_email_sent: now.toISOString()
            })
            .eq('id', dev.id);

          results.day11_sent++;
        }
        else if (daysRemaining <= 0) {
          // Trial expired - check if converted or failed
          console.log(`[Trial Checker] Trial expired for ${dev.email}, checking conversion status`);

          if (dev.subscription_status === 'active') {
            // Successful conversion
            console.log(`[Trial Checker] Sending success email to ${dev.email}`);

            await sendTrialConversionSuccessEmail({
              email: dev.email,
              company_name: dev.company_name || 'Developer',
              subscription_plan: dev.subscription_plan || 'basic',
              monthly_price: getPlanPrice(dev.subscription_plan || 'basic')
            });

            await supabase
              .from('developers')
              .update({
                trial_status: 'converted',
                trial_stage: 'day_14_success',
                last_trial_email_sent: now.toISOString()
              })
              .eq('id', dev.id);

            results.day14_success++;
          } else {
            // Failed conversion
            console.log(`[Trial Checker] Sending failed email to ${dev.email}`);

            // Get properties count
            const { data: properties } = await supabase
              .from('properties')
              .select('id')
              .eq('developer_id', dev.id);

            await sendTrialFailedEmail({
              email: dev.email,
              company_name: dev.company_name || 'Developer',
              trial_ended_at: dev.trial_ends_at,
              properties_count: properties?.length || 0
            });

            await supabase
              .from('developers')
              .update({
                trial_status: 'expired',
                trial_stage: 'day_14_failed',
                last_trial_email_sent: now.toISOString()
              })
              .eq('id', dev.id);

            results.day14_failed++;
          }
        } else {
          // Not at a trigger point yet
          console.log(`[Trial Checker] Developer ${dev.id} not at trigger point (${daysRemaining} days remaining)`);
          results.skipped++;
        }

        results.processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Trial Checker] Error processing developer ${dev.id}:`, error);
        results.errors.push(`Error processing developer ${dev.id}: ${errorMessage}`);
      }
    }

    console.log('[Trial Checker] Trial email automation completed:', results);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Trial Checker] Fatal error:', error);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
