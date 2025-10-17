/**
 * Custom hook for managing data completion notification badge
 * Task #104 - Notification badge system
 *
 * Handles:
 * - Reading badge state from localStorage
 * - Listening for data-completion-pending events
 * - Clearing badge when user completes wizard
 * - Auto-clearing badge when compliance reaches 80%+
 */

'use client'

import { useState, useEffect } from 'react'
import type { DataCompletionBadge } from './types'

const BADGE_STORAGE_KEY = 'oto-raport-data-completion-badge'
const MIN_COMPLIANCE_SCORE = 80 // Auto-clear badge at 80%+ compliance

export function useDataCompletionBadge() {
  const [badgeData, setBadgeData] = useState<DataCompletionBadge | null>(null)

  // Load badge state from localStorage on mount
  useEffect(() => {
    const loadBadge = () => {
      const stored = localStorage.getItem(BADGE_STORAGE_KEY)
      if (stored) {
        try {
          const data: DataCompletionBadge = JSON.parse(stored)

          // Auto-clear if compliance is high enough
          if (data.complianceScore >= MIN_COMPLIANCE_SCORE) {
            localStorage.removeItem(BADGE_STORAGE_KEY)
            setBadgeData(null)
          } else {
            setBadgeData(data)
          }
        } catch (err) {
          console.error('Failed to parse badge data:', err)
          localStorage.removeItem(BADGE_STORAGE_KEY)
        }
      }
    }

    loadBadge()
  }, [])

  // Listen for data-completion-pending events
  useEffect(() => {
    const handlePending = (event: Event) => {
      const customEvent = event as CustomEvent<DataCompletionBadge>
      setBadgeData(customEvent.detail)
    }

    window.addEventListener('data-completion-pending', handlePending)

    return () => {
      window.removeEventListener('data-completion-pending', handlePending)
    }
  }, [])

  // Clear badge (called when user completes wizard or dismisses)
  const clearBadge = () => {
    localStorage.removeItem(BADGE_STORAGE_KEY)
    setBadgeData(null)

    // Emit event for other components
    window.dispatchEvent(new CustomEvent('data-completion-cleared'))
  }

  // Update badge with new compliance score (e.g., after wizard completion)
  const updateComplianceScore = (newScore: number) => {
    if (newScore >= MIN_COMPLIANCE_SCORE) {
      // Auto-clear if compliance is good enough
      clearBadge()
    } else if (badgeData) {
      const updated: DataCompletionBadge = {
        ...badgeData,
        complianceScore: newScore,
        timestamp: Date.now(),
      }

      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(updated))
      setBadgeData(updated)
    }
  }

  return {
    hasBadge: badgeData?.hasPendingDataCompletion ?? false,
    badgeData,
    clearBadge,
    updateComplianceScore,
  }
}
