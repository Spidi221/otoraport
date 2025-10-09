'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

/**
 * PostHog Provider - Initializes PostHog analytics
 *
 * Features:
 * - EU hosting (privacy-first: https://eu.i.posthog.com)
 * - Disabled automatic pageview tracking (manual control for GDPR)
 * - Session recording and autocapture disabled by default
 * - Only runs if NEXT_PUBLIC_POSTHOG_KEY is set
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize if PostHog key is provided
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!posthogKey) {
      console.log('[PostHog] Not initialized - no API key provided')
      return
    }

    // Use EU host by default for GDPR compliance
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

    // Check if already initialized
    if (posthog.__loaded) {
      console.log('[PostHog] Already initialized')
      return
    }

    try {
      // Initialize PostHog
      posthog.init(posthogKey, {
        api_host: posthogHost,

        // Privacy settings - GDPR compliant
        person_profiles: 'identified_only', // Only create profiles for identified users

        // Disable automatic tracking - we'll do it manually based on consent
        capture_pageview: false,
        capture_pageleave: false,

        // Session recording - disabled by default, can be enabled after consent
        disable_session_recording: true,

        // Autocapture - disabled by default for privacy
        autocapture: false,

        // Advanced settings
        loaded: (posthog) => {
          console.log('[PostHog] Initialized successfully')

          // Check for existing consent
          if (typeof window !== 'undefined') {
            try {
              const consent = localStorage.getItem('cookie-consent')
              if (consent) {
                const consentData = JSON.parse(consent)

                // Opt out if analytics not consented
                if (!consentData.analytics) {
                  posthog.opt_out_capturing()
                  console.log('[PostHog] Opted out - no analytics consent')
                } else {
                  posthog.opt_in_capturing()
                  console.log('[PostHog] Opted in - analytics consent granted')
                }
              } else {
                // No consent yet - opt out by default
                posthog.opt_out_capturing()
                console.log('[PostHog] Opted out - no consent given yet')
              }
            } catch (error) {
              console.error('[PostHog] Error checking consent:', error)
              posthog.opt_out_capturing()
            }
          }
        },
      })
    } catch (error) {
      console.error('[PostHog] Initialization error:', error)
    }
  }, [])

  return <>{children}</>
}

/**
 * Hook to access PostHog instance
 *
 * Usage:
 * ```tsx
 * const posthog = usePostHog()
 * posthog.capture('event_name', { property: 'value' })
 * ```
 */
export function usePostHog() {
  return posthog
}
