/**
 * Google Analytics 4 (GA4) Tracking Utilities
 *
 * Provides functions for tracking custom events and conversions in GA4.
 * All tracking is GDPR-compliant and respects user cookie preferences.
 *
 * Events tracked:
 * - User signup (conversion)
 * - File upload success
 * - Trial subscription start (conversion)
 * - Trial to paid conversion (conversion)
 */

// Type definitions for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'consent',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Check if GA4 is enabled and configured
 */
function isGA4Enabled(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    window.gtag &&
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
  );
}

/**
 * Check if user has consented to analytics cookies
 */
function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) return false;

    const consentData = JSON.parse(consent);
    return consentData.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Send event to GA4 (internal helper)
 */
function sendGA4Event(eventName: string, eventParams?: Record<string, unknown>): void {
  if (!isGA4Enabled()) {
    console.log('[GA4] Tracking disabled - no measurement ID configured');
    return;
  }

  if (!hasAnalyticsConsent()) {
    console.log('[GA4] Tracking skipped - user has not consented to analytics');
    return;
  }

  try {
    window.gtag!('event', eventName, eventParams);
    console.log('[GA4] Event tracked:', eventName, eventParams);
  } catch (error) {
    console.error('[GA4] Error tracking event:', error);
  }
}

/**
 * Track user signup (conversion event)
 *
 * @param userId - Unique user identifier
 * @param planType - Selected subscription plan (trial, basic, pro)
 */
export function trackSignup(userId: string, planType?: string): void {
  sendGA4Event('sign_up', {
    method: 'email',
    user_id: userId,
    plan_type: planType || 'trial',
    // GA4 conversion event
    event_category: 'conversion',
    event_label: 'user_signup',
  });

  // Set user properties for segmentation
  if (isGA4Enabled() && hasAnalyticsConsent()) {
    try {
      window.gtag!('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!, {
        user_id: userId,
        user_properties: {
          subscription_plan: planType || 'trial',
          trial_status: 'active',
        },
      });
    } catch (error) {
      console.error('[GA4] Error setting user properties:', error);
    }
  }
}

/**
 * Track successful file upload
 *
 * @param fileName - Name of uploaded file
 * @param recordsCount - Number of properties uploaded
 * @param fileType - File format (csv, xlsx, xls)
 */
export function trackUploadSuccess(
  fileName: string,
  recordsCount: number,
  fileType: 'csv' | 'xlsx' | 'xls'
): void {
  sendGA4Event('file_upload_success', {
    file_name: fileName,
    file_type: fileType,
    records_count: recordsCount,
    event_category: 'engagement',
    event_label: 'file_upload',
    value: recordsCount, // Track number of properties as value
  });
}

/**
 * Track trial subscription start (conversion event)
 *
 * @param userId - Unique user identifier
 * @param planType - Selected plan (basic, pro)
 * @param trialDays - Length of trial period in days
 */
export function trackSubscriptionStart(
  userId: string,
  planType: string,
  trialDays: number = 14
): void {
  sendGA4Event('trial_start', {
    user_id: userId,
    plan_type: planType,
    trial_days: trialDays,
    // GA4 conversion event
    event_category: 'conversion',
    event_label: 'trial_start',
  });

  // Update user properties
  if (isGA4Enabled() && hasAnalyticsConsent()) {
    try {
      window.gtag!('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!, {
        user_id: userId,
        user_properties: {
          subscription_plan: planType,
          trial_status: 'active',
        },
      });
    } catch (error) {
      console.error('[GA4] Error updating user properties:', error);
    }
  }
}

/**
 * Track trial to paid conversion (conversion event)
 *
 * @param userId - Unique user identifier
 * @param planType - Converted plan (basic, pro)
 * @param planPrice - Monthly price in PLN
 */
export function trackSubscriptionConvert(
  userId: string,
  planType: string,
  planPrice: number
): void {
  sendGA4Event('trial_conversion', {
    user_id: userId,
    plan_type: planType,
    value: planPrice,
    currency: 'PLN',
    // GA4 conversion event
    event_category: 'conversion',
    event_label: 'trial_to_paid',
  });

  // Update user properties - trial converted
  if (isGA4Enabled() && hasAnalyticsConsent()) {
    try {
      window.gtag!('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!, {
        user_id: userId,
        user_properties: {
          subscription_plan: planType,
          trial_status: 'converted',
        },
      });
    } catch (error) {
      console.error('[GA4] Error updating user properties:', error);
    }
  }
}

/**
 * Track page view (automatically handled by GA4 script, but can be called manually)
 *
 * @param pageTitle - Title of the page
 * @param pagePath - URL path
 */
export function trackPageView(pageTitle: string, pagePath: string): void {
  if (!isGA4Enabled() || !hasAnalyticsConsent()) return;

  try {
    window.gtag!('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!, {
      page_title: pageTitle,
      page_path: pagePath,
    });
    console.log('[GA4] Page view tracked:', pageTitle, pagePath);
  } catch (error) {
    console.error('[GA4] Error tracking page view:', error);
  }
}

/**
 * Update GA4 consent based on user cookie preferences
 * Called when user updates their cookie preferences
 *
 * @param analyticsConsent - Whether user consented to analytics
 */
export function updateGA4Consent(analyticsConsent: boolean): void {
  if (!isGA4Enabled()) return;

  try {
    window.gtag!('consent', 'update', {
      analytics_storage: analyticsConsent ? 'granted' : 'denied',
    });
    console.log('[GA4] Consent updated:', analyticsConsent ? 'granted' : 'denied');
  } catch (error) {
    console.error('[GA4] Error updating consent:', error);
  }
}

/**
 * Initialize GA4 consent mode (called on page load before GA4 loads)
 * Sets default consent state to denied, user must opt-in
 */
export function initGA4Consent(): void {
  if (typeof window === 'undefined') return;

  // Initialize dataLayer for consent mode
  window.dataLayer = window.dataLayer || [];

  // Set default consent to denied (GDPR-compliant)
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    wait_for_update: 500,
  });

  // Check if user has already given consent
  const hasConsent = hasAnalyticsConsent();
  if (hasConsent) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }

  console.log('[GA4] Consent mode initialized:', hasConsent ? 'granted' : 'denied');
}
