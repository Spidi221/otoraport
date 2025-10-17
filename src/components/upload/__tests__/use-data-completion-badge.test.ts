/**
 * Data Completion Badge Hook Tests
 * Task #104 - Badge notification system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDataCompletionBadge } from '../use-data-completion-badge'
import type { DataCompletionBadge } from '../types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

const BADGE_STORAGE_KEY = 'oto-raport-data-completion-badge'

describe('useDataCompletionBadge', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initial State', () => {
    it('should return no badge when localStorage is empty', () => {
      const { result } = renderHook(() => useDataCompletionBadge())

      expect(result.current.hasBadge).toBe(false)
      expect(result.current.badgeData).toBeNull()
    })

    it('should load badge from localStorage on mount', () => {
      const mockBadge: DataCompletionBadge = {
        hasPendingDataCompletion: true,
        timestamp: Date.now(),
        complianceScore: 60,
        fileName: 'test.csv',
      }

      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(mockBadge))

      const { result } = renderHook(() => useDataCompletionBadge())

      expect(result.current.hasBadge).toBe(true)
      expect(result.current.badgeData).toEqual(mockBadge)
    })

    it('should auto-clear badge if compliance score is >= 80', () => {
      const mockBadge: DataCompletionBadge = {
        hasPendingDataCompletion: true,
        timestamp: Date.now(),
        complianceScore: 85,
        fileName: 'test.csv',
      }

      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(mockBadge))

      const { result } = renderHook(() => useDataCompletionBadge())

      expect(result.current.hasBadge).toBe(false)
      expect(result.current.badgeData).toBeNull()
      expect(localStorage.getItem(BADGE_STORAGE_KEY)).toBeNull()
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem(BADGE_STORAGE_KEY, 'invalid-json{{{')

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useDataCompletionBadge())

      expect(result.current.hasBadge).toBe(false)
      expect(result.current.badgeData).toBeNull()
      expect(localStorage.getItem(BADGE_STORAGE_KEY)).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Event Listeners', () => {
    it('should update badge when data-completion-pending event fired', () => {
      const { result } = renderHook(() => useDataCompletionBadge())

      expect(result.current.hasBadge).toBe(false)

      const mockBadge: DataCompletionBadge = {
        hasPendingDataCompletion: true,
        timestamp: Date.now(),
        complianceScore: 50,
        fileName: 'test.csv',
      }

      act(() => {
        window.dispatchEvent(
          new CustomEvent('data-completion-pending', {
            detail: mockBadge,
          })
        )
      })

      expect(result.current.hasBadge).toBe(true)
      expect(result.current.badgeData).toEqual(mockBadge)
    })

    it('should clean up event listener on unmount', () => {
      const { unmount } = renderHook(() => useDataCompletionBadge())

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'data-completion-pending',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('clearBadge', () => {
    it('should clear badge from state and localStorage', () => {
      const mockBadge: DataCompletionBadge = {
        hasPendingDataCompletion: true,
        timestamp: Date.now(),
        complianceScore: 60,
        fileName: 'test.csv',
      }

      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(mockBadge))

      const { result } = renderHook(() => useDataCompletionBadge())

      expect(result.current.hasBadge).toBe(true)

      act(() => {
        result.current.clearBadge()
      })

      expect(result.current.hasBadge).toBe(false)
      expect(result.current.badgeData).toBeNull()
      expect(localStorage.getItem(BADGE_STORAGE_KEY)).toBeNull()
    })

    it('should emit data-completion-cleared event', () => {
      const mockBadge: DataCompletionBadge = {
        hasPendingDataCompletion: true,
        timestamp: Date.now(),
        complianceScore: 60,
        fileName: 'test.csv',
      }

      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(mockBadge))

      const { result } = renderHook(() => useDataCompletionBadge())

      const eventListener = vi.fn()
      window.addEventListener('data-completion-cleared', eventListener)

      act(() => {
        result.current.clearBadge()
      })

      expect(eventListener).toHaveBeenCalledTimes(1)

      window.removeEventListener('data-completion-cleared', eventListener)
    })
  })

  describe('updateComplianceScore', () => {
    it('should update badge with new compliance score', () => {
      const mockBadge: DataCompletionBadge = {
        hasPendingDataCompletion: true,
        timestamp: Date.now() - 10000, // 10 seconds ago
        complianceScore: 50,
        fileName: 'test.csv',
      }

      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(mockBadge))

      const { result } = renderHook(() => useDataCompletionBadge())

      expect(result.current.badgeData?.complianceScore).toBe(50)

      act(() => {
        result.current.updateComplianceScore(70)
      })

      expect(result.current.badgeData?.complianceScore).toBe(70)
      expect(result.current.badgeData?.timestamp).toBeGreaterThan(mockBadge.timestamp)

      const stored = localStorage.getItem(BADGE_STORAGE_KEY)
      expect(stored).toBeTruthy()

      const storedBadge = JSON.parse(stored!)
      expect(storedBadge.complianceScore).toBe(70)
    })

    it('should auto-clear badge if new score >= 80', () => {
      const mockBadge: DataCompletionBadge = {
        hasPendingDataCompletion: true,
        timestamp: Date.now(),
        complianceScore: 50,
        fileName: 'test.csv',
      }

      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(mockBadge))

      const { result } = renderHook(() => useDataCompletionBadge())

      expect(result.current.hasBadge).toBe(true)

      act(() => {
        result.current.updateComplianceScore(85)
      })

      expect(result.current.hasBadge).toBe(false)
      expect(result.current.badgeData).toBeNull()
      expect(localStorage.getItem(BADGE_STORAGE_KEY)).toBeNull()
    })

    it('should not update if no badge exists', () => {
      const { result } = renderHook(() => useDataCompletionBadge())

      expect(result.current.hasBadge).toBe(false)

      act(() => {
        result.current.updateComplianceScore(70)
      })

      // Should remain false since there was no badge to update
      expect(result.current.hasBadge).toBe(false)
      expect(localStorage.getItem(BADGE_STORAGE_KEY)).toBeNull()
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle full workflow: set badge -> update score -> clear', () => {
      const { result } = renderHook(() => useDataCompletionBadge())

      // Step 1: No badge initially
      expect(result.current.hasBadge).toBe(false)

      // Step 2: User uploads file and clicks "Do Later"
      const initialBadge: DataCompletionBadge = {
        hasPendingDataCompletion: true,
        timestamp: Date.now(),
        complianceScore: 45,
        fileName: 'test.csv',
      }

      act(() => {
        window.dispatchEvent(
          new CustomEvent('data-completion-pending', {
            detail: initialBadge,
          })
        )
      })

      expect(result.current.hasBadge).toBe(true)
      expect(result.current.badgeData?.complianceScore).toBe(45)

      // Step 3: User partially completes data, score improves to 65
      act(() => {
        result.current.updateComplianceScore(65)
      })

      expect(result.current.hasBadge).toBe(true)
      expect(result.current.badgeData?.complianceScore).toBe(65)

      // Step 4: User completes all data, score reaches 95
      act(() => {
        result.current.updateComplianceScore(95)
      })

      // Badge should auto-clear at 80%+
      expect(result.current.hasBadge).toBe(false)
      expect(result.current.badgeData).toBeNull()
    })

    it('should persist across multiple hook instances', () => {
      const mockBadge: DataCompletionBadge = {
        hasPendingDataCompletion: true,
        timestamp: Date.now(),
        complianceScore: 60,
        fileName: 'test.csv',
      }

      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(mockBadge))

      // First hook instance
      const { result: result1 } = renderHook(() => useDataCompletionBadge())
      expect(result1.current.hasBadge).toBe(true)

      // Second hook instance (simulates different component using same hook)
      const { result: result2 } = renderHook(() => useDataCompletionBadge())
      expect(result2.current.hasBadge).toBe(true)
      expect(result2.current.badgeData).toEqual(mockBadge)
    })
  })
})
