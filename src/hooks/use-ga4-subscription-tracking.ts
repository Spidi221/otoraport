/**
 * GA4 Subscription Tracking Hook
 *
 * Monitors developer subscription state and tracks events in GA4 when:
 * - User starts a trial
 * - Trial converts to paid subscription
 *
 * This hook runs client-side and checks subscription state on mount and updates.
 */

import { useEffect, useRef } from 'react';
import { trackSubscriptionStart, trackSubscriptionConvert } from '@/lib/ga4-tracking';

interface SubscriptionTrackingProps {
  userId?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  trialStatus?: string;
  trialEndsAt?: string | null;
}

// Plan prices for tracking conversion value
const PLAN_PRICES: Record<string, number> = {
  basic: 99,
  pro: 299,
  trial: 0,
};

export function useGA4SubscriptionTracking({
  userId,
  subscriptionStatus,
  subscriptionPlan,
  trialStatus,
  trialEndsAt,
}: SubscriptionTrackingProps) {
  // Track what events we've already sent to avoid duplicates
  const trackedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || !subscriptionStatus || !subscriptionPlan) {
      return;
    }

    const eventKey = `${userId}-${subscriptionStatus}-${trialStatus}`;

    // Avoid duplicate tracking
    if (trackedEventsRef.current.has(eventKey)) {
      return;
    }

    // Track trial start
    if (subscriptionStatus === 'trialing' && trialStatus === 'active' && trialEndsAt) {
      const trialEnd = new Date(trialEndsAt);
      const now = new Date();
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Only track if trial is actually active (not expired)
      if (daysRemaining > 0) {
        trackSubscriptionStart(userId, subscriptionPlan, daysRemaining);
        trackedEventsRef.current.add(eventKey);
        console.log('[GA4 Subscription Tracking] Trial start tracked:', subscriptionPlan, daysRemaining, 'days');
      }
    }

    // Track trial conversion
    if (subscriptionStatus === 'active' && trialStatus === 'converted') {
      const planPrice = PLAN_PRICES[subscriptionPlan] || 0;

      trackSubscriptionConvert(userId, subscriptionPlan, planPrice);
      trackedEventsRef.current.add(eventKey);
      console.log('[GA4 Subscription Tracking] Trial conversion tracked:', subscriptionPlan, planPrice, 'PLN');
    }
  }, [userId, subscriptionStatus, subscriptionPlan, trialStatus, trialEndsAt]);
}
